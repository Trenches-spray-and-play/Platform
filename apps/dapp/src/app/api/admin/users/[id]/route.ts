import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/users/[id] - Get detailed user info for admin modal
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Verify admin authentication
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    const { id } = await params;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                handle: true,
                email: true,
                wallet: true,
                walletEvm: true,
                walletSol: true,
                beliefScore: true,
                balance: true,
                createdAt: true,
                telegramHandle: true,
                referralCode: true,
                referredById: true,
                referrer: {
                    select: { id: true, handle: true },
                },
                referrals: {
                    select: { id: true, handle: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
                deposits: {
                    select: {
                        id: true,
                        chain: true,
                        asset: true,
                        amount: true,
                        amountUsd: true,
                        status: true,
                        txHash: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
                depositAddresses: {
                    select: {
                        chain: true,
                        address: true,
                        cachedBalance: true,
                        cachedBalanceAt: true,
                    },
                },
                participants: {
                    select: {
                        id: true,
                        trenchId: true,
                        status: true,
                        boostPoints: true,
                        entryAmount: true,
                        maxPayout: true,
                        receivedAmount: true,
                        joinedAt: true,
                        trench: {
                            select: { name: true, level: true },
                        },
                    },
                    orderBy: { joinedAt: 'desc' },
                },
                sprayEntries: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        createdAt: true,
                        trench: {
                            select: { name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                userTasks: {
                    select: {
                        id: true,
                        completedAt: true,
                        task: {
                            select: { title: true, reward: true, link: true },
                        },
                    },
                    orderBy: { completedAt: 'desc' },
                },
                postSubmissions: {
                    select: {
                        id: true,
                        platform: true,
                        url: true,
                        contentType: true,
                        status: true,
                        endorsements: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
                campaignWaitlists: {
                    select: {
                        id: true,
                        campaignId: true,
                        hasDeposited: true,
                        depositAmount: true,
                        queueNumber: true,
                        joinedAt: true,
                        campaign: {
                            select: { id: true, name: true, startsAt: true },
                        },
                    },
                    orderBy: { joinedAt: 'desc' },
                },
                _count: {
                    select: {
                        deposits: true,
                        participants: true,
                        sprayEntries: true,
                        userTasks: true,
                        postSubmissions: true,
                        referrals: true,
                        campaignWaitlists: true,
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

        // Calculate aggregate stats
        const totalDepositsUsd = user.deposits.reduce(
            (sum, d) => sum + Number(d.amountUsd || 0),
            0
        );
        const depositsByChain = user.deposits.reduce((acc, d) => {
            const chain = d.chain;
            if (!acc[chain]) {
                acc[chain] = { count: 0, totalUsd: 0 };
            }
            acc[chain].count++;
            acc[chain].totalUsd += Number(d.amountUsd || 0);
            return acc;
        }, {} as Record<string, { count: number; totalUsd: number }>);

        const totalReceived = user.participants.reduce(
            (sum, p) => sum + p.receivedAmount,
            0
        );
        const totalBoostPoints = user.participants.reduce(
            (sum, p) => sum + p.boostPoints,
            0
        );

        // Check for pending payouts
        const pendingPayouts = await prisma.payout.findMany({
            where: { userId: id, status: 'PENDING' },
            select: { amount: true, amountUsd: true },
        });
        const pendingPayoutTotal = pendingPayouts.reduce(
            (sum, p) => sum + Number(p.amountUsd || 0),
            0
        );

        // Calculate profit/loss
        const profitLoss = totalReceived - totalDepositsUsd;

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                stats: {
                    totalDepositsUsd,
                    depositsByChain,
                    totalReceived,
                    totalBoostPoints,
                    pendingPayoutTotal,
                    profitLoss,
                    sprayCount: user._count.sprayEntries,
                    taskCount: user._count.userTasks,
                    postCount: user._count.postSubmissions,
                    referralCount: user._count.referrals,
                    waitlistCount: user._count.campaignWaitlists,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user details' },
            { status: 500 }
        );
    }
}
