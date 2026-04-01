import { createWorker, closeWorker } from './workers/document.worker';
import { logger } from './utils/logger.util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startWorker = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected for worker');

    const worker = createWorker();

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting worker shutdown`);

      try {
        await closeWorker(worker);
        await prisma.$disconnect();
        logger.info('Worker shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during worker shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection in worker', reason as Error);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception in worker', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start worker', error as Error);
    process.exit(1);
  }
};

void startWorker();