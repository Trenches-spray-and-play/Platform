/**
 * Solana Sweep Service
 *
 * Handles sweeping SPL tokens from user deposit addresses to vault addresses on Solana.
 * Derives private keys from HD wallet to sign transfer transactions.
 */

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';

// Minimum sweep thresholds for Solana assets (in token units)
const MIN_SWEEP_THRESHOLDS = {
    SOL: 0.01,      // 0.01 SOL (~$2)
    USDC: 1,        // $1 USDC
    USDT: 1,        // $1 USDT
};

// Maximum addresses per sweep batch
const MAX_BATCH_SIZE = 20;

// Estimated fees for Solana transactions (in lamports)
const ESTIMATED_TX_FEE = 5000; // 0.000005 SOL base fee
const PRIORITY_FEE = 10000;    // Priority fee for faster inclusion
const ATA_CREATION_RENT = 2039280; // Rent for creating ATA (~0.002 SOL)

// SPL Token mint addresses on Solana mainnet
const SOLANA_TOKENS: Record<string, { mint: string; decimals: number }> = {
    USDC: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
    },
    USDT: {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        decimals: 6,
    },
};

interface SolanaSweepDeposit {
    id: string;
    depositAddressId: string;
    amount: Decimal;
    asset: string;
    depositAddress: {
        address: string;
        derivationIndex: number;
    };
}

/**
 * Derive Solana keypair from HD wallet seed
 */
function deriveSolanaKeypair(index: number): Keypair {
    const seed = config.hdMasterSeed;
    if (!seed) {
        throw new Error('HD_MASTER_SEED not configured');
    }

    let seedBuffer: Buffer;
    if (seed.includes(' ')) {
        // Mnemonic phrase
        const { Mnemonic } = require('ethers');
        const mnemonic = Mnemonic.fromPhrase(seed);
        seedBuffer = Buffer.from(mnemonic.computeSeed());
    } else {
        // Hex seed
        seedBuffer = Buffer.from(seed, 'hex');
    }

    const path = `m/44'/501'/${index}'/0'`;
    const derived = derivePath(path, seedBuffer.toString('hex'));
    return Keypair.fromSeed(derived.key);
}

/**
 * Get treasury keypair for funding gas fees
 * The treasury pays for transaction fees when deposit addresses lack SOL
 */
function getTreasuryKeypair(): Keypair | null {
    const treasuryKey = config.treasuryKeys.solana;
    if (!treasuryKey) {
        return null;
    }

    try {
        // Try parsing as base58 (standard Solana format)
        if (treasuryKey.length === 88 || treasuryKey.length === 87) {
            const decoded = bs58.decode(treasuryKey);
            return Keypair.fromSecretKey(decoded);
        }

        // Try parsing as JSON array of bytes
        if (treasuryKey.startsWith('[')) {
            const bytes = JSON.parse(treasuryKey);
            return Keypair.fromSecretKey(Uint8Array.from(bytes));
        }

        // Try parsing as hex
        if (treasuryKey.startsWith('0x')) {
            const bytes = Buffer.from(treasuryKey.slice(2), 'hex');
            return Keypair.fromSecretKey(bytes);
        }

        // Direct base58
        const decoded = bs58.decode(treasuryKey);
        return Keypair.fromSecretKey(decoded);
    } catch (error) {
        console.error('Failed to parse TREASURY_KEY_SOLANA:', error);
        return null;
    }
}

/**
 * Fund a deposit address with SOL for transaction fees
 * Returns the funding transaction signature if successful
 */
async function fundAddressForFees(
    connection: Connection,
    treasuryKeypair: Keypair,
    targetAddress: PublicKey,
    amountLamports: number
): Promise<string | null> {
    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: targetAddress,
                lamports: amountLamports,
            })
        );

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [treasuryKeypair],
            { commitment: 'confirmed' }
        );

        console.log(`💰 Funded ${targetAddress.toBase58().slice(0, 8)}... with ${amountLamports / LAMPORTS_PER_SOL} SOL: ${signature}`);
        return signature;
    } catch (error) {
        console.error(`Failed to fund address ${targetAddress.toBase58()}:`, error);
        return null;
    }
}

