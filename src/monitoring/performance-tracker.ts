import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger.util';

export class PerformanceTracker {
  static startTransaction(name: string, op: string): Sentry.Transaction | null {
    try {
      return Sentry.startTransaction({ name, op });
    } catch (error) {
      logger.error('Failed to start transaction', error as Error, { name, op });
      return null;
    }
  }

  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      logger.debug('Performance measurement', {
        name,
        duration,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.warn('Performance measurement failed', {
        name,
        duration,
        status: 'error',
      });
      
      throw error;
    }
  }

  static measure<T>(name: string, fn: () => T): T {
    const start = Date.now();
    
    try {
      const result = fn();
      const duration = Date.now() - start;
      
      logger.debug('Performance measurement', {
        name,
        duration,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.warn('Performance measurement failed', {
        name,
        duration,
        status: 'error',
      });
      
      throw error;
    }
  }
}