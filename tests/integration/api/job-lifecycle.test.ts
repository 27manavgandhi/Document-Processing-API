import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../../helpers/test-server.helper';
import { cleanupTestJobs } from '../../helpers/test-db.helper';
import { cleanQueue, getQueueCounts } from '../../helpers/test-queue.helper';

describe('Job Lifecycle Integration', () => {
  let app: Application;

  beforeAll(() => {
    app = setupTestServer();
  });

  afterEach(async () => {
    await cleanupTestJobs();
    await cleanQueue('document-processing');
  });

  it('should handle complete job lifecycle from creation to queuing', async () => {
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://example.com/test.pdf',
        userId: 'lifecycle-test-user',
      });

    expect(createResponse.status).toBe(201);
    const { jobId } = createResponse.body.data;

    const getResponse = await request(app).get(`/api/v1/jobs/${jobId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.status).toBe('QUEUED');
    expect(getResponse.body.data.queuedAt).toBeDefined();

    const queueCounts = await getQueueCounts('document-processing');
    expect(queueCounts.waiting + queueCounts.active).toBeGreaterThan(0);
  });

  it('should handle multiple concurrent job creations', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: `https://example.com/test-${i}.pdf`,
          userId: 'concurrent-user',
        })
    );

    const responses = await Promise.all(promises);

    expect(responses.every((r) => r.status === 201)).toBe(true);

    const jobIds = responses.map((r) => r.body.data.jobId);
    expect(new Set(jobIds).size).toBe(5);

    const listResponse = await request(app)
      .get('/api/v1/jobs')
      .query({ userId: 'concurrent-user' });

    expect(listResponse.body.data.items).toHaveLength(5);
  });

  it('should maintain data consistency between database and queue', async () => {
    const createResponse = await request(app)
      .post('/api/v1/jobs')
      .send({
        fileUrl: 'https://example.com/consistency-test.pdf',
      });

    const { jobId } = createResponse.body.data;

    const dbResponse = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(dbResponse.body.data.status).toBe('QUEUED');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const queueCounts = await getQueueCounts('document-processing');
    expect(queueCounts.waiting + queueCounts.active + queueCounts.completed).toBeGreaterThan(0);
  });
});