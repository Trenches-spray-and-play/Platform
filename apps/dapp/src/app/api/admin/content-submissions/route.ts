import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { POINTS } from '@/constants/points';
import { recalculatePayoutTime } from '@/services/payout-time.service';

// Admin endpoint for managing content submissions
// GET: List all submissions
// PUT: Review submission (approve/reject with viewCount)

export async function GET(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    const campaignId = searchParams.get('campaignId');

    try {
        const submissions = await prisma.userContentSubmission.findMany({
            where: {
                ...(status && { status }),
                ...(campaignId && { campaignId }),
            },
            include: {
                user: {
                    select: { id: true, handle: true, beliefScore: true }
                },
                campaign: {
                    select: { id: true, brand: true, name: true, beliefPointsPer1k: true, platforms: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            data: submissions.map(s => ({
                id: s.id,
                userId: s.userId,
                userHandle: s.user.handle,
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

export async function PUT(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { id, status, viewCount } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing submission ID' }, { status: 400 });
        }

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        // Get the submission with campaign and user data
        const submission = await prisma.userContentSubmission.findUnique({
            where: { id },
            include: {
                campaign: true,
                user: { select: { handle: true } }
            }
        });

        if (!submission) {
            return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
        }

        // Update submission
        const updatedSubmission = await prisma.userContentSubmission.update({
            where: { id },
            data: {
                status,
                viewCount: viewCount || submission.viewCount,
                beliefAwarded: status === 'approved' ? POINTS.CONTENT_REWARD : 0,
                verifiedAt: status === 'approved' ? new Date() : null
            }
        });

        let raidId: string | null = null;

        // If approving, award BP to participant and auto-create raid
        if (status === 'approved') {
            // Award BP to user's participant records
            const updatedParticipants = await prisma.participant.updateMany({
                where: { userId: submission.userId },
                data: { boostPoints: { increment: POINTS.CONTENT_REWARD } }
            });

            // Recalculate payout time for all affected participants
            if (updatedParticipants.count > 0) {
                const participants = await prisma.participant.findMany({
                    where: { userId: submission.userId, status: 'active' },
                    select: { id: true }
                });
                await Promise.all(participants.map(p => recalculatePayoutTime(p.id)));
            }

            // Auto-create raid from approved content
            const raid = await prisma.raid.create({
                data: {
                    title: `${submission.campaign.brand}: ${submission.user.handle}'s content`,
                    platform: submission.platform,
                    url: submission.url,
                    reward: POINTS.RAID_REWARD, // Default 5 BP
                    isActive: true,
                    contentSubmissionId: submission.id
                }
            });
            raidId = raid.id;
        }

        return NextResponse.json({
            success: true,
            data: {
                id: updatedSubmission.id,
                status: updatedSubmission.status,
                viewCount: updatedSubmission.viewCount,
                bpAwarded: status === 'approved' ? POINTS.CONTENT_REWARD : 0,
                raidId
            }
        });
    } catch (error) {
        console.error('Failed to update submission:', error);
        return NextResponse.json({ success: false, error: 'Failed to update submission' }, { status: 500 });
    }
}

