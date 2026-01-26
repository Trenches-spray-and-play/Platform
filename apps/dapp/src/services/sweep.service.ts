/**
 * Sweep Service
 *
 * Periodically consolidates deposits from derived addresses into vault addresses.
 * Executes actual blockchain transactions to transfer funds.
 */

import {
    createWalletClient,
    createPublicClient,
    http,
    parseAbi,
    Address,
    formatEther,
    parseEther,
    encodeFunctionData,
    Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, base, arbitrum } from 'viem/chains';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import {
    Chain,
    getSupportedChains,
    deriveEvmPrivateKey,
    getDerivationIndex,
} from './deposit-address.service';
import { Decimal } from '@prisma/client/runtime/library';

// Minimum sweep thresholds per chain (in USD)
const MIN_SWEEP_USD: Record<Chain, number> = {
    ethereum: 50,   // Higher due to gas costs
    base: 10,
    arbitrum: 10,
    hyperevm: 5,
    solana: 5,
};

// Maximum addresses per sweep batch
const MAX_BATCH_SIZE = 50;

// Gas buffer multiplier (1.2 = 20% buffer)
const GAS_BUFFER_MULTIPLIER = 1.2;

// ERC20 ABI for transfers
const ERC20_ABI = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
]);

// Chain configurations for viem
const CHAIN_CONFIGS = {
    ethereum: mainnet,
    base: base,
    arbitrum: arbitrum,
    hyperevm: {
        id: 999,
        name: 'HyperEVM',
        network: 'hyperevm',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: [config.rpcUrls.hyperevm] },
            public: { http: [config.rpcUrls.hyperevm] },
        },
    },
} as const;

