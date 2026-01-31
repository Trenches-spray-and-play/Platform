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
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
 */
export const redis = Redis.fromEnv();

// Separate instances for pub/sub semantics (Edge-safe polling-based SSE)
export const redisPub = redis;
export const redisSub = redis;

// Type definition for real-time notifications
export interface NotificationPayload {
    type: "deposit_confirmed" | "position_filled" | "campaign_started" | "system";
    title?: string;
    message: string;
    data?: Record<string, any>;
    timestamp: number;
}

/**
 * Helper to queue a notification for a specific user.
 */
export async function queueNotification(
    userId: string,
    notification: NotificationPayload
): Promise<void> {
    const channel = `notifications:${userId}`;
    await redis.lpush(channel, JSON.stringify(notification));
    // Set TTL to auto-cleanup old notifications (24 hours)
    await redis.expire(channel, 60 * 60 * 24);
}

/**
 * Helper to dequeue a notification for a specific user.
 */
export async function dequeueNotification(
    userId: string
): Promise<NotificationPayload | null> {
    const channel = `notifications:${userId}`;
    const data = await redis.rpop(channel);
    return data ? JSON.parse(data as string) : null;
}
