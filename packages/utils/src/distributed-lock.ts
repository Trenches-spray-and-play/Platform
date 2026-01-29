/**
 * Distributed Lock Service
 * 
 * Uses Upstash Redis to implement a simple distributed lock pattern.
 * This ensures that only one process can execute a critical section at a time.
 * 
 * IMPORTANT: This service REQUIRES Redis in production. It will throw an error
 * if Redis is not configured in a production environment.
 * 
 * Usage:
 *   const locked = await acquireLock('my-job', 60000); // 60 second TTL
 *   if (!locked) return; // Another process holds the lock
 *   try {
 *     // ... critical section ...
 *   } finally {
 *     await releaseLock('my-job');
 *   }
 */

import { Redis } from '@upstash/redis';

// Check if Upstash Redis is configured
const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Detect production environment
const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';

// Create Redis client if configured
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// Log warning at module load time if Redis is not configured
if (!isRedisConfigured) {
    if (isProduction) {
        console.error(
            '🚨 CRITICAL: Upstash Redis is NOT configured in production! ' +
            'Distributed locks will NOT work, risking race conditions. ' +
            'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
        );
    } else {
        console.warn(
            '⚠️ Upstash Redis not configured. Distributed locks will use ' +
            'in-memory fallback (single-instance only, NOT safe for production).'
        );
    }
}

// In-memory store for development ONLY
const inMemoryLocks = new Map<string, number>();

/**
 * Acquire a distributed lock.
 * 
 * @param key - Unique identifier for the lock (e.g., 'payout_queue_processing')
 * @param ttlMs - Time-to-live in milliseconds. Lock auto-releases after this time.
 * @returns true if lock was acquired, false if already held by another process.
 * @throws Error if Redis is not configured in production.
 */
export async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const lockKey = `lock:${key}`;

    if (redis) {
        // Upstash Redis: atomic SET NX EX
        const result = await redis.set(lockKey, Date.now().toString(), {
            nx: true, // Only set if not exists
            px: ttlMs, // Expiry in milliseconds
        });
        return result === 'OK';
    }

    // Production without Redis = fail-safe (throw error)
    if (isProduction) {
        throw new Error(
            `Cannot acquire distributed lock "${key}": Redis is not configured. ` +
            'This is required for production to prevent race conditions.'
        );
    }

    // In-memory fallback for development ONLY
    const now = Date.now();
    const existing = inMemoryLocks.get(lockKey);

    if (existing && existing > now) {
        // Lock is still valid
        return false;
    }

    // Acquire lock (not truly atomic, but acceptable for single-instance dev)
    inMemoryLocks.set(lockKey, now + ttlMs);
    return true;
}

/**
 * Release a distributed lock.
 * 
 * @param key - The same key used to acquire the lock.
 */
export async function releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;

    if (redis) {
        await redis.del(lockKey);
        return;
    }

    // Production without Redis - log error but don't throw (we're in cleanup)
    if (isProduction) {
        console.error(`Cannot release lock "${key}": Redis not configured.`);
        return;
    }

    // In-memory fallback
    inMemoryLocks.delete(lockKey);
}
