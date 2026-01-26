import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TrenchLevel } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/trenches/[id] - Get trench details with participant queue
 */
export async function GET(request: Request, { params }: RouteParams) {
    const { id } = await params;

    try {
        // Check if id is a valid TrenchLevel
        const upperId = id.toUpperCase();
        const validLevels = ['RAPID', 'MID', 'DEEP'];
        const levelEnum = validLevels.includes(upperId) ? upperId as TrenchLevel : null;

        // Try to find by id first, then by level name
        const trench = await prisma.trench.findFirst({
            where: {
                OR: [
                    { id },
                    ...(levelEnum ? [{ level: levelEnum }] : []),
                ],
            },
            include: {
                participants: {
                    where: { status: 'active' },
                    // Note: Can't order by user.beliefScore in Prisma, so we sort in memory below
                    take: 100, // Fetch more to allow proper sorting
                    include: {
                        user: {
                            select: {
                                id: true,
                                handle: true,
                                beliefScore: true,
                            },
                        },
                    },
                },
            },
        });

        if (!trench) {
            return NextResponse.json(
                { error: 'Trench not found' },
                { status: 404 }
            );
        }

        // Sort participants by: beliefScore DESC, boostPoints DESC, joinedAt ASC
        // This matches the queue.service algorithm
        const sortedParticipants = [...trench.participants].sort((a, b) => {
            // 1. Belief Score (higher = better)
            if (b.user.beliefScore !== a.user.beliefScore) {
                return b.user.beliefScore - a.user.beliefScore;
            }
            // 2. Boost Points (higher = better)
            if (b.boostPoints !== a.boostPoints) {
                return b.boostPoints - a.boostPoints;
            }
            // 3. Joined At (earlier = better)
            return a.joinedAt.getTime() - b.joinedAt.getTime();
        }).slice(0, 50); // Return top 50 after sorting

        // Get campaign config for this trench
        const campaign = await prisma.campaignConfig.findFirst({
            where: {
                isActive: true,
                trenchIds: { has: trench.level.toLowerCase() },
            },
        });

        // USD entry ranges per level
        const usdRanges: Record<string, { min: number; max: number }> = {
            'RAPID': { min: 5, max: 1000 },
            'MID': { min: 100, max: 10000 },
            'DEEP': { min: 1000, max: 100000 },
        };
        const range = usdRanges[trench.level] || { min: 5, max: 1000 };

        // Format participant queue with positions
        const queue = sortedParticipants.map((p: typeof sortedParticipants[0], index: number) => ({
            position: index + 1,
            id: p.id,
            handle: p.user.handle,
            beliefScore: p.user.beliefScore,
            boostPoints: p.boostPoints,
            entryAmount: p.entryAmount,
            joinedAt: p.joinedAt,
            status: p.status,
        }));

        // Count total active participants
        const totalActive = await prisma.participant.count({
            where: { trenchId: trench.id, status: 'active' },
        });

        return NextResponse.json({
            data: {
                id: trench.id,
                name: trench.name,
                level: trench.level,
                entrySize: `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`,
                roiCap: campaign?.roiMultiplier ? `${campaign.roiMultiplier}x` : '1.5x',
                cadence: trench.cadence,
                reserves: campaign?.reserveCachedBalance || trench.reserves,
                active: trench.active,
                queue,
                totalParticipants: totalActive,
                tokenSymbol: campaign?.tokenSymbol || 'BLT',
                tokenPrice: campaign?.manualPrice || null,
            },
        });
    } catch (error) {
        console.error('Error fetching trench:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trench' },
            { status: 500 }
        );
    }
}
