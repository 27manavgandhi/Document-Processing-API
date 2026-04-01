import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.util';
import { sendError } from '../utils/response.util';
import { logger } from '../utils/logger.util';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.headers['x-correlation-id'] as string;

  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      correlationId,
      path: req.path,
      errors: err.errors,
    });
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.errors);
    return;
  }

  if (err instanceof AppError) {
    logger.warn('Application error', {
      correlationId,
      path: req.path,
      code: err.code,
      message: err.message,
    });
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  logger.error('Unhandled error', err, {
    correlationId,
    path: req.path,
    method: req.method,
  });

  sendError(res, config.isProduction ? 'Internal server error' : err.message, 500, 'INTERNAL_ERROR');
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};

import { config } from '../config';