/**
 * Get confirmed Solana deposits ready for sweep
 */
async function getPendingSolanaSweepDeposits(): Promise<SolanaSweepDeposit[]> {
    const deposits = await prisma.deposit.findMany({
        where: {
            chain: 'solana',
            status: 'CONFIRMED',
            sweepBatchId: null,
        },
        include: {
            depositAddress: {
                select: {
                    address: true,
                    derivationIndex: true,
                },
            },
        },
        orderBy: { confirmedAt: 'asc' },
        take: MAX_BATCH_SIZE,
    });

    return deposits as SolanaSweepDeposit[];
}

/**
 * Get Solana vault address
 */
async function getSolanaVaultAddress(): Promise<string | null> {
    // First check database
    const vaultRecord = await prisma.vaultAddress.findUnique({
        where: { chain: 'solana' },
    });

    if (vaultRecord) {
        return vaultRecord.address;
    }

    // Fall back to config
    return config.vaultAddresses.solana || null;
}

/**
 * Create a sweep batch record for Solana
 */
async function createSolanaSweepBatch(depositIds: string[], totalAmount: bigint): Promise<string> {
    const batch = await prisma.sweepBatch.create({
        data: {
            chain: 'solana',
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
 * Execute SPL token sweep from a deposit address to vault
 * If the deposit address lacks SOL for fees, treasury funds it first
 */
async function executeSplTokenSweep(
    connection: Connection,
    fromKeypair: Keypair,
    toAddress: PublicKey,
    tokenMint: PublicKey,
    amount: bigint,
    treasuryKeypair: Keypair | null
): Promise<string> {
    // Get source ATA
    const sourceAta = await getAssociatedTokenAddress(tokenMint, fromKeypair.publicKey);

    // Get destination ATA
    const destAta = await getAssociatedTokenAddress(tokenMint, toAddress);

    // Check if destination ATA exists
    let needsAtaCreation = false;
    try {
        await connection.getAccountInfo(destAta);
    } catch {
        needsAtaCreation = true;
    }

    const destAtaInfo = await connection.getAccountInfo(destAta);
    needsAtaCreation = !destAtaInfo;

    // Estimate required SOL for fees
    const requiredLamports = ESTIMATED_TX_FEE + PRIORITY_FEE + (needsAtaCreation ? ATA_CREATION_RENT : 0);

    // Check deposit address SOL balance
    const balance = await connection.getBalance(fromKeypair.publicKey);

    // If insufficient SOL, try to fund from treasury
    if (balance < requiredLamports) {
        if (!treasuryKeypair) {
            throw new Error(`Insufficient SOL for fees (need ${requiredLamports / LAMPORTS_PER_SOL} SOL, have ${balance / LAMPORTS_PER_SOL} SOL) and no treasury configured`);
        }

        const fundAmount = requiredLamports - balance + 1000; // Add small buffer
        const fundResult = await fundAddressForFees(
            connection,
            treasuryKeypair,
            fromKeypair.publicKey,
            fundAmount
        );

        if (!fundResult) {
            throw new Error('Failed to fund deposit address for fees');
        }

        // Wait for funding to confirm
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Build transaction
    const transaction = new Transaction();

    // Add priority fee for faster inclusion
    transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: PRIORITY_FEE,
        })
    );

    // Create destination ATA if needed
    if (needsAtaCreation) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                fromKeypair.publicKey, // payer
                destAta,
                toAddress,
                tokenMint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );
    }

    // Add transfer instruction
    const transferIx = createTransferInstruction(
        sourceAta,
        destAta,
        fromKeypair.publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
    );
    transaction.add(transferIx);

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
        { commitment: 'confirmed' }
    );

    return signature;
}

/**
 * Execute native SOL sweep from a deposit address to vault
 * Sweeps all SOL minus transaction fees
 */
