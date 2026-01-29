import { prisma } from '@/lib/db';

/**
 * Queue Engine
 * 
 * Deterministic ordering based on:
 * 1. Belief Score (DESC) - from user
 * 2. Boost Points (DESC) - from participant
 * 3. Joined At (ASC) - first in, first out tiebreaker
 */

export interface QueueEntry {
    participantId: string;
    userId: string;
    handle: string;
    wallet: string | null;
    beliefScore: number;
    boostPoints: number;
    entryAmount: number;
    maxPayout: number;
    receivedAmount: number;
    joinedAt: Date;
    position: number;
}

export interface QueueStats {
    totalParticipants: number;
    totalEntryValue: number;
    averageBeliefScore: number;
}

/**
 * Get the queue for a trench with deterministic ordering
 * Sort: beliefScore DESC, boostPoints DESC, joinedAt ASC
 */
export async function getTrenchQueue(trenchId: string): Promise<QueueEntry[]> {
    const participants = await prisma.participant.findMany({
        where: {
            trenchId,
            status: 'active',
        },
        include: {
            user: {
                select: {
                    id: true,
                    handle: true,
                    wallet: true,
                    beliefScore: true,
                },
            },
        },
        orderBy: [
            // Can't order by related field directly, so we'll sort in memory
        ],
    });

    // Deterministic sort: beliefScore DESC, boostPoints DESC, joinedAt ASC
    const sorted = participants.sort((a, b) => {
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
    });

    // Map to QueueEntry with position
    return sorted.map((p, index) => ({
        participantId: p.id,
        userId: p.user.id,
        handle: p.user.handle,
        wallet: p.user.wallet,
        beliefScore: p.user.beliefScore,
        boostPoints: p.boostPoints,
        entryAmount: p.entryAmount,
        maxPayout: p.maxPayout,
        receivedAmount: p.receivedAmount,
        joinedAt: p.joinedAt,
        position: index + 1, // 1-indexed position
    }));
}

/**
 * Get a user's position in a specific trench queue
 */
export async function getUserQueuePosition(
    userId: string,
    trenchId: string
): Promise<number | null> {
    const queue = await getTrenchQueue(trenchId);
    const entry = queue.find((e) => e.userId === userId);
    return entry?.position ?? null;
}

/**
 * Get who is "on the clock" (position 1 in queue)
 */
export async function getOnTheClockUser(trenchId: string): Promise<QueueEntry | null> {
    const queue = await getTrenchQueue(trenchId);
    return queue[0] ?? null;
}

/**
 * Get queue statistics for a trench
 */
export async function getQueueStats(trenchId: string): Promise<QueueStats> {
    const queue = await getTrenchQueue(trenchId);

    const totalParticipants = queue.length;
    const totalEntryValue = queue.reduce((sum, e) => sum + e.entryAmount, 0);
    const averageBeliefScore = totalParticipants > 0
        ? queue.reduce((sum, e) => sum + e.beliefScore, 0) / totalParticipants
        : 0;

    return {
        totalParticipants,
        totalEntryValue,
        averageBeliefScore,
    };
}

/**
 * Check if a user is eligible to receive a payout
 * Based on payout-target-resolver.md rules
 */
export function isEligibleForPayout(entry: QueueEntry): boolean {
    const remainingCap = entry.maxPayout - entry.receivedAmount;
    return remainingCap > 0;
}

/**
 * Get the next eligible payout target
 * Priority 1: Eligible users
 * Priority 2: Reserve addresses (handled elsewhere)
 */
export async function getNextPayoutTarget(
    trenchId: string
): Promise<QueueEntry | null> {
    const queue = await getTrenchQueue(trenchId);

    for (const entry of queue) {
        if (isEligibleForPayout(entry)) {
            return entry;
        }
    }

    return null; // No eligible user, use reserve
}

/**
 * Calculate payment amount for an entry
 * Respects cap to prevent overpayment
 */
export function calculatePaymentAmount(
    entry: QueueEntry,
    payoutIncrement: number
): number {
    const remainingCap = entry.maxPayout - entry.receivedAmount;
    return Math.min(payoutIncrement, remainingCap);
}

/**
 * @deprecated Use applyBoostToParticipant instead. This function adds BP directly to participant
 * without checking user wallet. Kept for backward compatibility.
 */
export async function addBoostPoints(
    userId: string,
    trenchId: string,
    points: number
): Promise<void> {
    await prisma.participant.update({
        where: {
            userId_trenchId: {
                userId,
                trenchId,
            },
        },
        data: {
            boostPoints: {
                increment: points,
            },
        },
    });
}

/**
 * Apply boost points from user wallet to a specific participant position
 * Uses atomic transaction to prevent race conditions
 */
export async function applyBoostToParticipant(
    userId: string,
    participantId: string,
    points: number
): Promise<{ success: boolean; error?: string; newTimer?: Date }> {
    if (points <= 0) {
        return { success: false, error: 'Points must be positive' };
    }

    try {
        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify user has enough BP
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { boostPoints: true },
            });

            if (!user || user.boostPoints < points) {
                throw new Error('Insufficient boost points');
            }

            // 2. Verify participant exists and belongs to user
            const participant = await tx.participant.findFirst({
                where: {
                    id: participantId,
                    userId,
                },
            });

            if (!participant) {
                throw new Error('Position not found');
            }

            if (participant.status !== 'active') {
                throw new Error('Cannot boost inactive position');
            }

            // 3. Atomically deduct from user and add to participant
            await tx.user.update({
                where: { id: userId },
                data: { boostPoints: { decrement: points } },
            });

            const updated = await tx.participant.update({
                where: { id: participantId },
                data: { boostPoints: { increment: points } },
            });

            return updated;
        });

        // 4. Recalculate payout time (outside transaction)
        const { recalculatePayoutTime } = await import('./payout-time.service');
        await recalculatePayoutTime(participantId);

        // 5. Get updated payout time
        const finalParticipant = await prisma.participant.findUnique({
            where: { id: participantId },
            select: { expectedPayoutAt: true },
        });

        return {
            success: true,
            newTimer: finalParticipant?.expectedPayoutAt ?? undefined,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply boost',
        };
    }
}

/**
 * Apply boost decay to all participants
 * Called periodically (e.g., every hour)
 */
export async function applyBoostDecay(decayPercent: number = 5): Promise<number> {
    // Get all active participants with boost points
    const participants = await prisma.participant.findMany({
        where: {
            status: 'active',
            boostPoints: {
                gt: 0,
            },
        },
    });

    let decayedCount = 0;
    for (const p of participants) {
        const decayAmount = Math.floor(p.boostPoints * (decayPercent / 100));
        if (decayAmount > 0) {
            await prisma.participant.update({
                where: { id: p.id },
                data: {
                    boostPoints: {
                        decrement: decayAmount,
                    },
                },
            });
            decayedCount++;
        }
    }

    return decayedCount;
}

/**
 * Update received amount after a payout
 */
export async function recordPayoutReceived(
    participantId: string,
    amount: number
): Promise<void> {
    const participant = await prisma.participant.update({
        where: { id: participantId },
        data: {
            receivedAmount: {
                increment: amount,
            },
        },
    });

    // Check if max payout reached
    if (participant.receivedAmount >= participant.maxPayout) {
        await prisma.participant.update({
            where: { id: participantId },
            data: {
                status: 'completed',
            },
        });
    }
}
