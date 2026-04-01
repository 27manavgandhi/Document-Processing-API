import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.util';
import { jobService } from '../services/job.service';
import { progressCache } from '../cache/progress.cache';
import { CreateJobInput, ListJobsInput, ScheduleJobInput, BulkCreateJobInput } from '../validators/job.validator';

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as CreateJobInput;
    const file = req.file;

    const job = await jobService.createJob(input, file);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        priority: job.priority,
        message: 'Job created and queued for processing',
        createdAt: job.createdAt,
        queuedAt: job.queuedAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as ScheduleJobInput;
    const file = req.file;

    const job = await jobService.scheduleJob(input, file);

    sendCreated(res, {
      jobId: job.id,
      status: job.status,
      priority: job.priority,
      scheduledFor: job.scheduledFor,
      createdAt: job.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as BulkCreateJobInput;

    const jobs = await jobService.bulkCreateJobs(input);

    sendCreated(res, {
      count: jobs.length,
      jobs: jobs.map((job) => ({
        jobId: job.id,
        status: job.status,
        priority: job.priority,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const cancelJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const cancelledBy = req.body.cancelledBy || req.headers['x-user-id'];

    const job = await jobService.cancelJob(jobId, cancelledBy as string);

    sendSuccess(res, {
      jobId: job.id,
      status: job.status,
      cancelledAt: job.cancelledAt,
      cancelledBy: job.cancelledBy,
    });
  } catch (error) {
    next(error);
  }
};

export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await jobService.getJob(jobId);
    const progress = await progressCache.getProgress(jobId);

    sendSuccess(res, {
      id: job.id,
      status: job.status,
      priority: job.priority,
      fileName: job.fileName,
      fileMimeType: job.fileMimeType,
      fileSize: job.fileSize,
      fileUrl: job.fileUrl,
      progress: progress || undefined,
      result: job.result,
      errorMessage: job.errorMessage,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      processingTime: job.processingTime,
      scheduledFor: job.scheduledFor,
      timestamps: {
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        queuedAt: job.queuedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        cancelledAt: job.cancelledAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.query as unknown as ListJobsInput;
    const { jobs, total } = await jobService.listJobs(input);

    sendPaginated(res, jobs, input.page, input.limit, total);
  } catch (error) {
    next(error);
  }
};