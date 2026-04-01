import { JobStatus } from '@prisma/client';

export const validJobData = {
  fileUrl: 'https://example.com/document.pdf',
  fileName: 'document.pdf',
  userId: 'user-123',
  metadata: { source: 'test' },
};

export const invalidJobData = {
  fileUrl: 'not-a-url',
  fileName: '',
};

export const mockJobResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  status: JobStatus.QUEUED,
  fileName: 'test.pdf',
  fileMimeType: 'application/pdf',
  fileSize: 2048,
  fileUrl: 'https://example.com/test.pdf',
  createdAt: new Date(),
  queuedAt: new Date(),
};

export const completedJobResponse = {
  ...mockJobResponse,
  status: JobStatus.COMPLETED,
  completedAt: new Date(),
  result: {
    processedAt: new Date().toISOString(),
    processingTime: 15000,
    documentInfo: {
      fileName: 'test.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
    },
    analysis: {
      pageCount: 5,
      wordCount: 1200,
    },
  },
};