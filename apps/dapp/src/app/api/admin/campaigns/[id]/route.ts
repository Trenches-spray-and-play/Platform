import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/campaigns/[id]
 * Get detailed campaign data including waitlist participants and stats
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    try {
        // Get campaign with waitlist entries
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id },
            include: {
                waitlist: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                handle: true,
                                email: true,
                            }
                        }
                    },
                    orderBy: { joinedAt: 'asc' }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Resolve trench UUIDs from level names (campaign.trenchIds contains levels like "rapid", "mid", "deep")
        const trenchLevels = campaign.trenchIds.map(level => level.toUpperCase());
        const trenches = await prisma.trench.findMany({
            where: {
                level: { in: trenchLevels as ('RAPID' | 'MID' | 'DEEP')[] }
            },
            select: { id: true }
        });
        const trenchUuids = trenches.map(t => t.id);

        // Get participant count for this campaign's trenches using actual UUIDs
        const participantCount = await prisma.participant.count({
            where: {
                trenchId: { in: trenchUuids }
            }
        });

        // Get deposit stats for users in this campaign
        const depositsStats = await prisma.deposit.aggregate({
            where: { status: 'CONFIRMED' },
            _count: true,
            _sum: { amountUsd: true }
        });

        // Calculate waitlist stats
        const waitlistEntries = campaign.waitlist || [];
        const waitingNoDeposit = waitlistEntries.filter(w => !w.hasDeposited);
        const waitingWithDeposit = waitlistEntries.filter(w => w.hasDeposited);
        const totalWaitlistDeposits = waitingWithDeposit.reduce(
            (sum, w) => sum + Number(w.depositAmount || 0), 0
        );

        // Determine campaign phase
        let phase: 'WAITLIST' | 'ACCEPTING' | 'LIVE' | 'PAUSED' = 'LIVE';
        const now = new Date();
        const startsAt = campaign.startsAt ? new Date(campaign.startsAt) : null;

        if (campaign.isPaused) {
            phase = 'PAUSED';
        } else if (startsAt && startsAt > now) {
            phase = campaign.acceptDepositsBeforeStart ? 'ACCEPTING' : 'WAITLIST';
        }

        // Build response
        const response = {
            ...campaign,
            phase,
            stats: {
                totalParticipants: participantCount,
                totalDeposits: depositsStats._count || 0,
                totalDepositedUsd: Number(depositsStats._sum?.amountUsd || 0),
            },
            waitlistStats: {
                totalInWaitlist: waitlistEntries.length,
                waitingNoDeposit: waitingNoDeposit.length,
                waitingWithDeposit: waitingWithDeposit.length,
                totalDepositedInWaitlist: totalWaitlistDeposits,
            },
            waitlistUsers: {
                waiting: waitingNoDeposit.map(w => ({
                    id: w.id,
                    position: w.queueNumber || 0,
                    user: w.user,
                    joinedAt: w.joinedAt,
                })),
                deposited: waitingWithDeposit.map(w => ({
                    id: w.id,
                    position: w.queueNumber || 0,
                    user: w.user,
                    depositAmount: Number(w.depositAmount),
                    joinedAt: w.joinedAt,
                })),
            }
        };

        // Remove raw waitlist array
        delete (response as any).waitlist;

        return NextResponse.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error('Error fetching campaign details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch campaign details' },
            { status: 500 }
        );
    }
}
