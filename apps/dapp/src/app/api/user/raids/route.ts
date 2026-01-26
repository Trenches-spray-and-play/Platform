import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/user/raids - Get user's completed raids
// POST /api/user/raids - Claim a raid
export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const completedRaids = await prisma.userRaid.findMany({
            where: { userId },
            include: {
                raid: {
                    select: {
                        id: true,
                        title: true,
                        platform: true,
                        reward: true
                    }
                }
            },
            orderBy: { completedAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            data: completedRaids.map(ur => ({
                id: ur.id,
                raidId: ur.raidId,
                title: ur.raid.title,
                platform: ur.raid.platform,
                bpAwarded: ur.bpAwarded,
                completedAt: ur.completedAt
            }))
        });
    } catch (error) {
        console.error('Failed to fetch user raids:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch raids' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { raidId } = await request.json();
        if (!raidId) {
            return NextResponse.json({ success: false, error: 'Missing raidId' }, { status: 400 });
        }

        // Check if raid exists and is active
        const raid = await prisma.raid.findUnique({ where: { id: raidId } });
        if (!raid || !raid.isActive) {
            return NextResponse.json({ success: false, error: 'Raid not found or inactive' }, { status: 404 });
        }

        // Check if expired
        if (raid.expiresAt && raid.expiresAt < new Date()) {
            return NextResponse.json({ success: false, error: 'Raid has expired' }, { status: 400 });
        }

        // Check if already completed
        const existing = await prisma.userRaid.findUnique({
            where: { userId_raidId: { userId, raidId } }
        });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Raid already completed' }, { status: 400 });
        }

        // Create completion and award BP
        const [userRaid] = await prisma.$transaction([
            prisma.userRaid.create({
                data: {
                    userId,
                    raidId,
                    bpAwarded: raid.reward
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    beliefScore: { increment: raid.reward } // Using boostPoints through beliefScore for now
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                id: userRaid.id,
                bpAwarded: raid.reward
            }
        });
    } catch (error) {
        console.error('Failed to claim raid:', error);
        return NextResponse.json({ success: false, error: 'Failed to claim raid' }, { status: 500 });
    }
}
