import { prisma } from '@/lib/db';
import {
    calculatePayoutTime,
    getRemainingTime,
    formatRemainingTime,
    getBpToMinutesRate
} from '@/services/payout-time.service';

export interface UserProfile {
    id: string;
    handle: string;
    email: string | null;
    wallet: string | null;
    walletEvm: string | null;
    walletSol: string | null;
    referralCode: string | undefined;
    beliefScore: number;
    balance: string; // Match schema
    boostPoints: number;
    stats: {
        sprays: number;
        exits: number;
        earnings: number;
        tasksCompleted: number;
        postsSubmitted: number;
        referrals: number;
    };
    socials: {
        twitter: boolean;
        telegram: boolean;
    };
    createdAt: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        console.log('[DEBUG] getUserProfile: fetching for:', userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        participants: true,
                        deposits: true,
                        postSubmissions: true,
                        userTasks: true,
                        referrals: true,
                    },
                },
            },
        });

        if (!user) return null;

        const participantStats = await prisma.participant.aggregate({
            where: { userId: user.id },
            _sum: {
                boostPoints: true,
                receivedAmount: true,
            },
            _count: {
                _all: true,
            },
        });

        const exitedCount = await prisma.participant.count({
            where: { userId: user.id, status: 'exited' },
        });

        return {
            id: user.id,
            handle: user.handle,
            email: user.email,
            wallet: user.wallet,
            walletEvm: user.walletEvm,
            walletSol: user.walletSol,
            referralCode: user.referralCode ?? undefined,
            beliefScore: user.beliefScore,
            balance: (user.balance?.toString() || "0"),
            boostPoints: user.boostPoints || 0,
            stats: {
                sprays: participantStats._count._all || 0,
                exits: exitedCount,
                earnings: participantStats._sum.receivedAmount || 0,
                tasksCompleted: user._count.userTasks,
                postsSubmitted: user._count.postSubmissions,
                referrals: user._count.referrals,
            },
            socials: {
                twitter: true,
                telegram: false,
            },
            createdAt: user.createdAt.toISOString(),
        };
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        return null;
    }
}

export async function getUserPositions(userId: string) {
    try {
        // 0. Get all visible, active campaigns and their trench IDs
        const visibleCampaigns = await prisma.campaignConfig.findMany({
            where: {
                isHidden: false,
                isActive: true,
            },
            select: {
                trenchIds: true,
            },
        });
        
        // Flatten all visible trench IDs into a set for efficient lookup
        const visibleTrenchIds = new Set(
            visibleCampaigns.flatMap(c => c.trenchIds)
        );

        // 1. Fetch Active Participants (only for non-hidden campaigns)
        const participants = await prisma.participant.findMany({
            where: {
                userId,
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

        // Filter participants to only include those in visible campaigns
        const visibleParticipants = participants.filter(
            p => visibleTrenchIds.has(p.trenchId)
        );

        // 2. Fetch Waitlist Entries (Enlisted & Secured) - only for non-hidden campaigns
        const waitlistEntries = await prisma.campaignWaitlist.findMany({
            where: { 
                userId,
                campaign: {
                    isHidden: false,
                    isActive: true,
                }
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

        const bpRate = await getBpToMinutesRate();

        // 3. Map Participants to Unified Format (ACTIVE)
        const activePositions = visibleParticipants.map((p) => {
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
                type: 'active' as const,
                trenchId: p.trenchId,
                trenchName: p.trench.name,
                trenchLevel: p.trench.level,
                status: displayStatus,
                joinedAt: p.joinedAt.toISOString(),
                boostPoints: p.boostPoints,
                entryAmount: p.entryAmount,
                maxPayout: p.maxPayout,
                receivedAmount: p.receivedAmount,
                expiresAt: p.expiresAt?.toISOString() || null,
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
                type: (isSecured ? 'secured' : 'enlisted') as 'secured' | 'enlisted',
                campaignId: w.campaignId,
                campaignName: w.campaign.name,
                trenchLevel: primaryTrench.toUpperCase(),
                status: isSecured ? 'priority_locked' : 'monitoring',
                joinedAt: w.joinedAt.toISOString(),
                depositAmount: w.depositAmount ? Number(w.depositAmount) : 0,
                roiMultiplier: Number(w.campaign.roiMultiplier) || 1.5,
                queueNumber: w.queueNumber,
                startsAt: w.campaign.startsAt?.toISOString() || null,
            };
        });

        // Combine all and sort
        const unifiedStream = [
            ...activePositions,
            ...waitlistPositions
        ].sort((a, b) => {
            const typeWeight = { active: 3, secured: 2, enlisted: 1 };
            const weightA = typeWeight[a.type as keyof typeof typeWeight] || 0;
            const weightB = typeWeight[b.type as keyof typeof typeWeight] || 0;

            if (weightA !== weightB) return weightB - weightA;
            return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        });

        return unifiedStream;
    } catch (error) {
        console.error('Error in getUserPositions:', error);
        return [];
    }
}
