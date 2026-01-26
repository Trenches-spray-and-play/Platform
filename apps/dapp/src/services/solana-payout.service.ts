/**
 * Solana Payout Service
 * 
 * Handles SPL token payouts on Solana blockchain.
 * Used when campaign chainId = 0 (Solana).
 */

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { prisma } from '@/lib/db';
import { getRpcUrl } from '@/lib/rpc';

interface SolanaPayoutParams {
    id: string;
    tokenAddress: string;  // SPL Token mint address
    toAddress: string;     // Recipient's Solana wallet address
    amount: number;        // Amount in token units (not lamports)
    tokenDecimals?: number;
}

/**
 * Execute a Solana SPL token payout
 */
export async function executeSolanaPayout(payout: SolanaPayoutParams) {
    const rpcUrl = getRpcUrl(0); // Solana chainId = 0
    const connection = new Connection(rpcUrl, 'confirmed');

    // Get payer keypair from environment
    const privateKeyBase58 = process.env.SOLANA_PAYOUT_PRIVATE_KEY;
    if (!privateKeyBase58) {
        throw new Error('SOLANA_PAYOUT_PRIVATE_KEY not configured');
    }

    const payerKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

    // Parse addresses
    const mint = new PublicKey(payout.tokenAddress);
    const destinationWallet = new PublicKey(payout.toAddress);

    // Get or create associated token accounts
    const sourceAta = await getAssociatedTokenAddress(mint, payerKeypair.publicKey);

    // Get destination ATA (or create if doesn't exist)
    const destinationAta = await getOrCreateAssociatedTokenAccount(
        connection,
        payerKeypair,
        mint,
        destinationWallet
    );

    // Calculate amount in smallest units
    const decimals = payout.tokenDecimals ?? 6; // Default to 6 for USDC
    const amountInSmallestUnits = BigInt(Math.floor(payout.amount * (10 ** decimals)));

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
        sourceAta,
        destinationAta.address,
        payerKeypair.publicKey,
        amountInSmallestUnits,
        [],
        TOKEN_PROGRAM_ID
    );

    // Build and send transaction
    const transaction = new Transaction().add(transferInstruction);

    // Mark as executing
    await prisma.payout.update({
        where: { id: payout.id },
        data: {
            status: 'EXECUTING',
            executedAt: new Date(),
        },
    });

    try {
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payerKeypair],
            { commitment: 'confirmed' }
        );

        console.log(`Solana payout executed: ${signature}`);

        // Update payout record
        await prisma.payout.update({
            where: { id: payout.id },
            data: {
                status: 'CONFIRMED',
                txHash: signature,
                confirmedAt: new Date(),
            },
        });

        return { success: true, txHash: signature };
    } catch (error) {
        console.error(`Solana payout ${payout.id} failed:`, error);

        await prisma.payout.update({
            where: { id: payout.id },
            data: { status: 'FAILED' },
        });

        throw error;
    }
}

/**
 * Get token balance for a Solana wallet
 */
export async function getSolanaTokenBalance(
    walletAddress: string,
    mintAddress: string
): Promise<{ balance: number; decimals: number }> {
    const rpcUrl = getRpcUrl(0);
    const connection = new Connection(rpcUrl, 'confirmed');

    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    try {
        const ata = await getAssociatedTokenAddress(mint, wallet);
        const accountInfo = await connection.getTokenAccountBalance(ata);

        return {
            balance: parseFloat(accountInfo.value.uiAmountString || '0'),
            decimals: accountInfo.value.decimals,
        };
    } catch {
        // Account doesn't exist or has no balance
        return { balance: 0, decimals: 6 };
    }
}
