/**
 * Backfill API - Manually process missed deposits
 * 
 * Use this when deposits were made but not detected due to:
 * - Deposit monitor not running
 * - RPC connectivity issues
 * - System downtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, Address } from 'viem';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';

const ERC20_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

/**
 * Manually process a specific transaction as a deposit
 */
async function processDepositTx(
  txHash: string,
  chain: string,
  userId?: string
) {
  // Check if already processed
  const existing = await prisma.deposit.findFirst({
    where: { txHash: { contains: txHash } }, // Use contains search since multi-asset txs have suffixes
  });

  if (existing) {
    return { success: false, error: 'Deposit already exists with this hash base', deposit: existing };
  }

  // Get RPC URL for chain
  const rpcUrl = config.rpcUrls[chain as keyof typeof config.rpcUrls];
  if (!rpcUrl) {
    return { success: false, error: `No RPC URL for chain: ${chain}` };
  }

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  // Get transaction details and receipt
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash: txHash as `0x${string}` }),
    client.getTransactionReceipt({ hash: txHash as `0x${string}` })
  ]);

  if (!receipt || receipt.status !== 'success' || !tx) {
    return { success: false, error: 'Transaction not found or failed' };
  }

  const results = [];
  const { getUsdValue } = await import('@/services/price-oracle.service');

  // 1. Check for Native Transfers (if value > 0)
  if (tx.value > 0n) {
    const toAddress = tx.to?.toLowerCase();

    if (toAddress) {
      const depositAddress = await prisma.depositAddress.findFirst({
        where: { address: toAddress, chain },
      });

      if (depositAddress) {
        let asset = 'ETH';
        if (chain === 'bsc') asset = 'BNB';
        if (chain === 'hyperevm') asset = 'HYPE';

        const amountUsd = await getUsdValue(asset as any, tx.value);

        const deposit = await prisma.deposit.create({
          data: {
            depositAddressId: depositAddress.id,
            userId: depositAddress.userId,
            txHash: `${txHash}-native`,
            chain,
            asset,
            amount: tx.value.toString(),
            amountUsd,
            status: 'SAFE',
            blockNumber: receipt.blockNumber,
            confirmations: 100,
            creditedToBalance: true,
            confirmedAt: new Date(),
            safeAt: new Date(),
          },
        });

        // Credit user balance
        await prisma.user.update({
          where: { id: depositAddress.userId },
          data: { balance: { increment: amountUsd } },
        });

        results.push({
          type: 'native',
          to: toAddress,
          asset,
          amountUsd,
          status: 'credited',
        });
      }
    }
  }

  // 2. Look for ERC20 Transfer events
  const logs = await client.getLogs({
    event: ERC20_ABI[0],
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  const transfers = logs.filter(
    log => log.transactionHash.toLowerCase() === txHash.toLowerCase()
  );

  for (const transfer of transfers) {
    const toAddress = transfer.args.to?.toLowerCase();
    const amount = transfer.args.value || 0n;
    const tokenAddress = transfer.address.toLowerCase();

    if (!toAddress) continue;

    const depositAddress = await prisma.depositAddress.findFirst({
      where: { address: toAddress, chain },
    });

    if (!depositAddress) continue;

    // Determine asset from token address
    let asset = 'UNKNOWN';
    const chainTokens = config.tokenAddresses[chain as keyof typeof config.tokenAddresses] || {};

    for (const [symbol, addr] of Object.entries(chainTokens)) {
      if (typeof addr === 'string' && addr.toLowerCase() === tokenAddress) {
        asset = symbol;
        break;
      }
    }

    if (asset === 'UNKNOWN') {
      // Fallback for known token addresses if not in config
      if (tokenAddress === '0xb88339cb7199b77e23db6e890353e22632ba630f') asset = 'USDC';
      if (tokenAddress === '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb') asset = 'USDT';
    }

    const amountUsd = await getUsdValue(asset as any, amount);

    const deposit = await prisma.deposit.create({
      data: {
        depositAddressId: depositAddress.id,
        userId: depositAddress.userId,
        txHash: `${txHash}-${asset}`,
        chain,
        asset,
        amount: amount.toString(),
        amountUsd,
        status: 'SAFE',
        blockNumber: receipt.blockNumber,
        confirmations: 100,
        creditedToBalance: true,
        confirmedAt: new Date(),
        safeAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: depositAddress.userId },
      data: { balance: { increment: amountUsd } },
    });

    results.push({
      type: 'token',
      to: toAddress,
      asset,
      amountUsd,
      status: 'credited',
    });
  }

  return { success: true, results };
}

// POST /api/admin/deposits/backfill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, chain = 'hyperevm', userId } = body;

    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash is required' },
        { status: 400 }
      );
    }

    const result = await processDepositTx(txHash, chain, userId);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error backfilling deposit:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process deposit' },
      { status: 500 }
    );
  }
}
