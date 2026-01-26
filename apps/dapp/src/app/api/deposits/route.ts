/**
 * Deposits API
 * 
 * GET: Get user's deposit history
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/deposits?userId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const where: any = { userId };
        if (status) {
            where.status = status;
        }

        const deposits = await prisma.deposit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                depositAddress: {
                    select: { chain: true, address: true },
                },
            },
        });

        // Calculate totals
        const totals = await prisma.deposit.aggregate({
            where: { userId, status: { in: ['CONFIRMED', 'SWEPT'] } },
            _sum: { amountUsd: true },
            _count: true,
        });

        return NextResponse.json({
            deposits,
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
