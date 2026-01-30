import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';
import { FoundDeposit } from './deposit-credit.service';

/**
 * Solana SPL token mint addresses for supported assets.
 * These are the standard USDC and USDT mints on Solana Mainnet.
 */
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

let connection: Connection | null = null;

/**
 * Get or create a Solana Connection.
 * Reuses connection for performance.
 */
function getConnection(): Connection {
    if (!connection) {
        const rpcUrl = config.rpcUrls.solana;
        if (!rpcUrl) throw new Error('Solana RPC URL not configured in config.rpcUrls.solana');
        connection = new Connection(rpcUrl, 'confirmed');
    }
    return connection;
}

/**
 * Scans Solana for recent deposits (SOL and SPL tokens) to a specific address.
 * Fetches recent signatures and parses transactions for incoming transfers.
 */
export async function scanSolana(
    depositAddress: string,
    signaturesLimit: number = 20
): Promise<FoundDeposit[]> {
    console.log(`[SolanaScanner] Scanning ${depositAddress} (limit: ${signaturesLimit})...`);

    const conn = getConnection();
    const pubkey = new PublicKey(depositAddress);
    const foundDeposits: FoundDeposit[] = [];

    try {
        // 1. Get recent signature history for the address
        const signatures = await conn.getSignaturesForAddress(pubkey, {
            limit: signaturesLimit
        });

        if (signatures.length === 0) {
            console.log(`[SolanaScanner] No transactions found for ${depositAddress}`);
            return [];
        }

        // 2. Process transactions in parallel to detect transfers
        // We use Promise.all to respect the 4s SLA
        const scanPromises = signatures.map(async (sigInfo) => {
            try {
                const tx = await conn.getParsedTransaction(sigInfo.signature, {
                    maxSupportedTransactionVersion: 0,
                });

                if (!tx || !tx.meta || tx.meta.err) return [];

                const results: FoundDeposit[] = [];
                const slot = tx.slot;

                // --- A. Detect Native SOL transfer ---
                const preBalances = tx.meta.preBalances;
                const postBalances = tx.meta.postBalances;
                const accountKeys = tx.transaction.message.accountKeys;

                // Find our deposit address in the accounts list
                for (let i = 0; i < accountKeys.length; i++) {
                    const accountPubkey = typeof accountKeys[i] === 'object' && 'pubkey' in accountKeys[i]
                        ? (accountKeys[i] as any).pubkey.toBase58()
                        : (accountKeys[i] as any).toBase58();

                    if (accountPubkey === depositAddress) {
                        const preBalance = BigInt(preBalances[i]);
                        const postBalance = BigInt(postBalances[i]);

                        // Increase in SOL balance
                        if (postBalance > preBalance) {
                            results.push({
                                txHash: sigInfo.signature,
                                chain: 'solana',
                                asset: 'SOL',
                                amount: postBalance - preBalance,
                                blockNumber: BigInt(slot),
                            });
                        }
                    }
                }

                // --- B. Detect SPL Token transfers ---
                const preTokenBalances = tx.meta.preTokenBalances || [];
                const postTokenBalances = tx.meta.postTokenBalances || [];

                // Index post-balances by account index for fast lookup
                const postTokenMap = new Map<number, { mint: string; amount: string }>();
                for (const b of postTokenBalances) {
                    if (b.uiTokenAmount) {
                        postTokenMap.set(b.accountIndex, {
                            mint: b.mint,
                            amount: b.uiTokenAmount.amount,
                        });
                    }
                }

                // Compare pre and post for our address
                for (const pre of preTokenBalances) {
                    const post = postTokenMap.get(pre.accountIndex);
                    if (!post) continue;

                    // Filter for our deposit address as owner
                    if (pre.owner !== depositAddress) continue;

                    const preAmount = BigInt(pre.uiTokenAmount?.amount || '0');
                    const postAmount = BigInt(post.amount);

                    if (postAmount > preAmount) {
                        const amount = postAmount - preAmount;

                        // Identify asset from mint
                        let asset = 'UNKNOWN';
                        for (const [name, info] of Object.entries(SOLANA_TOKEN_MINTS)) {
                            if (info.mint === pre.mint) {
                                asset = name;
                                break;
                            }
                        }

                        if (asset !== 'UNKNOWN') {
                            results.push({
                                txHash: sigInfo.signature,
                                chain: 'solana',
                                asset,
                                amount,
                                blockNumber: BigInt(slot),
                            });
                        }
                    }
                }

                return results;
            } catch (err) {
                console.error(`[SolanaScanner] Error parsing tx ${sigInfo.signature}:`, err);
                return [];
            }
        });

        // Combine all found deposits
        const allBatchResults = await Promise.all(scanPromises);
        for (const batch of allBatchResults) {
            foundDeposits.push(...batch);
        }

        if (foundDeposits.length > 0) {
            console.log(`[SolanaScanner] Successfully found ${foundDeposits.length} deposits for ${depositAddress}`);
        }

    } catch (error) {
        console.error(`[SolanaScanner] Major scan error:`, error);
    }

    return foundDeposits;
}
