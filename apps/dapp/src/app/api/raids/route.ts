import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/raids - Get all active raids
export async function GET() {
    try {
        const raids = await prisma.raid.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { completions: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: raids.map(r => ({
                id: r.id,
                title: r.title,
                platform: r.platform,
                url: r.url,
                reward: r.reward,
                completions: r._count.completions,
                createdAt: r.createdAt,
                expiresAt: r.expiresAt
            }))
        });
    } catch (error) {
        console.error('Failed to fetch raids:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch raids' }, { status: 500 });
    }
}
