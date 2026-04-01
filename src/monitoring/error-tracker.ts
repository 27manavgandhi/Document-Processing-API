import * as Sentry from '@sentry/node';
import { config } from '../config';
import { logger } from '../utils/logger.util';

export class ErrorTracker {
  private static initialized = false;

  static initialize(): void {
    if (this.initialized || !process.env.SENTRY_DSN) {
      return;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: config.env,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      beforeSend(event) {
        if (config.isDevelopment) {
          logger.debug('Sentry event', { event });
        }
        return event;
      },
    });

    this.initialized = true;
    logger.info('Error tracking initialized');
  }

  static captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized) return;

    Sentry.captureException(error, {
      extra: context,
    });
  }

  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.initialized) return;

    Sentry.captureMessage(message, level);
  }

  static setUser(user: { id: string; email?: string }): void {
    if (!this.initialized) return;

    Sentry.setUser(user);
  }

  static clearUser(): void {
    if (!this.initialized) return;

    Sentry.setUser(null);
  }

  static addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb(breadcrumb);
  }
}