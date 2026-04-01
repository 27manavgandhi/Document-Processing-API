import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import routes from './routes';
import metricsRoutes from './routes/metrics.routes';
import { bullBoardRouter } from './monitoring/bull-board';
import { setupSwagger } from './swagger';
import { logger } from './utils/logger.util';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.server.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(requestLogger);
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  setupSwagger(app);

  app.use('/metrics', metricsRoutes);
  app.use('/admin/queues', bullBoardRouter);

  app.use(rateLimitMiddleware);

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('Express application configured', {
    env: config.env,
    corsOrigin: config.server.corsOrigin,
  });

  return app;
};