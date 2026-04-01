import { Router, Request, Response } from 'express';
import { register } from '../metrics/prometheus';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

export default router;