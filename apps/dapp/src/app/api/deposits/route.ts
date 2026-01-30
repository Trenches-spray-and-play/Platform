/**
 * Deposits API
 * 
 * GET: Get user's deposit history including pending deposits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

// Confirmation requirements per chain
const CONFIRMATION_REQUIREMENTS: Record<string, { threshold: number; total: number }> = {
    ethereum: { threshold: 12, total: 24 },
    base: { threshold: 50, total: 75 },
    arbitrum: { threshold: 50, total: 75 },
    hyperevm: { threshold: 1, total: 21 },
    bsc: { threshold: 15, total: 25 },
    solana: { threshold: 32, total: 48 },
};

// GET /api/deposits?userId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Get all deposits for user
        const deposits = await prisma.deposit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                depositAddress: {
                    select: { chain: true, address: true },
                },
            },
        });

        // Separate pending/confirming from completed
        const pendingDeposits = deposits.filter(d => 
            d.status === 'PENDING' || d.status === 'CONFIRMING'
        );
        const completedDeposits = deposits.filter(d => 
            d.status === 'SAFE' || d.status === 'CONFIRMED' || d.status === 'SWEPT'
        );
        
        // Debug logging
        console.log(`[Deposits API] User ${userId}: ${deposits.length} total, ${pendingDeposits.length} pending, ${completedDeposits.length} completed`);
        if (deposits.length > 0) {
            console.log(`[Deposits API] Statuses found:`, deposits.map(d => ({ status: d.status, asset: d.asset, amount: d.amount })));
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

        // Serialize Decimal values to strings/numbers for JSON
        const serializeDeposit = (d: any) => ({
            ...d,
            amount: d.amount?.toString?.() || d.amount,
            amountUsd: d.amountUsd?.toNumber?.() || Number(d.amountUsd) || 0,
        });

        return NextResponse.json({
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
