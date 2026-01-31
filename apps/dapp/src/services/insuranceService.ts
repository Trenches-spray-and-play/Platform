/**
 * Insurance Service - 3 Trenches Model
 * 
 * Features:
 * - Insurance buffer management
 * - Payout processing with price drop coverage
 * - Insurance event logging
 * - Reserve health monitoring
 */

import { prisma } from '@/lib/db';
import type { TrenchV2, SprayEntryV2 } from '@prisma/client';

export interface PayoutResult {
  amount: number;
  useInsurance: boolean;
  partial?: boolean;
  shortfall?: number;
  insuranceUsed?: number;
}

export interface TokenPrice {
  tokenSymbol: string;
  priceUsd: number;
  timestamp: Date;
}

/**
 * Process payout with insurance coverage
 * Covers token price drops to guarantee expected payout
 */
export async function processPayoutWithInsurance(
  sprayId: string,
  currentTokenPrices: Record<string, number>
): Promise<PayoutResult> {
  // Get spray details
  const spray = await prisma.sprayEntryV2.findUnique({
    where: { id: sprayId },
    include: { trench: true },
  });
  
  if (!spray) {
    throw new Error('Spray not found');
  }
  
  if (spray.status !== 'READY') {
    throw new Error('Spray is not ready for payout');
  }
  
  const trench = spray.trench;
  const expectedUsd = spray.expectedPayout.toNumber();
  const allocation = JSON.parse(spray.allocation) as Array<{
    tokenSymbol: string;
    amount: number;
    usdValue: number;
  }>;
  
  // Calculate actual token value at current prices
  let actualTokenValue = 0;
  for (const alloc of allocation) {
    const currentPrice = currentTokenPrices[alloc.tokenSymbol];
    if (currentPrice) {
      actualTokenValue += alloc.amount * currentPrice;
    } else {
      // Fallback to original value if price not available
      actualTokenValue += alloc.usdValue;
    }
  }
  
  // Token appreciated or stable - no insurance needed
  if (actualTokenValue >= expectedUsd) {
    await markSprayAsPaid(sprayId, false, 0);
    return { 
      amount: expectedUsd, 
      useInsurance: false,
    };
  }
  
  // Token depreciated - use insurance
  const shortfall = expectedUsd - actualTokenValue;
  const insuranceBuffer = trench.insuranceBuffer.toNumber();
  
  if (shortfall <= insuranceBuffer) {
    // Cover full shortfall from insurance
    await deductFromInsuranceBuffer(trench.id, shortfall);
    await logInsuranceEvent(trench.id, shortfall, 'PRICE_DROP', 
      `Covered shortfall for spray ${sprayId}`);
    await markSprayAsPaid(sprayId, true, shortfall);
    
    return { 
      amount: expectedUsd, 
      useInsurance: true,
      insuranceUsed: shortfall,
    };
  }
  
  // Insurance depleted - partial payout
  const available = actualTokenValue + insuranceBuffer;
  await deductFromInsuranceBuffer(trench.id, insuranceBuffer);
  await logInsuranceEvent(trench.id, insuranceBuffer, 'EMERGENCY_PAYOUT',
    `Partial payout for spray ${sprayId}. Shortfall: ${shortfall}`);
  await markSprayAsPaid(sprayId, true, insuranceBuffer, true, expectedUsd - available);
  
  return { 
    amount: available, 
    useInsurance: true,
    partial: true,
    shortfall: expectedUsd - available,
    insuranceUsed: insuranceBuffer,
  };
}

/**
 * Deduct amount from insurance buffer
 */
async function deductFromInsuranceBuffer(
  trenchId: string,
  amount: number
): Promise<void> {
  await prisma.trenchV2.update({
    where: { id: trenchId },
    data: {
      insuranceBuffer: { decrement: amount },
    },
  });
}

/**
 * Add amount to insurance buffer (from fees or replenishment)
 */
export async function addToInsuranceBuffer(
  trenchId: string,
  amount: number
): Promise<void> {
  await prisma.trenchV2.update({
    where: { id: trenchId },
    data: {
      insuranceBuffer: { increment: amount },
    },
  });
}

/**
 * Log insurance event
 */
async function logInsuranceEvent(
  trenchId: string,
  amount: number,
  reason: 'PRICE_DROP' | 'RESERVE_COVERAGE' | 'EMERGENCY_PAYOUT',
  details?: string
): Promise<void> {
  await prisma.insuranceEvent.create({
    data: {
      trenchId,
      amount,
      reason,
      details,
    },
  });
  
  console.log(`[Insurance] Event logged: ${reason} - $${amount} in trench ${trenchId}`);
}

/**
 * Mark spray as paid
 */
