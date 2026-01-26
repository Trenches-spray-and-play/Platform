import { NextResponse } from 'next/server';
import {
    createPayout,
    getPendingPayouts,
    processPayoutQueue,
    getPayoutStats,
    getUserPayouts
} from '@/services/payout.service';

// GET /api/payouts - Get payouts (by user or stats)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const stats = searchParams.get('stats');

        if (stats === 'true') {
            const payoutStats = await getPayoutStats();
            return NextResponse.json({
                success: true,
                data: payoutStats,
            });
        }

        if (userId) {
            const payouts = await getUserPayouts(userId);
            return NextResponse.json({
                success: true,
                data: payouts,
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

// POST /api/payouts - Create a new payout or process queue
export async function POST(request: Request) {
    try {
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
