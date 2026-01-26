import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/user/content-submissions - Get user's submissions
// POST /api/user/content-submissions - Submit content to a campaign
export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const submissions = await prisma.userContentSubmission.findMany({
            where: { userId },
            include: {
                campaign: {
                    select: {
                        id: true,
                        brand: true,
                        name: true,
                        beliefPointsPer1k: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            data: submissions.map(s => ({
                id: s.id,
                campaignId: s.campaignId,
                brand: s.campaign.brand,
                campaignName: s.campaign.name,
                url: s.url,
                platform: s.platform,
                viewCount: s.viewCount,
                beliefAwarded: Number(s.beliefAwarded),
                status: s.status,
                createdAt: s.createdAt,
                verifiedAt: s.verifiedAt
            }))
        });
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch submissions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { campaignId, url, platform } = await request.json();

        if (!campaignId || !url || !platform) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Check if campaign exists and is active
        const campaign = await prisma.contentCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign || !campaign.isActive) {
            return NextResponse.json({ success: false, error: 'Campaign not found or inactive' }, { status: 404 });
        }

        // Check if platform is allowed
        if (!campaign.platforms.includes(platform)) {
            return NextResponse.json({
                success: false,
                error: `Platform "${platform}" not allowed for this campaign. Allowed: ${campaign.platforms.join(', ')}`
            }, { status: 400 });
        }

        // Create submission
        const submission = await prisma.userContentSubmission.create({
            data: {
                userId,
                campaignId,
                url,
                platform,
                status: 'pending'
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                id: submission.id,
                status: submission.status
            }
        });
    } catch (error) {
        console.error('Failed to create submission:', error);
        return NextResponse.json({ success: false, error: 'Failed to submit content' }, { status: 500 });
    }
}
