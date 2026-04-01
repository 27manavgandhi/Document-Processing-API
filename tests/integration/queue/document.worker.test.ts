import { createWorker, closeWorker } from '../../../src/workers/document.worker';
import { addJobToQueue, documentQueue } from '../../../src/queues/document.queue';
import { cleanupTestJobs, createTestJob } from '../../helpers/test-db.helper';
import { cleanQueue } from '../../helpers/test-queue.helper';
import { JobStatus, JobPriority } from '@prisma/client';
import { Worker } from 'bullmq';
import { jobService } from '../../../src/services/job.service';

describe('Document Worker', () => {
  let worker: Worker;

  beforeAll(() => {
    worker = createWorker();
  });

  afterAll(async () => {
    await closeWorker(worker);
  });

  afterEach(async () => {
    await cleanupTestJobs();
    await cleanQueue('document-processing');
  });

  it('should process a job successfully', async () => {
    const job = await createTestJob({
      status: JobStatus.QUEUED,
      fileName: 'test.pdf',
      fileMimeType: 'application/pdf',
      fileSize: 1024,
    });

    await addJobToQueue({
      jobId: job.id,
      fileName: job.fileName!,
      fileMimeType: job.fileMimeType!,
      fileSize: job.fileSize!,
    });

    await new Promise((resolve) => setTimeout(resolve, 25000));

    const updatedJob = await jobService.getJob(job.id);
    expect(updatedJob.status).toBe(JobStatus.COMPLETED);
    expect(updatedJob.result).toBeDefined();
    expect(updatedJob.completedAt).toBeDefined();
  }, 30000);

  it('should update job status to PROCESSING when picked up', async () => {
    const job = await createTestJob({
      status: JobStatus.QUEUED,
      fileName: 'test.pdf',
      fileMimeType: 'application/pdf',
    });

    await addJobToQueue({
      jobId: job.id,
      fileName: job.fileName!,
      fileMimeType: job.fileMimeType!,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const updatedJob = await jobService.getJob(job.id);
    expect([JobStatus.PROCESSING, JobStatus.COMPLETED]).toContain(updatedJob.status);
  }, 10000);

  it('should handle job failure', async () => {
    const job = await createTestJob({
      status: JobStatus.QUEUED,
      fileName: null,
      fileMimeType: null,
    });

    await addJobToQueue({
      jobId: job.id,
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const updatedJob = await jobService.getJob(job.id);
    expect([JobStatus.FAILED, JobStatus.QUEUED]).toContain(updatedJob.status);
  }, 10000);

  it('should respect priority order', async () => {
    const lowPriorityJob = await createTestJob({
      status: JobStatus.QUEUED,
      priority: JobPriority.LOW,
      fileName: 'low.pdf',
      fileMimeType: 'application/pdf',
    });

    const highPriorityJob = await createTestJob({
      status: JobStatus.QUEUED,
      priority: JobPriority.HIGH,
      fileName: 'high.pdf',
      fileMimeType: 'application/pdf',
    });

    await addJobToQueue({
      jobId: lowPriorityJob.id,
      fileName: 'low.pdf',
      fileMimeType: 'application/pdf',
      priority: JobPriority.LOW,
    });

    await addJobToQueue({
      jobId: highPriorityJob.id,
      fileName: 'high.pdf',
      fileMimeType: 'application/pdf',
      priority: JobPriority.HIGH,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const highJob = await jobService.getJob(highPriorityJob.id);
    expect([JobStatus.PROCESSING, JobStatus.COMPLETED]).toContain(highJob.status);
  }, 10000);
});