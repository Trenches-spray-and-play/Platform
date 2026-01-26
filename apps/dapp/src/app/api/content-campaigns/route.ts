import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/content-campaigns - Get all active content campaigns
export async function GET() {
    try {
        const campaigns = await prisma.contentCampaign.findMany({
            where: { isActive: true },
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
                id: c.id,
                brand: c.brand,
                name: c.name,
                description: c.description,
                platforms: c.platforms,
                beliefPointsPer1k: Number(c.beliefPointsPer1k),
                usdPer1k: c.usdPer1k ? Number(c.usdPer1k) : null,
                icon: c.icon,
                budgetUsd: c.budgetUsd ? Number(c.budgetUsd) : null,
                spentUsd: Number(c.spentUsd),
                submissions: c._count.submissions,
                createdAt: c.createdAt
            }))
        });
    } catch (error) {
        console.error('Failed to fetch content campaigns:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}
