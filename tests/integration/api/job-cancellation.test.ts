import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../../helpers/test-server.helper';
import { cleanupTestJobs, createTestJob } from '../../helpers/test-db.helper';
import { JobStatus } from '@prisma/client';

describe('Job Cancellation API', () => {
  let app: Application;

  beforeAll(() => {
    app = setupTestServer();
  });

  afterEach(async () => {
    await cleanupTestJobs();
  });

  describe('DELETE /api/v1/jobs/:jobId', () => {
    it('should cancel a queued job', async () => {
      const job = await createTestJob({ status: JobStatus.QUEUED });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.data.cancelledAt).toBeDefined();
    });

    it('should cancel a processing job', async () => {
      const job = await createTestJob({ status: JobStatus.PROCESSING });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should not cancel a completed job', async () => {
      const job = await createTestJob({ status: JobStatus.COMPLETED });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should not cancel a failed job', async () => {
      const job = await createTestJob({ status: JobStatus.FAILED });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should not cancel an already cancelled job', async () => {
      const job = await createTestJob({ status: JobStatus.CANCELLED });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`);

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already cancelled');
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .delete(`/api/v1/jobs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should record who cancelled the job', async () => {
      const job = await createTestJob({ status: JobStatus.QUEUED });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job.id}`)
        .send({ cancelledBy: 'admin-user' });

      expect(response.status).toBe(200);
      expect(response.body.data.cancelledBy).toBe('admin-user');
    });
  });
});