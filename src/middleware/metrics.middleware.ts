import { Request, Response, NextFunction } from 'express';
import {
  httpRequestCounter,
  httpRequestDuration,
  activeHttpRequests,
} from '../metrics/prometheus';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  activeHttpRequests.inc();

  const endpoint = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      endpoint,
      status: res.statusCode.toString(),
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);
    activeHttpRequests.dec();
  });

  next();
};