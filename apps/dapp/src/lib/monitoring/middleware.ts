/**
 * Performance Monitoring Middleware
 * 
 * Tracks:
 * - Request/response times
 * - Error rates
 * - Endpoint usage
 * - Slow request detection and alerting
 * 
 * Use in route handlers or as Next.js middleware
 */

import { alertHighLatency } from './alerts';

interface PerformanceMetrics {
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
}

// In-memory store for recent metrics (last 1000 requests)
// In production, consider using Redis or external service
const recentMetrics: PerformanceMetrics[] = [];
const MAX_STORED_METRICS = 1000;

// Alert threshold (ms)
const SLOW_REQUEST_THRESHOLD = 2000;
const VERY_SLOW_REQUEST_THRESHOLD = 5000;

/**
 * Wrap an API route handler with performance monitoring
 * 
 * Usage:
 * export const GET = withMonitoring(async (request) => {
 *   // your handler code
 * });
 */
export function withMonitoring<T extends (request: Request, ...args: unknown[]) => Promise<Response>>(
    handler: T,
    options: { endpoint?: string; skipAlerts?: boolean } = {}
): T {
    return (async (request: Request, ...args: unknown[]): Promise<Response> => {
        const startTime = Date.now();
        const endpoint = options.endpoint || new URL(request.url).pathname;
        const method = request.method;

        try {
            const response = await handler(request, ...args);
            const duration = Date.now() - startTime;

            // Record metrics
            recordMetrics({
                endpoint,
                method,
                statusCode: response.status,
                durationMs: duration,
                timestamp: new Date(),
                userAgent: request.headers.get('user-agent') || undefined,
                ip: getClientIP(request),
            });

            // Alert on slow requests
            if (!options.skipAlerts && duration > SLOW_REQUEST_THRESHOLD) {
                const severity = duration > VERY_SLOW_REQUEST_THRESHOLD ? 'critical' : 'warning';
                console.warn(`Slow request detected: ${method} ${endpoint} took ${duration}ms`);
                
                // Only alert on critical slowness to avoid spam
                if (severity === 'critical') {
                    alertHighLatency(endpoint, duration, SLOW_REQUEST_THRESHOLD).catch(console.error);
                }
            }

            // Add performance headers to response
            const enhancedResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                    ...Object.fromEntries(response.headers.entries()),
                    'X-Response-Time': `${duration}ms`,
                    'X-Request-ID': generateRequestId(),
                },
            });

            return enhancedResponse;
        } catch (error) {
            const duration = Date.now() - startTime;

            // Record failed request
            recordMetrics({
                endpoint,
                method,
                statusCode: 500,
                durationMs: duration,
                timestamp: new Date(),
                userAgent: request.headers.get('user-agent') || undefined,
                ip: getClientIP(request),
            });

            throw error;
        }
    }) as T;
}

/**
 * Record metrics to in-memory store
 */
function recordMetrics(metrics: PerformanceMetrics): void {
    recentMetrics.push(metrics);

    // Keep only recent metrics
    if (recentMetrics.length > MAX_STORED_METRICS) {
        recentMetrics.shift();
    }

    // Also log slow/error requests
    if (metrics.durationMs > SLOW_REQUEST_THRESHOLD || metrics.statusCode >= 500) {
        console.log('[PERF]', {
            endpoint: metrics.endpoint,
            method: metrics.method,
            status: metrics.statusCode,
            duration: `${metrics.durationMs}ms`,
        });
    }
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string | undefined {
    // Check common headers for client IP
    const headers = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];
    
    for (const header of headers) {
        const value = request.headers.get(header);
        if (value) {
            // x-forwarded-for can contain multiple IPs
            return value.split(',')[0].trim();
        }
    }

    return undefined;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get aggregated performance statistics
 */
export function getPerformanceStats(timeWindowMinutes: number = 5): {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number; count: number }>;
    errorEndpoints: Array<{ endpoint: string; errorCount: number; totalCount: number }>;
} {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const relevantMetrics = recentMetrics.filter(m => m.timestamp >= cutoffTime);

    if (relevantMetrics.length === 0) {
        return {
            totalRequests: 0,
            errorRate: 0,
            avgResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            slowestEndpoints: [],
            errorEndpoints: [],
        };
    }

    // Calculate basic stats
    const durations = relevantMetrics.map(m => m.durationMs).sort((a, b) => a - b);
    const errorCount = relevantMetrics.filter(m => m.statusCode >= 500).length;

    const totalRequests = relevantMetrics.length;
    const errorRate = (errorCount / totalRequests) * 100;
    const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95ResponseTime = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99ResponseTime = durations[Math.floor(durations.length * 0.99)] || 0;

    // Aggregate by endpoint
    const endpointStats = new Map<string, { totalDuration: number; count: number; errorCount: number }>();

    for (const metric of relevantMetrics) {
        const key = `${metric.method} ${metric.endpoint}`;
        const existing = endpointStats.get(key) || { totalDuration: 0, count: 0, errorCount: 0 };
        
        existing.totalDuration += metric.durationMs;
        existing.count += 1;
        if (metric.statusCode >= 500) {
            existing.errorCount += 1;
        }
        
        endpointStats.set(key, existing);
    }

    // Get slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
        .map(([endpoint, stats]) => ({
            endpoint,
            avgDuration: Math.round(stats.totalDuration / stats.count),
            count: stats.count,
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10);

    // Get endpoints with errors
    const errorEndpoints = Array.from(endpointStats.entries())
        .filter(([, stats]) => stats.errorCount > 0)
        .map(([endpoint, stats]) => ({
            endpoint,
            errorCount: stats.errorCount,
            totalCount: stats.count,
        }))
        .sort((a, b) => b.errorCount - a.errorCount);

    return {
        totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime,
        p99ResponseTime,
        slowestEndpoints,
        errorEndpoints,
    };
}

/**
 * Get raw metrics (for /api/metrics endpoint)
 */
export function getRawMetrics(limit: number = 100): PerformanceMetrics[] {
    return recentMetrics.slice(-limit);
}

/**
 * Clear old metrics (call periodically or on demand)
 */
export function clearOldMetrics(olderThanMinutes: number = 60): void {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const index = recentMetrics.findIndex(m => m.timestamp >= cutoffTime);
    
    if (index > 0) {
        recentMetrics.splice(0, index);
    }
}
