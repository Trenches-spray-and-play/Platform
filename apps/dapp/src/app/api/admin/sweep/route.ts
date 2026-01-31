import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { requireAdminAuth } from '@/lib/admin-auth';
import {
    sweepChain,
    sweepAllChains,
    getSweepStats,
    getPendingSweepAmounts,
    retryFailedSweeps,
    triggerManualSweep,
} from '@/services/sweep.service';
import { Chain } from '@/services/deposit-address.service';

/**
 * GET /api/admin/sweep - Get sweep statistics
 */
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const [stats, pendingAmounts] = await Promise.all([
            getSweepStats(),
            getPendingSweepAmounts(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                stats,
                pendingAmounts,
            },
        });
    } catch (error: any) {
        console.error('Error fetching sweep stats:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch sweep stats' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/sweep - Trigger sweep operation
 *
 * Body:
 *   - action: 'sweep_chain' | 'sweep_all' | 'retry_failed'
 *   - chain: Chain (required for sweep_chain)
 */
export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { action, chain } = body;

        if (!action) {
            return NextResponse.json(
                { success: false, error: 'Action is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'sweep_chain': {
                if (!chain) {
                    return NextResponse.json(
                        { success: false, error: 'Chain is required for sweep_chain action' },
                        { status: 400 }
                    );
                }

                const validChains: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm', 'solana'];
                if (!validChains.includes(chain)) {
                    return NextResponse.json(
                        { success: false, error: `Invalid chain. Valid chains: ${validChains.join(', ')}` },
                        { status: 400 }
                    );
                }

                console.log(`Admin ${auth.admin.email} triggered sweep for ${chain}`);
                const result = await triggerManualSweep(chain);

                return NextResponse.json({
                    success: result.success,
                    message: result.message,
                    data: result.details,
                });
            }

            case 'sweep_all': {
                console.log(`Admin ${auth.admin.email} triggered sweep for all chains`);
                const results = await sweepAllChains();

                let totalSwept = 0;
                const chainResults: Record<string, any> = {};

                for (const [chainName, result] of Object.entries(results)) {
                    chainResults[chainName] = result;
                    totalSwept += result.depositCount;
                }

                return NextResponse.json({
                    success: true,
                    message: `Swept ${totalSwept} deposits across all chains`,
                    data: chainResults,
                });
            }

            case 'retry_failed': {
                console.log(`Admin ${auth.admin.email} triggered retry of failed sweeps`);
                const retriedCount = await retryFailedSweeps();

                return NextResponse.json({
                    success: true,
                    message: `Reset ${retriedCount} failed batches for retry`,
                    data: { retriedCount },
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown action: ${action}. Valid actions: sweep_chain, sweep_all, retry_failed` },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Sweep operation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Sweep operation failed' },
            { status: 500 }
        );
    }
}
