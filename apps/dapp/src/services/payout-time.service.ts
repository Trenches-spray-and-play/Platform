/**
 * Payout Time Service
 * 
 * Handles time-based payout calculations for the Protocol-V1 system.
 * 
 * Core Rules:
 * - expectedPayoutAt = joinedAt + (durationHours * 3600000) - (boostPoints * bpToMinutesRate * 60000)
 * - 1 BP = 1 minute off timer by default (configurable via PlatformConfig.bpToMinutesRate)
 */

import { prisma } from '@/lib/db';

// Cache for platform config to avoid repeated DB calls
let cachedBpRate: number | null = null;
let cacheExpiry: number = 0;

/**
 * Get the BP-to-minutes conversion rate from PlatformConfig
 * Cached for 60 seconds to reduce DB load
 */
export async function getBpToMinutesRate(): Promise<number> {
    const now = Date.now();

    if (cachedBpRate !== null && now < cacheExpiry) {
        return cachedBpRate;
    }

    const config = await prisma.platformConfig.findUnique({
        where: { id: 'default' },
        select: { bpToMinutesRate: true },
    });

    cachedBpRate = config?.bpToMinutesRate ?? 1;
    cacheExpiry = now + 60000; // Cache for 60 seconds

    return cachedBpRate;
}

/**
 * Clear the BP rate cache (call when admin updates the config)
 */
export function clearBpRateCache(): void {
    cachedBpRate = null;
    cacheExpiry = 0;
}

/**
 * Calculate the expected payout time for a participant
 * 
 * @param joinedAt - When the user joined the trench
 * @param durationHours - Baseline wait time for the trench (e.g., 24h for Rapid)
 * @param boostPoints - User's current boost points
 * @param bpToMinutesRate - Minutes saved per BP (default: 1)
 * @returns The calculated expected payout date
 */
export function calculatePayoutTime(
    joinedAt: Date,
    durationHours: number,
    boostPoints: number,
    bpToMinutesRate: number = 1
): Date {
    const baselineMs = durationHours * 60 * 60 * 1000;
    const reductionMs = boostPoints * bpToMinutesRate * 60 * 1000;

    // Ensure we don't go negative (payout can't be before join)
    const adjustedMs = Math.max(baselineMs - reductionMs, 0);

    return new Date(joinedAt.getTime() + adjustedMs);
}

/**
 * Get remaining time until payout
 * 
 * @param expectedPayoutAt - The calculated payout date
 * @returns Object with days, hours, minutes, and total milliseconds remaining
 */
export function getRemainingTime(expectedPayoutAt: Date): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isReady: boolean;
} {
    const now = new Date();
    const totalMs = expectedPayoutAt.getTime() - now.getTime();

    if (totalMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isReady: true };
    }

    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalMs, isReady: false };
}

/**
 * Format remaining time as a human-readable string
 * 
 * @param expectedPayoutAt - The calculated payout date
 * @returns Formatted string like "1d 4h 22m" or "READY"
 */
export function formatRemainingTime(expectedPayoutAt: Date): string {
    const { days, hours, minutes, isReady } = getRemainingTime(expectedPayoutAt);

    if (isReady) {
        return 'READY';
    }

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return parts.join(' ');
}

/**
 * Calculate and update the expectedPayoutAt for a participant
 * Call this when:
 * - Participant is first created
 * - Participant earns boost points
 */
export async function recalculatePayoutTime(participantId: string): Promise<Date | null> {
    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { trench: true },
    });

    if (!participant) {
        console.error(`Participant ${participantId} not found`);
        return null;
    }

    const bpRate = await getBpToMinutesRate();
    const expectedPayoutAt = calculatePayoutTime(
        participant.joinedAt,
        participant.trench.durationHours,
        participant.boostPoints,
        bpRate
    );

    // Update the participant record
    await prisma.participant.update({
        where: { id: participantId },
        data: { expectedPayoutAt },
    });

    console.log(`Updated expectedPayoutAt for participant ${participantId}: ${expectedPayoutAt.toISOString()}`);
    return expectedPayoutAt;
}

/**
 * Get all participants whose payout time has arrived and are ready to be paid
 * 
 * @param limit - Maximum number of participants to return
 * @returns Array of participants ready for payout
 */
export async function getParticipantsReadyForPayout(limit: number = 10) {
    const now = new Date();

    return prisma.participant.findMany({
        where: {
            status: 'active',
            expectedPayoutAt: { lte: now },
            payoutTxHash: null, // Not yet paid
        },
        include: {
            user: true,
            trench: true,
        },
        orderBy: { expectedPayoutAt: 'asc' },
        take: limit,
    });
}

/**
 * Recalculate payout times for all active participants
 * Use this for:
 * - Backfilling after schema migration
 * - When admin changes the BP rate
 */
export async function recalculateAllPayoutTimes(): Promise<number> {
    const bpRate = await getBpToMinutesRate();

    const participants = await prisma.participant.findMany({
        where: { status: 'active' },
        include: { trench: true },
    });

    let updated = 0;

    for (const participant of participants) {
        const expectedPayoutAt = calculatePayoutTime(
            participant.joinedAt,
            participant.trench.durationHours,
            participant.boostPoints,
            bpRate
        );

        await prisma.participant.update({
            where: { id: participant.id },
            data: { expectedPayoutAt },
        });

        updated++;
    }

    console.log(`Recalculated payout times for ${updated} participants`);
    return updated;
}
