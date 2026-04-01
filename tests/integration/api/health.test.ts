import request from 'supertest';
import { Application } from 'express';
import { setupTestServer } from '../../helpers/test-server.helper';

describe('Health API', () => {
  let app: Application;

  beforeAll(() => {
    app = setupTestServer();
  });

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app).get('/api/v1/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.services).toHaveProperty('database');
      expect(response.body.data.services).toHaveProperty('redis');
      expect(response.body.data.services).toHaveProperty('queue');
    });

    it('should include response time in metadata', async () => {
      const response = await request(app).get('/api/v1/health/detailed');

      expect(response.body.meta).toHaveProperty('responseTime');
      expect(typeof response.body.meta.responseTime).toBe('number');
    });
  });
});