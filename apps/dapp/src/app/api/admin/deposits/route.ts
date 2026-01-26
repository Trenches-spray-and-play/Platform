import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/deposits - List all deposits with user info
 */
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const deposits = await prisma.deposit.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to recent 100
            include: {
                user: {
                    select: {
                        id: true,
                        handle: true,
                    },
                },
            },
        });

        // Format deposits for frontend
        const formattedDeposits = deposits.map(deposit => ({
            id: deposit.id,
            chain: deposit.chain,
            amount: deposit.amount.toString(),
            token: deposit.asset,
            usdValue: Number(deposit.amountUsd),
            txHash: deposit.txHash,
            status: deposit.status.toLowerCase(),
            createdAt: deposit.createdAt.toISOString(),
            user: deposit.user,
        }));

        return NextResponse.json({
            data: formattedDeposits,
        });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json(
            { error: 'Failed to fetch deposits' },
            { status: 500 }
        );
    }
}

