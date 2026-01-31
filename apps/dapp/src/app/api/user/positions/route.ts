import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserPositions } from '@/services/userService';

/**
 * GET /api/user/positions - Get current user's unified deployment stream
 * 
 * Protocol-V1: Returns Active Positions, Secured Spots, and Enlisted Spots.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const unifiedStream = await getUserPositions(session.id);
        return NextResponse.json({ data: unifiedStream });
    } catch (error) {
        console.error('Error fetching user positions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch positions' },
            { status: 500 }
        );
    }
}
