import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger.util';
import { JobData } from '../types';

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

connection.on('error', (err) => {
  logger.error('Redis connection error in queue', err);
});

connection.on('connect', () => {
  logger.info('Redis connected for queue');
});

export const documentQueue = new Queue<JobData>('document-processing', {
  connection,
  defaultJobOptions: {
    attempts: config.queue.maxAttempts,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
    timeout: config.queue.jobTimeout,
  },
});

export const queueEvents = new QueueEvents('document-processing', {
  connection,
});

queueEvents.on('completed', ({ jobId }) => {
  logger.info('Queue event: job completed', { jobId });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error('Queue event: job failed', undefined, { jobId, failedReason });
});

queueEvents.on('progress', ({ jobId, data }) => {
  logger.debug('Queue event: job progress', { jobId, progress: data });
});

export const addJobToQueue = async (jobData: JobData): Promise<string> => {
  try {
    const job = await documentQueue.add('process-document', jobData, {
      jobId: jobData.jobId,
    });

    logger.info('Job added to queue', {
      jobId: job.id,
      queueName: documentQueue.name,
    });

    return job.id as string;
  } catch (error) {
    logger.error('Failed to add job to queue', error as Error, {
      jobId: jobData.jobId,
    });
    throw error;
  }
};

export const getQueueHealth = async (): Promise<{
  status: 'up' | 'down';
  details?: Record<string, unknown>;
}> => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      documentQueue.getWaitingCount(),
      documentQueue.getActiveCount(),
      documentQueue.getCompletedCount(),
      documentQueue.getFailedCount(),
    ]);

    return {
      status: 'up',
      details: {
        waiting,
        active,
        completed,
        failed,
      },
    };
  } catch (error) {
    logger.error('Queue health check failed', error as Error);
    return {
      status: 'down',
    };
  }
};

export const closeQueue = async (): Promise<void> => {
  await documentQueue.close();
  await queueEvents.close();
  await connection.quit();
  logger.info('Document queue closed');
};