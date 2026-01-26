/**
 * Queue Stats API
 *
 * Returns pending payout statistics for a specific campaign.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;

        // Get campaign to verify it exists
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id },
        });

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Get pending payouts for this campaign's trenches
        const pendingPayouts = await prisma.payout.findMany({
            where: {
                status: 'PENDING',
                trenchId: { in: campaign.trenchIds },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Calculate stats
        const pendingCount = pendingPayouts.length;
        const pendingAmountTotal = pendingPayouts.reduce(
            (sum, p) => sum + Number(p.amount),
            0
        );
        const pendingAmountUsd = pendingPayouts.reduce(
            (sum, p) => sum + Number(p.amountUsd),
            0
        );

        const oldestPending = pendingPayouts[0];
        const oldestPendingAt = oldestPending?.createdAt?.toISOString() || null;

        // Get last confirmed payout
        const lastConfirmed = await prisma.payout.findFirst({
            where: {
                status: 'CONFIRMED',
                trenchId: { in: campaign.trenchIds },
            },
            orderBy: { confirmedAt: 'desc' },
        });
        const lastPayoutAt = lastConfirmed?.confirmedAt?.toISOString() || null;

        // Get failed payouts count (for alert awareness)
        const failedCount = await prisma.payout.count({
            where: {
                status: 'FAILED',
                trenchId: { in: campaign.trenchIds },
            },
        });

        // Get the last failure reason if any recent failures
        const lastFailed = await prisma.payout.findFirst({
            where: {
                status: 'FAILED',
                trenchId: { in: campaign.trenchIds },
            },
            orderBy: { executedAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: {
                pendingCount,
                pendingAmountTotal,
                pendingAmountUsd,
                oldestPendingAt,
                lastPayoutAt,
                failedCount,
                lastFailedAt: lastFailed?.executedAt?.toISOString() || null,
                isPaused: campaign.isPaused,
                tokenSymbol: campaign.tokenSymbol,
            },
        });
    } catch (error) {
        console.error('Error fetching queue stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch queue stats' },
            { status: 500 }
        );
    }
}
