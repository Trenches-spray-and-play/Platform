import { createPublicClient, http, parseAbi, Address, PublicClient } from 'viem';
import { config } from '@/lib/config';
import { FoundDeposit } from './deposit-credit.service';
import { prisma } from '@/lib/db';

const ERC20_ABI = parseAbi([
    'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

const clients: Record<string, PublicClient> = {};

/**
 * Get or create a Viem PublicClient for a specific chain.
 * Reuses clients for performance.
 */
function getClient(chain: string): PublicClient {
    if (!clients[chain]) {
        const rpcUrl = (config.rpcUrls as any)[chain];
        if (!rpcUrl) throw new Error(`No RPC URL configured for chain: ${chain}`);

        clients[chain] = createPublicClient({
            transport: http(rpcUrl),
        }) as PublicClient;
    }
    return clients[chain];
}

/**
 * Scans an EVM-compatible chain for recent deposits to a specific address.
 * Scans last 100 blocks for ERC20 Transfers and checks native balance.
 */
export async function scanEvmChain(
    chain: string,
    depositAddress: string,
    blocksToScan: number = 100
): Promise<FoundDeposit[]> {
    console.log(`[EvmScanner] Scanning ${chain} for ${depositAddress}...`);

    const client = getClient(chain);
    const foundDeposits: FoundDeposit[] = [];

    try {
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock - BigInt(blocksToScan);

        // 1. Scan supported ERC20 tokens in parallel
        const tokenAddresses = (config.tokenAddresses as any)[chain] || {};
        const erc20Promises = Object.entries(tokenAddresses).map(async ([asset, tokenAddress]) => {
            if (tokenAddress === 'native') return [];

            try {
                const logs = await client.getLogs({
                    address: tokenAddress as Address,
                    event: ERC20_ABI[0],
                    args: { to: depositAddress as Address },
                    fromBlock,
                    toBlock: currentBlock,
                });

                return logs.map(log => ({
                    txHash: log.transactionHash,
                    chain,
                    asset,
                    amount: log.args.value || 0n,
                    blockNumber: log.blockNumber,
                }));
            } catch (err) {
                console.error(`[EvmScanner] Error scanning ${asset} on ${chain}:`, err);
                return [];
            }
        });

        // 2. Scan native asset balance (ETH, BNB, HYPE)
        const nativePromise = (async () => {
            try {
                const balance = await client.getBalance({ address: depositAddress as Address });

                // Get cached balance from DB to detect increases
                const da = await prisma.depositAddress.findFirst({
                    where: { address: depositAddress, chain },
                    select: { cachedBalance: true }
                });

                const lastKnownBalance = BigInt(da?.cachedBalance?.toString().split('.')[0] || '0');

                if (balance > lastKnownBalance) {
                    const amount = balance - lastKnownBalance;
                    const nativeAsset = getNativeAsset(chain);

                    // Native transfers don't have events, so we use a pseudo-tx-hash 
                    // that incorporates the block number to prevent double-crediting
                    const pseudoTxHash = `native-${chain}-${depositAddress}-${currentBlock}`;

                    return [{
                        txHash: pseudoTxHash,
                        chain,
                        asset: nativeAsset,
                        amount,
                        blockNumber: currentBlock,
                    }];
                }
            } catch (err) {
                console.error(`[EvmScanner] Error checking native balance on ${chain}:`, err);
            }
            return [];
        })();

        // Wait for all scans to complete
        const results = await Promise.all([...erc20Promises, nativePromise]);
        foundDeposits.push(...results.flat());

        if (foundDeposits.length > 0) {
            console.log(`[EvmScanner] Found ${foundDeposits.length} deposits for ${depositAddress} on ${chain}`);
        }

    } catch (error) {
        console.error(`[EvmScanner] Fatal error scanning ${chain}:`, error);
    }

    return foundDeposits;
}

/**
 * Maps chain to its native asset name.
 */
function getNativeAsset(chain: string): string {
    if (chain === 'bsc') return 'BNB';
    if (chain === 'hyperevm') return 'HYPE';
    return 'ETH';
}
