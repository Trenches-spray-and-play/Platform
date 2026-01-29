import { NextResponse } from 'next/server';
import {
    createPayout,
    getPendingPayouts,
    processPayoutQueue,
    getPayoutStats,
    getUserPayouts
} from '@/services/payout.service';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getSession } from '@/lib/auth';

// GET /api/payouts - Get payouts (by user or stats)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const stats = searchParams.get('stats');

        // User-specific payouts: require user session
        if (userId) {
            const session = await getSession();
            if (!session || session.id !== userId) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            const payouts = await getUserPayouts(userId);
            return NextResponse.json({
                success: true,
                data: payouts,
            });
        }

        // Admin-only: stats or pending payouts list
        const auth = await requireAdminAuth();
        if (!auth.authorized) {
            return auth.response;
        }

        if (stats === 'true') {
            const payoutStats = await getPayoutStats();
            return NextResponse.json({
                success: true,
                data: payoutStats,
            });
        }

        // Return pending payouts for admin
        const pending = await getPendingPayouts(50);
        return NextResponse.json({
            success: true,
            data: pending,
        });
    } catch (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch payouts' },
            { status: 500 }
        );
    }
}

// POST /api/payouts - Create a new payout or process queue (ADMIN ONLY)
export async function POST(request: Request) {
    try {
        // Require admin authentication for all payout mutations
        const auth = await requireAdminAuth();
        if (!auth.authorized) {
            return auth.response;
        }

        const body = await request.json();
        const { action, participantId, userId, trenchId, amount, amountUsd, toAddress } = body;

        // Process payout queue
        if (action === 'process') {
            const result = await processPayoutQueue(body.limit || 10);

            // Check if paused
            if (result.paused) {
                return NextResponse.json({
                    success: true,
                    paused: true,
                    message: 'Payout processing is currently paused by admin',
                });
            }

            return NextResponse.json({
                success: true,
                data: result.results,
                message: `Processed ${result.results?.length || 0} payouts`,
                intervalSeconds: result.intervalSeconds,
            });
        }

        // Create new payout
        if (!participantId || !userId || !trenchId || !amount || !toAddress) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const payout = await createPayout({
            participantId,
            userId,
            trenchId,
            amount,
            amountUsd: amountUsd || 0,
            toAddress,
        });

        return NextResponse.json({
            success: true,
            data: payout,
            message: 'Payout created',
        });
    } catch (error) {
        console.error('Error creating payout:', error);
        const message = error instanceof Error ? error.message : 'Failed to create payout';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
