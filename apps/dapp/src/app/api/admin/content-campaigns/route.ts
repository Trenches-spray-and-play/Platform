import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

// Admin: GET all campaigns, POST new, PUT update, DELETE
export async function GET() {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const campaigns = await prisma.contentCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: campaigns.map(c => ({
                ...c,
                beliefPointsPer1k: Number(c.beliefPointsPer1k),
                usdPer1k: c.usdPer1k ? Number(c.usdPer1k) : null,
                budgetUsd: c.budgetUsd ? Number(c.budgetUsd) : null,
                spentUsd: Number(c.spentUsd),
                submissions: c._count.submissions
            }))
        });
    } catch (error) {
        console.error('Failed to fetch content campaigns:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const body = await request.json();
        const { brand, name, description, platforms, beliefPointsPer1k, usdPer1k, budgetUsd, icon } = body;

        if (!brand || !name || beliefPointsPer1k === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const campaign = await prisma.contentCampaign.create({
            data: {
                brand,
                name,
                description: description || null,
                platforms: platforms || [],
                beliefPointsPer1k,
                usdPer1k: usdPer1k || null,
                budgetUsd: budgetUsd || null,
                icon: icon || null,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, data: campaign });
    } catch (error) {
        console.error('Failed to create content campaign:', error);
        return NextResponse.json({ success: false, error: 'Failed to create campaign' }, { status: 500 });
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
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing campaign ID' }, { status: 400 });
        }

        const campaign = await prisma.contentCampaign.update({
            where: { id },
            data: updates
        });

        return NextResponse.json({ success: true, data: campaign });
    } catch (error) {
        console.error('Failed to update content campaign:', error);
        return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing campaign ID' }, { status: 400 });
        }

        // Soft delete by deactivating
        await prisma.contentCampaign.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete content campaign:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete campaign' }, { status: 500 });
    }
}
