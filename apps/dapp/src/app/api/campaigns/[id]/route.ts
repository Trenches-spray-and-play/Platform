import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/campaigns/[id] - Get a single campaign by ID
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Calculate campaign phase
        const now = new Date();
        let phase: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED' = 'LIVE';

        if (campaign.isPaused) {
            phase = 'PAUSED';
        } else if (campaign.startsAt && campaign.startsAt > now) {
            phase = campaign.acceptDepositsBeforeStart ? 'ACCEPTING' : 'WAITLIST';
        }

        // Get participant count
        const participantCounts = await prisma.participant.groupBy({
            by: ['trenchId'],
            where: {
                trenchId: { in: campaign.trenchIds },
            },
            _count: true,
        });

        const participantCount = participantCounts.reduce((sum, p) => sum + p._count, 0);

        // Determine level from trenchIds
        const level = campaign.trenchIds.includes('RAPID')
            ? 'RAPID'
            : campaign.trenchIds.includes('MID')
                ? 'MID'
                : 'DEEP';

        // Entry ranges based on level
        const entryRanges = {
            RAPID: { min: 5, max: 1000 },
            MID: { min: 100, max: 10000 },
            DEEP: { min: 1000, max: 100000 },
        };

        const campaignWithMetadata = {
            ...campaign,
            phase,
            level,
            participantCount,
            entryRange: entryRanges[level as keyof typeof entryRanges],
        };

        return NextResponse.json({
            data: campaignWithMetadata,
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}
