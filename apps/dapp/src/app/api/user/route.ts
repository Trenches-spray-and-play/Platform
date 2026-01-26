import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/user - Get current authenticated user's profile
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch full user data with stats
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            include: {
                _count: {
                    select: {
                        participants: true,
                        deposits: true,
                        postSubmissions: true,
                        userTasks: true,
                        referrals: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Calculate stats
        const participantStats = await prisma.participant.aggregate({
            where: { userId: user.id },
            _sum: {
                boostPoints: true,
                receivedAmount: true,
            },
            _count: {
                _all: true,
            },
        });

        const exitedCount = await prisma.participant.count({
            where: { userId: user.id, status: 'exited' },
        });

        return NextResponse.json({
            data: {
                id: user.id,
                handle: user.handle,
                email: user.email,
                wallet: user.wallet,
                walletEvm: user.walletEvm,
                walletSol: user.walletSol,
                referralCode: user.referralCode,
                beliefScore: user.beliefScore,
                balance: Number(user.balance) || 0, // USD-normalized balance
                boostPoints: participantStats._sum.boostPoints || 0,
                stats: {
                    sprays: participantStats._count._all || 0,
                    exits: exitedCount,
                    earnings: participantStats._sum.receivedAmount || 0,
                    tasksCompleted: user._count.userTasks,
                    postsSubmitted: user._count.postSubmissions,
                    referrals: user._count.referrals,
                },
                socials: {
                    twitter: true, // TODO: Implement actual social connection status
                    telegram: false,
                },
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user - Update user profile (wallet address)
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { wallet, walletEvm, walletSol } = await request.json();

        const updated = await prisma.user.update({
            where: { id: session.id },
            data: {
                ...(wallet !== undefined && { wallet }),
                ...(walletEvm !== undefined && { walletEvm }),
                ...(walletSol !== undefined && { walletSol }),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                wallet: updated.wallet,
                walletEvm: updated.walletEvm,
                walletSol: updated.walletSol,
            },
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
