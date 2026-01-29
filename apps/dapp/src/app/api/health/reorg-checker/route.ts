import { NextResponse } from 'next/server';
import { getReorgCheckerHealth } from '@/services/reorg-protection.service';

/**
 * GET /api/health/reorg-checker - Get reorg checker health status
 * 
 * This endpoint is public for monitoring purposes.
 */
export async function GET() {
    try {
        const health = await getReorgCheckerHealth();

        // Return 503 if unhealthy
        const statusCode = health.status === 'healthy' ? 200 :
            health.status === 'not_started' ? 200 : 503;

        return NextResponse.json(health, { status: statusCode });
    } catch (error) {
        console.error('Error fetching reorg checker health:', error);
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'Failed to fetch health status',
                checkerRunning: false,
            },
            { status: 503 }
        );
    }
}
