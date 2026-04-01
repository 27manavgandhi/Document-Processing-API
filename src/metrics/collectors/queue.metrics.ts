import { Gauge } from 'prom-client';
import { register } from '../prometheus';

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['state'],
  registers: [register],
});

export const queueWaitTime = new Gauge({
  name: 'queue_wait_time_seconds',
  help: 'Average wait time in queue',
  registers: [register],
});

export const workerUtilization = new Gauge({
  name: 'worker_utilization',
  help: 'Worker utilization percentage',
  registers: [register],
});

export const queueProcessingRate = new Gauge({
  name: 'queue_processing_rate',
  help: 'Jobs processed per second',
  registers: [register],
});