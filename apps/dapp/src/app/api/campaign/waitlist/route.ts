import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/campaign/waitlist
 * Get user's waitlist position for a campaign
 * Query: ?campaignId=xxx
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
        return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        // Get campaign info
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id: campaignId },
            select: {
                id: true,
                name: true,
                startsAt: true,
                acceptDepositsBeforeStart: true,
                _count: { select: { waitlist: true } },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Get user's waitlist entry
        const waitlistEntry = await prisma.campaignWaitlist.findUnique({
            where: {
                campaignId_userId: { campaignId, userId: dbUser.id },
            },
        });

        // Calculate queue position
        let queuePosition = null;
        if (waitlistEntry) {
            const earlierEntries = await prisma.campaignWaitlist.count({
                where: {
                    campaignId,
                    joinedAt: { lt: waitlistEntry.joinedAt },
                },
            });
            queuePosition = earlierEntries + 1;
        }

        return NextResponse.json({
            success: true,
            data: {
                campaign: {
                    id: campaign.id,
                    name: campaign.name,
                    startsAt: campaign.startsAt?.toISOString() || null,
                    acceptDepositsBeforeStart: campaign.acceptDepositsBeforeStart,
                    totalWaitlist: campaign._count.waitlist,
                },
                inWaitlist: !!waitlistEntry,
                queuePosition,
                hasDeposited: waitlistEntry?.hasDeposited || false,
                depositAmount: waitlistEntry?.depositAmount ? Number(waitlistEntry.depositAmount) : null,
                joinedAt: waitlistEntry?.joinedAt?.toISOString() || null,
            },
        });
    } catch (error) {
        console.error('Error fetching waitlist:', error);
        return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
    }
}

/**
 * POST /api/campaign/waitlist
 * Join campaign waitlist
 * Body: { campaignId: string }
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true, balance: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { campaignId, depositAmount } = body;

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
        }

        // Get campaign
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id: campaignId },
            select: {
                id: true,
                name: true,
                startsAt: true,
                acceptDepositsBeforeStart: true,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Check if campaign already started
        if (campaign.startsAt && new Date() >= campaign.startsAt) {
            return NextResponse.json(
                { error: 'Campaign has already started' },
                { status: 400 }
            );
        }

        // Handle deposit logic if provided
        const deposit = parseFloat(depositAmount) || 0;
        if (deposit > 0 && !campaign.acceptDepositsBeforeStart) {
            return NextResponse.json(
                { error: 'Campaign is not currently accepting deposits' },
                { status: 400 }
            );
        }

        // Check user balance if depositing
        if (deposit > 0 && Number(dbUser.balance) < deposit) {
            return NextResponse.json(
                { error: 'Insufficient balance for waitlist deposit' },
                { status: 400 }
            );
        }

        // Check if already in waitlist
        const existing = await prisma.campaignWaitlist.findUnique({
            where: {
                campaignId_userId: { campaignId, userId: dbUser.id },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Already in waitlist' },
                { status: 400 }
            );
        }

        // Run as a transaction to ensure balance and waitlist entry are atomic
        const entry = await prisma.$transaction(async (tx) => {
            // Deduct balance if depositing
            if (deposit > 0) {
                await tx.user.update({
                    where: { id: dbUser.id },
                    data: {
                        balance: { decrement: deposit }
                    }
                });
            }

            // Calculate queue number (based on current count + 1)
            const currentCount = await tx.campaignWaitlist.count({
                where: { campaignId },
            });

            // Join waitlist
            return await tx.campaignWaitlist.create({
                data: {
                    campaignId,
                    userId: dbUser.id,
                    queueNumber: currentCount + 1,
                    hasDeposited: deposit > 0,
                    depositAmount: deposit > 0 ? deposit : null,
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: deposit > 0
                ? `Secured priority spot for ${campaign.name}`
                : `Joined waitlist for ${campaign.name}`,
            data: {
                queueNumber: entry.queueNumber,
                joinedAt: entry.joinedAt.toISOString(),
                hasDeposited: entry.hasDeposited,
            },
        });
    } catch (error) {
        console.error('Error joining waitlist:', error);
        return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }
}

/**
 * DELETE /api/campaign/waitlist
 * Leave campaign waitlist
 * Query: ?campaignId=xxx
 */
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
        return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        // Check if campaign already started
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id: campaignId },
            select: { startsAt: true },
        });

        if (campaign?.startsAt && new Date() >= campaign.startsAt) {
            return NextResponse.json(
                { error: 'Cannot leave waitlist after campaign has started' },
                { status: 400 }
            );
        }

        // Check if user has deposited - cannot leave if deposited
        const waitlistEntry = await prisma.campaignWaitlist.findUnique({
            where: {
                campaignId_userId: { campaignId, userId: dbUser.id },
            },
            select: { hasDeposited: true },
        });

        if (!waitlistEntry) {
            return NextResponse.json(
                { error: 'Not in waitlist' },
                { status: 404 }
            );
        }

        if (waitlistEntry.hasDeposited) {
            return NextResponse.json(
                { error: 'Cannot leave waitlist after depositing. Your funds are secured for the campaign.' },
                { status: 400 }
            );
        }

        // Delete waitlist entry (only allowed if no deposit)
        await prisma.campaignWaitlist.delete({
            where: {
                campaignId_userId: { campaignId, userId: dbUser.id },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Left waitlist',
        });
    } catch (error) {
        console.error('Error leaving waitlist:', error);
        return NextResponse.json({ error: 'Failed to leave waitlist' }, { status: 500 });
    }
}
