/**
 * Deposit Monitor Service
 *
 * Monitors all derived deposit addresses for incoming transfers across all supported chains.
 * Credits users after chain-specific finality thresholds are met.
 */

import { createPublicClient, http, parseAbi, Address, PublicClient, formatEther, parseEther } from 'viem';
import {
    Connection,
    PublicKey,
    ParsedTransactionWithMeta,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import {
    Chain,
    getDepositAddressByAddress,
    getConfirmationThreshold,
    getSupportedChains
} from './deposit-address.service';

// ERC20 Transfer event ABI
const ERC20_ABI = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

// Token contract addresses per chain
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
    ethereum: {
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        ETH: 'native',
    },
    base: {
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        ETH: 'native',
    },
    arbitrum: {
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        ETH: 'native',
    },
    hyperevm: {
        BLT: config.bltContractAddress,
        USDT: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
        USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        ETH: 'native',
    },
};

// Solana SPL token mint addresses
const SOLANA_TOKEN_MINTS: Record<string, { mint: string; decimals: number }> = {
    USDC: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
    },
    USDT: {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
    },
};

// Minimum deposit thresholds (to avoid dust)
const MIN_DEPOSIT_THRESHOLDS: Record<string, number> = {
    ETH: 0.001,      // 0.001 ETH
    SOL: 0.01,       // 0.01 SOL
    USDC: 1,         // $1
    USDT: 1,         // $1
    BLT: 1,          // 1 BLT
};

// Chain state for EVM
interface EvmChainMonitorState {
    client: PublicClient;
    isMonitoring: boolean;
    lastProcessedBlock: bigint | null;
    pollInterval: NodeJS.Timeout | null;
}

// Chain state for Solana
interface SolanaMonitorState {
    connection: Connection;
    isMonitoring: boolean;
    lastSignature: string | null;
    pollInterval: NodeJS.Timeout | null;
    // Track last known balances for native SOL detection
    addressBalances: Map<string, bigint>;
}

const evmChainStates: Partial<Record<Exclude<Chain, 'solana'>, EvmChainMonitorState>> = {};
let solanaState: SolanaMonitorState | null = null;

// Legacy alias for compatibility
const chainStates = evmChainStates as Partial<Record<Chain, EvmChainMonitorState>>;

/**
 * Initialize blockchain client for a chain
 */
function initializeChainClient(chain: Chain): PublicClient | null {
    const rpcUrl = config.rpcUrls[chain];
    if (!rpcUrl) {
        console.warn(`RPC URL not configured for ${chain}`);
        return null;
    }

    try {
        const client = createPublicClient({
            transport: http(rpcUrl),
        }) as PublicClient;

        console.log(`Initialized blockchain client for ${chain}`);
        return client;
    } catch (error) {
        console.error(`Failed to initialize ${chain} client:`, error);
        return null;
    }
}

/**
 * Get all watched addresses for a chain
 */
async function getWatchedAddresses(chain: Chain): Promise<string[]> {
    const addresses = await prisma.depositAddress.findMany({
        where: { chain },
        select: { address: true },
    });
    return addresses.map(a => a.address);
}

/**
 * Process an incoming deposit transfer
 */
async function processIncomingDeposit(params: {
    chain: Chain;
    txHash: string;
    toAddress: string;
    asset: string;
    amount: bigint;
    blockNumber: bigint;
}): Promise<void> {
    const { chain, txHash, toAddress, asset, amount, blockNumber } = params;

    // Check if already processed
    const existing = await prisma.deposit.findUnique({
        where: { txHash },
    });
    if (existing) {
        console.log(`Deposit ${txHash} already recorded, skipping`);
        return;
    }

    // Find the deposit address
    const depositAddress = await getDepositAddressByAddress(toAddress);
    if (!depositAddress) {
        console.log(`Address ${toAddress} not a deposit address, skipping`);
        return;
    }

    // Get USD value (placeholder - would need oracle integration)
    const amountUsd = await getUsdValue(asset, amount, chain);

    // Create deposit record
    const deposit = await prisma.deposit.create({
        data: {
            depositAddressId: depositAddress.id,
            userId: depositAddress.userId,
            txHash,
            chain,
            asset,
            amount: amount.toString(),
            amountUsd,
            status: 'PENDING',
            blockNumber,
            confirmations: 0,
        },
    });

    console.log(`📥 New deposit detected: ${txHash} - ${asset} on ${chain} for user ${depositAddress.userId}`);

    // Start confirmation tracking
    await updateDepositConfirmations(deposit.id, chain);
}

