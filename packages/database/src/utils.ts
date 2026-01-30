/**
 * Database connection utilities for serverless environments
 */

// Parse and optimize DATABASE_URL for serverless/PgBouncer
export function getOptimizedDatabaseUrl(): string {
  const originalUrl = process.env.DATABASE_URL;
  
  if (!originalUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  
  // Check if already has connection parameters
  if (originalUrl.includes('connection_limit=')) {
    return originalUrl;
  }
  
  // Add serverless-optimized connection parameters
  const separator = originalUrl.includes('?') ? '&' : '?';
  
  // For serverless/Vercel with PgBouncer:
  // - connection_limit=1: Use single connection per function instance
  // - pool_timeout=20: Wait longer for connection from pool
  const params = [
    'connection_limit=1',
    'pool_timeout=20',
  ];
  
  // Only add if not using direct connection (DIRECT_URL is for that)
  if (originalUrl.includes('pgbouncer=true') || originalUrl.includes(':6543')) {
    return `${originalUrl}${separator}${params.join('&')}`;
  }
  
  return originalUrl;
}

// Log database configuration for debugging
export function logDbConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;
  
  const url = process.env.DATABASE_URL || '';
  const isPooler = url.includes('pgbouncer=true') || url.includes(':6543');
  
  console.log('[Database] Configuration:', {
    usingPooler: isPooler,
    hasConnectionLimit: url.includes('connection_limit='),
    hasPoolTimeout: url.includes('pool_timeout='),
  });
}
