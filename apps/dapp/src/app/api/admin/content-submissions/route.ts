import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

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

        // Get the submission with campaign data
        const submission = await prisma.userContentSubmission.findUnique({
            where: { id },
            include: { campaign: true }
        });

        if (!submission) {
            return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
        }

        // Calculate belief points if approving with view count
        let beliefAwarded = 0;
        if (status === 'approved' && viewCount && viewCount > 0) {
            beliefAwarded = (viewCount / 1000) * Number(submission.campaign.beliefPointsPer1k);
        }

        // Update submission
        const updatedSubmission = await prisma.userContentSubmission.update({
            where: { id },
            data: {
                status,
                viewCount: viewCount || submission.viewCount,
                beliefAwarded,
                verifiedAt: status === 'approved' ? new Date() : null
            }
        });

        // If approving, add belief points to user
        if (status === 'approved' && beliefAwarded > 0) {
            await prisma.user.update({
                where: { id: submission.userId },
                data: {
                    beliefScore: { increment: Math.floor(beliefAwarded) }
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: updatedSubmission.id,
                status: updatedSubmission.status,
                viewCount: updatedSubmission.viewCount,
                beliefAwarded: Number(updatedSubmission.beliefAwarded)
            }
        });
    } catch (error) {
        console.error('Failed to update submission:', error);
        return NextResponse.json({ success: false, error: 'Failed to update submission' }, { status: 500 });
    }
}

// POST: Promote submission to raid
export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { submissionId, reward } = body;

        if (!submissionId) {
            return NextResponse.json({ success: false, error: 'Missing submissionId' }, { status: 400 });
        }

        // Get the submission
        const submission = await prisma.userContentSubmission.findUnique({
            where: { id: submissionId },
            include: {
                campaign: true,
                user: { select: { handle: true } }
            }
        });

        if (!submission) {
            return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
        }

        if (submission.status !== 'approved') {
            return NextResponse.json({ success: false, error: 'Only approved submissions can be promoted to raids' }, { status: 400 });
        }

        // Create raid from submission
        const raid = await prisma.raid.create({
            data: {
                title: `${submission.campaign.brand}: ${submission.user.handle}'s content`,
                platform: submission.platform,
                url: submission.url,
                reward: reward || 50,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                raidId: raid.id,
                title: raid.title,
                url: raid.url,
                reward: raid.reward
            },
            message: 'Content promoted to raid successfully'
        });
    } catch (error) {
        console.error('Failed to promote to raid:', error);
        return NextResponse.json({ success: false, error: 'Failed to promote to raid' }, { status: 500 });
    }
}
