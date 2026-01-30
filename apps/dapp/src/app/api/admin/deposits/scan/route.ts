/**
 * Manual scan endpoint for debugging deposits
 * 
 * POST /api/admin/deposits/scan
 * Body: { chain: 'hyperevm', fromBlock: 12345, toBlock: 12350 }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, Address } from 'viem';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';

const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chain = 'hyperevm', fromBlock, toBlock, address } = body;

        const rpcUrl = config.rpcUrls[chain as keyof typeof config.rpcUrls];
        if (!rpcUrl) {
            return NextResponse.json({ error: `No RPC for ${chain}` }, { status: 400 });
        }

        const client = createPublicClient({
            transport: http(rpcUrl),
        });

        // Get watched addresses
        const watchedAddresses = address 
            ? [address.toLowerCase()]
            : (await prisma.depositAddress.findMany({
                  where: { chain },
                  select: { address: true },
              })).map(a => a.address.toLowerCase());

        const tokens = (config.tokenAddresses as any)[chain] || {};
        const results: any[] = [];

        // Determine block range
        const latestBlock = await client.getBlockNumber();
        const scanFrom = fromBlock ? BigInt(fromBlock) : latestBlock - 100n;
        const scanTo = toBlock ? BigInt(toBlock) : latestBlock;

        // Scan each token
        for (const [asset, tokenAddress] of Object.entries(tokens)) {
            if (tokenAddress === 'native' || !tokenAddress) continue;

            try {
                const logs = await client.getLogs({
                    address: tokenAddress as Address,
                    event: ERC20_ABI[0],
                    fromBlock: scanFrom,
                    toBlock: scanTo,
                });

                // Filter for transfers to watched addresses
                const matchingTransfers = logs.filter(log => {
                    const toAddress = log.args.to?.toLowerCase();
                    return toAddress && watchedAddresses.includes(toAddress);
                });

                if (matchingTransfers.length > 0 || logs.length > 0) {
                    results.push({
                        asset,
                        tokenAddress,
                        totalLogs: logs.length,
                        matchingTransfers: matchingTransfers.map(log => ({
                            txHash: log.transactionHash,
                            from: log.args.from,
                            to: log.args.to,
                            value: log.args.value?.toString(),
                            blockNumber: log.blockNumber.toString(),
                        })),
                    });
                }
            } catch (error) {
                results.push({ asset, error: (error as Error).message });
            }
        }

        return NextResponse.json({
            chain,
            rpcUrl: rpcUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials
            blockRange: { from: scanFrom.toString(), to: scanTo.toString(), latest: latestBlock.toString() },
            watchedAddresses: watchedAddresses.length,
            watchedList: watchedAddresses.slice(0, 5), // Show first 5
            results,
        });

    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Quick status check
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'hyperevm';
    
    const rpcUrl = config.rpcUrls[chain as keyof typeof config.rpcUrls];
    
    return NextResponse.json({
        chain,
        rpcConfigured: !!rpcUrl,
        rpcUrl: rpcUrl ? rpcUrl.replace(/\/\/.*@/, '//***@') : null,
        tokens: (config.tokenAddresses as any)[chain] || {},
    });
}
