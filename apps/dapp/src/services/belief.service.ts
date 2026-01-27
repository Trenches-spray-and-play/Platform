import { prisma } from '@/lib/db';

/**
 * Belief Score Service
 *
 * Manages belief score for queue priority.
 * User validation system has been removed - belief score is now
 * primarily for queue ordering (higher score = higher priority).
 */

/**
 * Award belief points to a user (permanent, affects queue priority)
 */
export async function awardBeliefPoints(userId: string, points: number) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            beliefScore: {
                increment: points,
            },
        },
    });

    console.log(`Awarded ${points} belief points to user ${userId}`);
    return points;
}

/**
 * Get user's belief stats
 */
export async function getUserBeliefStats(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            beliefScore: true,
        },
    });

    return {
        beliefScore: user?.beliefScore ?? 0,
    };
}

/**
 * Get leaderboard of top belief scores
 */
export async function getBeliefLeaderboard(limit: number = 20) {
    const users = await prisma.user.findMany({
        where: {
            beliefScore: {
                gt: 0,
            },
        },
        select: {
            id: true,
            handle: true,
            beliefScore: true,
        },
        orderBy: {
            beliefScore: 'desc',
        },
        take: limit,
    });

    return users;
}
