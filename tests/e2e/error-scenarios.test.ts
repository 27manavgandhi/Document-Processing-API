import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../helpers/test-server.helper';
import { cleanupTestJobs } from '../helpers/test-db.helper';
import { createWorker, closeWorker } from '../../src/workers/document.worker';
import { Worker } from 'bullmq';

describe('E2E: Error Scenarios', () => {
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
  });

  it('should handle invalid file URL gracefully', async () => {
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://invalid-domain-that-does-not-exist-12345.com/file.pdf',
      });

    expect(createResponse.status).toBe(201);
    const { jobId } = createResponse.body.data;

    await new Promise((resolve) => setTimeout(resolve, 25000));

    const statusResponse = await request(app).get(`/api/v1/jobs/${jobId}`);

    expect(['FAILED', 'QUEUED', 'PROCESSING']).toContain(statusResponse.body.data.status);
  }, 30000);

  it('should respect rate limiting', async () => {
    const requests = Array.from({ length: 110 }, () =>
      request(app)
        .post('/api/v1/jobs')
        .send({ fileUrl: 'https://example.com/test.pdf' })
    );

    const responses = await Promise.all(requests.map((r) => r.catch((e) => e)));

    const rateLimitedResponses = responses.filter(
      (r) => r.status === 429 || (r.response && r.response.status === 429)
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  it('should handle malformed request bodies', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .send({ invalidField: 'value' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should reject oversized file uploads', async () => {
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024);

    const response = await request(app)
      .post('/api/v1/jobs')
      .attach('file', largeBuffer, 'large-file.pdf');

    expect([400, 413]).toContain(response.status);
  });
});
