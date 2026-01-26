import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * POST /api/admin/users/[id]/balance - Adjust user balance
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { delta } = await request.json();

    if (typeof delta !== 'number') {
        return NextResponse.json({ error: 'delta required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { balance: { increment: delta } },
            select: { balance: true },
        });

        // Log the adjustment as a transaction for audit trail
        // (Optional: create a Transaction record here)

        return NextResponse.json({ success: true, balance: Number(user.balance) });
    } catch (error) {
        console.error('Error adjusting balance:', error);
        return NextResponse.json({ error: 'Failed to adjust balance' }, { status: 500 });
    }
}
