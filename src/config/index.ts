import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('10'),
  QUEUE_CONCURRENCY: z.string().transform(Number).default('5'),
  JOB_TIMEOUT_MS: z.string().transform(Number).default('120000'),
  JOB_MAX_ATTEMPTS: z.string().transform(Number).default('3'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  PROCESSING_MIN_DELAY_MS: z.string().transform(Number).default('10000'),
  PROCESSING_MAX_DELAY_MS: z.string().transform(Number).default('20000'),
  CORS_ORIGIN: z.string().default('*'),
});

const envVars = envSchema.parse(process.env);

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
  
  database: {
    url: envVars.DATABASE_URL,
  },
  
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  },
  
  server: {
    port: envVars.PORT,
    corsOrigin: envVars.CORS_ORIGIN,
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
  },
  
  upload: {
    maxFileSizeMB: envVars.MAX_FILE_SIZE_MB,
    maxFileSizeBytes: envVars.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  
  queue: {
    concurrency: envVars.QUEUE_CONCURRENCY,
    jobTimeout: envVars.JOB_TIMEOUT_MS,
    maxAttempts: envVars.JOB_MAX_ATTEMPTS,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  processing: {
    minDelayMs: envVars.PROCESSING_MIN_DELAY_MS,
    maxDelayMs: envVars.PROCESSING_MAX_DELAY_MS,
  },
} as const;