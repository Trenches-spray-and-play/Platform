/**
 * Reorg Protection Service
 *
 * Detects blockchain reorganizations and reverses credited deposits
 * that were included in orphaned blocks.
 */

import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { createPublicClient, http, PublicClient } from 'viem';
import { Connection } from '@solana/web3.js';
import type { Chain } from './deposit-address.service';
import {
    sendReorgDetectedAlert,
    sendReorgReviewAlert,
    sendReorgCheckFailureAlert
} from './alert.service';
import { recordReorgMetric } from './metrics.service';

// EVM clients cache
const evmClients: Partial<Record<Exclude<Chain, 'solana'>, PublicClient>> = {};

// Solana connection
let solanaConnection: Connection | null = null;

/**
 * Initialize blockchain clients for reorg checks
 */
function getEvmClient(chain: Exclude<Chain, 'solana'>): PublicClient | null {
    if (evmClients[chain]) return evmClients[chain]!;

    const rpcUrl = config.rpcUrls[chain];
    if (!rpcUrl) return null;

    evmClients[chain] = createPublicClient({
        transport: http(rpcUrl),
    }) as PublicClient;

    return evmClients[chain]!;
}

function getSolanaConnection(): Connection | null {
    if (solanaConnection) return solanaConnection;

    const rpcUrl = config.rpcUrls.solana;
    if (!rpcUrl) return null;

    solanaConnection = new Connection(rpcUrl);
    return solanaConnection;
}

/**
 * Verify a transaction is still valid on the canonical chain
 */
async function verifyTransactionOnChain(params: {
    chain: Chain;
    txHash: string;
    blockNumber: bigint;
    expectedBlockHash: string;
}): Promise<{
    reorgDetected: boolean;
    currentBlockHash: string | null;
}> {
    const { chain, blockNumber, expectedBlockHash } = params;

    if (chain === 'solana') {
        // Solana uses signatures - check if tx still exists
        const connection = getSolanaConnection();
        if (!connection) return { reorgDetected: false, currentBlockHash: null };

        const status = await connection.getSignatureStatus(params.txHash);
        if (!status.value || status.value.err) {
            return { reorgDetected: true, currentBlockHash: null };
        }
        return { reorgDetected: false, currentBlockHash: null };
    }

    // EVM chains - compare block hashes
    const client = getEvmClient(chain);
    if (!client) return { reorgDetected: false, currentBlockHash: null };

    const block = await client.getBlock({ blockNumber });
    const currentBlockHash = block?.hash || null;

    if (!currentBlockHash) {
        // Block not found - might have been reorged
        return { reorgDetected: true, currentBlockHash: null };
    }

    const reorgDetected = currentBlockHash !== expectedBlockHash;
    return { reorgDetected, currentBlockHash };
}

/**
 * Reverse a deposit credit when reorg is detected
 *
 * CRITICAL: Must handle case where user already spent the funds
 */
