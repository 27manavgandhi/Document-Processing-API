import { Router } from 'express';
import healthRoutes from './health.routes';
import jobRoutes from './job.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/jobs', jobRoutes);

export default router;