import { prisma } from '@/lib/db';
import { ethers } from 'ethers';
import { getRpcUrl, isSolana } from '@/lib/rpc';
import { executeSolanaPayout } from './solana-payout.service';

/**
 * Payout Service
 * 
 * Handles BLT token payouts to users:
 * - Get active campaign token config
 * - Create pending payouts
 * - Execute on-chain transfers
 * - Process payout queue
 */

// ERC20 ABI for transfer function
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
];

/**
 * Get the active campaign token configuration
 */
export async function getActiveCampaignToken() {
    const config = await prisma.campaignConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
    });

    // Return default BLT config if none exists
    if (!config) {
        return {
            id: null,
            name: 'Default Campaign',
            trenchIds: [],
            tokenAddress: process.env.BLT_CONTRACT_ADDRESS || '0xFEF20Fd2422a9d47Fe1a8C355A1AE83F04025EDF',
            tokenSymbol: 'BLT',
            tokenDecimals: 18,
            chainId: parseInt(process.env.HYPEREVM_CHAIN_ID || '999'),
            chainName: 'HyperEVM',
            acceptedTokens: '[]',
            roiMultiplier: 1.5,
            manualPrice: null,
            useOracle: false,
            oracleSource: null,
        };
    }

    return config;
}

/**
 * Get campaign configuration for a specific trench
 */
export async function getCampaignForTrench(trenchId: string) {
    // Find campaign that includes this trench
    const campaigns = await prisma.campaignConfig.findMany({
        where: { isActive: true },
    });

    // Find campaign where trenchIds array contains this trenchId
    const campaign = campaigns.find((c: { trenchIds: string[] }) => c.trenchIds.includes(trenchId));

    if (campaign) {
        return campaign;
    }

    // Fall back to default campaign if trench not assigned
    return getActiveCampaignToken();
}

/**
 * Get token price - uses manual price or oracle based on config
 */
export async function getTokenPrice(): Promise<number | null> {
    const config = await getActiveCampaignToken();

    if (!config.useOracle && config.manualPrice) {
        // Use manual price
        return Number(config.manualPrice);
    }

    if (config.useOracle && config.oracleSource) {
        // Try to fetch from oracle
        try {
            const price = await fetchOraclePrice(config.oracleSource, config.tokenSymbol);
            return price;
        } catch (error) {
            console.error('Oracle fetch failed, falling back to manual price:', error);
            // Fall back to manual price if oracle fails
            if (config.manualPrice) {
                return Number(config.manualPrice);
            }
        }
    }

    // No price available
    return null;
}

/**
 * Fetch price from oracle service
 */
async function fetchOraclePrice(source: string, symbol: string): Promise<number | null> {
    switch (source.toLowerCase()) {
        case 'coingecko':
            return fetchCoingeckoPrice(symbol);
        case 'manual':
            return null; // Use manual price
        default:
            console.log(`Oracle source ${source} not supported`);
            return null;
    }
}

/**
 * Fetch price from Coingecko API
 */
async function fetchCoingeckoPrice(symbol: string): Promise<number | null> {
    try {
        // Map common symbols to Coingecko IDs
        const symbolToId: Record<string, string> = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'USDC': 'usd-coin',
            'USDT': 'tether',
        };

        const coinId = symbolToId[symbol.toUpperCase()] || symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;

        const response = await fetch(url);
        const data = await response.json();

        return data[coinId]?.usd || null;
    } catch (error) {
        console.error('Coingecko API error:', error);
        return null;
    }
}


/**
 * Create a pending payout record
 */
