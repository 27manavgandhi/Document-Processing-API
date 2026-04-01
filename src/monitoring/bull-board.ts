import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { documentQueue } from '../queues/document.queue';
import { logger } from '../utils/logger.util';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(documentQueue)],
  serverAdapter,
});

logger.info('Bull Board initialized at /admin/queues');

export const bullBoardRouter = serverAdapter.getRouter();