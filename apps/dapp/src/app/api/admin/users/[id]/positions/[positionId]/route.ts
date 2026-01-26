import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * DELETE /api/admin/users/[id]/positions/[positionId] - Force exit position with refund
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; positionId: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id: userId, positionId } = await params;

    try {
        // Find the participant
        const participant = await prisma.participant.findUnique({
            where: { id: positionId },
            select: {
                id: true,
                userId: true,
                status: true,
                entryAmount: true,
                receivedAmount: true,
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        if (participant.userId !== userId) {
            return NextResponse.json({ error: 'Position does not belong to this user' }, { status: 400 });
        }

        if (participant.status === 'paid' || participant.status === 'exited') {
            return NextResponse.json({ error: 'Cannot force exit a completed position' }, { status: 400 });
        }

        // Refund the entry amount to balance
        const refundAmount = participant.entryAmount - participant.receivedAmount;

        await prisma.$transaction([
            // Refund balance
            prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: refundAmount > 0 ? refundAmount : 0 } },
            }),
            // Update participant to exited status
            prisma.participant.update({
                where: { id: positionId },
                data: { status: 'exited' },
            }),
        ]);

        return NextResponse.json({
            success: true,
            refunded: refundAmount > 0 ? refundAmount : 0,
            message: `Position force exited. $${Math.max(0, refundAmount).toFixed(2)} refunded to balance.`,
        });
    } catch (error) {
        console.error('Error force exiting position:', error);
        return NextResponse.json({ error: 'Failed to force exit position' }, { status: 500 });
    }
}
