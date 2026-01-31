import { prisma } from '@/lib/db';

// In-memory cache for campaigns (reduces DB hits)
// Campaigns change infrequently, so we cache for 30 seconds
let campaignsCache: { data: any[]; timestamp: number } | null = null;
const CAMPAIGNS_CACHE_TTL = 30 * 1000; // 30 seconds

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

async function getCachedCampaigns() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (campaignsCache && (now - campaignsCache.timestamp) < CAMPAIGNS_CACHE_TTL) {
        console.log('[PERF] Using cached campaigns');
        return campaignsCache.data;
    }
    
    // Fetch fresh data
    console.time('[PERF] getTrenchGroups:fetchCampaigns');
    const campaigns = await prisma.campaignConfig.findMany({
        where: {
            isActive: true,
            isHidden: false,
        },
        orderBy: { createdAt: 'desc' },
    });
    console.timeEnd('[PERF] getTrenchGroups:fetchCampaigns');
    
    // Update cache
    campaignsCache = { data: campaigns, timestamp: now };
    return campaigns;
}

export async function getTrenchGroups() {
    console.time('[PERF] getTrenchGroups:total');
    
    try {
        // Run queries in PARALLEL to reduce total time
        console.time('[PERF] getTrenchGroups:parallelQueries');
        const [campaigns, participantCounts] = await Promise.all([
            getCachedCampaigns(),
            prisma.participant.groupBy({
                by: ['trenchId'],
                _count: true,
            }),
        ]);
        console.timeEnd('[PERF] getTrenchGroups:parallelQueries');
        
        const participantMap = Object.fromEntries(
            participantCounts.map(p => [p.trenchId, p._count])
        );

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

        const grouped: Record<string, {
            level: string;
            name: string;
            entryRange: { min: number; max: number };
            cadence: string;
            campaigns: any[];
        }> = {};

        for (const [level, config] of Object.entries(trenchLevels)) {
            grouped[level] = {
                level,
                name: config.name,
                entryRange: config.entryRange,
                cadence: config.cadence,
                campaigns: [],
            };
        }

        console.time('[PERF] getTrenchGroups:processCampaigns');
        for (const campaign of campaigns) {
            const phase = getCampaignPhase(campaign);
            const participantCount = campaign.trenchIds.reduce((sum: number, tid: string) => {
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
        console.timeEnd('[PERF] getTrenchGroups:processCampaigns');

        const result = Object.values(grouped).filter(g => g.campaigns.length > 0);
        console.timeEnd('[PERF] getTrenchGroups:total');
        
        return result;
    } catch (error) {
        console.timeEnd('[PERF] getTrenchGroups:total');
        console.error('Error in getTrenchGroups:', error);
        return [];
    }
}

// Export function to clear cache (useful for admin updates)
export function clearCampaignsCache() {
    campaignsCache = null;
    console.log('[PERF] Campaigns cache cleared');
}
