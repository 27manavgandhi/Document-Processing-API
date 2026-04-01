export enum JobStatus {
  QUEUED = 'QUEUED',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface JobData {
  jobId: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  userId?: string;
  priority?: JobPriority;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
}

export interface JobResult {
  processedAt: string;
  processingTime: number;
  documentInfo: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
  analysis: {
    wordCount?: number;
    pageCount?: number;
    metadata?: Record<string, unknown>;
  };
}

export interface JobProgress {
  percentage: number;
  currentStep: string;
  totalSteps: number;
}

export interface BulkJobCreateRequest {
  jobs: Array<{
    fileUrl?: string;
    fileName?: string;
    userId?: string;
    priority?: JobPriority;
    metadata?: Record<string, unknown>;
    webhookUrl?: string;
  }>;
}

export interface ScheduledJobRequest {
  fileUrl?: string;
  fileName?: string;
  userId?: string;
  priority?: JobPriority;
  scheduledFor: string;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
}