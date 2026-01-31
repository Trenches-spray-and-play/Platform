import { NextResponse } from 'next/server';
import { getPerformanceStats, getRawMetrics, clearOldMetrics } from '@/lib/monitoring/middleware';

/**
 * GET /api/metrics - Performance metrics endpoint
 * 
 * Query params:
 * - window: Time window in minutes (default: 5)
 * - raw: Include raw request data (default: false)
 * - limit: Limit for raw data (default: 100)
 * 
 * Returns:
 * - Aggregated performance statistics
 * - Error rates and slow endpoints
 * - Optional raw request data
 */
export async function GET(request: Request) {
    // Simple auth check - should be enhanced for production
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.METRICS_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const windowMinutes = parseInt(searchParams.get('window') || '5', 10);
    const includeRaw = searchParams.get('raw') === 'true';
    const rawLimit = parseInt(searchParams.get('limit') || '100', 10);

    try {
        const stats = getPerformanceStats(windowMinutes);
        
        const response: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            window: `${windowMinutes} minutes`,
            stats,
        };

        if (includeRaw) {
            response.raw = getRawMetrics(rawLimit);
        }

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Failed to fetch metrics',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/metrics - Admin actions
 * 
 * Actions:
 * - clear: Clear old metrics
 */
export async function POST(request: Request) {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.METRICS_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        
        if (body.action === 'clear') {
            const olderThanMinutes = body.olderThanMinutes || 60;
            clearOldMetrics(olderThanMinutes);
            
            return NextResponse.json({
                success: true,
                message: `Cleared metrics older than ${olderThanMinutes} minutes`,
            });
        }

        return NextResponse.json(
            { error: 'Unknown action' },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Failed to process request',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