// Token addresses per chain (native = ETH/native token)
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
    ethereum: {
        ETH: 'native',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    base: {
        ETH: 'native',
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    arbitrum: {
        ETH: 'native',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
    hyperevm: {
        ETH: 'native',
        BLT: config.bltContractAddress,
    },
};

/**
 * Get confirmed deposits ready to sweep for a chain
 */
async function getPendingSweepDeposits(chain: Chain): Promise<Array<{
    id: string;
    depositAddressId: string;
    amount: Decimal;
    amountUsd: Decimal;
    asset: string;
    depositAddress: { address: string; derivationIndex: number };
}>> {
    return await prisma.deposit.findMany({
        where: {
            chain,
            status: 'CONFIRMED',
            sweepBatchId: null,
        },
        include: {
            depositAddress: {
                select: { address: true, derivationIndex: true },
            },
        },
        orderBy: { confirmedAt: 'asc' },
        take: MAX_BATCH_SIZE,
    });
}

/**
 * Get vault address for a chain
 */
async function getVaultAddress(chain: Chain): Promise<string | null> {
    // First check database
    const vaultRecord = await prisma.vaultAddress.findUnique({
        where: { chain },
    });

    if (vaultRecord) {
        return vaultRecord.address;
    }

    // Fall back to config
    return config.vaultAddresses[chain] || null;
}

/**
 * Create a sweep batch record
 */
async function createSweepBatch(chain: Chain, depositIds: string[], totalAmount: bigint): Promise<string> {
    const batch = await prisma.sweepBatch.create({
        data: {
            chain,
            status: 'PENDING',
            depositCount: depositIds.length,
            totalAmount: totalAmount.toString(),
        },
    });

    // Link deposits to batch
    await prisma.deposit.updateMany({
        where: { id: { in: depositIds } },
        data: { sweepBatchId: batch.id },
    });

    return batch.id;
}

/**
 * Get public client for a chain
 */
function getPublicClient(chain: Exclude<Chain, 'solana'>) {
    const chainConfig = CHAIN_CONFIGS[chain];
    const rpcUrl = config.rpcUrls[chain];

    return createPublicClient({
        chain: chainConfig as any,
        transport: http(rpcUrl),
    });
}

/**
 * Get wallet client for a derived address
 */
function getWalletClient(chain: Exclude<Chain, 'solana'>, derivationIndex: number) {
    const chainConfig = CHAIN_CONFIGS[chain];
    const rpcUrl = config.rpcUrls[chain];

    // Derive the private key for this deposit address
    const privateKey = deriveEvmPrivateKey(derivationIndex) as `0x${string}`;
    const account = privateKeyToAccount(privateKey);

    return createWalletClient({
        account,
        chain: chainConfig as any,
        transport: http(rpcUrl),
    });
}

/**
 * Execute a single sweep transaction (native token)
 */
async function sweepNativeToken(
    chain: Exclude<Chain, 'solana'>,
    fromAddress: string,
    derivationIndex: number,
    toAddress: string,
    amount: bigint
): Promise<{ success: boolean; txHash?: string; error?: string; gasCost?: bigint }> {
    try {
        const publicClient = getPublicClient(chain);
        const walletClient = getWalletClient(chain, derivationIndex);

        // Estimate gas for the transfer
        const gasEstimate = await publicClient.estimateGas({
            account: walletClient.account,
            to: toAddress as Address,
            value: amount,
        });

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();

        // Calculate total gas cost with buffer
        const gasCost = BigInt(Math.ceil(Number(gasEstimate * gasPrice) * GAS_BUFFER_MULTIPLIER));

        // Check if we have enough to cover gas
        if (amount <= gasCost) {
            return {
                success: false,
                error: `Amount ${formatEther(amount)} ETH is less than gas cost ${formatEther(gasCost)} ETH`,
            };
        }

        // Calculate amount after gas
        const amountAfterGas = amount - gasCost;

        // Execute transfer
        const txHash = await walletClient.sendTransaction({
            to: toAddress as Address,
            value: amountAfterGas,
            gas: gasEstimate,
            chain: walletClient.chain,
            account: walletClient.account!,
        });

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations: 1,
        });

        if (receipt.status === 'success') {
            return { success: true, txHash, gasCost };
        } else {
            return { success: false, txHash, error: 'Transaction reverted' };
        }
    } catch (error: any) {
        console.error(`Native sweep error from ${fromAddress}:`, error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Execute a single sweep transaction (ERC20 token)
 */
async function sweepErc20Token(
    chain: Exclude<Chain, 'solana'>,
    fromAddress: string,
    derivationIndex: number,
    toAddress: string,
    tokenAddress: string,
    amount: bigint
): Promise<{ success: boolean; txHash?: string; error?: string; gasCost?: bigint }> {
    try {
        const publicClient = getPublicClient(chain);
        const walletClient = getWalletClient(chain, derivationIndex);

        // Encode transfer function call
        const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [toAddress as Address, amount],
        });

        // Estimate gas for the transfer
        const gasEstimate = await publicClient.estimateGas({
            account: walletClient.account,
            to: tokenAddress as Address,
            data,
        });

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();
        const gasCost = BigInt(Math.ceil(Number(gasEstimate * gasPrice) * GAS_BUFFER_MULTIPLIER));

        // Check if account has enough ETH for gas
        const balance = await publicClient.getBalance({
            address: fromAddress as Address,
        });

        if (balance < gasCost) {
            return {
                success: false,
                error: `Insufficient ETH for gas. Need ${formatEther(gasCost)}, have ${formatEther(balance)}`,
            };
        }

        // Execute transfer
        const txHash = await walletClient.sendTransaction({
            to: tokenAddress as Address,
            data,
            gas: gasEstimate,
            chain: walletClient.chain,
            account: walletClient.account!,
        });

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations: 1,
        });

        if (receipt.status === 'success') {
            return { success: true, txHash, gasCost };
        } else {
            return { success: false, txHash, error: 'Transaction reverted' };
        }
    } catch (error: any) {
        console.error(`ERC20 sweep error from ${fromAddress}:`, error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Execute sweep for EVM chains
 */
async function executeEvmSweep(
    chain: Exclude<Chain, 'solana'>,
    batchId: string,
    deposits: Array<{
        id: string;
        address: string;
        derivationIndex: number;
        amount: bigint;
        asset: string;
    }>
): Promise<{ success: boolean; txHashes: string[]; errors: string[]; totalGasCost: bigint }> {
    const vaultAddress = await getVaultAddress(chain);
    if (!vaultAddress) {
        console.error(`No vault address configured for ${chain}`);
        return { success: false, txHashes: [], errors: ['No vault address configured'], totalGasCost: 0n };
    }

    // Update batch status to executing
    await prisma.sweepBatch.update({
        where: { id: batchId },
        data: { status: 'EXECUTING' },
    });

    const txHashes: string[] = [];
    const errors: string[] = [];
    let totalGasCost = 0n;
    let successCount = 0;

    const tokenAddresses = TOKEN_ADDRESSES[chain] || {};

    for (const deposit of deposits) {
        const tokenAddress = tokenAddresses[deposit.asset];

        let result: { success: boolean; txHash?: string; error?: string; gasCost?: bigint };

        if (tokenAddress === 'native' || !tokenAddress) {
            // Native token transfer
            result = await sweepNativeToken(
                chain,
                deposit.address,
                deposit.derivationIndex,
                vaultAddress,
                deposit.amount
            );
        } else {
            // ERC20 token transfer
            result = await sweepErc20Token(
                chain,
                deposit.address,
                deposit.derivationIndex,
                vaultAddress,
                tokenAddress,
                deposit.amount
            );
        }

        if (result.success && result.txHash) {
            txHashes.push(result.txHash);
            successCount++;

            // Update individual deposit
            await prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    status: 'SWEPT',
                    sweepTxHash: result.txHash,
                    sweptAt: new Date(),
                },
            });

            console.log(`✅ Swept ${deposit.asset} from ${deposit.address.slice(0, 10)}...: ${result.txHash}`);
        } else {
            errors.push(`${deposit.address}: ${result.error}`);
            console.error(`❌ Failed to sweep from ${deposit.address}: ${result.error}`);
        }

        if (result.gasCost) {
            totalGasCost += result.gasCost;
        }

        // Small delay between transactions to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update batch status
    const batchSuccess = successCount === deposits.length;
    await prisma.sweepBatch.update({
        where: { id: batchId },
        data: {
            status: batchSuccess ? 'COMPLETED' : (successCount > 0 ? 'COMPLETED' : 'FAILED'),
            txHash: txHashes[0] || null, // Store first tx hash as reference
            gasCost: totalGasCost.toString(),
            executedAt: new Date(),
        },
    });

    return {
        success: successCount > 0,
        txHashes,
        errors,
        totalGasCost,
    };
}

