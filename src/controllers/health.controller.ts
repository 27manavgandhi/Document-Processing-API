import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response.util';
import { HealthCheckResponse, ServiceStatus } from '../types';
import { getQueueHealth } from '../queues/document.queue';
import Redis from 'ioredis';
import { config } from '../config';

const prisma = new PrismaClient();
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
});

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

export const getDetailedHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startTime = Date.now();

    const [dbStatus, redisStatus, queueStatus] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkQueue(),
    ]);

    const services = {
      database: dbStatus.status === 'fulfilled' ? dbStatus.value : { status: 'down' as const },
      redis: redisStatus.status === 'fulfilled' ? redisStatus.value : { status: 'down' as const },
      queue: queueStatus.status === 'fulfilled' ? queueStatus.value : { status: 'down' as const },
    };

    const overallStatus =
      Object.values(services).every((s) => s.status === 'up')
        ? 'healthy'
        : Object.values(services).some((s) => s.status === 'up')
          ? 'degraded'
          : 'unhealthy';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    sendSuccess(res, response, { responseTime: Date.now() - startTime }, statusCode);
  } catch (error) {
    next(error);
  }
};

const checkDatabase = async (): Promise<ServiceStatus> => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
};

const checkRedis = async (): Promise<ServiceStatus> => {
  const start = Date.now();
  try {
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
};

const checkQueue = async (): Promise<ServiceStatus> => {
  try {
    const queueHealth = await getQueueHealth();
    return {
      status: queueHealth.status,
      details: queueHealth.details,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Queue health check failed',
    };
  }
};