async function executeSolSweep(
    connection: Connection,
    fromKeypair: Keypair,
    toAddress: PublicKey
): Promise<string> {
    // Get current balance
    const balance = await connection.getBalance(fromKeypair.publicKey);

    // Get recent blockhash to estimate fees
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    // Build transaction to estimate exact fee
    const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: fromKeypair.publicKey,
    });

    // Add priority fee for faster inclusion
    transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: PRIORITY_FEE,
        })
    );

    // Add placeholder transfer (will update amount after fee calculation)
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toAddress,
            lamports: 1, // Placeholder
        })
    );

    // Get fee for this transaction
    const fee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
    const txFee = fee.value || (ESTIMATED_TX_FEE + PRIORITY_FEE);

    // Calculate amount to send (balance minus fees, with small buffer)
    const feeBuffer = 1000; // 0.000001 SOL buffer
    const sendAmount = balance - txFee - feeBuffer;

    if (sendAmount <= 0) {
        throw new Error(`Insufficient balance to sweep. Balance: ${balance / LAMPORTS_PER_SOL} SOL, Fee: ${txFee / LAMPORTS_PER_SOL} SOL`);
    }

    // Rebuild transaction with correct amount
    const finalTransaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: fromKeypair.publicKey,
    });

    finalTransaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: PRIORITY_FEE,
        })
    );

    finalTransaction.add(
        SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toAddress,
            lamports: sendAmount,
        })
    );

    const signature = await sendAndConfirmTransaction(
        connection,
        finalTransaction,
        [fromKeypair],
        { commitment: 'confirmed' }
    );

    return signature;
}

/**
 * Execute Solana sweep for a batch of deposits
 */
