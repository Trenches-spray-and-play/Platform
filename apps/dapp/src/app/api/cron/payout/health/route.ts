/**
 * Payout Health Check Endpoint
 * 
 * Returns system health status for monitoring.
 * No authentication required (public endpoint).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { payoutConfig, getPayoutConfigSummary } from '@/lib/payout-config';
import { ethers } from 'ethers';
import { getRpcUrl } from '@/lib/rpc';

// ERC20 ABI for balance check
const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

export async function GET() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get queue stats
        const [pending, executing, confirmedLastHour, failedLastHour] = await Promise.all([
            prisma.payout.count({ where: { status: 'PENDING' } }),
            prisma.payout.count({ where: { status: 'EXECUTING' } }),
            prisma.payout.count({
                where: {
                    status: 'CONFIRMED',
                    confirmedAt: { gte: oneHourAgo },
                },
            }),
            prisma.payout.count({
                where: {
                    status: 'FAILED',
                    executedAt: { gte: oneHourAgo },
                },
            }),
        ]);

        // Get last successful payout
        const lastPayout = await prisma.payout.findFirst({
            where: { status: 'CONFIRMED' },
            orderBy: { confirmedAt: 'desc' },
            select: { confirmedAt: true },
        });

        // Get campaign config for wallet balance check
        const campaign = await prisma.campaignConfig.findFirst({
            where: { isActive: true },
        });

        let hotWalletBalance: string | null = null;

        if (campaign && process.env.PAYOUT_PRIVATE_KEY) {
            try {
                const rpcUrl = getRpcUrl(campaign.chainId);
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const wallet = new ethers.Wallet(process.env.PAYOUT_PRIVATE_KEY, provider);
                const tokenContract = new ethers.Contract(campaign.tokenAddress, ERC20_ABI, provider);
                const balance = await tokenContract.balanceOf(wallet.address);
                hotWalletBalance = ethers.formatUnits(balance, campaign.tokenDecimals);
            } catch (err) {
                console.error('Failed to fetch hot wallet balance:', err);
            }
        }

        // Determine health status
        const queueSize = pending + executing;
        const isHealthy =
            queueSize < payoutConfig.queueBackupThreshold &&
            failedLastHour < 10;

        const status = isHealthy ? 'healthy' : 'degraded';

        return NextResponse.json({
            status,
            timestamp: now.toISOString(),
            queue: {
                pending,
                executing,
                total: queueSize,
            },
            lastHour: {
                processed: confirmedLastHour,
                failed: failedLastHour,
                successRate: confirmedLastHour > 0
                    ? ((confirmedLastHour / (confirmedLastHour + failedLastHour)) * 100).toFixed(1) + '%'
                    : 'N/A',
            },
            lastPayout: lastPayout?.confirmedAt?.toISOString() || null,
            hotWalletBalance: hotWalletBalance || 'unavailable',
            config: getPayoutConfigSummary(),
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