async function reverseDepositCredit(deposit: {
    id: string;
    userId: string;
    amountUsd: unknown;
    safeAt: Date | null;
}): Promise<void> {
    const depositAmount = Number(deposit.amountUsd);

    return await prisma.$transaction(async (tx) => {
        // 1. Get current user state
        const user = await tx.user.findUnique({
            where: { id: deposit.userId },
        });

        if (!user) return;

        const currentBalance = Number(user.balance);

        // 2. Check if user has already spent the funds
        // Get spray entries created after the deposit was credited
        const sprayEntriesAfterDeposit = deposit.safeAt
            ? await tx.sprayEntry.findMany({
                where: {
                    userId: deposit.userId,
                    createdAt: { gte: deposit.safeAt }
                }
            })
            : [];

        const spentAmount = sprayEntriesAfterDeposit.reduce(
            (sum, entry) => sum + Number(entry.amount),
            0
        );

        if (spentAmount > 0 || currentBalance < depositAmount) {
            // User has already sprayed with this deposit or insufficient balance
            // Flag for manual review
            await tx.reorgIncident.create({
                data: {
                    depositId: deposit.id,
                    userId: deposit.userId,
                    amount: depositAmount,
                    status: 'REQUIRES_REVIEW',
                    reason: spentAmount > 0
                        ? `User already spent ${spentAmount} of the reorged deposit`
                        : `User balance (${currentBalance}) less than deposit amount (${depositAmount})`,
                    detectedAt: new Date(),
                }
            });

            console.error(`🚨 Reorg incident requires manual review: deposit ${deposit.id}`);

            // Send review alert
            const depositRecord = await tx.deposit.findUnique({ where: { id: deposit.id } });
            if (depositRecord) {
                sendReorgReviewAlert({
                    depositId: deposit.id,
                    amount: depositAmount,
                    chain: depositRecord.chain,
                    userId: deposit.userId,
                    reason: spentAmount > 0
                        ? `User spent ${spentAmount} of deposit`
                        : `Insufficient balance`,
                }).catch(console.error);

                // Record metric
                recordReorgMetric(depositRecord.chain, 'review').catch(console.error);
            }

            return;
        }

        // 3. Safe to reverse - deduct from balance
        await tx.user.update({
            where: { id: deposit.userId },
            data: {
                balance: {
                    decrement: depositAmount
                }
            }
        });

        // 4. Mark deposit as REORGED
        await tx.deposit.update({
            where: { id: deposit.id },
            data: {
                status: 'REORGED',
                reorgDetectedAt: new Date(),
                creditedToBalance: false,
            }
        });

        // 5. Create audit log
        await tx.reorgIncident.create({
            data: {
                depositId: deposit.id,
                userId: deposit.userId,
                amount: depositAmount,
                status: 'REVERSED',
                detectedAt: new Date(),
            }
        });

        console.log(`✅ Reversed deposit ${deposit.id} - deducted $${depositAmount} from user ${deposit.userId}`);
    });
}

/**
 * Periodic reorg check for all CONFIRMING deposits
 * Run this on an interval (e.g., every 30 seconds)
 */
export async function runReorgChecks(): Promise<{
    checked: number;
    reorgsDetected: number;
}> {
    const confirmingDeposits = await prisma.deposit.findMany({
        where: {
            status: 'CONFIRMING',
            blockHash: { not: null }
        },
    });

    let reorgsDetected = 0;

    for (const deposit of confirmingDeposits) {
        if (!deposit.blockHash) continue;

        try {
            const result = await verifyTransactionOnChain({
                chain: deposit.chain as Chain,
                txHash: deposit.txHash,
                blockNumber: deposit.blockNumber,
                expectedBlockHash: deposit.blockHash
            });

            if (result.reorgDetected) {
                console.error(`🚨 REORG DETECTED for deposit ${deposit.id}`);
                console.error(`   TX: ${deposit.txHash}`);
                console.error(`   User: ${deposit.userId}`);
                console.error(`   Amount: $${deposit.amountUsd}`);

                // Mark as REORGED (not credited yet, so no reversal needed)
                await prisma.deposit.update({
                    where: { id: deposit.id },
                    data: {
                        status: 'REORGED',
                        reorgDetectedAt: new Date(),
                    }
                });

                // Log the incident
                await prisma.reorgIncident.create({
                    data: {
                        depositId: deposit.id,
                        userId: deposit.userId,
                        amount: Number(deposit.amountUsd),
                        status: 'DETECTED_BEFORE_CREDIT',
                        reason: 'Reorg detected during CONFIRMING state before credit applied',
                        detectedAt: new Date(),
                    }
                });

                reorgsDetected++;

                // Send alert
                sendReorgDetectedAlert({
                    depositId: deposit.id,
                    txHash: deposit.txHash,
                    amount: Number(deposit.amountUsd),
                    chain: deposit.chain,
                    userId: deposit.userId,
                }).catch(console.error);

                // Record metric
                recordReorgMetric(deposit.chain, 'detected').catch(console.error);
            }
        } catch (error) {
            console.error(`Error checking reorg for deposit ${deposit.id}:`, error);

            // Send failure alert (once per chain per cooldown)
            sendReorgCheckFailureAlert({
                chain: deposit.chain,
                error: error instanceof Error ? error.message : 'Unknown error',
                depositsAffected: confirmingDeposits.filter(d => d.chain === deposit.chain).length,
            }).catch(console.error);

            // Record metric
            recordReorgMetric(deposit.chain, 'check_failure').catch(console.error);
        }
    }

    return { checked: confirmingDeposits.length, reorgsDetected };
}

/**
 * Check SAFE deposits for late reorg detection
 * This is a safety net for edge cases where reorg happens after SAFE status
 */
