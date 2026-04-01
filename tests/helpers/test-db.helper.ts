import { PrismaClient, Job, JobStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const createTestJob = async (overrides?: Partial<Job>): Promise<Job> => {
  return prisma.job.create({
    data: {
      id: uuidv4(),
      status: JobStatus.QUEUED,
      fileName: 'test-file.pdf',
      fileMimeType: 'application/pdf',
      fileSize: 1024,
      fileUrl: 'https://example.com/test.pdf',
      ...overrides,
    },
  });
};

export const cleanupTestJobs = async (): Promise<void> => {
  await prisma.job.deleteMany();
};

export const getJobById = async (id: string): Promise<Job | null> => {
  return prisma.job.findUnique({ where: { id } });
};

export const getJobsCount = async (): Promise<number> => {
  return prisma.job.count();
};