import { Worker, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import { logger, createJobLogger } from '../utils/logger.util';
import { JobData, JobStatus } from '../types';
import { jobService } from '../services/job.service';
import { documentService } from '../services/document.service';
import { progressCache } from '../cache/progress.cache';
import { WebhookSignature } from '../utils/webhook-signature.util';
import axios from 'axios';

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

const processDocument = async (job: BullJob<JobData>): Promise<void> => {
  const { jobId, fileName, fileSize, fileMimeType, fileUrl, webhookUrl } = job.data;
  const jobLogger = createJobLogger(jobId);

  jobLogger.info('Worker picked up job for processing');

  const dbJob = await jobService.getJob(jobId);
  if (dbJob.status === JobStatus.CANCELLED) {
    jobLogger.info('Job was cancelled before processing started');
    return;
  }

  try {
    await jobService.updateJobStatus(jobId, JobStatus.PROCESSING);
    await jobService.addJobLog(jobId, 'INFO', 'Job processing started');

    await progressCache.setProgress(jobId, {
      percentage: 0,
      currentStep: 'Starting',
      estimatedTimeRemaining: 15000,
      lastUpdated: new Date().toISOString(),
    });

    if (!fileName || !fileMimeType) {
      throw new Error('Missing required file information');
    }

    await job.updateProgress(25);
    await progressCache.setProgress(jobId, {
      percentage: 25,
      currentStep: 'Validating file',
      estimatedTimeRemaining: 12000,
      lastUpdated: new Date().toISOString(),
    });

    jobLogger.info('Validating file');

    if (fileUrl) {
      const isValid = await documentService.validateFileUrl(fileUrl);
      if (!isValid) {
        throw new Error('File URL is not accessible');
      }
    }

    await job.updateProgress(50);
    await progressCache.setProgress(jobId, {
      percentage: 50,
      currentStep: 'Processing document',
      estimatedTimeRemaining: 8000,
      lastUpdated: new Date().toISOString(),
    });

    jobLogger.info('Processing document');

    const result = await documentService.processDocument(
      fileName,
      fileSize || 0,
      fileMimeType,
      fileUrl
    );

    await job.updateProgress(75);
    await progressCache.setProgress(jobId, {
      percentage: 75,
      currentStep: 'Finalizing',
      estimatedTimeRemaining: 4000,
      lastUpdated: new Date().toISOString(),
    });

    await jobService.updateJobStatus(jobId, JobStatus.COMPLETED, {
      result,
      processingTime: result.processingTime,
    });

    await jobService.addJobLog(jobId, 'INFO', 'Job completed successfully', {
      processingTime: result.processingTime,
    });

    await job.updateProgress(100);
    await progressCache.setProgress(jobId, {
      percentage: 100,
      currentStep: 'Completed',
      estimatedTimeRemaining: 0,
      lastUpdated: new Date().toISOString(),
    });

    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        jobId,
        status: JobStatus.COMPLETED,
        result,
      });
      jobLogger.info('Webhook sent successfully', { webhookUrl });
    }

    await progressCache.deleteProgress(jobId);

    jobLogger.info('Job completed successfully', {
      processingTime: result.processingTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    jobLogger.error('Job processing failed', error as Error);

    await jobService.updateJobStatus(jobId, JobStatus.FAILED, {
      errorMessage,
      errorStack,
    });

    await jobService.addJobLog(jobId, 'ERROR', 'Job processing failed', {
      error: errorMessage,
    });

    await progressCache.deleteProgress(jobId);

    if (webhookUrl) {
      try {
        await sendWebhook(webhookUrl, {
          jobId,
          status: JobStatus.FAILED,
          error: errorMessage,
        });
      } catch (webhookError) {
        jobLogger.error('Failed to send failure webhook', webhookError as Error);
      }
    }

    throw error;
  }
};

const sendWebhook = async (url: string, payload: unknown): Promise<void> => {
  try {
    const { signature, timestamp } = WebhookSignature.generate(payload as Record<string, unknown>);

    await axios.post(url, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DocumentProcessingAPI/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
      },
    });
  } catch (error) {
    logger.error('Webhook delivery failed', error as Error, { url });
    throw error;
  }
};

export const createWorker = (): Worker<JobData> => {
  const worker = new Worker<JobData>('document-processing', processDocument, {
    connection,
    concurrency: config.queue.concurrency,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  worker.on('completed', (job) => {
    logger.info('Worker completed job', {
      jobId: job.id,
      duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Worker failed job', err, {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Worker error', err);
  });

  logger.info('Document worker started', {
    concurrency: config.queue.concurrency,
  });

  return worker;
};

export const closeWorker = async (worker: Worker): Promise<void> => {
  await worker.close();
  await connection.quit();
  logger.info('Document worker closed');
};