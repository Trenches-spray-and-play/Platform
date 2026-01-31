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
                id: true,
                name: true,
                trenchIds: true,
                roiMultiplier: true,
            },
        });
        
        // DEBUG LOGGING
        console.log('[DEBUG] getUserPositions - UserId:', userId);
        console.log('[DEBUG] getUserPositions - Visible campaigns count:', visibleCampaigns.length);
        console.log('[DEBUG] getUserPositions - Campaigns:', visibleCampaigns.map(c => ({ id: c.id, name: c.name, trenchIds: c.trenchIds })));
        
        // Create a map of trenchId -> campaign name for lookup
        const trenchToCampaign: Map<string, { name: string; campaignId: string }> = new Map();
        visibleCampaigns.forEach(campaign => {
            campaign.trenchIds.forEach(trenchId => {
                trenchToCampaign.set(trenchId, { name: campaign.name, campaignId: campaign.id });
            });
        });
        
        // Flatten all visible trench IDs into a set for efficient lookup
        const visibleTrenchIds = new Set(trenchToCampaign.keys());
        
        // DEBUG LOGGING
        console.log('[DEBUG] getUserPositions - Visible trench IDs:', Array.from(visibleTrenchIds));

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
        
        // DEBUG: Log participant autoBoost fields
        console.log('[DEBUG] Participants autoBoost fields:', participants.map(p => ({ 
            id: p.id, 
            autoBoostEnabled: p.autoBoostEnabled, 
            autoBoostPaused: p.autoBoostPaused 
        })));
        
        // DEBUG LOGGING
        console.log('[DEBUG] getUserPositions - All participants count:', participants.length);
        console.log('[DEBUG] getUserPositions - Participants:', participants.map(p => ({ id: p.id, trenchId: p.trenchId, status: p.status })));

        // Filter participants by trench LEVEL (not trenchId)
        // Note: campaign.trenchIds contains LEVEL names ('rapid', 'mid', 'deep')
        // participant.trenchId is a UUID, but participant.trench.level matches
        const visibleTrenchLevels = visibleTrenchIds; // This contains levels like 'deep', 'rapid'
        
        const visibleParticipants = visibleTrenchLevels.size > 0 
            ? participants.filter(p => p.trench?.level && visibleTrenchLevels.has(p.trench.level.toLowerCase()))
            : participants; // If no visible campaigns, show all (for debugging)
        
        // DEBUG LOGGING
        console.log('[DEBUG] getUserPositions - Visible trench LEVELS count:', visibleTrenchLevels.size);
        console.log('[DEBUG] getUserPositions - Visible participants count:', visibleParticipants.length);
        console.log('[DEBUG] getUserPositions - Filtered out count:', participants.length - visibleParticipants.length);
        console.log('[DEBUG] getUserPositions - Sample participant trench level:', participants[0]?.trench?.level);

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

            // Get campaign info from trench mapping
            const campaignInfo = trenchToCampaign.get(p.trenchId);
            
            // Find the full campaign to get roiMultiplier
            const campaign = visibleCampaigns.find(c => c.trenchIds.includes(p.trenchId));
            const roiMultiplier = campaign ? Number(campaign.roiMultiplier) : 1.5;

            return {
                id: p.id,
                type: 'active' as const,
                trenchId: p.trenchId,
                trenchName: p.trench.name,
                trenchLevel: p.trench.level,
                campaignName: campaignInfo?.name || p.trench.name, // Use campaign name if available
                campaignId: campaignInfo?.campaignId,
                status: displayStatus,
                joinedAt: p.joinedAt.toISOString(),
                boostPoints: p.boostPoints,
                entryAmount: p.entryAmount,
                maxPayout: p.maxPayout,
                receivedAmount: p.receivedAmount,
                roiMultiplier: roiMultiplier,
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
                autoBoostEnabled: p.autoBoostEnabled,
                autoBoostPaused: p.autoBoostPaused,
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
