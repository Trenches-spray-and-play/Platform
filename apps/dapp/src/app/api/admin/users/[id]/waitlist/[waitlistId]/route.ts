import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * DELETE /api/admin/users/[id]/waitlist/[waitlistId] - Delete waitlist entry with refund
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; waitlistId: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id: userId, waitlistId } = await params;

    try {
        // Find the waitlist entry
        const waitlist = await prisma.campaignWaitlist.findUnique({
            where: { id: waitlistId },
            select: {
                id: true,
                userId: true,
                hasDeposited: true,
                depositAmount: true,
            },
        });

        if (!waitlist) {
            return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
        }

        if (waitlist.userId !== userId) {
            return NextResponse.json({ error: 'Waitlist does not belong to this user' }, { status: 400 });
        }

        // If user had deposited, refund to balance
        const refundAmount = waitlist.hasDeposited && waitlist.depositAmount ? Number(waitlist.depositAmount) : 0;

        await prisma.$transaction([
            // Refund balance if applicable
            ...(refundAmount > 0 ? [
                prisma.user.update({
                    where: { id: userId },
                    data: { balance: { increment: refundAmount } },
                }),
            ] : []),
            // Delete the waitlist entry
            prisma.campaignWaitlist.delete({
                where: { id: waitlistId },
            }),
        ]);

        return NextResponse.json({
            success: true,
            refunded: refundAmount,
            message: refundAmount > 0 ? `$${refundAmount.toFixed(2)} refunded to balance` : 'Entry deleted',
        });
    } catch (error) {
        console.error('Error deleting waitlist:', error);
        return NextResponse.json({ error: 'Failed to delete waitlist entry' }, { status: 500 });
    }
}
