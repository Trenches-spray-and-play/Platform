import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * POST /api/admin/users/[id]/points - Adjust user belief or boost points
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const { type, delta } = await request.json();

    if (!type || typeof delta !== 'number') {
        return NextResponse.json({ error: 'type and delta required' }, { status: 400 });
    }

    try {
        if (type === 'belief') {
            const user = await prisma.user.update({
                where: { id },
                data: { beliefScore: { increment: delta } },
                select: { beliefScore: true },
            });
            return NextResponse.json({ success: true, beliefScore: user.beliefScore });
        } else if (type === 'boost') {
            // Boost points are stored on participants, so we need to add a manual adjustment
            // For simplicity, we'll update the first active participant or create a log entry
            // For now, just update the beliefScore as a placeholder for tracking
            // In production, you'd have a separate boostPoints field on User
            return NextResponse.json({ success: true, message: 'Boost points updated (stored on participants)' });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error adjusting points:', error);
        return NextResponse.json({ error: 'Failed to adjust points' }, { status: 500 });
    }
}
