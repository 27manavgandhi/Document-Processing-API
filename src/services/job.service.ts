import { PrismaClient, Job, JobStatus, JobPriority } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.util';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.util';
import { JobData, JobResult } from '../types';
import { addJobToQueue, documentQueue } from '../queues/document.queue';
import { CreateJobInput, ListJobsInput, ScheduleJobInput, BulkCreateJobInput } from '../validators/job.validator';

const prisma = new PrismaClient();

export class JobService {
  async createJob(input: CreateJobInput, file?: Express.Multer.File): Promise<Job> {
    const jobId = uuidv4();

    let fileName: string | undefined;
    let fileMimeType: string | undefined;
    let fileSize: number | undefined;
    let fileUrl: string | undefined;

    if (file) {
      fileName = file.originalname;
      fileMimeType = file.mimetype;
      fileSize = file.size;
      fileUrl = `/uploads/${file.filename}`;
    } else if (input.fileUrl) {
      fileUrl = input.fileUrl;
      fileName = input.fileName || this.extractFileNameFromUrl(input.fileUrl);
      fileMimeType = this.guessMimeType(fileName);
    } else {
      throw new ValidationError('Either file or fileUrl must be provided');
    }

    try {
      const job = await prisma.job.create({
        data: {
          id: jobId,
          userId: input.userId,
          status: JobStatus.QUEUED,
          priority: (input.priority as JobPriority) || JobPriority.MEDIUM,
          fileUrl,
          fileName,
          fileMimeType,
          fileSize,
          metadata: input.metadata as object,
        },
      });

      logger.info('Job created in database', {
        jobId: job.id,
        status: job.status,
        priority: job.priority,
      });

      const jobData: JobData = {
        jobId: job.id,
        fileUrl: job.fileUrl || undefined,
        fileName: job.fileName || undefined,
        fileMimeType: job.fileMimeType || undefined,
        fileSize: job.fileSize || undefined,
        userId: job.userId || undefined,
        priority: job.priority as JobPriority,
        metadata: job.metadata as Record<string, unknown>,
        webhookUrl: input.webhookUrl,
      };

      try {
        await addJobToQueue(jobData);
      } catch (queueError) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.FAILED,
            errorMessage: 'Failed to enqueue job',
            failedAt: new Date(),
          },
        });

        logger.error('Failed to enqueue job, marked as failed', queueError as Error, {
          jobId,
        });

        throw queueError;
      }

      return job;
    } catch (error) {
      logger.error('Failed to create job', error as Error, {
        jobId,
      });
      throw error;
    }
  }

  async scheduleJob(input: ScheduleJobInput, file?: Express.Multer.File): Promise<Job> {
    const jobId = uuidv4();
    const scheduledFor = new Date(input.scheduledFor);
    const now = new Date();

    if (scheduledFor <= now) {
      throw new ValidationError('scheduledFor must be in the future');
    }

    let fileName: string | undefined;
    let fileMimeType: string | undefined;
    let fileSize: number | undefined;
    let fileUrl: string | undefined;

    if (file) {
      fileName = file.originalname;
      fileMimeType = file.mimetype;
      fileSize = file.size;
      fileUrl = `/uploads/${file.filename}`;
    } else if (input.fileUrl) {
      fileUrl = input.fileUrl;
      fileName = input.fileName || this.extractFileNameFromUrl(input.fileUrl);
      fileMimeType = this.guessMimeType(fileName);
    } else {
      throw new ValidationError('Either file or fileUrl must be provided');
    }

    const job = await prisma.job.create({
      data: {
        id: jobId,
        userId: input.userId,
        status: JobStatus.SCHEDULED,
        priority: (input.priority as JobPriority) || JobPriority.MEDIUM,
        scheduledFor,
        fileUrl,
        fileName,
        fileMimeType,
        fileSize,
        metadata: input.metadata as object,
      },
    });

    const delay = scheduledFor.getTime() - now.getTime();
    const jobData: JobData = {
      jobId: job.id,
      fileUrl: job.fileUrl || undefined,
      fileName: job.fileName || undefined,
      fileMimeType: job.fileMimeType || undefined,
      fileSize: job.fileSize || undefined,
      userId: job.userId || undefined,
      priority: job.priority as JobPriority,
      metadata: job.metadata as Record<string, unknown>,
      webhookUrl: input.webhookUrl,
    };

    await documentQueue.add('process-document', jobData, {
      jobId: job.id,
      delay,
    });

    logger.info('Job scheduled', {
      jobId: job.id,
      scheduledFor: scheduledFor.toISOString(),
      delay,
    });

    return job;
  }

  async bulkCreateJobs(input: BulkCreateJobInput): Promise<Job[]> {
    const jobs = await prisma.$transaction(async (tx) => {
      const createdJobs = await Promise.all(
        input.jobs.map(async (jobInput) => {
          const jobId = uuidv4();
          const fileUrl = jobInput.fileUrl;
          const fileName = jobInput.fileName || (fileUrl ? this.extractFileNameFromUrl(fileUrl) : 'unknown');
          const fileMimeType = this.guessMimeType(fileName);

          return tx.job.create({
            data: {
              id: jobId,
              userId: jobInput.userId,
              status: JobStatus.QUEUED,
              priority: (jobInput.priority as JobPriority) || JobPriority.MEDIUM,
              fileUrl,
              fileName,
              fileMimeType,
              metadata: jobInput.metadata as object,
            },
          });
        })
      );

      return createdJobs;
    });

    try {
      await Promise.all(
        jobs.map((job) =>
          addJobToQueue({
            jobId: job.id,
            fileUrl: job.fileUrl || undefined,
            fileName: job.fileName || undefined,
            fileMimeType: job.fileMimeType || undefined,
            fileSize: job.fileSize || undefined,
            userId: job.userId || undefined,
            priority: job.priority as JobPriority,
            metadata: job.metadata as Record<string, unknown>,
          })
        )
      );

      logger.info('Bulk jobs created and enqueued', {
        count: jobs.length,
      });

      return jobs;
    } catch (error) {
      logger.error('Failed to enqueue bulk jobs', error as Error);
      throw error;
    }
  }

  async cancelJob(jobId: string, cancelledBy?: string): Promise<Job> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    if (job.status === JobStatus.COMPLETED) {
      throw new ConflictError('Cannot cancel a completed job');
    }

    if (job.status === JobStatus.FAILED) {
      throw new ConflictError('Cannot cancel a failed job');
    }

    if (job.status === JobStatus.CANCELLED) {
      throw new ConflictError('Job is already cancelled');
    }

    if (job.status === JobStatus.QUEUED || job.status === JobStatus.SCHEDULED) {
      const bullJob = await documentQueue.getJob(jobId);
      if (bullJob) {
        await bullJob.remove();
        logger.info('Job removed from queue', { jobId });
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy,
      },
    });

    await this.addJobLog(jobId, 'INFO', 'Job cancelled', { cancelledBy });

    logger.info('Job cancelled', { jobId, cancelledBy });

    return updatedJob;
  }

  async getJob(jobId: string): Promise<Job> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        webhooks: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    return job;
  }

  async listJobs(input: ListJobsInput): Promise<{ jobs: Job[]; total: number }> {
    const { page, limit, status, priority, userId, search, dateFrom, dateTo, sortBy, order } = input;
    const skip = (page - 1) * limit;

    const where: {
      status?: JobStatus;
      priority?: JobPriority;
      userId?: string;
      fileName?: { contains: string; mode: 'insensitive' };
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (status) where.status = status as JobStatus;
    if (priority) where.priority = priority as JobPriority;
    if (userId) where.userId = userId;
    if (search) {
      where.fileName = { contains: search, mode: 'insensitive' };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total };
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    data?: {
      result?: JobResult;
      errorMessage?: string;
      errorStack?: string;
      processingTime?: number;
    }
  ): Promise<Job> {
    const updateData: {
      status: JobStatus;
      result?: object;
      errorMessage?: string;
      errorStack?: string;
      processingTime?: number;
      startedAt?: Date;
      completedAt?: Date;
      failedAt?: Date;
      attempts?: { increment: number };
    } = { status };

    if (status === JobStatus.PROCESSING) {
      updateData.startedAt = new Date();
      updateData.attempts = { increment: 1 };
    } else if (status === JobStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (data?.result) updateData.result = data.result as object;
      if (data?.processingTime) updateData.processingTime = data.processingTime;
    } else if (status === JobStatus.FAILED) {
      updateData.failedAt = new Date();
      if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
      if (data?.errorStack) updateData.errorStack = data.errorStack;
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    logger.info('Job status updated', {
      jobId,
      status,
      previousStatus: job.status,
    });

    return job;
  }

  async addJobLog(
    jobId: string,
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await prisma.jobLog.create({
      data: {
        jobId,
        level,
        message,
        metadata: metadata as object,
      },
    });
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private guessMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export const jobService = new JobService();