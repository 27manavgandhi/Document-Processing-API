import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../../helpers/test-server.helper';
import { cleanupTestJobs, createTestJob } from '../../helpers/test-db.helper';
import { JobStatus } from '@prisma/client';
import path from 'path';

describe('Job API', () => {
  let app: Application;

  beforeAll(() => {
    app = setupTestServer();
  });

  afterEach(async () => {
    await cleanupTestJobs();
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a job with file URL', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          userId: 'test-user',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data.status).toBe('QUEUED');
    });

    it('should create a job with file upload', async () => {
      const testFilePath = path.join(__dirname, '../../fixtures/files/test.txt');

      const response = await request(app)
        .post('/api/v1/jobs')
        .attach('file', testFilePath)
        .field('userId', 'test-user');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
    });

    it('should reject request without file or URL', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({ userId: 'test-user' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate file URL format', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: 'not-a-valid-url',
          userId: 'test-user',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept optional metadata', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: 'https://example.com/test.pdf',
          userId: 'test-user',
          metadata: { source: 'api', priority: 'high' },
        });

      expect(response.status).toBe(201);
    });

    it('should accept optional webhook URL', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({
          fileUrl: 'https://example.com/test.pdf',
          webhookUrl: 'https://webhook.site/unique-id',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/v1/jobs/:jobId', () => {
    it('should retrieve an existing job', async () => {
      const job = await createTestJob();

      const response = await request(app).get(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(job.id);
      expect(response.body.data.status).toBe(job.status);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app).get(`/api/v1/jobs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/jobs/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should include timestamps in response', async () => {
      const job = await createTestJob();

      const response = await request(app).get(`/api/v1/jobs/${job.id}`);

      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
      expect(response.body.data).toHaveProperty('queuedAt');
    });
  });

  describe('GET /api/v1/jobs', () => {
    beforeEach(async () => {
      await Promise.all([
        createTestJob({ userId: 'user-1', status: JobStatus.QUEUED }),
        createTestJob({ userId: 'user-1', status: JobStatus.COMPLETED }),
        createTestJob({ userId: 'user-2', status: JobStatus.PROCESSING }),
        createTestJob({ userId: 'user-2', status: JobStatus.FAILED }),
      ]);
    });

    it('should list all jobs with default pagination', async () => {
      const response = await request(app).get('/api/v1/jobs');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(4);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
      expect(response.body.data.pagination).toHaveProperty('total', 4);
    });

    it('should filter jobs by status', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].status).toBe('COMPLETED');
    });

    it('should filter jobs by userId', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ userId: 'user-1' });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every((j: { userId: string }) => j.userId === 'user-1')).toBe(true);
    });

    it('should handle custom pagination', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ page: 2, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(false);
      expect(response.body.data.pagination.hasPrev).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ userId: 'user-2', status: 'FAILED' });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].userId).toBe('user-2');
      expect(response.body.data.items[0].status).toBe('FAILED');
    });

    it('should return empty array when no jobs match', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .query({ userId: 'non-existent-user' });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });
});