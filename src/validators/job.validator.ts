import { z } from 'zod';

export const createJobSchema = z.object({
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  userId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  webhookUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const scheduleJobSchema = z.object({
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  userId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  scheduledFor: z.string().datetime(),
  webhookUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const bulkCreateJobSchema = z.object({
  jobs: z.array(createJobSchema).min(1).max(100),
});

export const getJobSchema = z.object({
  jobId: z.string().uuid(),
});

export const listJobsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['QUEUED', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ScheduleJobInput = z.infer<typeof scheduleJobSchema>;
export type BulkCreateJobInput = z.infer<typeof bulkCreateJobSchema>;
export type GetJobInput = z.infer<typeof getJobSchema>;
export type ListJobsInput = z.infer<typeof listJobsSchema>;