async function executeSolanaSweep(
    batchId: string,
    deposits: SolanaSweepDeposit[]
): Promise<{ txHashes: string[]; errors: string[] }> {
    const vaultAddress = await getSolanaVaultAddress();
    if (!vaultAddress) {
        throw new Error('Solana vault address not configured');
    }

    const rpcUrl = config.rpcUrls.solana;
    if (!rpcUrl) {
        throw new Error('Solana RPC URL not configured');
    }

    const connection = new Connection(rpcUrl, 'confirmed');
    const vaultPubkey = new PublicKey(vaultAddress);

    // Get treasury keypair for funding SPL token sweeps
    const treasuryKeypair = getTreasuryKeypair();
    if (!treasuryKeypair) {
        console.warn('⚠️ TREASURY_KEY_SOLANA not configured - SPL sweeps may fail if deposit addresses lack SOL');
    }

    // Update batch status
    await prisma.sweepBatch.update({
        where: { id: batchId },
        data: { status: 'EXECUTING' },
    });

    const txHashes: string[] = [];
    const errors: string[] = [];

    // Sort deposits: sweep SOL last so SPL tokens can be funded first
    const sortedDeposits = [...deposits].sort((a, b) => {
        if (a.asset === 'SOL' && b.asset !== 'SOL') return 1;
        if (a.asset !== 'SOL' && b.asset === 'SOL') return -1;
        return 0;
    });

    for (const deposit of sortedDeposits) {
        try {
            // Derive keypair for this deposit address
            const keypair = deriveSolanaKeypair(deposit.depositAddress.derivationIndex);

            // Verify derived address matches
            const derivedAddress = keypair.publicKey.toBase58();
            if (derivedAddress !== deposit.depositAddress.address) {
                throw new Error(`Derived address mismatch: expected ${deposit.depositAddress.address}, got ${derivedAddress}`);
            }

            let txHash: string;

            if (deposit.asset === 'SOL') {
                // Native SOL sweep
                txHash = await executeSolSweep(
                    connection,
                    keypair,
                    vaultPubkey
                );
            } else {
                // SPL token sweep
                const tokenInfo = SOLANA_TOKENS[deposit.asset];
                if (!tokenInfo) {
                    throw new Error(`Unknown Solana token: ${deposit.asset}`);
                }

                const tokenMint = new PublicKey(tokenInfo.mint);
                txHash = await executeSplTokenSweep(
                    connection,
                    keypair,
                    vaultPubkey,
                    tokenMint,
                    BigInt(deposit.amount.toString()),
                    treasuryKeypair
                );
            }

            // Update deposit as swept
            await prisma.deposit.update({
                where: { id: deposit.id },
                data: {
                    status: 'SWEPT',
                    sweepTxHash: txHash,
                    sweptAt: new Date(),
                },
            });

            txHashes.push(txHash);
            console.log(`✅ Swept Solana deposit ${deposit.id}: ${txHash}`);

            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Deposit ${deposit.id}: ${errorMsg}`);
            console.error(`❌ Failed to sweep Solana deposit ${deposit.id}:`, error);
        }
    }

    return { txHashes, errors };
}

/**
 * Main function to sweep Solana deposits
 */
export async function sweepSolana(): Promise<{
    success: boolean;
    batchId?: string;
    txHashes?: string[];
    depositCount: number;
    error?: string;
}> {
    try {
        const deposits = await getPendingSolanaSweepDeposits();

        if (deposits.length === 0) {
            console.log('No Solana deposits to sweep');
            return { success: true, depositCount: 0 };
        }

        // Group deposits by asset for threshold checking
        const byAsset: Record<string, { count: number; total: number }> = {};
        for (const d of deposits) {
            if (!byAsset[d.asset]) {
                byAsset[d.asset] = { count: 0, total: 0 };
            }
            byAsset[d.asset].count++;
            byAsset[d.asset].total += Number(d.amount);
        }

        console.log('Solana deposits ready for sweep:');
        for (const [asset, data] of Object.entries(byAsset)) {
            console.log(`  ${asset}: ${data.count} deposits, total ${data.total}`);
        }

        // Calculate total amount for batch
        const totalAmount = deposits.reduce(
            (sum, d) => sum + BigInt(d.amount.toString()),
            0n
        );

        // Create batch
        const batchId = await createSolanaSweepBatch(
            deposits.map(d => d.id),
            totalAmount
        );

        // Execute sweep
        const { txHashes, errors } = await executeSolanaSweep(batchId, deposits);

        // Update batch status
        const allSuccessful = errors.length === 0;
        await prisma.sweepBatch.update({
            where: { id: batchId },
            data: {
                status: allSuccessful ? 'COMPLETED' : 'FAILED',
                txHash: txHashes[0] || null, // Store first tx hash
                executedAt: new Date(),
            },
        });

        if (allSuccessful) {
            console.log(`✅ Swept ${deposits.length} Solana deposits`);
            return {
                success: true,
                batchId,
                txHashes,
                depositCount: deposits.length,
            };
        } else {
            console.error(`⚠️ Some Solana sweeps failed: ${errors.join(', ')}`);
            return {
                success: false,
                batchId,
                txHashes,
                depositCount: txHashes.length,
                error: `${errors.length} deposits failed to sweep`,
            };
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Solana sweep error:', error);
        return {
            success: false,
            depositCount: 0,
            error: errorMsg,
        };
    }
}

/**
 * Get Solana sweep statistics
 */
export async function getSolanaSweepStats(): Promise<{
    pendingCount: number;
    pendingValue: number;
    completedCount: number;
    totalSweptValue: number;
}> {
    const [pending, completed] = await Promise.all([
        prisma.deposit.aggregate({
            where: {
                chain: 'solana',
                status: 'CONFIRMED',
                sweepBatchId: null,
            },
            _count: true,
            _sum: { amountUsd: true },
        }),
        prisma.deposit.aggregate({
            where: {
                chain: 'solana',
                status: 'SWEPT',
            },
            _count: true,
            _sum: { amountUsd: true },
        }),
    ]);

    return {
        pendingCount: pending._count,
        pendingValue: Number(pending._sum.amountUsd || 0),
        completedCount: completed._count,
        totalSweptValue: Number(completed._sum.amountUsd || 0),
    };
}

/**
 * Check if Solana sweeping is properly configured
 */
export function isSolanaSweepConfigured(): boolean {
    return !!(
        config.hdMasterSeed &&
        config.rpcUrls.solana &&
        config.vaultAddresses.solana
    );
}
