import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// ============ CONFIGURATION ============

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
    // Spray endpoint - prevent spam submissions
    // 10 requests per minute per IP
    spray: {
        requests: 10,
        window: '1m' as const,
    },
    // Deposit address generation - prevent address enumeration
    // 5 requests per minute per IP
    depositAddress: {
        requests: 5,
        window: '1m' as const,
    },
    // Task completion - prevent spam completions
    // 30 requests per minute per IP
    tasks: {
        requests: 30,
        window: '1m' as const,
    },
    // User operations - general user actions
    // 30 requests per minute per IP
    user: {
        requests: 30,
        window: '1m' as const,
    },
    // General API - default rate limit
    // 60 requests per minute per IP
    general: {
        requests: 60,
        window: '1m' as const,
    },
    // Admin operations - relaxed for admin
    // 120 requests per minute per IP
    admin: {
        requests: 120,
        window: '1m' as const,
    },
};

// ============ RATE LIMITER SETUP ============

// Check if Upstash Redis is configured
const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client if configured
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// In-memory store for development (when Redis not configured)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Create rate limiters for each endpoint type
const rateLimiters: Record<string, Ratelimit | null> = {};

// Initialize rate limiters dynamically
for (const [key, config] of Object.entries(RATE_LIMITS)) {
    rateLimiters[key] = redis
        ? new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(config.requests, config.window),
            analytics: true,
            prefix: `ratelimit:dapp:${key}`,
        })
        : null;
}

// ============ IN-MEMORY FALLBACK ============

function checkInMemoryRateLimit(
    identifier: string,
    config: { requests: number; window: string }
): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const windowMs = parseWindow(config.window);
    const key = identifier;

    const record = inMemoryStore.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    if (!record || now > record.resetAt) {
        // First request or window expired - reset
        inMemoryStore.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return {
            success: true,
            remaining: config.requests - 1,
            reset: now + windowMs,
        };
    }

    if (record.count >= config.requests) {
        // Rate limit exceeded
        return {
            success: false,
            remaining: 0,
            reset: record.resetAt,
        };
    }

    // Increment count
    record.count += 1;
    inMemoryStore.set(key, record);

    return {
        success: true,
        remaining: config.requests - record.count,
        reset: record.resetAt,
    };
}

function parseWindow(window: string): number {
    const match = window.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 60000; // Default 1 minute

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return 60000;
    }
}

function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, record] of inMemoryStore.entries()) {
        if (now > record.resetAt) {
            inMemoryStore.delete(key);
        }
    }
}

// ============ MAIN RATE LIMIT FUNCTION ============

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
    limit: number;
}

/**
 * Check rate limit for a request
 * @param identifier - Unique identifier (usually IP address)
 * @param type - Type of rate limit to apply
 * @returns Rate limit result
 */
export async function checkRateLimit(
    identifier: string,
    type: RateLimitType = 'general'
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[type];
    const limiter = rateLimiters[type];

    if (limiter) {
        // Use Upstash Redis rate limiter
        const result = await limiter.limit(identifier);
        return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
            limit: config.requests,
        };
    }

    // Fallback to in-memory rate limiter
    const result = checkInMemoryRateLimit(`${type}:${identifier}`, config);
    return {
        ...result,
        limit: config.requests,
    };
}

// ============ HELPER FUNCTIONS ============

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
    // Check various headers for IP (in order of reliability)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    // Fallback for local development
    return '127.0.0.1';
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return NextResponse.json(
        {
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter,
        },
        {
            status: 429,
            headers: {
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.reset.toString(),
                'Retry-After': retryAfter.toString(),
            },
        }
    );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResult
): NextResponse {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());
    return response;
}

// ============ MIDDLEWARE HELPER ============

/**
 * Rate limit middleware wrapper for API routes
 * Usage:
 *   const { limited, response, rateLimitResult } = await rateLimit(request, 'spray');
 *   if (limited) return response;
 */
export async function rateLimit(
    request: Request,
    type: RateLimitType = 'general'
): Promise<{ limited: true; response: NextResponse; rateLimitResult: RateLimitResult } | { limited: false; response: undefined; rateLimitResult: RateLimitResult }> {
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, type);

    if (!rateLimitResult.success) {
        return {
            limited: true,
            response: rateLimitExceededResponse(rateLimitResult),
            rateLimitResult,
        };
    }

    return {
        limited: false,
        response: undefined,
        rateLimitResult,
    };
}
