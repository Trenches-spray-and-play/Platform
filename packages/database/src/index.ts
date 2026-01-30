import { PrismaClient } from '@prisma/client';
import { getOptimizedDatabaseUrl, logDbConfig } from './utils';

// Prevent multiple instances during development hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Log configuration on startup
logDbConfig();

// Get optimized URL with connection parameters
const optimizedUrl = getOptimizedDatabaseUrl();

// Serverless-optimized Prisma client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export types from Prisma client
export * from '@prisma/client';

// Export the default client
export default prisma;
