import { cacheService } from '../redis.cache';
import { Job } from '@prisma/client';
import { logger } from '../../utils/logger.util';

const LIST_CACHE_TTL = 300;

export class ListCacheStrategy {
  static getCacheKey(params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `jobs:list:${sortedParams}`;
  }

  static async get(params: Record<string, unknown>): Promise<{ jobs: Job[]; total: number } | null> {
    try {
      const cached = await cacheService.get<{ jobs: Job[]; total: number }>(
        this.getCacheKey(params)
      );
      if (cached) {
        logger.debug('List cache hit', { params });
      }
      return cached;
    } catch (error) {
      logger.error('List cache get failed', error as Error, { params });
      return null;
    }
  }

  static async set(params: Record<string, unknown>, data: { jobs: Job[]; total: number }): Promise<void> {
    try {
      await cacheService.set(this.getCacheKey(params), data, LIST_CACHE_TTL);
      logger.debug('List cached', { params });
    } catch (error) {
      logger.error('List cache set failed', error as Error, { params });
    }
  }

  static async invalidateAll(): Promise<void> {
    try {
      await cacheService.deletePattern('jobs:list:*');
      logger.debug('All list caches invalidated');
    } catch (error) {
      logger.error('List cache invalidation failed', error as Error);
    }
  }
}