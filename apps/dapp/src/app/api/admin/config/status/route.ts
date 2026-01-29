import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/config/status - Get config lock status
 * Returns whether config is locked due to active payouts
 */
export async function GET() {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const activePayoutCount = await prisma.payout.count({
            where: { status: { in: ['EXECUTING', 'PENDING'] } }
        });

        const criticalFields = ['manualPrice', 'roiMultiplier', 'tokenAddress', 'tokenDecimals', 'chainId'];

        return NextResponse.json({
            success: true,
            data: {
                locked: activePayoutCount > 0,
                reason: activePayoutCount > 0
                    ? `${activePayoutCount} payouts currently processing`
                    : null,
                lockedFields: activePayoutCount > 0 ? criticalFields : [],
                activePayouts: activePayoutCount,
            }
        });
    } catch (error) {
        console.error('Error checking config status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check config status' },
            { status: 500 }
        );
    }
}
