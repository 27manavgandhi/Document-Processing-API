import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

beforeAll(async () => {
  await prisma.$connect();
  await redis.flushdb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

afterEach(async () => {
  await prisma.job.deleteMany();
  await prisma.jobLog.deleteMany();
  await prisma.jobWebhook.deleteMany();
  await redis.flushdb();
});

export { prisma, redis };