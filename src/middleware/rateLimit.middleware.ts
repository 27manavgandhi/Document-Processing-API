import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { config } from '../config';
import { TooManyRequestsError } from '../utils/errors.util';
import { logger } from '../utils/logger.util';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => {
  logger.error('Redis client error in rate limiter', err);
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit',
  points: config.rateLimit.maxRequests,
  duration: Math.floor(config.rateLimit.windowMs / 1000),
  blockDuration: 60,
});

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    const rateLimiterRes: RateLimiterRes = await rateLimiter.consume(key, 1);

    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
      });
      next(new TooManyRequestsError('Too many requests, please try again later'));
    } else {
      const rejRes = error as RateLimiterRes;
      res.setHeader('Retry-After', Math.ceil(rejRes.msBeforeNext / 1000));
      next(new TooManyRequestsError('Too many requests, please try again later'));
    }
  }
};