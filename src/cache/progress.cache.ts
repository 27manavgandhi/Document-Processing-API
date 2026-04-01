import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger.util';

interface JobProgress {
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining: number;
  lastUpdated: string;
}

class ProgressCache {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });
  }

  async setProgress(jobId: string, progress: JobProgress): Promise<void> {
    try {
      const key = `job:${jobId}:progress`;
      await this.client.setex(key, 300, JSON.stringify(progress));
    } catch (error) {
      logger.error('Failed to set progress', error as Error, { jobId });
    }
  }

  async getProgress(jobId: string): Promise<JobProgress | null> {
    try {
      const key = `job:${jobId}:progress`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get progress', error as Error, { jobId });
      return null;
    }
  }

  async deleteProgress(jobId: string): Promise<void> {
    try {
      const key = `job:${jobId}:progress`;
      await this.client.del(key);
    } catch (error) {
      logger.error('Failed to delete progress', error as Error, { jobId });
    }
  }
}

export const progressCache = new ProgressCache();