/**
 * Sweep all confirmed deposits for a chain
 */
export async function sweepChain(chain: Chain): Promise<{
    success: boolean;
    batchId?: string;
    txHashes?: string[];
    depositCount: number;
    error?: string;
}> {
    if (chain === 'solana') {
        // Use dedicated Solana sweep service
        const { sweepSolana } = await import('./solana-sweep.service');
        return await sweepSolana();
    }

    const deposits = await getPendingSweepDeposits(chain);

    if (deposits.length === 0) {
        console.log(`No deposits to sweep on ${chain}`);
        return { success: true, depositCount: 0 };
    }

    // Calculate total USD value
    const totalUsd = deposits.reduce(
        (sum, d) => sum + Number(d.amountUsd),
        0
    );

    // Check minimum threshold
    const minThreshold = MIN_SWEEP_USD[chain];
    if (totalUsd < minThreshold) {
        console.log(`Total $${totalUsd.toFixed(2)} below minimum $${minThreshold} for ${chain}, skipping`);
        return { success: true, depositCount: 0 };
    }

    // Calculate total amount
    const totalAmount = deposits.reduce(
        (sum, d) => sum + BigInt(d.amount.toString()),
        0n
    );

    // Create batch
    const batchId = await createSweepBatch(
        chain,
        deposits.map(d => d.id),
        totalAmount
    );

    // Prepare sweep data
    const sweepData = deposits.map(d => ({
        id: d.id,
        address: d.depositAddress.address,
        derivationIndex: d.depositAddress.derivationIndex,
        amount: BigInt(d.amount.toString()),
        asset: d.asset,
    }));

    console.log(`Starting sweep of ${deposits.length} deposits on ${chain} (total: $${totalUsd.toFixed(2)})`);

    // Execute sweep
    const result = await executeEvmSweep(chain, batchId, sweepData);

    if (result.success) {
        console.log(`✅ Swept ${result.txHashes.length}/${deposits.length} deposits on ${chain}`);
        return {
            success: true,
            batchId,
            txHashes: result.txHashes,
            depositCount: result.txHashes.length,
        };
    } else {
        console.error(`❌ Sweep failed for ${chain}: ${result.errors.join(', ')}`);
        return {
            success: false,
            batchId,
            depositCount: deposits.length,
            error: result.errors.join('; '),
        };
    }
}

/**
 * Sweep all chains
 */
export async function sweepAllChains(): Promise<Record<Chain, {
    success: boolean;
    depositCount: number;
}>> {
    const results: Record<Chain, { success: boolean; depositCount: number }> = {} as any;

    const evmChains: Chain[] = ['ethereum', 'base', 'arbitrum', 'hyperevm'];

    for (const chain of evmChains) {
        try {
            results[chain] = await sweepChain(chain);
        } catch (error) {
            console.error(`Error sweeping ${chain}:`, error);
            results[chain] = { success: false, depositCount: 0 };
        }
    }

    // Sweep Solana
    try {
        results.solana = await sweepChain('solana');
    } catch (error) {
        console.error('Error sweeping Solana:', error);
        results.solana = { success: false, depositCount: 0 };
    }

    return results;
}

