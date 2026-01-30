import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/deposits/status
 * Fetches only the pending/confirming deposits for the user.
 * Used for real-time status banners and progress tracking.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const userId = session?.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const pending = await prisma.deposit.findMany({
            where: {
                userId,
                status: { in: ['PENDING', 'CONFIRMING'] }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                depositAddress: {
                    select: { chain: true, address: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            count: pending.length,
            deposits: pending.map(d => ({
                id: d.id,
                txHash: d.txHash,
                chain: d.chain,
                asset: d.asset,
                amountUsd: Number(d.amountUsd),
                status: d.status,
                confirmations: d.confirmations,
                createdAt: d.createdAt
            }))
        });

    } catch (error) {
        console.error('[API Deposit Status] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
