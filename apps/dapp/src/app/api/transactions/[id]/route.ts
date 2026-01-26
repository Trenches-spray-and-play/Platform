import { NextResponse } from 'next/server';
import { getTransactionStatus } from '@/services/transaction.service';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transaction = await getTransactionStatus(id);

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: transaction.id,
                status: transaction.status,
                amount: transaction.amount,
                txHash: transaction.txHash,
                blockNumber: transaction.blockNumber,
                verifiedAt: transaction.verifiedAt?.toISOString(),
                deadline: transaction.deadline.toISOString(),
                createdAt: transaction.createdAt.toISOString(),
                user: transaction.user,
                trench: transaction.trench,
            },
        });
    } catch (error) {
        console.error('Error fetching transaction status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
