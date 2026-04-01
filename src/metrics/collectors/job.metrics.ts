import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from '../prometheus';

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

export const jobRetries = new Counter({
  name: 'job_retries_total',
  help: 'Total number of job retries',
  registers: [register],
});