export async function runSafeDepositReorgChecks(): Promise<{
    checked: number;
    reorgsDetected: number;
}> {
    // Only check deposits that became SAFE within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentSafeDeposits = await prisma.deposit.findMany({
        where: {
            status: 'SAFE',
            safeAt: { gte: oneHourAgo },
            blockHash: { not: null },
            creditedToBalance: true,
        },
    });

    let reorgsDetected = 0;

    for (const deposit of recentSafeDeposits) {
        if (!deposit.blockHash) continue;

        try {
            const result = await verifyTransactionOnChain({
                chain: deposit.chain as Chain,
                txHash: deposit.txHash,
                blockNumber: deposit.blockNumber,
                expectedBlockHash: deposit.blockHash
            });

            if (result.reorgDetected) {
                console.error(`🚨 LATE REORG DETECTED for SAFE deposit ${deposit.id}`);

                await reverseDepositCredit({
                    id: deposit.id,
                    userId: deposit.userId,
                    amountUsd: deposit.amountUsd,
                    safeAt: deposit.safeAt,
                });

                // Send alert
                sendReorgDetectedAlert({
                    depositId: deposit.id,
                    txHash: deposit.txHash,
                    amount: Number(deposit.amountUsd),
                    chain: deposit.chain,
                    userId: deposit.userId,
                }).catch(console.error);

                reorgsDetected++;
            }
        } catch (error) {
            console.error(`Error checking late reorg for deposit ${deposit.id}:`, error);
        }
    }

    return { checked: recentSafeDeposits.length, reorgsDetected };
}

/**
 * Start the background reorg checker
 */
let reorgCheckInterval: NodeJS.Timeout | null = null;
let lastCheckAt: Date | null = null;
let lastCheckResult: { confirming: number; safe: number; reorgs: number } | null = null;

export function startReorgChecker(): void {
    if (reorgCheckInterval) return;

    const intervalMs = config.reorgProtection.reorgCheckIntervalMs;

    reorgCheckInterval = setInterval(async () => {
        try {
            const confirmingResult = await runReorgChecks();
            const safeResult = await runSafeDepositReorgChecks();

            lastCheckAt = new Date();
            lastCheckResult = {
                confirming: confirmingResult.checked,
                safe: safeResult.checked,
                reorgs: confirmingResult.reorgsDetected + safeResult.reorgsDetected,
            };

            if (confirmingResult.reorgsDetected > 0 || safeResult.reorgsDetected > 0) {
                console.log(`Reorg check: ${confirmingResult.reorgsDetected} in CONFIRMING, ${safeResult.reorgsDetected} in SAFE`);
            }
        } catch (error) {
            console.error('Reorg checker error:', error);
        }
    }, intervalMs);

    console.log(`Reorg checker started (interval: ${intervalMs}ms)`);
}

export function stopReorgChecker(): void {
    if (reorgCheckInterval) {
        clearInterval(reorgCheckInterval);
        reorgCheckInterval = null;
        console.log('Reorg checker stopped');
    }
}

/**
 * Get health status of the reorg checker
 */
export async function getReorgCheckerHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'not_started';
    lastCheckAt: string | null;
    depositsMonitoring: { pending: number; confirming: number };
    recentIncidents: number;
    checkerRunning: boolean;
}> {
    const isRunning = reorgCheckInterval !== null;

    // Get current deposit counts
    const [pendingCount, confirmingCount, recentIncidents] = await Promise.all([
        prisma.deposit.count({ where: { status: 'PENDING' } }),
        prisma.deposit.count({ where: { status: 'CONFIRMING' } }),
        prisma.reorgIncident.count({
            where: {
                detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        }),
    ]);

    // Determine health status
    let status: 'healthy' | 'unhealthy' | 'not_started' = 'not_started';
    if (isRunning) {
        // Unhealthy if no check in last 2 minutes (should be every 30 seconds)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (lastCheckAt && lastCheckAt > twoMinutesAgo) {
            status = 'healthy';
        } else {
            status = 'unhealthy';
        }
    }

    return {
        status,
        lastCheckAt: lastCheckAt?.toISOString() || null,
        depositsMonitoring: {
            pending: pendingCount,
            confirming: confirmingCount,
        },
        recentIncidents,
        checkerRunning: isRunning,
    };
}
