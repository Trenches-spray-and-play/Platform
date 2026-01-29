import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { toggleAutoBoost } from '@/services/auto-boost.service';

/**
 * PUT /api/user/positions/[id]/auto-boost
 * 
 * Toggle auto-boost for a specific position.
 * 
 * Body: { enabled: boolean }
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: participantId } = await params;
        const { enabled } = await request.json();

        if (typeof enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'enabled must be a boolean' },
                { status: 400 }
            );
        }

        const result = await toggleAutoBoost(session.id, participantId, enabled);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            autoBoostEnabled: enabled,
        });
    } catch (error) {
        console.error('Error toggling auto-boost:', error);
        return NextResponse.json(
            { error: 'Failed to toggle auto-boost' },
            { status: 500 }
        );
    }
}
