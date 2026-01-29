import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { applyBoostToParticipant } from '@/services/queue.service';
import { prisma } from '@/lib/db';

/**
 * POST /api/user/boost
 * 
 * Manually apply boost points from user wallet to a specific position.
 * 
 * Body: { participantId: string, amount: number }
 * 
 * Returns: { success, walletBalance, position }
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { participantId, amount } = await request.json();

        // Validate input
        if (!participantId || typeof participantId !== 'string') {
            return NextResponse.json(
                { error: 'participantId is required' },
                { status: 400 }
            );
        }

        if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
            return NextResponse.json(
                { error: 'amount must be a positive integer' },
                { status: 400 }
            );
        }

        // Apply boost
        const result = await applyBoostToParticipant(session.id, participantId, amount);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Get updated user and position data for response
        const [user, position] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.id },
                select: { boostPoints: true },
            }),
            prisma.participant.findUnique({
                where: { id: participantId },
                select: {
                    boostPoints: true,
                    expectedPayoutAt: true,
                    autoBoostEnabled: true,
                    autoBoostPaused: true,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            walletBalance: user?.boostPoints ?? 0,
            position: {
                id: participantId,
                boostPoints: position?.boostPoints ?? 0,
                expectedPayoutAt: position?.expectedPayoutAt,
                autoBoostEnabled: position?.autoBoostEnabled ?? false,
                autoBoostPaused: position?.autoBoostPaused ?? false,
            },
        });
    } catch (error) {
        console.error('Error applying boost:', error);
        return NextResponse.json(
            { error: 'Failed to apply boost' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/user/boost
 * 
 * Get user's current boost wallet balance and positions with auto-boost status.
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

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                boostPoints: true,
                participants: {
                    where: { status: 'active' },
                    select: {
                        id: true,
                        boostPoints: true,
                        expectedPayoutAt: true,
                        autoBoostEnabled: true,
                        autoBoostPaused: true,
                        trench: {
                            select: {
                                name: true,
                                level: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            walletBalance: user.boostPoints,
            positions: user.participants.map((p) => ({
                id: p.id,
                trenchName: p.trench.name,
                trenchLevel: p.trench.level,
                boostPoints: p.boostPoints,
                expectedPayoutAt: p.expectedPayoutAt,
                autoBoostEnabled: p.autoBoostEnabled,
                autoBoostPaused: p.autoBoostPaused,
            })),
        });
    } catch (error) {
        console.error('Error fetching boost data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boost data' },
            { status: 500 }
        );
    }
}
