import { Router } from 'express';
import multer from 'multer';
import { createJob, getJob, listJobs, cancelJob, scheduleJob, bulkCreateJobs } from '../controllers/job.controller';
import { validateBody, validateParams, validateQuery, validateFile } from '../middleware/validation.middleware';
import { createJobSchema, getJobSchema, listJobsSchema, scheduleJobSchema, bulkCreateJobSchema } from '../validators/job.validator';
import { config } from '../config';

const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               userId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               webhookUrl:
 *                 type: string
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', upload.single('file'), validateFile, validateBody(createJobSchema), createJob);

/**
 * @swagger
 * /api/v1/jobs/schedule:
 *   post:
 *     summary: Schedule a job for future processing
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledFor
 *             properties:
 *               fileUrl:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       201:
 *         description: Job scheduled successfully
 */
router.post('/schedule', upload.single('file'), validateBody(scheduleJobSchema), scheduleJob);

/**
 * @swagger
 * /api/v1/jobs/bulk:
 *   post:
 *     summary: Create multiple jobs in bulk
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobs:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       201:
 *         description: Jobs created successfully
 */
router.post('/bulk', validateBody(bulkCreateJobSchema), bulkCreateJobs);

/**
 * @swagger
 * /api/v1/jobs/{jobId}:
 *   get:
 *     summary: Get job details
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get('/:jobId', validateParams(getJobSchema), getJob);

/**
 * @swagger
 * /api/v1/jobs/{jobId}:
 *   delete:
 *     summary: Cancel a job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job cancelled successfully
 *       404:
 *         description: Job not found
 *       409:
 *         description: Job cannot be cancelled
 */
router.delete('/:jobId', validateParams(getJobSchema), cancelJob);

/**
 * @swagger
 * /api/v1/jobs:
 *   get:
 *     summary: List jobs with filtering and pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [QUEUED, SCHEDULED, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/', validateQuery(listJobsSchema), listJobs);

export default router;