/**
 * Get USD value for an asset using price oracle
 */
async function getUsdValue(asset: string, amount: bigint, chain: Chain): Promise<number> {
    // Dynamic import to avoid circular dependency at module load
    const { getUsdValue: oracleGetUsdValue } = await import('./price-oracle.service');

    try {
        // Map to Asset type (handles case sensitivity)
        const assetType = asset.toUpperCase() as 'ETH' | 'SOL' | 'BLT' | 'USDT' | 'USDC';
        return await oracleGetUsdValue(assetType, amount);
    } catch (error) {
        console.error(`Error getting USD value for ${asset}:`, error);

        // Fallback: stablecoins at face value, others at 0
        if (asset === 'USDT' || asset === 'USDC') {
            return Number(amount) / 1_000_000;
        }
        return 0;
    }
}

/**
 * Update confirmation count for a deposit
 */
async function updateDepositConfirmations(depositId: string, chain: Chain): Promise<void> {
    const deposit = await prisma.deposit.findUnique({
        where: { id: depositId },
    });

    if (!deposit || deposit.status !== 'PENDING') return;

    if (chain === 'solana') {
        // Handle Solana separately
        if (!solanaState?.connection) return;

        try {
            const status = await solanaState.connection.getSignatureStatus(deposit.txHash);
            const threshold = getConfirmationThreshold('solana');

            if (status.value?.confirmationStatus === 'finalized' ||
                (status.value?.confirmations && status.value.confirmations >= threshold)) {
                await prisma.deposit.update({
                    where: { id: depositId },
                    data: {
                        status: 'CONFIRMED',
                        confirmations: status.value?.confirmations || threshold,
                        confirmedAt: new Date(),
                    },
                });

                console.log(`✅ Solana deposit ${depositId} confirmed`);
                await creditUserEntry(deposit);
            } else if (status.value?.confirmations) {
                await prisma.deposit.update({
                    where: { id: depositId },
                    data: { confirmations: status.value.confirmations },
                });
            }
        } catch (error) {
            console.error(`Error updating Solana deposit ${depositId}:`, error);
        }
        return;
    }

    // EVM chains
    const state = evmChainStates[chain];
    if (!state?.client) return;

    const currentBlock = await state.client.getBlockNumber();
    const confirmations = Number(currentBlock - deposit.blockNumber);
    const threshold = getConfirmationThreshold(chain);

    if (confirmations >= threshold) {
        // Finality reached - credit user
        await prisma.deposit.update({
            where: { id: depositId },
            data: {
                status: 'CONFIRMED',
                confirmations,
                confirmedAt: new Date(),
            },
        });

        console.log(`✅ Deposit ${depositId} confirmed after ${confirmations} blocks`);
        await creditUserEntry(deposit);
    } else {
        // Update confirmation count
        await prisma.deposit.update({
            where: { id: depositId },
            data: { confirmations },
        });
    }
}

/**
 * Credit user entry after deposit confirmation
 *
 * Flow:
 * 1. Add deposit amount to user balance
 * 2. Optionally create a participant entry if auto-join is configured
 */
async function creditUserEntry(deposit: {
    userId: string;
    amountUsd: unknown;
    asset: string;
    chain: string;
}): Promise<void> {
    const amountUsd = Number(deposit.amountUsd);

    if (isNaN(amountUsd) || amountUsd <= 0) {
        console.error(`Invalid deposit amount for user ${deposit.userId}: ${deposit.amountUsd}`);
        return;
    }

    try {
        // Credit the user's balance
        const updatedUser = await prisma.user.update({
            where: { id: deposit.userId },
            data: {
                balance: {
                    increment: amountUsd,
                },
            },
        });

        console.log(`Credited user ${deposit.userId} with $${amountUsd}. New balance: $${updatedUser.balance}`);

        // Check if user is on a campaign waitlist and update their deposit status
        const waitlistEntries = await prisma.campaignWaitlist.findMany({
            where: {
                userId: deposit.userId,
                hasDeposited: false,
            },
        });

        for (const entry of waitlistEntries) {
            // Mark as deposited and update amount
            await prisma.campaignWaitlist.update({
                where: { id: entry.id },
                data: {
                    hasDeposited: true,
                    depositAmount: {
                        increment: amountUsd,
                    },
                },
            });

            console.log(`Updated waitlist entry ${entry.id} for campaign ${entry.campaignId}`);
        }

        // Note: User can use their balance to spray into trenches via the spray API
        // The actual queue entry is created when they call POST /api/spray

    } catch (error) {
        console.error(`Error crediting user ${deposit.userId}:`, error);
        throw error;
    }
}

