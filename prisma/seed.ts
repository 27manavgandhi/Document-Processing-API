import { PrismaClient, JobStatus, JobPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.jobLog.deleteMany();
  await prisma.jobWebhook.deleteMany();
  await prisma.job.deleteMany();

  console.log('✅ Cleared existing data');

  const jobs = await prisma.job.createMany({
    data: [
      {
        status: JobStatus.COMPLETED,
        priority: JobPriority.HIGH,
        fileName: 'sample-report.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 2048000,
        fileUrl: 'https://example.com/reports/sample-report.pdf',
        userId: 'user-001',
        result: {
          processedAt: new Date().toISOString(),
          processingTime: 15000,
          documentInfo: {
            fileName: 'sample-report.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          },
          analysis: {
            pageCount: 25,
            wordCount: 5000,
            tableCount: 3,
          },
        },
        processingTime: 15000,
        completedAt: new Date(),
        queuedAt: new Date(Date.now() - 20000),
        startedAt: new Date(Date.now() - 15000),
      },
      {
        status: JobStatus.COMPLETED,
        priority: JobPriority.MEDIUM,
        fileName: 'document.docx',
        fileMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 1024000,
        fileUrl: 'https://example.com/docs/document.docx',
        userId: 'user-002',
        result: {
          processedAt: new Date().toISOString(),
          processingTime: 12000,
          documentInfo: {
            fileName: 'document.docx',
            fileSize: 1024000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          analysis: {
            pageCount: 10,
            wordCount: 2500,
            tableCount: 1,
          },
        },
        processingTime: 12000,
        completedAt: new Date(),
        queuedAt: new Date(Date.now() - 18000),
        startedAt: new Date(Date.now() - 12000),
      },
      {
        status: JobStatus.FAILED,
        priority: JobPriority.LOW,
        fileName: 'corrupted-file.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 512000,
        fileUrl: 'https://example.com/files/corrupted.pdf',
        userId: 'user-001',
        errorMessage: 'File is corrupted or unreadable',
        attempts: 3,
        failedAt: new Date(),
        queuedAt: new Date(Date.now() - 40000),
        startedAt: new Date(Date.now() - 30000),
      },
      {
        status: JobStatus.PROCESSING,
        priority: JobPriority.HIGH,
        fileName: 'large-document.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 5120000,
        fileUrl: 'https://example.com/files/large-document.pdf',
        userId: 'user-003',
        attempts: 1,
        queuedAt: new Date(Date.now() - 10000),
        startedAt: new Date(Date.now() - 5000),
      },
      {
        status: JobStatus.QUEUED,
        priority: JobPriority.MEDIUM,
        fileName: 'waiting-file.txt',
        fileMimeType: 'text/plain',
        fileSize: 10240,
        fileUrl: 'https://example.com/files/waiting.txt',
        userId: 'user-002',
        queuedAt: new Date(),
      },
    ],
  });

  console.log(`✅ Created ${jobs.count} sample jobs`);
  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });