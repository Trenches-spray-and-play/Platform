import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing Upstash Redis environment variables');
    } else {
        console.warn('Missing Upstash Redis environment variables. Redis operations will fail.');
    }
}

/**
 * Global Redis client for @upstash/redis.
 * Uses existing UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
