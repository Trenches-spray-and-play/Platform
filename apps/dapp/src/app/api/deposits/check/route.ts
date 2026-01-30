import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { scanForDeposits } from '@/services/deposit-scanner.service';

/**
 * POST /api/deposits/check
 * Triggered by user ("I've Sent It") to scan for their deposits.
 */
export async function POST(request: NextRequest) {
    try {
        // ALWAYS use session ID for security
        const session = await getSession();
        const userId = session?.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const chain = body.chain || 'all';

        console.log(`[API Deposit Check] User ${userId} requested scan for chain: ${chain}`);

        // Scans all or specific chain in parallel
        const result = await scanForDeposits(userId, chain);

        return NextResponse.json(result);

    } catch (error: any) {
        if (error.message === 'RATE_LIMITED') {
            return NextResponse.json({
                success: false,
                error: 'Please wait before checking again.',
                code: 'RATE_LIMITED',
                retryAfter: error.retryAfter || 30
            }, { status: 429 });
        }

        if (error.message === 'SERVICE_UNAVAILABLE') {
            return NextResponse.json({
                success: false,
                error: 'Rate limit service unavailable. Please try again later.',
                code: 'SCAN_FAILED'
            }, { status: 503 });
        }

        console.error('[API Deposit Check] Critical failure:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to scan for deposits.',
            code: 'SCAN_FAILED'
        }, { status: 500 });
    }
}