/**
 * Schedule periodic sweeps
 */
let sweepInterval: NodeJS.Timeout | null = null;

export function startScheduledSweeps(): void {
    if (sweepInterval) {
        console.log('Scheduled sweeps already running');
        return;
    }

    const intervalMs = config.sweepIntervalHours * 60 * 60 * 1000;

    console.log(`Starting scheduled sweeps every ${config.sweepIntervalHours} hours`);

    // Run immediately on start
    sweepAllChains().catch(err => console.error('Initial sweep failed:', err));

    sweepInterval = setInterval(async () => {
        console.log('Running scheduled sweep...');
        try {
            const results = await sweepAllChains();

            let totalSwept = 0;
            for (const [chain, result] of Object.entries(results)) {
                if (result.depositCount > 0) {
                    console.log(`  ${chain}: ${result.depositCount} deposits`);
                    totalSwept += result.depositCount;
                }
            }

            console.log(`Scheduled sweep complete: ${totalSwept} total deposits swept`);
        } catch (error) {
            console.error('Scheduled sweep failed:', error);
        }
    }, intervalMs);
}

export function stopScheduledSweeps(): void {
    if (sweepInterval) {
        clearInterval(sweepInterval);
        sweepInterval = null;
        console.log('Scheduled sweeps stopped');
    }
}

/**
 * Retry failed sweep batches
 */
export async function retryFailedSweeps(): Promise<number> {
    const failedBatches = await prisma.sweepBatch.findMany({
        where: { status: 'FAILED' },
    });

    let retried = 0;

    for (const batch of failedBatches) {
        // Reset deposits in failed batch to be picked up again
        await prisma.deposit.updateMany({
            where: { sweepBatchId: batch.id },
            data: { sweepBatchId: null },
        });

        // Delete the failed batch
        await prisma.sweepBatch.delete({
            where: { id: batch.id },
        });

        retried++;
    }

    console.log(`Reset ${retried} failed batches for retry`);
    return retried;
}

/**
 * Get sweep statistics
 */
export async function getSweepStats(): Promise<{
    pendingCount: number;
    completedCount: number;
    failedCount: number;
    totalSweptValue: number;
}> {
    const [pending, completed, failed, totalValue] = await Promise.all([
        prisma.sweepBatch.count({ where: { status: 'PENDING' } }),
        prisma.sweepBatch.count({ where: { status: 'COMPLETED' } }),
        prisma.sweepBatch.count({ where: { status: 'FAILED' } }),
        prisma.sweepBatch.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { totalAmount: true },
        }),
    ]);

    return {
        pendingCount: pending,
        completedCount: completed,
        failedCount: failed,
        totalSweptValue: Number(totalValue._sum.totalAmount || 0),
    };
}

/**
 * Get pending sweep amount per chain
 */
export async function getPendingSweepAmounts(): Promise<Record<Chain, number>> {
    const deposits = await prisma.deposit.groupBy({
        by: ['chain'],
        where: {
            status: 'CONFIRMED',
            sweepBatchId: null,
        },
        _sum: { amountUsd: true },
        _count: true,
    });

    const result: Record<Chain, number> = {
        ethereum: 0,
        base: 0,
        arbitrum: 0,
        hyperevm: 0,
        solana: 0,
    };

    for (const d of deposits) {
        result[d.chain as Chain] = Number(d._sum.amountUsd || 0);
    }

    return result;
}

/**
 * Manual sweep trigger for admin
 */
export async function triggerManualSweep(chain: Chain): Promise<{
    success: boolean;
    message: string;
    details?: any;
}> {
    try {
        const result = await sweepChain(chain);

        if (result.depositCount === 0) {
            return {
                success: true,
                message: `No deposits to sweep on ${chain}`,
            };
        }

        return {
            success: result.success,
            message: result.success
                ? `Successfully swept ${result.depositCount} deposits on ${chain}`
                : `Sweep failed: ${result.error}`,
            details: {
                batchId: result.batchId,
                txHashes: result.txHashes,
                depositCount: result.depositCount,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Sweep error: ${error.message}`,
        };
    }
}