export async function createPayout(params: {
    participantId: string;
    userId: string;
    trenchId: string;
    amount: number; // In token units (not wei)
    amountUsd: number;
    toAddress: string;
}) {
    const { participantId, userId, trenchId, amount, amountUsd, toAddress } = params;

    const campaignToken = await getActiveCampaignToken();

    const payout = await prisma.payout.create({
        data: {
            participantId,
            userId,
            trenchId,
            amount: amount,
            amountUsd: amountUsd,
            toAddress,
            tokenAddress: campaignToken.tokenAddress,
            tokenSymbol: campaignToken.tokenSymbol,
            chainId: campaignToken.chainId,
            status: 'PENDING',
        },
    });

    console.log(`Created payout ${payout.id} for ${amount} ${campaignToken.tokenSymbol} to ${toAddress}`);
    return payout;
}

/**
 * Get pending payouts ready for execution
 */
export async function getPendingPayouts(limit: number = 10) {
    return prisma.payout.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });
}

/**
 * Execute a single payout on-chain
 * Requires PAYOUT_PRIVATE_KEY environment variable
 */
export async function executePayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
    });

    if (!payout) {
        throw new Error(`Payout ${payoutId} not found`);
    }

    if (payout.status !== 'PENDING') {
        throw new Error(`Payout ${payoutId} is not pending (status: ${payout.status})`);
    }

    // Route to Solana service if chainId = 0
    if (isSolana(payout.chainId)) {
        return executeSolanaPayout({
            id: payout.id,
            tokenAddress: payout.tokenAddress,
            toAddress: payout.toAddress,
            amount: Number(payout.amount), // Convert Decimal to number
        });
    }

    // EVM chain payout
    const privateKey = process.env.PAYOUT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PAYOUT_PRIVATE_KEY not configured');
    }

    // Use dynamic RPC based on payout's chainId
    let rpcUrl: string;
    try {
        rpcUrl = getRpcUrl(payout.chainId);
    } catch {
        // Fallback to legacy env var for backwards compatibility
        rpcUrl = process.env.HYPEREVM_RPC_URL || '';
        if (!rpcUrl) {
            throw new Error(`No RPC configured for chainId ${payout.chainId}`);
        }
    }

    // Mark as executing
    await prisma.payout.update({
        where: { id: payoutId },
        data: {
            status: 'EXECUTING',
            executedAt: new Date(),
        },
    });

    try {
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Setup token contract
        const tokenContract = new ethers.Contract(
            payout.tokenAddress,
            ERC20_ABI,
            wallet
        );

        // Get token decimals
        const decimals = await tokenContract.decimals();

        // Convert amount to wei
        const amountWei = ethers.parseUnits(payout.amount.toString(), decimals);

        // Check balance before transfer
        const balance = await tokenContract.balanceOf(wallet.address);
        if (balance < amountWei) {
            console.error(`Insufficient funds for payout ${payoutId}: need ${payout.amount}, have ${ethers.formatUnits(balance, decimals)}`);

            // Mark as failed with reason
            await prisma.payout.update({
                where: { id: payoutId },
                data: { status: 'FAILED' },
            });

            // Send alert email (import at top of file)
            try {
                const { sendInsufficientFundsAlert } = await import('./alert.service');
                const campaign = await prisma.campaignConfig.findFirst({
                    where: { trenchIds: { has: payout.trenchId } }
                });
                await sendInsufficientFundsAlert({
                    campaignName: campaign?.name || 'Unknown',
                    tokenSymbol: payout.tokenSymbol,
                    amountRequired: Number(payout.amount),
                    vaultBalance: Number(ethers.formatUnits(balance, decimals)),
                    payoutId: payout.id,
                    recipientAddress: payout.toAddress,
                });
            } catch (alertError) {
                console.error('Failed to send alert:', alertError);
            }

            throw new Error(`Insufficient funds: need ${payout.amount} ${payout.tokenSymbol}, have ${ethers.formatUnits(balance, decimals)}`);
        }

        console.log(`Executing payout: ${payout.amount} ${payout.tokenSymbol} to ${payout.toAddress}`);

        // Execute transfer
        const tx = await tokenContract.transfer(payout.toAddress, amountWei);

        console.log(`Transaction sent: ${tx.hash}`);

        // Update payout with tx hash
        await prisma.payout.update({
            where: { id: payoutId },
            data: { txHash: tx.hash },
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            // Success
            await prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                },
            });

            console.log(`Payout ${payoutId} confirmed!`);
            return { success: true, txHash: tx.hash };
        } else {
            // Failed
            await prisma.payout.update({
                where: { id: payoutId },
                data: { status: 'FAILED' },
            });

            throw new Error('Transaction failed');
        }
    } catch (error) {
        console.error(`Payout ${payoutId} failed:`, error);

        await prisma.payout.update({
            where: { id: payoutId },
            data: { status: 'FAILED' },
        });
        throw error;
    }
}

