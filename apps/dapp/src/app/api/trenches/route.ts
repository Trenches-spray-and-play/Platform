import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Calculate campaign phase
function getCampaignPhase(campaign: {
    isPaused: boolean;
    startsAt: Date | null;
    acceptDepositsBeforeStart: boolean;
}): 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED' {
    const now = new Date();

    if (campaign.isPaused) {
        return 'PAUSED';
    }

    if (campaign.startsAt && campaign.startsAt > now) {
        return campaign.acceptDepositsBeforeStart ? 'ACCEPTING' : 'WAITLIST';
    }

    return 'LIVE';
}

/**
 * GET /api/trenches - Get campaigns grouped by trench level
 */
export async function GET() {
    try {
        // Get all active, non-hidden campaigns
        const campaigns = await prisma.campaignConfig.findMany({
            where: {
                isActive: true,
                isHidden: false,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get participant counts per trench
        const participantCounts = await prisma.participant.groupBy({
            by: ['trenchId'],
            _count: true,
        });
        const participantMap = Object.fromEntries(
            participantCounts.map(p => [p.trenchId, p._count])
        );

        // USD entry ranges per level
        const trenchLevels = {
            'RAPID': {
                name: 'RAPID CAMPAIGNS',
                entryRange: { min: 5, max: 1000 },
                cadence: '1-3 DAYS',
            },
            'MID': {
                name: 'MID CAMPAIGNS',
                entryRange: { min: 100, max: 10000 },
                cadence: '7-14 DAYS',
            },
            'DEEP': {
                name: 'DEEP CAMPAIGNS',
                entryRange: { min: 1000, max: 100000 },
                cadence: '30-60 DAYS',
            },
        };

        // Group campaigns by trench level with phase info
        const grouped: Record<string, {
            level: string;
            name: string;
            entryRange: { min: number; max: number };
            cadence: string;
            campaigns: Array<typeof campaigns[0] & {
                phase: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED';
                participantCount: number;
            }>;
        }> = {};

        // Initialize groups
        for (const [level, config] of Object.entries(trenchLevels)) {
            grouped[level] = {
                level,
                name: config.name,
                entryRange: config.entryRange,
                cadence: config.cadence,
                campaigns: [],
            };
        }

        // Assign campaigns to their trench levels with phase data
        for (const campaign of campaigns) {
            const phase = getCampaignPhase(campaign);

            // Sum participants across all trenches in this campaign
            const participantCount = campaign.trenchIds.reduce((sum, tid) => {
                return sum + (participantMap[tid] || 0);
            }, 0);

            const campaignWithPhase = {
                ...campaign,
                phase,
                participantCount,
            };

            for (const trenchId of campaign.trenchIds) {
                const level = trenchId.toUpperCase();
                if (grouped[level]) {
                    grouped[level].campaigns.push(campaignWithPhase);
                }
            }
        }

        // Convert to array, only include levels with campaigns
        const data = Object.values(grouped).filter(g => g.campaigns.length > 0);

        return NextResponse.json({
            data,
            meta: {
                updatedAt: new Date().toISOString(),
                totalCampaigns: campaigns.length,
            },
        });
    } catch (error) {
        console.error('Error fetching trenches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trenches' },
            { status: 500 }
        );
    }
}