/**
 * Scan for native ETH/token transfers by checking balance changes
 * This is more efficient than iterating all transactions
 */
async function scanNativeTransfers(
    chain: Exclude<Chain, 'solana'>,
    watchedAddresses: string[],
    currentBlock: bigint
): Promise<void> {
    const state = evmChainStates[chain];
    if (!state?.client) return;

    for (const address of watchedAddresses) {
        try {
            // Get current balance
            const balance = await state.client.getBalance({
                address: address as Address,
            });

            // Get deposit address info to check cached balance
            const depositAddress = await prisma.depositAddress.findUnique({
                where: { address },
                select: { id: true, userId: true, cachedBalance: true },
            });

            if (!depositAddress) continue;

            // Convert cached balance (Decimal) to BigInt
            const cachedBalanceStr = depositAddress.cachedBalance?.toString() || '0';
            const lastKnownBalance = BigInt(cachedBalanceStr.split('.')[0] || '0');

            // Check if balance increased
            if (balance > lastKnownBalance) {
                const depositAmount = balance - lastKnownBalance;

                // Check minimum threshold
                const minThreshold = parseEther(String(MIN_DEPOSIT_THRESHOLDS.ETH || 0.001));
                if (depositAmount < minThreshold) {
                    // Still update the known balance to track small amounts
                    await prisma.depositAddress.update({
                        where: { address },
                        data: {
                            cachedBalance: balance.toString(),
                            cachedBalanceAt: new Date(),
                        },
                    });
                    continue;
                }

                // Generate a pseudo tx hash for balance-based detection
                // In production, you'd want to find the actual tx hash via block scanning
                const pseudoTxHash = `native-${chain}-${address}-${currentBlock}-${Date.now()}`;

                // Check if we already have a recent deposit for this address
                const recentDeposit = await prisma.deposit.findFirst({
                    where: {
                        depositAddressId: depositAddress.id,
                        asset: 'ETH',
                        status: 'PENDING',
                        createdAt: { gte: new Date(Date.now() - 60000) }, // Within last minute
                    },
                });

                if (!recentDeposit) {
                    await processIncomingDeposit({
                        chain,
                        txHash: pseudoTxHash,
                        toAddress: address,
                        asset: 'ETH',
                        amount: depositAmount,
                        blockNumber: currentBlock,
                    });
                }

                // Update cached balance
                await prisma.depositAddress.update({
                    where: { address },
                    data: {
                        cachedBalance: balance.toString(),
                        cachedBalanceAt: new Date(),
                    },
                });
            }
        } catch (error) {
            console.error(`Error checking native balance for ${address} on ${chain}:`, error);
        }
    }
}

/**
 * Scan a chain for new deposits to watched addresses
 */
async function scanChainForDeposits(chain: Chain, fromBlock: bigint, toBlock: bigint): Promise<void> {
    if (chain === 'solana') {
        // Solana uses separate monitoring
        return;
    }

    const state = evmChainStates[chain];
    if (!state?.client) return;

    const watchedAddresses = await getWatchedAddresses(chain);
    if (watchedAddresses.length === 0) return;

    const tokens = TOKEN_ADDRESSES[chain] || {};

    // Scan for ERC20 transfers to our addresses
    for (const [asset, tokenAddress] of Object.entries(tokens)) {
        if (tokenAddress === 'native') continue; // Handle native separately
        if (!tokenAddress) continue;

        try {
            const logs = await state.client.getLogs({
                address: tokenAddress as Address,
                event: ERC20_ABI[0],
                fromBlock,
                toBlock,
            });

            for (const log of logs) {
                const toAddress = log.args.to?.toLowerCase();
                if (toAddress && watchedAddresses.includes(toAddress)) {
                    await processIncomingDeposit({
                        chain,
                        txHash: log.transactionHash,
                        toAddress,
                        asset,
                        amount: log.args.value || 0n,
                        blockNumber: log.blockNumber,
                    });
                }
            }
        } catch (error) {
            console.error(`Error scanning ${asset} on ${chain}:`, error);
        }
    }

    // Scan for native ETH transfers using balance checking
    await scanNativeTransfers(chain, watchedAddresses, toBlock);
}

