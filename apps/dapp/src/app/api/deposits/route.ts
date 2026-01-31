/**
 * Deposits API
 * 
 * GET: Get user's deposit history including pending deposits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

import { getSession } from '@/lib/auth';

// Confirmation requirements per chain
const CONFIRMATION_REQUIREMENTS: Record<string, { threshold: number; total: number }> = {
    ethereum: { threshold: 12, total: 24 },
    base: { threshold: 50, total: 75 },
    arbitrum: { threshold: 50, total: 75 },
    hyperevm: { threshold: 1, total: 21 },
    bsc: { threshold: 15, total: 25 },
    solana: { threshold: 32, total: 48 },
};

export const dynamic = 'force-dynamic';

// GET /api/deposits
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // ALWAYS use session ID for security and reliability
        const session = await getSession();
        const userId = session?.id;

        if (!userId) {
            console.warn('[Deposits API] GET requested but no session found');
            return NextResponse.json(
                { error: 'Unauthorized', userId: null },
                { status: 401 }
            );
        }

        // Debug logging
        console.log(`[Deposits API] GET requested for userId: "${userId}" (limit: ${limit})`);

        // Get all deposits for user
        const deposits = await prisma.deposit.findMany({
            where: { userId: userId || '' },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                depositAddress: {
                    select: { chain: true, address: true },
                },
            },
        });

        console.log(`[Deposits API] Found ${deposits.length} total deposits in DB for user ${userId}`);
        if (deposits.length > 0) {
            console.log(`[Deposits API] Sample statuses: ${deposits.slice(0, 3).map(d => d.status).join(', ')}`);
        }

        // Separate pending/confirming from completed
        // PENDING/CONFIRMING show in the "Incoming" section
        const pendingDeposits = deposits.filter(d =>
            d.status === 'PENDING' || d.status === 'CONFIRMING'
        );

        // Everything else shows in the "History" section
        const completedDeposits = deposits.filter(d =>
            !['PENDING', 'CONFIRMING'].includes(d.status)
        );

        console.log(`[Deposits API] Filtered: ${pendingDeposits.length} pending, ${completedDeposits.length} history items`);

        if (deposits.length > 0) {
            console.log(`[Deposits API] Sample deposit: ID=${deposits[0].id}, status=${deposits[0].status}, asset=${deposits[0].asset}`);
        }

        // Calculate totals for completed deposits
        const totals = await prisma.deposit.aggregate({
            where: { userId, status: { in: ['SAFE', 'CONFIRMED', 'SWEPT'] } },
            _sum: { amountUsd: true },
            _count: true,
        });

        // Calculate pending totals
        const pendingTotals = pendingDeposits.reduce((acc, d) => ({
            count: acc.count + 1,
            amountUsd: acc.amountUsd + Number(d.amountUsd || 0),
        }), { count: 0, amountUsd: 0 });

        // Enhance pending deposits with progress info
        const enhancedPending = pendingDeposits.map(d => {
            const chain = d.chain;
            const requirements = CONFIRMATION_REQUIREMENTS[chain] || { threshold: 12, total: 12 };
            const confirmations = d.confirmations || 0;

            // Calculate progress percentage
            const progress = Math.min(100, Math.round((confirmations / requirements.total) * 100));

            // Estimate time remaining (approximate block times in seconds)
            const blockTimes: Record<string, number> = {
                ethereum: 12,
                base: 2,
                arbitrum: 0.25,
                hyperevm: 1,
                bsc: 3,
                solana: 0.4,
            };
            const remainingConfirmations = Math.max(0, requirements.total - confirmations);
            const estimatedSeconds = remainingConfirmations * (blockTimes[chain] || 12);

            return {
                ...d,
                progress,
                requiredConfirmations: requirements.total,
                estimatedSecondsRemaining: estimatedSeconds,
            };
        });

        // Serialize special types (Decimal, BigInt) for JSON
        const serializeDeposit = (d: any) => ({
            ...d,
            amount: d.amount?.toString?.() || d.amount,
            amountUsd: typeof d.amountUsd?.toNumber === 'function' ? d.amountUsd.toNumber() : Number(d.amountUsd || 0),
            blockNumber: d.blockNumber?.toString() || d.blockNumber,
        });

        return NextResponse.json({
            userId,
            deposits: completedDeposits.map(serializeDeposit),
            pending: {
                deposits: enhancedPending.map(serializeDeposit),
                summary: {
                    count: pendingTotals.count,
                    amountUsd: pendingTotals.amountUsd,
                },
            },
            summary: {
                totalCount: totals._count,
                totalValueUsd: Number(totals._sum.amountUsd || 0),
            },
        });

    } catch (error) {
        console.error('Error getting deposits:', error);
        return NextResponse.json(
            { error: 'Failed to get deposits' },
            { status: 500 }
        );
    }
}
