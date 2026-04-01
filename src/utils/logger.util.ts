import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, correlationId, jobId, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (correlationId) log += ` [CID: ${correlationId}]`;
    if (jobId) log += ` [JID: ${jobId}]`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'document-processing-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (config.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export const createJobLogger = (jobId: string, correlationId?: string) => {
  return {
    debug: (message: string, meta?: Record<string, unknown>) =>
      logger.debug(message, { jobId, correlationId, ...meta }),
    info: (message: string, meta?: Record<string, unknown>) =>
      logger.info(message, { jobId, correlationId, ...meta }),
    warn: (message: string, meta?: Record<string, unknown>) =>
      logger.warn(message, { jobId, correlationId, ...meta }),
    error: (message: string, error?: Error, meta?: Record<string, unknown>) =>
      logger.error(message, { jobId, correlationId, error: error?.message, stack: error?.stack, ...meta }),
  };
};