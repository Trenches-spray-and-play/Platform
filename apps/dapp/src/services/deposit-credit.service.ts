import { prisma } from '@/lib/db';
import { getUsdValue, Asset } from './price-oracle.service';
import { Decimal } from '@prisma/client/runtime/library';
import { config } from '@/lib/config';

export interface FoundDeposit {
    txHash: string;
    chain: string;
    asset: string;
    amount: bigint;
    blockNumber: bigint;
}

/**
 * Credits found deposits to user accounts and creates database records.
 * Optimized for handling multiple deposits in a single scan.
 */
export async function creditDeposits(userId: string, foundDeposits: FoundDeposit[]) {
    const results = [];

    for (const deposit of foundDeposits) {
        // 1. Double-credit prevention: Check if txHash already exists in DB
        const existing = await prisma.deposit.findUnique({
            where: { txHash: deposit.txHash }
        });

        if (existing) {
            console.log(`[DepositCredit] Transaction ${deposit.txHash} already exists, skipping.`);
            results.push({ ...existing, amountUsd: Number(existing.amountUsd), alreadyProcessed: true });
            continue;
        }

        // 2. Calculate USD value using the price oracle
        const amountUsd = await getUsdValue(deposit.asset as Asset, deposit.amount);

        // 3. Find the associated DepositAddress record for the user/chain
        const depositAddress = await prisma.depositAddress.findFirst({
            where: { userId, chain: deposit.chain }
        });

        if (!depositAddress) {
            console.error(`[DepositCredit] No deposit address found for user ${userId} on ${deposit.chain}`);
            continue;
        }

        // 4. Atomically create deposit record and increment user balance
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Create the deposit record
                const newDeposit = await tx.deposit.create({
                    data: {
                        userId,
                        depositAddressId: depositAddress.id,
                        txHash: deposit.txHash,
                        chain: deposit.chain,
                        asset: deposit.asset,
                        amount: deposit.amount.toString(),
                        amountUsd: new Decimal(amountUsd),
                        status: 'SAFE', // Since it's found on-demand, we consider it safe or wait for reorg checker later
                        blockNumber: deposit.blockNumber,
                        confirmations: 100, // Explicitly safe for on-demand found
                        creditedToBalance: true,
                        safeAt: new Date(),
                    }
                });

                // Increment user's global balance
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        balance: { increment: new Decimal(amountUsd) }
                    }
                });

                return newDeposit;
            });

            console.log(`[DepositCredit] ✅ Successfully credited $${amountUsd.toFixed(2)} to user ${userId} (${deposit.asset} on ${deposit.chain})`);

            results.push({ ...result, amountUsd, alreadyProcessed: false });

            // 5. Fire-and-forget Telegram notification
            notifyTelegram(result, userId).catch(err =>
                console.error('[DepositCredit] Telegram notification failed:', err)
            );
        } catch (error) {
            console.error(`[DepositCredit] Failed to credit deposit ${deposit.txHash}:`, error);
        }
    }

    return results;
}

/**
 * Sends a non-blocking Telegram notification to admins about the new deposit.
 */
async function notifyTelegram(deposit: any, userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { handle: true }
    });

    if (!user) return;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
        console.warn('[DepositCredit] Telegram configuration missing, skipping notification.');
        return;
    }

    const explorerUrl = getExplorerUrl(deposit.chain, deposit.txHash);

    const message = `
💰 *New Deposit Found (On-Demand)*

*User:* ${user.handle}
*Amount:* $${Number(deposit.amountUsd).toFixed(2)}
*Asset:* ${deposit.asset}
*Chain:* ${deposit.chain}

*TX:* [${deposit.txHash.slice(0, 10)}...](${explorerUrl})
    `.trim();

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });
    } catch (err) {
        console.error('[Telegram] Fetch error:', err);
    }
}

/**
 * Helper to get explorer links for notifications
 */
function getExplorerUrl(chain: string, txHash: string): string {
    const explorers: Record<string, string> = {
        ethereum: 'https://etherscan.io/tx/',
        base: 'https://basescan.org/tx/',
        arbitrum: 'https://arbiscan.io/tx/',
        hyperevm: 'https://explorer.hyperliquid.xyz/tx/',
        bsc: 'https://bscscan.com/tx/',
        solana: 'https://solscan.io/tx/',
    };

    return (explorers[chain] || '') + txHash;
}
