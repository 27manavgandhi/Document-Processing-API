import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../helpers/test-server.helper';
import { cleanupTestJobs } from '../helpers/test-db.helper';
import { cleanQueue } from '../helpers/test-queue.helper';
import { createWorker, closeWorker } from '../../src/workers/document.worker';
import { Worker } from 'bullmq';

describe('E2E: Complete Workflow', () => {
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

  it('should process a job from creation to completion', async () => {
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        userId: 'e2e-test-user',
      });

    expect(createResponse.status).toBe(201);
    const { jobId } = createResponse.body.data;

    const initialStatus = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(initialStatus.body.data.status).toBe('QUEUED');

    await new Promise((resolve) => setTimeout(resolve, 25000));

    const finalStatus = await request(app).get(`/api/v1/jobs/${jobId}`);

    expect(finalStatus.body.data.status).toBe('COMPLETED');
    expect(finalStatus.body.data.completedAt).toBeDefined();
    expect(finalStatus.body.data.result).toBeDefined();
    expect(finalStatus.body.data.result.processingTime).toBeGreaterThan(0);
    expect(finalStatus.body.data.result.documentInfo).toBeDefined();
  }, 30000);

  it('should handle multiple jobs concurrently', async () => {
    const jobPromises = Array.from({ length: 3 }, (_, i) =>
      request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: `https://example.com/test-${i}.pdf`,
          userId: 'concurrent-user',
        })
    );

    const createResponses = await Promise.all(jobPromises);
    const jobIds = createResponses.map((r) => r.body.data.jobId);

    await new Promise((resolve) => setTimeout(resolve, 25000));

    const statusPromises = jobIds.map((id) =>
      request(app).get(`/api/v1/jobs/${id}`)
    );
    const statusResponses = await Promise.all(statusPromises);

    const completedJobs = statusResponses.filter(
      (r) => r.body.data.status === 'COMPLETED'
    );

    expect(completedJobs.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  it('should track job progress through all states', async () => {
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://example.com/progress-test.pdf',
      });

    const { jobId } = createResponse.body.data;
    const states: string[] = [];

    const checkInterval = setInterval(async () => {
      const response = await request(app).get(`/api/v1/jobs/${jobId}`);
      const status = response.body.data.status;
      if (!states.includes(status)) {
        states.push(status);
      }
    }, 2000);

    await new Promise((resolve) => setTimeout(resolve, 25000));
    clearInterval(checkInterval);

    expect(states).toContain('QUEUED');
    expect(states.length).toBeGreaterThanOrEqual(2);
  }, 30000);
});