import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getConfigHistory } from '@/services/config-audit.service';

/**
 * GET /api/admin/config/history - Get config change history
 * Query params:
 *   - type: 'campaign' | 'platform' (optional)
 *   - configId: specific config ID (optional)
 *   - limit: max results (default 50)
 */
export async function GET(request: Request) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const configType = searchParams.get('type') as 'campaign' | 'platform' | undefined;
        const configId = searchParams.get('configId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const history = await getConfigHistory({
            configType: configType || undefined,
            configId,
            limit,
        });

        return NextResponse.json({
            success: true,
            data: history,
            meta: { total: history.length, limit },
        });
    } catch (error) {
        console.error('Error fetching config history:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch config history' },
            { status: 500 }
        );
    }
}
