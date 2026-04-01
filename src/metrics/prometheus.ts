import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const activeHttpRequests = new Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
  registers: [register],
});

export const jobsCreatedCounter = new Counter({
  name: 'jobs_created_total',
  help: 'Total number of jobs created',
  labelNames: ['priority'],
  registers: [register],
});

export const jobsCompletedCounter = new Counter({
  name: 'jobs_completed_total',
  help: 'Total number of jobs completed',
  registers: [register],
});

export const jobsFailedCounter = new Counter({
  name: 'jobs_failed_total',
  help: 'Total number of jobs failed',
  registers: [register],
});

export const jobsCancelledCounter = new Counter({
  name: 'jobs_cancelled_total',
  help: 'Total number of jobs cancelled',
  registers: [register],
});

export const jobProcessingDuration = new Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  buckets: [5, 10, 15, 20, 30, 60, 120],
  registers: [register],
});

export const jobsByStatus = new Gauge({
  name: 'jobs_by_status',
  help: 'Number of jobs by status',
  labelNames: ['status'],
  registers: [register],
});

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['state'],
  registers: [register],
});

export const databaseConnectionPool = new Gauge({
  name: 'database_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['state'],
  registers: [register],
});

register.setDefaultLabels({
  app: 'document-processing-api',
  environment: process.env.NODE_ENV || 'development',
});