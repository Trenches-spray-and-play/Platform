import { prisma } from '@/lib/db';

export type TransactionStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

/**
 * Transaction Service
 * 
 * NOTE: This service is now primarily used for DEPOSIT verification.
 * The spray flow has been refactored to use balance-based payments via SprayEntry.
 * See /api/spray and /api/spray/finalize for the new spray implementation.
 */

export interface VerifyTransactionParams {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: bigint;
  blockNumber: number;
  timestamp: Date;
}

/**
 * Match a blockchain transfer to a pending transaction
 */
export async function matchTransferToEntry(params: VerifyTransactionParams) {
  const { txHash, fromAddress, toAddress, amount, blockNumber, timestamp } = params;

  // Find pending transactions that match:
  // 1. Target address matches
  // 2. Amount matches (within small tolerance for rounding)
  // 3. Within time window
  // 4. Not already verified

  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
      targetAddress: toAddress.toLowerCase(),
      deadline: {
        gte: timestamp, // Not expired yet
      },
    },
    include: {
      user: true,
    },
  });

  // Find exact or closest match
  for (const tx of pendingTransactions) {
    const amountDiff = Math.abs(Number(amount) - tx.amount);
    const tolerance = tx.amount * 0.0001; // 0.01% tolerance for rounding

    if (amountDiff <= tolerance) {
      // Match found - verify this transaction
      return await verifyTransaction(tx.id, {
        txHash,
        fromAddress,
        toAddress,
        amount,
        blockNumber,
        timestamp,
      });
    }
  }

  return null; // No match found
}

/**
 * Verify and update a transaction
 */
export async function verifyTransaction(
  transactionId: string,
  params: VerifyTransactionParams
) {
  const { txHash, fromAddress, toAddress, amount, blockNumber, timestamp } = params;

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'VERIFIED',
      txHash,
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      blockNumber,
      verifiedAt: timestamp,
      updatedAt: new Date(),
    },
  });

  // Create or update participant record using upsert with composite unique key
  await prisma.participant.upsert({
    where: {
      userId_trenchId: {
        userId: transaction.userId,
        trenchId: transaction.trenchId,
      },
    },
    create: {
      userId: transaction.userId,
      trenchId: transaction.trenchId,
      status: 'active',
      joinedAt: timestamp,
    },
    update: {
      status: 'active',
    },
  });

  return transaction;
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(transactionId: string) {
  return await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: {
        select: {
          id: true,
          handle: true,
          wallet: true,
        },
      },
      trench: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
    },
  });
}

/**
 * Mark expired transactions as EXPIRED
 */
export async function expirePendingTransactions() {
  const now = new Date();

  const result = await prisma.transaction.updateMany({
    where: {
      status: 'PENDING',
      deadline: {
        lt: now,
      },
    },
    data: {
      status: 'EXPIRED',
      updatedAt: now,
    },
  });

  return result.count;
}

/**
 * Check if transaction hash already exists (prevent duplicates)
 */
export async function transactionHashExists(txHash: string): Promise<boolean> {
  const count = await prisma.transaction.count({
    where: {
      txHash: txHash.toLowerCase(),
    },
  });

  return count > 0;
}