async function markSprayAsPaid(
  sprayId: string,
  insuranceUsed: boolean,
  insuranceAmount: number,
  partial: boolean = false,
  shortfall?: number
): Promise<void> {
  await prisma.sprayEntryV2.update({
    where: { id: sprayId },
    data: {
      status: 'PAID_OUT',
      insuranceUsed,
      insuranceAmount: insuranceUsed ? insuranceAmount : null,
      paidAt: new Date(),
    },
  });
  
  if (partial && shortfall) {
    console.log(`[Insurance] Partial payout for spray ${sprayId}. Shortfall: $${shortfall}`);
  }
}

/**
 * Check all trenches and update status based on insurance buffer
 * Should be run every 5 minutes
 */
export async function checkReserveHealth(): Promise<void> {
  const trenches = await prisma.trenchV2.findMany();
  
  for (const trench of trenches) {
    const totalReserve = trench.totalReserveUsd.toNumber();
    const insuranceBuffer = trench.insuranceBuffer.toNumber();
    const bufferPercent = totalReserve > 0 ? (insuranceBuffer / totalReserve) * 100 : 0;
    
    let newStatus: 'ACTIVE' | 'PAUSED' | 'EMERGENCY' = 'ACTIVE';
    let shouldLog = false;
    
    if (bufferPercent < 5) {
      newStatus = 'EMERGENCY';
      shouldLog = trench.status !== 'EMERGENCY';
    } else if (bufferPercent < 10) {
      newStatus = 'PAUSED';
      shouldLog = trench.status !== 'PAUSED';
    } else {
      newStatus = 'ACTIVE';
      shouldLog = trench.status !== 'ACTIVE';
    }
    
    if (newStatus !== trench.status) {
      await prisma.trenchV2.update({
        where: { id: trench.id },
        data: { status: newStatus },
      });
      
      if (shouldLog) {
        await logInsuranceEvent(
          trench.id,
          0,
          'RESERVE_COVERAGE',
          `Status changed to ${newStatus}. Buffer: ${bufferPercent.toFixed(2)}%`
        );
        
        console.log(`[Insurance] Trench ${trench.level} status: ${trench.status} → ${newStatus} (buffer: ${bufferPercent.toFixed(2)}%)`);
      }
    }
  }
}

/**
 * Update token prices and recalculate reserve values
 * Should be run every 5 minutes
 */
export async function updateTokenPrices(
  priceUpdates: TokenPrice[]
): Promise<void> {
  for (const update of priceUpdates) {
    // Update token price in database
    await prisma.tokenPrice.upsert({
      where: {
        tokenSymbol_chainId: {
          tokenSymbol: update.tokenSymbol,
          chainId: 1, // Default to Ethereum mainnet, update as needed
        },
      },
      update: {
        priceUsd: update.priceUsd,
        updatedAt: update.timestamp,
      },
      create: {
        tokenSymbol: update.tokenSymbol,
        tokenAddress: '', // Will be populated separately
        chainId: 1,
        priceUsd: update.priceUsd,
        source: 'oracle',
        updatedAt: update.timestamp,
      },
    });
  }
  
  // Recalculate featured project reserve values
  const projects = await prisma.featuredProject.findMany();
  
  for (const project of projects) {
    const price = priceUpdates.find(p => p.tokenSymbol === project.tokenSymbol);
    if (price) {
      const newUsdValue = project.reserveAmount.toNumber() * price.priceUsd;
      
      await prisma.featuredProject.update({
        where: { id: project.id },
        data: {
          reserveUsdValue: newUsdValue,
        },
      });
      
      // Check if below threshold
      const minThreshold = project.minReserveThreshold.toNumber();
      if (newUsdValue < minThreshold && project.status === 'ACTIVE') {
        await prisma.featuredProject.update({
          where: { id: project.id },
          data: { status: 'LOW_RESERVE' },
        });
        
        console.log(`[Insurance] Project ${project.tokenSymbol} status: ACTIVE → LOW_RESERVE`);
      }
    }
  }
  
  // Recalculate trench total reserves
  const trenches = await prisma.trenchV2.findMany({
    include: { featuredProjects: true },
  });
  
  for (const trench of trenches) {
    const totalReserve = trench.featuredProjects.reduce(
      (sum, p) => sum + p.reserveUsdValue.toNumber(),
      0
    );
    
    await prisma.trenchV2.update({
      where: { id: trench.id },
      data: {
        totalReserveUsd: totalReserve,
      },
    });
  }
}

/**
 * Get insurance events for a trench
 */
export async function getInsuranceEvents(trenchId: string, limit: number = 50) {
  return prisma.insuranceEvent.findMany({
    where: { trenchId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get insurance statistics for platform
 */
export async function getInsuranceStats() {
  const stats = await prisma.insuranceEvent.groupBy({
    by: ['reason'],
    _sum: { amount: true },
    _count: { id: true },
  });
  
  const totalUsed = stats.reduce((sum, s) => sum + (s._sum.amount?.toNumber() || 0), 0);
  
  return {
    totalUsed,
    eventsByReason: stats.map(s => ({
      reason: s.reason,
      count: s._count.id,
      amount: s._sum.amount?.toNumber() || 0,
    })),
  };
}
