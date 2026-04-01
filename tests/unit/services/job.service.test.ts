import { JobService } from '../../../src/services/job.service';
import { PrismaClient, JobStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.util';
import { cleanupTestJobs } from '../../helpers/test-db.helper';

jest.mock('../../../src/queues/document.queue', () => ({
  addJobToQueue: jest.fn().mockResolvedValue('job-123'),
}));

const prisma = new PrismaClient();
const jobService = new JobService();

describe('JobService', () => {
  afterEach(async () => {
    await cleanupTestJobs();
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job with file URL', async () => {
      const input = {
        fileUrl: 'https://example.com/test.pdf',
        userId: 'user-123',
      };

      const job = await jobService.createJob(input);

      expect(job).toBeDefined();
      expect(job.status).toBe(JobStatus.QUEUED);
      expect(job.fileUrl).toBe(input.fileUrl);
      expect(job.userId).toBe(input.userId);
    });

    it('should create a job with file upload', async () => {
      const input = { userId: 'user-123' };
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        filename: 'uploaded-test.pdf',
      } as Express.Multer.File;

      const job = await jobService.createJob(input, file);

      expect(job).toBeDefined();
      expect(job.fileName).toBe('test.pdf');
      expect(job.fileMimeType).toBe('application/pdf');
      expect(job.fileSize).toBe(1024);
    });

    it('should throw ValidationError when neither file nor URL provided', async () => {
      const input = { userId: 'user-123' };

      await expect(jobService.createJob(input)).rejects.toThrow(ValidationError);
    });

    it('should handle queue enqueue failure', async () => {
      const { addJobToQueue } = require('../../../src/queues/document.queue');
      addJobToQueue.mockRejectedValueOnce(new Error('Queue error'));

      const input = { fileUrl: 'https://example.com/test.pdf' };

      await expect(jobService.createJob(input)).rejects.toThrow();

      const failedJob = await prisma.job.findFirst({
        where: { status: JobStatus.FAILED },
      });
      expect(failedJob).toBeDefined();
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', async () => {
      const created = await prisma.job.create({
        data: {
          status: JobStatus.QUEUED,
          fileName: 'test.pdf',
          fileMimeType: 'application/pdf',
          fileSize: 1024,
        },
      });

      const job = await jobService.getJob(created.id);

      expect(job).toBeDefined();
      expect(job.id).toBe(created.id);
    });

    it('should throw NotFoundError for non-existent job', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(jobService.getJob(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('listJobs', () => {
    beforeEach(async () => {
      await Promise.all([
        prisma.job.create({
          data: {
            status: JobStatus.QUEUED,
            fileName: 'file1.pdf',
            fileMimeType: 'application/pdf',
          },
        }),
        prisma.job.create({
          data: {
            status: JobStatus.COMPLETED,
            fileName: 'file2.pdf',
            fileMimeType: 'application/pdf',
          },
        }),
        prisma.job.create({
          data: {
            status: JobStatus.QUEUED,
            fileName: 'file3.pdf',
            fileMimeType: 'application/pdf',
            userId: 'user-123',
          },
        }),
      ]);
    });

    it('should list all jobs with pagination', async () => {
      const { jobs, total } = await jobService.listJobs({
        page: 1,
        limit: 10,
      });

      expect(jobs).toHaveLength(3);
      expect(total).toBe(3);
    });

    it('should filter jobs by status', async () => {
      const { jobs, total } = await jobService.listJobs({
        page: 1,
        limit: 10,
        status: 'QUEUED',
      });

      expect(jobs).toHaveLength(2);
      expect(total).toBe(2);
      expect(jobs.every((j) => j.status === JobStatus.QUEUED)).toBe(true);
    });

    it('should filter jobs by userId', async () => {
      const { jobs, total } = await jobService.listJobs({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(jobs).toHaveLength(1);
      expect(total).toBe(1);
      expect(jobs[0].userId).toBe('user-123');
    });

    it('should handle pagination correctly', async () => {
      const { jobs } = await jobService.listJobs({
        page: 2,
        limit: 2,
      });

      expect(jobs).toHaveLength(1);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job to PROCESSING', async () => {
      const created = await prisma.job.create({
        data: {
          status: JobStatus.QUEUED,
          fileName: 'test.pdf',
          fileMimeType: 'application/pdf',
        },
      });

      const updated = await jobService.updateJobStatus(created.id, JobStatus.PROCESSING);

      expect(updated.status).toBe(JobStatus.PROCESSING);
      expect(updated.startedAt).toBeDefined();
      expect(updated.attempts).toBe(1);
    });

    it('should update job to COMPLETED with result', async () => {
      const created = await prisma.job.create({
        data: {
          status: JobStatus.PROCESSING,
          fileName: 'test.pdf',
          fileMimeType: 'application/pdf',
        },
      });

      const result = {
        processedAt: new Date().toISOString(),
        processingTime: 10000,
        documentInfo: {
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        },
        analysis: {},
      };

      const updated = await jobService.updateJobStatus(created.id, JobStatus.COMPLETED, {
        result,
        processingTime: 10000,
      });

      expect(updated.status).toBe(JobStatus.COMPLETED);
      expect(updated.completedAt).toBeDefined();
      expect(updated.result).toEqual(result);
      expect(updated.processingTime).toBe(10000);
    });

    it('should update job to FAILED with error', async () => {
      const created = await prisma.job.create({
        data: {
          status: JobStatus.PROCESSING,
          fileName: 'test.pdf',
          fileMimeType: 'application/pdf',
        },
      });

      const updated = await jobService.updateJobStatus(created.id, JobStatus.FAILED, {
        errorMessage: 'Processing failed',
        errorStack: 'Error stack trace',
      });

      expect(updated.status).toBe(JobStatus.FAILED);
      expect(updated.failedAt).toBeDefined();
      expect(updated.errorMessage).toBe('Processing failed');
    });
  });

  describe('addJobLog', () => {
    it('should add a log entry to a job', async () => {
      const created = await prisma.job.create({
        data: {
          status: JobStatus.QUEUED,
          fileName: 'test.pdf',
          fileMimeType: 'application/pdf',
        },
      });

      await jobService.addJobLog(created.id, 'INFO', 'Job started');

      const job = await prisma.job.findUnique({
        where: { id: created.id },
        include: { logs: true },
      });

      expect(job?.logs).toHaveLength(1);
      expect(job?.logs[0].level).toBe('INFO');
      expect(job?.logs[0].message).toBe('Job started');
    });
  });
});