/**
 * Initialize Solana connection
 */
function initializeSolanaConnection(): Connection | null {
    const rpcUrl = config.rpcUrls.solana;
    if (!rpcUrl) {
        console.warn('Solana RPC URL not configured');
        return null;
    }

    try {
        const connection = new Connection(rpcUrl, 'confirmed');
        console.log('Initialized Solana connection');
        return connection;
    } catch (error) {
        console.error('Failed to initialize Solana connection:', error);
        return null;
    }
}

/**
 * Process a Solana transaction for deposits
 */
async function processSolanaTransaction(
    connection: Connection,
    signature: string,
    watchedAddresses: Set<string>
): Promise<void> {
    try {
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta || tx.meta.err) return;

        const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);
        const slot = tx.slot;

        // Check for native SOL transfers in pre/post balances
        const preBalances = tx.meta.preBalances;
        const postBalances = tx.meta.postBalances;
        const accountKeys = tx.transaction.message.accountKeys;

        for (let i = 0; i < accountKeys.length; i++) {
            const pubkey = accountKeys[i].pubkey.toBase58();

            if (watchedAddresses.has(pubkey)) {
                const preBalance = BigInt(preBalances[i]);
                const postBalance = BigInt(postBalances[i]);

                // Check for SOL deposit (balance increase)
                if (postBalance > preBalance) {
                    const depositAmount = postBalance - preBalance;
                    const minThreshold = BigInt(MIN_DEPOSIT_THRESHOLDS.SOL * LAMPORTS_PER_SOL);

                    if (depositAmount >= minThreshold) {
                        await processIncomingDeposit({
                            chain: 'solana',
                            txHash: signature,
                            toAddress: pubkey,
                            asset: 'SOL',
                            amount: depositAmount,
                            blockNumber: BigInt(slot),
                        });
                    }
                }
            }
        }

        // Check for SPL token transfers
        const preTokenBalances = tx.meta.preTokenBalances || [];
        const postTokenBalances = tx.meta.postTokenBalances || [];

        // Build map of post-token balances by account index
        const postTokenMap = new Map<number, { mint: string; amount: string }>();
        for (const balance of postTokenBalances) {
            if (balance.uiTokenAmount) {
                postTokenMap.set(balance.accountIndex, {
                    mint: balance.mint,
                    amount: balance.uiTokenAmount.amount,
                });
            }
        }

        // Check for token deposits
        for (const preBalance of preTokenBalances) {
            const postBalance = postTokenMap.get(preBalance.accountIndex);
            if (!postBalance) continue;

            const ownerPubkey = preBalance.owner;
            if (!ownerPubkey || !watchedAddresses.has(ownerPubkey)) continue;

            const preAmount = BigInt(preBalance.uiTokenAmount?.amount || '0');
            const postAmount = BigInt(postBalance.amount);

            if (postAmount > preAmount) {
                const depositAmount = postAmount - preAmount;

                // Identify asset from mint
                let asset = 'UNKNOWN';
                for (const [tokenName, tokenInfo] of Object.entries(SOLANA_TOKEN_MINTS)) {
                    if (tokenInfo.mint === preBalance.mint) {
                        asset = tokenName;
                        break;
                    }
                }

                if (asset !== 'UNKNOWN') {
                    const minThreshold = BigInt(
                        (MIN_DEPOSIT_THRESHOLDS[asset] || 1) *
                        Math.pow(10, SOLANA_TOKEN_MINTS[asset]?.decimals || 6)
                    );

                    if (depositAmount >= minThreshold) {
                        await processIncomingDeposit({
                            chain: 'solana',
                            txHash: signature,
                            toAddress: ownerPubkey,
                            asset,
                            amount: depositAmount,
                            blockNumber: BigInt(slot),
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error processing Solana transaction ${signature}:`, error);
    }
}

/**
 * Scan Solana for deposits to watched addresses
 */
async function scanSolanaDeposits(): Promise<void> {
    if (!solanaState?.connection || !solanaState.isMonitoring) return;

    const watchedAddresses = await getWatchedAddresses('solana');
    if (watchedAddresses.length === 0) return;

    const watchedSet = new Set(watchedAddresses);
    const connection = solanaState.connection;

    // For each watched address, get recent transactions
    for (const address of watchedAddresses) {
        try {
            const pubkey = new PublicKey(address);

            // Get recent signatures (up to 10 most recent)
            const signatures = await connection.getSignaturesForAddress(pubkey, {
                limit: 10,
            });

            for (const sigInfo of signatures) {
                // Skip if already processed
                const existing = await prisma.deposit.findUnique({
                    where: { txHash: sigInfo.signature },
                });
                if (existing) continue;

                // Skip failed transactions
                if (sigInfo.err) continue;

                // Process the transaction
                await processSolanaTransaction(connection, sigInfo.signature, watchedSet);
            }
        } catch (error) {
            console.error(`Error scanning Solana address ${address}:`, error);
        }
    }
}

/**
 * Start Solana deposit monitoring
 */
export async function startSolanaMonitoring(): Promise<void> {
    if (solanaState?.isMonitoring) {
        console.log('Solana monitoring already started');
        return;
    }

    const connection = initializeSolanaConnection();
    if (!connection) return;

    solanaState = {
        connection,
        isMonitoring: true,
        lastSignature: null,
        pollInterval: null,
        addressBalances: new Map(),
    };

    console.log('Starting Solana deposit monitoring');

    // Poll for new transactions
    const pollInterval = setInterval(async () => {
        if (!solanaState?.isMonitoring) {
            clearInterval(pollInterval);
            return;
        }

        try {
            await scanSolanaDeposits();
            await updateSolanaPendingConfirmations();
        } catch (error) {
            console.error('Error in Solana monitoring poll:', error);
        }
    }, config.pollingInterval * 1000);

    solanaState.pollInterval = pollInterval;

    // Initial scan
    await scanSolanaDeposits();
}

/**
 * Stop Solana monitoring
 */
export function stopSolanaMonitoring(): void {
    if (!solanaState) return;

    solanaState.isMonitoring = false;
    if (solanaState.pollInterval) {
        clearInterval(solanaState.pollInterval);
        solanaState.pollInterval = null;
    }

    console.log('Solana deposit monitoring stopped');
}

/**
 * Update confirmations for pending Solana deposits
 */
async function updateSolanaPendingConfirmations(): Promise<void> {
    if (!solanaState?.connection) return;

    const pendingDeposits = await prisma.deposit.findMany({
        where: {
            chain: 'solana',
            status: 'PENDING',
        },
    });

    const connection = solanaState.connection;
    const threshold = getConfirmationThreshold('solana');

    for (const deposit of pendingDeposits) {
        try {
            const status = await connection.getSignatureStatus(deposit.txHash);

            if (status.value?.confirmationStatus === 'finalized') {
                // Transaction is finalized
                await prisma.deposit.update({
                    where: { id: deposit.id },
                    data: {
                        status: 'CONFIRMED',
                        confirmations: threshold,
                        confirmedAt: new Date(),
                    },
                });

                console.log(`✅ Solana deposit ${deposit.id} confirmed (finalized)`);
                await creditUserEntry(deposit);
            } else if (status.value?.confirmations) {
                // Update confirmation count
                const confirmations = status.value.confirmations;

                if (confirmations >= threshold) {
                    await prisma.deposit.update({
                        where: { id: deposit.id },
                        data: {
                            status: 'CONFIRMED',
                            confirmations,
                            confirmedAt: new Date(),
                        },
                    });

                    console.log(`✅ Solana deposit ${deposit.id} confirmed after ${confirmations} confirmations`);
                    await creditUserEntry(deposit);
                } else {
                    await prisma.deposit.update({
                        where: { id: deposit.id },
                        data: { confirmations },
                    });
                }
            }
        } catch (error) {
            console.error(`Error updating Solana deposit ${deposit.id}:`, error);
        }
    }
}

/**
 * Start monitoring a specific chain
 */
export async function startChainMonitoring(chain: Chain): Promise<void> {
    if (chain === 'solana') {
        await startSolanaMonitoring();
        return;
    }

    if (evmChainStates[chain]?.isMonitoring) {
        console.log(`${chain} monitoring already started`);
        return;
    }

    const client = initializeChainClient(chain);
    if (!client) return;

    const currentBlock = await client.getBlockNumber();

    evmChainStates[chain] = {
        client,
        isMonitoring: true,
        lastProcessedBlock: currentBlock,
        pollInterval: null,
    };

    console.log(`Starting ${chain} deposit monitoring from block ${currentBlock}`);

    // Poll for new blocks
    const pollInterval = setInterval(async () => {
        const state = evmChainStates[chain];
        if (!state?.isMonitoring) {
            clearInterval(pollInterval);
            return;
        }

        try {
            const latestBlock = await state.client.getBlockNumber();

            if (latestBlock > state.lastProcessedBlock!) {
                const fromBlock = state.lastProcessedBlock! + 1n;
                await scanChainForDeposits(chain, fromBlock, latestBlock);
                state.lastProcessedBlock = latestBlock;
            }

            // Also update pending confirmations
            await updateEvmPendingConfirmations(chain);
        } catch (error) {
            console.error(`Error polling ${chain}:`, error);
        }
    }, config.pollingInterval * 1000);

    evmChainStates[chain]!.pollInterval = pollInterval;
}

/**
 * Update confirmations for pending EVM deposits on a specific chain
 */
async function updateEvmPendingConfirmations(chain: Exclude<Chain, 'solana'>): Promise<void> {
    const state = evmChainStates[chain];
    if (!state?.client) return;

    const pendingDeposits = await prisma.deposit.findMany({
        where: {
            chain,
            status: 'PENDING',
        },
    });

    if (pendingDeposits.length === 0) return;

    const currentBlock = await state.client.getBlockNumber();
    const threshold = getConfirmationThreshold(chain);

    for (const deposit of pendingDeposits) {
        const confirmations = Number(currentBlock - deposit.blockNumber);

        if (confirmations >= threshold) {
            await prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    status: 'CONFIRMED',
                    confirmations,
                    confirmedAt: new Date(),
                },
            });

            console.log(`✅ Deposit ${deposit.id} confirmed after ${confirmations} blocks on ${chain}`);
            await creditUserEntry(deposit);
        } else {
            await prisma.deposit.update({
                where: { id: deposit.id },
                data: { confirmations },
            });
        }
    }
}

/**
 * Stop monitoring a specific chain
 */
export function stopChainMonitoring(chain: Chain): void {
    if (chain === 'solana') {
        stopSolanaMonitoring();
        return;
    }

    const state = evmChainStates[chain];
    if (!state) return;

    state.isMonitoring = false;
    if (state.pollInterval) {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
    }

    console.log(`${chain} deposit monitoring stopped`);
}

/**
 * Start monitoring all supported chains
 */
export async function startAllChainMonitoring(): Promise<void> {
    const evmChains: Exclude<Chain, 'solana'>[] = ['ethereum', 'base', 'arbitrum', 'hyperevm'];

    for (const chain of evmChains) {
        await startChainMonitoring(chain);
    }

    // Start Solana monitoring
    await startSolanaMonitoring();
}

/**
 * Stop monitoring all chains
 */
export function stopAllChainMonitoring(): void {
    // Stop EVM chains
    const evmChains: Exclude<Chain, 'solana'>[] = ['ethereum', 'base', 'arbitrum', 'hyperevm'];
    for (const chain of evmChains) {
        stopChainMonitoring(chain);
    }

    // Stop Solana
    stopSolanaMonitoring();
}

/**
 * Update confirmations for all pending deposits
 */
export async function updateAllPendingConfirmations(): Promise<void> {
    // Update EVM deposits
    const evmChains: Exclude<Chain, 'solana'>[] = ['ethereum', 'base', 'arbitrum', 'hyperevm'];
    for (const chain of evmChains) {
        await updateEvmPendingConfirmations(chain);
    }

    // Update Solana deposits
    await updateSolanaPendingConfirmations();
}

/**
 * Get deposit statistics
 */
export async function getDepositStats(): Promise<{
    pending: number;
    confirmed: number;
    swept: number;
    totalValueUsd: number;
}> {
    const [pending, confirmed, swept, totalValue] = await Promise.all([
        prisma.deposit.count({ where: { status: 'PENDING' } }),
        prisma.deposit.count({ where: { status: 'CONFIRMED' } }),
        prisma.deposit.count({ where: { status: 'SWEPT' } }),
        prisma.deposit.aggregate({
            where: { status: { in: ['CONFIRMED', 'SWEPT'] } },
            _sum: { amountUsd: true },
        }),
    ]);

    return {
        pending,
        confirmed,
        swept,
        totalValueUsd: Number(totalValue._sum.amountUsd || 0),
    };
}
