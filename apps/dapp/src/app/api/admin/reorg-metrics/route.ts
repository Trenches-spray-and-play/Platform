import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getReorgMetrics } from '@/services/metrics.service';

/**
 * GET /api/admin/reorg-metrics - Get reorg detection metrics
 * Query params: days (optional, default 7)
 */
export async function GET(request: Request) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7', 10);

        const metrics = await getReorgMetrics(days);

        return NextResponse.json({ data: metrics });
    } catch (error) {
        console.error('Error fetching reorg metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reorg metrics' },
            { status: 500 }
        );
    }
}
