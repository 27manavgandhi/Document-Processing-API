import { Application } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';

let app: Application;

export const setupTestServer = (): Application => {
  if (!app) {
    app = createApp();
  }
  return app;
};

export const makeRequest = (app: Application) => {
  return request(app);
};

export const createAuthToken = (): string => {
  return 'Bearer test-token-12345';
};