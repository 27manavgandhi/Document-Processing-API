import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../../src/config';

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

export const cleanQueue = async (queueName: string): Promise<void> => {
  const queue = new Queue(queueName, { connection });
  await queue.drain();
  await queue.clean(0, 1000, 'completed');
  await queue.clean(0, 1000, 'failed');
  await queue.close();
};

export const getQueueCounts = async (queueName: string) => {
  const queue = new Queue(queueName, { connection });
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);
  await queue.close();
  return { waiting, active, completed, failed };
};