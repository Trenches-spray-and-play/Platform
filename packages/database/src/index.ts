import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Detect if we're using PgBouncer
const isPgBouncer = process.env.DATABASE_URL?.includes('pgbouncer=true') ||
  process.env.DATABASE_URL?.includes(':6543');

// Parse connection limit from URL or default to 1 for serverless
const getConnectionLimit = () => {
  const match = process.env.DATABASE_URL?.match(/connection_limit=(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

// Prisma Client configuration optimized for serverless + PgBouncer
const prismaConfig = {
  log: (process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']) as any,
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaConfig);

// Log connection mode on startup (only once per instance)
if (!globalForPrisma.prisma) {
  console.log(`[Prisma] Mode: ${isPgBouncer ? 'PgBouncer' : 'Direct'}, Connection limit: ${getConnectionLimit()}`);
}

globalForPrisma.prisma = prisma;

export * from '@prisma/client';
export default prisma;
