import { prisma } from '@/lib/db';
import { recalculatePayoutTime, getBpToMinutesRate } from './payout-time.service';

/**
 * Auto-Boost Service
 * 
 * Handles automatic distribution of boost points to positions with auto-boost enabled.
 * 
 * Rules (per user confirmation):
 * - FIFO distribution: oldest position first
 * - Auto-resume enabled: paused positions resume when timer > 0
 * - Multiple positions allowed: apply FIFO until timer = 0, then skip to next
 * - Partial application: apply only needed amount, keep rest in wallet
 */

/**
 * Process auto-boost when user earns BP
 * @param userId User who earned the BP
 * @param earnedBp Amount of BP earned (already added to User.boostPoints)
 */
export async function processAutoBoost(userId: string, earnedBp: number): Promise<{
    distributed: number;
    remaining: number;
    positionsUpdated: string[];
}> {
    if (earnedBp <= 0) {
        return { distributed: 0, remaining: 0, positionsUpdated: [] };
    }

    // Get all auto-boost enabled positions for this user, ordered FIFO (oldest first)
    const positions = await prisma.participant.findMany({
        where: {
            userId,
            status: 'active',
            autoBoostEnabled: true,
        },
        orderBy: {
            joinedAt: 'asc', // FIFO: oldest first
        },
        include: {
            trench: {
                select: {
                    durationHours: true,
                },
            },
        },
    });

    if (positions.length === 0) {
        // No auto-boost positions, BP stays in wallet
        return { distributed: 0, remaining: earnedBp, positionsUpdated: [] };
    }

    let remainingBp = earnedBp;
    const positionsUpdated: string[] = [];
    const bpToMinutesRate = await getBpToMinutesRate();

    for (const position of positions) {
        if (remainingBp <= 0) break;

        const now = new Date();
        let expectedPayout = position.expectedPayoutAt;

        // If expectedPayoutAt is null, calculate it first
        if (!expectedPayout) {
            expectedPayout = await recalculatePayoutTime(position.id);
            if (!expectedPayout) {
                continue; // Skip if we can't determine payout time
            }
        }

        // Check if timer is at zero (ready for payout)
        if (expectedPayout <= now) {
            // Timer at zero - pause auto-boost for this position
            if (!position.autoBoostPaused) {
                await prisma.participant.update({
                    where: { id: position.id },
                    data: { autoBoostPaused: true },
                });
            }
            continue; // Skip to next position
        }

        // Resume if was paused but timer is now > 0 (e.g., new position created)
        if (position.autoBoostPaused && expectedPayout > now) {
            await prisma.participant.update({
                where: { id: position.id },
                data: { autoBoostPaused: false },
            });
        }

        // Calculate how much BP needed to reach timer = 0
        const msUntilPayout = expectedPayout.getTime() - now.getTime();
        const minutesUntilPayout = msUntilPayout / (60 * 1000);
        const bpNeeded = Math.ceil(minutesUntilPayout / bpToMinutesRate);

        // Apply only what's needed or available
        const bpToApply = Math.min(remainingBp, Math.max(0, bpNeeded));

        if (bpToApply > 0) {
            // Update participant boost points
            await prisma.participant.update({
                where: { id: position.id },
                data: {
                    boostPoints: { increment: bpToApply },
                },
            });

            // Deduct from user wallet
            await prisma.user.update({
                where: { id: userId },
                data: {
                    boostPoints: { decrement: bpToApply },
                },
            });

            // Recalculate payout time
            await recalculatePayoutTime(position.id);

            remainingBp -= bpToApply;
            positionsUpdated.push(position.id);

            // Check if this position's timer is now at zero
            const updatedPosition = await prisma.participant.findUnique({
                where: { id: position.id },
                select: { expectedPayoutAt: true },
            });

            const currentTime = new Date();
            if (updatedPosition?.expectedPayoutAt && updatedPosition.expectedPayoutAt <= currentTime) {
                // Timer reached zero, pause auto-boost
                await prisma.participant.update({
                    where: { id: position.id },
                    data: { autoBoostPaused: true },
                });
            }
        }
    }

    return {
        distributed: earnedBp - remainingBp,
        remaining: remainingBp,
        positionsUpdated,
    };
}

/**
 * Toggle auto-boost for a specific position
 */
export async function toggleAutoBoost(
    userId: string,
    participantId: string,
    enabled: boolean
): Promise<{ success: boolean; error?: string }> {
    // Verify user owns this position
    const participant = await prisma.participant.findFirst({
        where: {
            id: participantId,
            userId,
        },
    });

    if (!participant) {
        return { success: false, error: 'Position not found' };
    }

    if (participant.status !== 'active') {
        return { success: false, error: 'Cannot modify inactive position' };
    }

    // Check if timer is at zero
    const now = new Date();
    const isPaused = !!(participant.expectedPayoutAt && participant.expectedPayoutAt <= now);

    await prisma.participant.update({
        where: { id: participantId },
        data: {
            autoBoostEnabled: enabled,
            autoBoostPaused: enabled && isPaused, // Auto-pause if enabling with timer at zero
        },
    });

    return { success: true };
}
