import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
    calculatePayoutTime,
    getRemainingTime,
    formatRemainingTime,
    getBpToMinutesRate
} from '@/services/payout-time.service';

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

        // 1. Fetch Active Participants
        const participants = await prisma.participant.findMany({
            where: {
                userId: session.id,
                status: { not: 'exited' }
            },
            include: {
                trench: {
                    select: {
                        id: true,
                        name: true,
                        level: true,
                        cadence: true,
                        durationHours: true,
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        // 2. Fetch Waitlist Entries (Enlisted & Secured)
        const waitlistEntries = await prisma.campaignWaitlist.findMany({
            where: {
                userId: session.id
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        trenchIds: true,
                        roiMultiplier: true,
                        startsAt: true,
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        });

        // Get the BP-to-minutes rate from config
        const bpRate = await getBpToMinutesRate();

        // 3. Map Participants to Unified Format (ACTIVE)
        const activePositions = participants.map((p) => {
            const expectedPayoutAt = p.expectedPayoutAt
                ? new Date(p.expectedPayoutAt)
                : calculatePayoutTime(
                    p.joinedAt,
                    p.trench.durationHours,
                    p.boostPoints,
                    bpRate
                );

            const remaining = getRemainingTime(expectedPayoutAt);
            const formattedTime = formatRemainingTime(expectedPayoutAt);

            let displayStatus = p.status;
            if (p.payoutTxHash) {
                displayStatus = 'paid';
            } else if (remaining.isReady) {
                displayStatus = 'processing';
            } else if (p.status === 'active') {
                displayStatus = 'waiting';
            }

            return {
                id: p.id,
                type: 'active',
                trenchId: p.trenchId,
                trenchName: p.trench.name,
                trenchLevel: p.trench.level,
                status: displayStatus,
                joinedAt: p.joinedAt,
                boostPoints: p.boostPoints,
                entryAmount: p.entryAmount,
                maxPayout: p.maxPayout,
                receivedAmount: p.receivedAmount,
                expiresAt: p.expiresAt,
                expectedPayoutAt: expectedPayoutAt.toISOString(),
                remainingTime: {
                    days: remaining.days,
                    hours: remaining.hours,
                    minutes: remaining.minutes,
                    seconds: remaining.seconds,
                    isReady: remaining.isReady,
                },
                formattedCountdown: formattedTime,
                payoutTxHash: p.payoutTxHash,
            };
        });

        // 4. Map Waitlist to Unified Format (SECURED or ENLISTED)
        const waitlistPositions = waitlistEntries.map((w) => {
            const isSecured = w.hasDeposited;
            const primaryTrench = w.campaign.trenchIds[0] || 'RAPID';

            return {
                id: w.id,
                type: isSecured ? 'secured' : 'enlisted',
                campaignId: w.campaignId,
                campaignName: w.campaign.name,
                trenchLevel: primaryTrench.toUpperCase(),
                status: isSecured ? 'priority_locked' : 'monitoring',
                joinedAt: w.joinedAt,
                depositAmount: w.depositAmount ? Number(w.depositAmount) : 0,
                roiMultiplier: Number(w.campaign.roiMultiplier) || 1.5,
                queueNumber: w.queueNumber,
                startsAt: w.campaign.startsAt,
            };
        });

        // Combine all and sort: Active (first), then by join date
        const unifiedStream = [
            ...activePositions,
            ...waitlistPositions
        ].sort((a, b) => {
            // Sort by type priority: active > secured > enlisted
            const typeWeight = { active: 3, secured: 2, enlisted: 1 };
            const weightA = typeWeight[a.type as keyof typeof typeWeight] || 0;
            const weightB = typeWeight[b.type as keyof typeof typeWeight] || 0;

            if (weightA !== weightB) return weightB - weightA;

            // Then by join date
            return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        });

        return NextResponse.json({ data: unifiedStream });
    } catch (error) {
        console.error('Error fetching user positions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch positions' },
            { status: 500 }
        );
    }
}


