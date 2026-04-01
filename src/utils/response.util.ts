import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, meta?: Record<string, unknown>): void => {
  sendSuccess(res, data, meta, 201);
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number
): void => {
  const totalPages = Math.ceil(total / limit);
  sendSuccess(res, {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};