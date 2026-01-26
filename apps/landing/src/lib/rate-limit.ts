// Re-export from shared utils package
// This file exists for backwards compatibility with existing imports
export {
    RATE_LIMITS,
    checkRateLimit,
    getClientIp,
    rateLimitExceededResponse,
    addRateLimitHeaders,
    rateLimit,
    type RateLimitType,
    type RateLimitResult,
} from '@trenches/utils';
