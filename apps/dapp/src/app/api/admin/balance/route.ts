import { NextResponse } from 'next/server';
import {
    getPlatformBalanceSummary,
    refreshAllCachedBalances,
} from '@/services/balance.service';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/balance
 * Get platform balance summary for admin dashboard
 */
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const summary = await getPlatformBalanceSummary();

        return NextResponse.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error fetching balance summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance summary' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/balance
 * Actions: refresh (refresh cached balances), sweep (trigger batch sweep)
 */
export async function POST(request: Request) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'refresh') {
            // Refresh all cached balances
            const result = await refreshAllCachedBalances(true);

            return NextResponse.json({
                success: true,
                message: `Refreshed ${result.refreshed} balances, ${result.failed} failed, ${result.skipped} skipped`,
                data: result,
            });
        }

        if (action === 'sweep') {
            // Get unswept deposits
            const unsweptDeposits = await prisma.deposit.findMany({
                where: {
                    status: 'CONFIRMED',
                },
                select: {
                    id: true,
                    chain: true,
                    amount: true,
                    amountUsd: true,
                },
            });

            if (unsweptDeposits.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No deposits to sweep',
                    data: { count: 0 },
                });
            }

            // Group by chain for batch processing
            const byChain = unsweptDeposits.reduce((acc, d) => {
                if (!acc[d.chain]) acc[d.chain] = [];
                acc[d.chain].push(d);
                return acc;
            }, {} as Record<string, typeof unsweptDeposits>);

            // For now, just return the sweep candidates
            // Actual sweep logic would go here (requires private key handling)
            return NextResponse.json({
                success: true,
                message: `Found ${unsweptDeposits.length} deposits to sweep`,
                data: {
                    totalCount: unsweptDeposits.length,
                    byChain: Object.entries(byChain).map(([chain, deposits]) => ({
                        chain,
                        count: deposits.length,
                        totalUsd: deposits.reduce((sum, d) => sum + Number(d.amountUsd), 0),
                    })),
                    // Actual sweep would be triggered here
                    status: 'SWEEP_READY',
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use "refresh" or "sweep"' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error processing balance action:', error);
        return NextResponse.json(
            { error: 'Failed to process action' },
            { status: 500 }
        );
    }
}
