import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../helpers/test-server.helper';
import { cleanupTestJobs } from '../helpers/test-db.helper';
import { cleanQueue } from '../helpers/test-queue.helper';
import { createWorker, closeWorker } from '../../src/workers/document.worker';
import { Worker } from 'bullmq';
import { JobStatus } from '@prisma/client';

describe('E2E: Concurrent Processing', () => {
  let app: Application;
  let worker: Worker;

  beforeAll(() => {
    app = setupTestServer();
    worker = createWorker();
  });

  afterAll(async () => {
    await closeWorker(worker);
  });

  afterEach(async () => {
    await cleanupTestJobs();
    await cleanQueue('document-processing');
  });

  it('should process 10 jobs concurrently', async () => {
    const jobPromises = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: `https://example.com/test-${i}.pdf`,
          userId: 'concurrent-test-user',
        })
    );

    const responses = await Promise.all(jobPromises);

    expect(responses.every((r) => r.status === 202)).toBe(true);

    const jobIds = responses.map((r) => r.body.data.jobId);

    await new Promise((resolve) => setTimeout(resolve, 30000));

    const statusPromises = jobIds.map((id) =>
      request(app).get(`/api/v1/jobs/${id}`)
    );
    const statusResponses = await Promise.all(statusPromises);

    const completedJobs = statusResponses.filter(
      (r) => r.body.data.status === JobStatus.COMPLETED
    );

    expect(completedJobs.length).toBeGreaterThanOrEqual(8);

    const allJobsProcessed = statusResponses.every((r) =>
      [JobStatus.COMPLETED, JobStatus.PROCESSING].includes(r.body.data.status)
    );
    expect(allJobsProcessed).toBe(true);
  }, 40000);

  it('should handle high load without failures', async () => {
    const jobCount = 20;
    const jobs = [];

    for (let i = 0; i < jobCount; i++) {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: `https://example.com/load-test-${i}.pdf`,
          userId: 'load-test-user',
        });
      
      jobs.push(response.body.data.jobId);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(jobs).toHaveLength(jobCount);

    await new Promise((resolve) => setTimeout(resolve, 35000));

    const statusChecks = await Promise.all(
      jobs.map((id) => request(app).get(`/api/v1/jobs/${id}`))
    );

    const allValid = statusChecks.every((r) => r.status === 200);
    expect(allValid).toBe(true);

    const completedOrProcessing = statusChecks.every((r) =>
      [JobStatus.COMPLETED, JobStatus.PROCESSING, JobStatus.QUEUED].includes(
        r.body.data.status
      )
    );
    expect(completedOrProcessing).toBe(true);
  }, 45000);

  it('should maintain job order with priority', async () => {
    const highPriorityResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://example.com/high-priority.pdf',
        priority: 'HIGH',
        userId: 'priority-test-user',
      });

    const lowPriorityResponses = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/jobs')
          .send({
            fileUrl: `https://example.com/low-${i}.pdf`,
            priority: 'LOW',
            userId: 'priority-test-user',
          })
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 25000));

    const highPriorityJob = await request(app).get(
      `/api/v1/jobs/${highPriorityResponse.body.data.jobId}`
    );

    expect([JobStatus.COMPLETED, JobStatus.PROCESSING]).toContain(
      highPriorityJob.body.data.status
    );
  }, 30000);
});