/**
 * Process time-based payouts - Protocol-V1
 * Creates payouts for participants whose expectedPayoutAt has passed
 */
export async function processTimeBasedPayouts(limit: number = 10): Promise<{
    created: number;
    errors: string[];
}> {
    const now = new Date();
    const errors: string[] = [];

    // Find participants ready for payout
    const readyParticipants = await prisma.participant.findMany({
        where: {
            status: 'active',
            expectedPayoutAt: { lte: now },
            payoutTxHash: null, // Not yet paid
        },
        include: {
            user: true,
            trench: true,
        },
        orderBy: { expectedPayoutAt: 'asc' },
        take: limit,
    });

    if (readyParticipants.length === 0) {
        return { created: 0, errors: [] };
    }

    console.log(`Found ${readyParticipants.length} participants ready for time-based payout`);

    let created = 0;

    for (const participant of readyParticipants) {
        try {
            // Check if payout already exists for this participant
            const existingPayout = await prisma.payout.findFirst({
                where: { participantId: participant.id },
            });

            if (existingPayout) {
                console.log(`Payout already exists for participant ${participant.id}`);
                continue;
            }

            // Determine wallet address (prefer EVM, fallback to SOL)
            const toAddress = participant.user.walletEvm || participant.user.walletSol;
            if (!toAddress) {
                errors.push(`Participant ${participant.id}: No wallet address configured`);
                continue;
            }

            // Get token price for USD conversion
            const price = await getTokenPrice();
            if (!price) {
                errors.push(`Participant ${participant.id}: Unable to get token price`);
                continue;
            }

            // Calculate token amount from USD payout
            const amountUsd = participant.maxPayout;
            const amount = amountUsd / price;

            // Create the payout
            const payout = await createPayout({
                participantId: participant.id,
                userId: participant.userId,
                trenchId: participant.trenchId,
                amount,
                amountUsd,
                toAddress,
            });

            // Update participant status to processing
            await prisma.participant.update({
                where: { id: participant.id },
                data: { status: 'processing' },
            });

            console.log(`Created payout ${payout.id} for participant ${participant.id}`);
            created++;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Participant ${participant.id}: ${errorMsg}`);
            console.error(`Failed to create payout for participant ${participant.id}:`, error);
        }
    }

    return { created, errors };
}

/**
 * Process the payout queue - execute all pending payouts
 * Respects campaign pause state and configurable interval
 * 
 * Protocol-V1: Now also triggers time-based payout creation first
 */
export async function processPayoutQueue(limit: number = 10): Promise<{
    paused?: boolean;
    results?: Array<{ payoutId: string; success: boolean; txHash?: string; error?: string }>;
    intervalSeconds?: number;
    timeBasedCreated?: number;
}> {
    // Get active campaign to check pause state
    const campaign = await getActiveCampaignToken();

    // Check if campaign is paused
    if (campaign && 'isPaused' in campaign && campaign.isPaused) {
        console.log('Payout processing paused by admin');
        return { paused: true, results: [] };
    }

    // Get configured interval (default 5 seconds)
    const intervalSeconds = (campaign && 'payoutIntervalSeconds' in campaign)
        ? (campaign.payoutIntervalSeconds as number) || 5
        : 5;

    // Protocol-V1: First, create payouts for participants with expired timers
    const timeBasedResult = await processTimeBasedPayouts(limit);

    const pendingPayouts = await getPendingPayouts(limit);

    const results = [];
    for (let i = 0; i < pendingPayouts.length; i++) {
        const payout = pendingPayouts[i];
        try {
            const result = await executePayout(payout.id);
            results.push({ payoutId: payout.id, ...result });

            // Update participant with tx hash
            if (result.txHash) {
                await prisma.participant.updateMany({
                    where: { id: payout.participantId },
                    data: {
                        status: 'paid',
                        payoutTxHash: result.txHash,
                    },
                });
            }
        } catch (error) {
            results.push({
                payoutId: payout.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Wait between payouts if not the last one
        if (i < pendingPayouts.length - 1 && intervalSeconds > 0) {
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
        }
    }

    return {
        results,
        intervalSeconds,
        timeBasedCreated: timeBasedResult.created,
    };
}

/**
 * Get payout history for a user
 */
export async function getUserPayouts(userId: string) {
    return prisma.payout.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get payout statistics
 */
export async function getPayoutStats() {
    const [pending, executing, confirmed, failed] = await Promise.all([
        prisma.payout.count({ where: { status: 'PENDING' } }),
        prisma.payout.count({ where: { status: 'EXECUTING' } }),
        prisma.payout.count({ where: { status: 'CONFIRMED' } }),
        prisma.payout.count({ where: { status: 'FAILED' } }),
    ]);

    const totalPaid = await prisma.payout.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amountUsd: true },
    });

    return {
        pending,
        executing,
        confirmed,
        failed,
        totalPaidUsd: totalPaid._sum.amountUsd || 0,
    };
}

/**
 * Update campaign token configuration
 */
export async function updateCampaignToken(params: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals?: number;
    chainId: number;
    chainName?: string;
    manualPrice?: number | null;
    useOracle?: boolean;
    oracleSource?: string | null;
}) {
    const {
        tokenAddress,
        tokenSymbol,
        tokenDecimals = 18,
        chainId,
        chainName = 'HyperEVM',
        manualPrice = null,
        useOracle = false,
        oracleSource = null,
    } = params;

    // Deactivate current active config
    await prisma.campaignConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
    });

    // Create new active config
    const config = await prisma.campaignConfig.create({
        data: {
            tokenAddress,
            tokenSymbol,
            tokenDecimals,
            chainId,
            chainName,
            manualPrice,
            useOracle,
            oracleSource,
            isActive: true,
        },
    });

    console.log(`Campaign token updated to ${tokenSymbol} (${tokenAddress}), price: ${useOracle ? 'Oracle' : manualPrice}`);
    return config;
}

/**
 * Freeze and migrate pending payouts to a new token/chain configuration
 * Called when admin changes settlement token during a game
 */
export async function freezeAndMigratePayouts(newTokenConfig: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals?: number;
    chainId: number;
}) {
    // Find all PENDING payouts
    const pendingPayouts = await prisma.payout.findMany({
        where: { status: 'PENDING' },
    });

    if (pendingPayouts.length === 0) {
        console.log('No pending payouts to migrate');
        return 0;
    }

    console.log(`Freezing and migrating ${pendingPayouts.length} pending payouts to ${newTokenConfig.tokenSymbol} on chain ${newTokenConfig.chainId}`);

    // Update each payout to the new token config
    const result = await prisma.payout.updateMany({
        where: { status: 'PENDING' },
        data: {
            tokenAddress: newTokenConfig.tokenAddress,
            tokenSymbol: newTokenConfig.tokenSymbol,
            chainId: newTokenConfig.chainId,
        },
    });

    console.log(`Migrated ${result.count} pending payouts to ${newTokenConfig.tokenSymbol}`);
    return result.count;
}
