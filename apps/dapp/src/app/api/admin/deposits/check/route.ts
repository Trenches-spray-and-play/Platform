/**
 * Check deposits for a user (diagnostic endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const txHash = searchParams.get('txHash');

        if (!userId && !txHash) {
            return NextResponse.json({ error: 'userId or txHash required' }, { status: 400 });
        }

        // Check by userId
        if (userId) {
            const deposits = await prisma.deposit.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            const depositAddress = await prisma.depositAddress.findFirst({
                where: { userId },
            });

            return NextResponse.json({
                userId,
                depositCount: deposits.length,
                deposits: deposits.map(d => ({
                    id: d.id,
                    asset: d.asset,
                    amount: d.amount.toString(),
                    amountUsd: d.amountUsd.toString(),
                    status: d.status,
                    chain: d.chain,
                    txHash: d.txHash,
                    createdAt: d.createdAt,
                })),
                hasDepositAddress: !!depositAddress,
                depositAddress: depositAddress?.address || null,
            });
        }

        // Check by txHash
        if (txHash) {
            const deposit = await prisma.deposit.findFirst({
                where: { txHash: { contains: txHash } },
            });

            return NextResponse.json({
                found: !!deposit,
                deposit: deposit ? {
                    id: deposit.id,
                    userId: deposit.userId,
                    asset: deposit.asset,
                    amount: deposit.amount.toString(),
                    status: deposit.status,
                } : null,
            });
        }

    } catch (error) {
        console.error('Error checking deposits:', error);
        return NextResponse.json({ error: 'Failed to check deposits' }, { status: 500 });
    }
}
