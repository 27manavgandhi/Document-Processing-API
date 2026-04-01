import { cacheService } from '../redis.cache';
import { Job } from '@prisma/client';
import { logger } from '../../utils/logger.util';

const JOB_CACHE_TTL = 3600;
const COMPLETED_JOB_TTL = 86400;

export class JobCacheStrategy {
  static getCacheKey(jobId: string): string {
    return `job:${jobId}`;
  }

  static async get(jobId: string): Promise<Job | null> {
    try {
      const cached = await cacheService.get<Job>(this.getCacheKey(jobId));
      if (cached) {
        logger.debug('Job cache hit', { jobId });
      }
      return cached;
    } catch (error) {
      logger.error('Job cache get failed', error as Error, { jobId });
      return null;
    }
  }

  static async set(job: Job): Promise<void> {
    try {
      const ttl = job.status === 'COMPLETED' || job.status === 'FAILED' 
        ? COMPLETED_JOB_TTL 
        : JOB_CACHE_TTL;
      
      await cacheService.set(this.getCacheKey(job.id), job, ttl);
      logger.debug('Job cached', { jobId: job.id, ttl });
    } catch (error) {
      logger.error('Job cache set failed', error as Error, { jobId: job.id });
    }
  }

  static async invalidate(jobId: string): Promise<void> {
    try {
      await cacheService.delete(this.getCacheKey(jobId));
      logger.debug('Job cache invalidated', { jobId });
    } catch (error) {
      logger.error('Job cache invalidation failed', error as Error, { jobId });
    }
  }
}