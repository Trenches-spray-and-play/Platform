import { prisma } from '@/lib/db';
import { ethers } from 'ethers';

/**
 * Balance Service
 * 
 * Handles on-chain balance polling and caching for admin dashboard:
 * - Fetch on-chain balances via RPC
 * - Cache balances with 24-hour expiry
 * - Aggregate platform totals by chain
 */

// Chain RPC endpoints
const RPC_ENDPOINTS: Record<string, string> = {
    'ETH': process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    'Base': process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    'Arbitrum': process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    'HyperEVM': process.env.HYPEREVM_RPC_URL || '',
    'Solana': '', // Handled separately
};

// 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Check if cached balance is still valid (within 24 hours)
 */
export function shouldRefreshBalance(cachedAt: Date | null): boolean {
    if (!cachedAt) return true;
    return Date.now() - cachedAt.getTime() > CACHE_DURATION_MS;
}

/**
 * Get native balance for an EVM address
 */
export async function getEvmBalance(address: string, chain: string): Promise<string | null> {
    const rpcUrl = RPC_ENDPOINTS[chain];
    if (!rpcUrl) {
        console.warn(`No RPC URL for chain: ${chain}`);
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (error) {
        console.error(`Error fetching balance for ${address} on ${chain}:`, error);
        return null;
    }
}

/**
 * Refresh cached balance for a specific deposit address
 */
export async function refreshCachedBalance(depositAddressId: string): Promise<{
    success: boolean;
    balance?: string;
    error?: string;
}> {
    try {
        const depositAddress = await prisma.depositAddress.findUnique({
            where: { id: depositAddressId },
        });

        if (!depositAddress) {
            return { success: false, error: 'Deposit address not found' };
        }

        // Skip Solana for now (would need different implementation)
        if (depositAddress.chain === 'Solana') {
            return { success: true, balance: '0' };
        }

        const balance = await getEvmBalance(depositAddress.address, depositAddress.chain);

        if (balance === null) {
            return { success: false, error: 'Failed to fetch balance' };
        }

        await prisma.depositAddress.update({
            where: { id: depositAddressId },
            data: {
                cachedBalance: balance,
                cachedBalanceAt: new Date(),
            },
        });

        return { success: true, balance };
    } catch (error) {
        console.error('Error refreshing cached balance:', error);
        return { success: false, error: 'Failed to refresh balance' };
    }
}

/**
 * Refresh all cached balances (or those that are stale)
 */
export async function refreshAllCachedBalances(forceRefresh = false): Promise<{
    refreshed: number;
    failed: number;
    skipped: number;
}> {
    const addresses = await prisma.depositAddress.findMany({
        select: {
            id: true,
            chain: true,
            cachedBalanceAt: true,
        },
    });

    let refreshed = 0;
    let failed = 0;
    let skipped = 0;

    for (const addr of addresses) {
        // Skip if cache is still valid unless force refresh
        if (!forceRefresh && !shouldRefreshBalance(addr.cachedBalanceAt)) {
            skipped++;
            continue;
        }

        // Skip Solana for now
        if (addr.chain === 'Solana') {
            skipped++;
            continue;
        }

        const result = await refreshCachedBalance(addr.id);
        if (result.success) {
            refreshed++;
        } else {
            failed++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { refreshed, failed, skipped };
}

/**
 * Get platform balance summary for admin dashboard
 */
export async function getPlatformBalanceSummary(): Promise<{
    byChain: Record<string, {
        totalDeposits: number;
        depositCount: number;
        sweptAmount: number;
        unsweptAmount: number;
        unsweptCount: number;
        cachedWalletBalance: number;
    }>;
    totals: {
        totalDepositsUsd: number;
        sweptUsd: number;
        unsweptUsd: number;
        pendingCount: number;
    };
}> {
    // Get all deposits grouped by chain and status
    const deposits = await prisma.deposit.groupBy({
        by: ['chain', 'status'],
        _sum: { amountUsd: true },
        _count: true,
    });

    // Get cached wallet balances
    const depositAddresses = await prisma.depositAddress.findMany({
        select: {
            chain: true,
            cachedBalance: true,
        },
    });

    // Build by-chain summary
    const byChain: Record<string, {
        totalDeposits: number;
        depositCount: number;
        sweptAmount: number;
        unsweptAmount: number;
        unsweptCount: number;
        cachedWalletBalance: number;
    }> = {};

    for (const d of deposits) {
        if (!byChain[d.chain]) {
            byChain[d.chain] = {
                totalDeposits: 0,
                depositCount: 0,
                sweptAmount: 0,
                unsweptAmount: 0,
                unsweptCount: 0,
                cachedWalletBalance: 0,
            };
        }

        const amount = Number(d._sum.amountUsd || 0);
        byChain[d.chain].totalDeposits += amount;
        byChain[d.chain].depositCount += d._count;

        if (d.status === 'SWEPT') {
            byChain[d.chain].sweptAmount += amount;
        } else if (d.status === 'CONFIRMED' || d.status === 'PENDING') {
            byChain[d.chain].unsweptAmount += amount;
            byChain[d.chain].unsweptCount += d._count;
        }
    }

    // Add cached wallet balances by chain
    for (const addr of depositAddresses) {
        if (byChain[addr.chain]) {
            byChain[addr.chain].cachedWalletBalance += Number(addr.cachedBalance || 0);
        }
    }

    // Calculate totals
    let totalDepositsUsd = 0;
    let sweptUsd = 0;
    let unsweptUsd = 0;
    let pendingCount = 0;

    for (const chain of Object.values(byChain)) {
        totalDepositsUsd += chain.totalDeposits;
        sweptUsd += chain.sweptAmount;
        unsweptUsd += chain.unsweptAmount;
        pendingCount += chain.unsweptCount;
    }

    return {
        byChain,
        totals: {
            totalDepositsUsd,
            sweptUsd,
            unsweptUsd,
            pendingCount,
        },
    };
}
