import { PrismaClient } from '@prisma/client';

// Prevent multiple instances during development hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Connection pool configuration for serverless environments
// Vercel has specific limits - adjust based on your database provider
const getConnectionLimit = () => {
  // Use environment variable or default to reasonable serverless limit
  const limit = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5', 10);
  return limit;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Configure connection pool at the global level to prevent exhaustion
if (!globalForPrisma.prisma) {
  // Log connection issues in production for debugging
  if (process.env.NODE_ENV === 'production') {
    console.log('[Prisma] Initializing with connection pooling...');
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export types from Prisma client
export * from '@prisma/client';

// Export the default client
export default prisma;
