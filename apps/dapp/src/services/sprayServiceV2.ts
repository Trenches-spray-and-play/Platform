/**
 * Spray Service V2 - 3 Trenches Model
 * 
 * Features:
 * - 0.5% deposit fee
 * - Proportional allocation to featured projects
 * - Insurance tracking
 * - Payout calculation
 */

import { prisma } from '@/lib/db';
import { calculateRiskAssessment } from './trenchServiceV2';
import type { TrenchV2, FeaturedProject } from '@prisma/client';

// Constants
const DEPOSIT_FEE_PERCENT = 0.005; // 0.5%
const DEFAULT_APY = 1.5; // 1.5x = 50% return

export interface SprayAllocation {
  projectId: string;
  tokenSymbol: string;
  amount: number;
  usdValue: number;
  proportion: number;
}

export interface SprayResult {
  sprayId: string;
  amount: number;
  fee: number;
  effectiveAmount: number;
  allocation: SprayAllocation[];
  expectedPayout: {
    amount: number;
    date: Date;
  };
  riskLevel: string;
  insuranceBuffer: number;
}

export interface SprayValidation {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate spray request
 */
export async function validateSpray(
  userId: string,
  trenchId: string,
  amount: number
): Promise<SprayValidation> {
  // Check trench exists and is active
  const trench = await prisma.trenchV2.findUnique({
    where: { id: trenchId },
    include: { featuredProjects: { where: { status: 'ACTIVE' } } },
  });
  
  if (!trench) {
    return { valid: false, error: 'Trench not found', code: 'TRENCH_NOT_FOUND' };
  }
  
  // Check trench status
  const risk = calculateRiskAssessment(trench);
  if (!risk.canSpray) {
    return { 
      valid: false, 
      error: `Trench is ${trench.status.toLowerCase()}. Sprays are temporarily disabled.`,
      code: 'TRENCH_INACTIVE',
    };
  }
  
  // Check minimum amount
  const minAmount = getTrenchMinAmount(trench.level);
  if (amount < minAmount) {
    return { 
      valid: false, 
      error: `Minimum spray amount is $${minAmount}`,
      code: 'MIN_AMOUNT_NOT_MET',
    };
  }
  
  // Check maximum amount
  const maxAmount = getTrenchMaxAmount(trench.level);
  if (amount > maxAmount) {
    return { 
      valid: false, 
      error: `Maximum spray amount is $${maxAmount}`,
      code: 'MAX_AMOUNT_EXCEEDED',
    };
  }
  
  // Check user has featured projects to allocate to
  if (trench.featuredProjects.length === 0) {
    return { 
      valid: false, 
      error: 'No active projects in this trench',
      code: 'NO_ACTIVE_PROJECTS',
    };
  }
  
  return { valid: true };
}

/**
 * Calculate spray allocation across featured projects
 */
export function calculateAllocation(
  amount: number,
  projects: FeaturedProject[],
  totalReserveUsd: number
): SprayAllocation[] {
  const allocations: SprayAllocation[] = [];
  
  for (const project of projects) {
    if (project.status !== 'ACTIVE') continue;
    
    // Proportional allocation based on reserve contribution
    const proportion = totalReserveUsd > 0
      ? project.reserveUsdValue.toNumber() / totalReserveUsd
      : 1 / projects.length;
    
    const allocation = amount * proportion;
    
    allocations.push({
      projectId: project.id,
      tokenSymbol: project.tokenSymbol,
      amount: Math.round(allocation * 100) / 100,
      usdValue: Math.round(allocation * 100) / 100,
      proportion: Math.round(proportion * 10000) / 10000,
    });
  }
  
  return allocations;
}

/**
 * Process a spray request
 */
export async function processSpray(
  userId: string,
  trenchId: string,
  amount: number
): Promise<SprayResult> {
  // Validate
  const validation = await validateSpray(userId, trenchId, amount);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Get trench
  const trench = await prisma.trenchV2.findUnique({
    where: { id: trenchId },
    include: { featuredProjects: { where: { status: 'ACTIVE' } } },
  });
  
  if (!trench) {
    throw new Error('Trench not found');
  }
  
  // Calculate fee
  const fee = amount * DEPOSIT_FEE_PERCENT;
  const effectiveAmount = amount - fee;
  
  // Calculate allocation
  const allocation = calculateAllocation(
    effectiveAmount,
    trench.featuredProjects,
    trench.totalReserveUsd.toNumber()
  );
  
  // Calculate expected payout (1.5x default)
  const avgApy = trench.featuredProjects.length > 0
    ? trench.featuredProjects.reduce((sum, p) => sum + p.promisedApy.toNumber(), 0) / trench.featuredProjects.length
    : DEFAULT_APY;
  
  const expectedPayout = effectiveAmount * avgApy;
  
  // Calculate payout date based on trench level
  const payoutDate = calculatePayoutDate(trench.level);
  
  // Create spray entry
  const spray = await prisma.sprayEntryV2.create({
    data: {
      userId,
      trenchId,
      amount,
      fee,
      effectiveAmount,
      allocation: JSON.stringify(allocation),
      expectedPayout,
      payoutDate,
      status: 'PENDING',
    },
  });
  
  // Update trench stats
  await prisma.trenchV2.update({
    where: { id: trenchId },
    data: {
      totalSprayed: { increment: amount },
      totalFeesCollected: { increment: fee },
    },
  });
  
  // Get risk info
  const risk = calculateRiskAssessment(trench);
  
  return {
    sprayId: spray.id,
    amount,
    fee,
    effectiveAmount,
    allocation,
    expectedPayout: {
      amount: expectedPayout,
      date: payoutDate,
    },
    riskLevel: risk.level,
    insuranceBuffer: trench.insuranceBuffer.toNumber(),
  };
}

/**
 * Get spray details with current token values
 */
export async function getSprayDetails(sprayId: string) {
  const spray = await prisma.sprayEntryV2.findUnique({
    where: { id: sprayId },
    include: {
      trench: {
        include: { featuredProjects: true },
      },
    },
  });
  
  if (!spray) {
    throw new Error('Spray not found');
  }
  
  const allocation = JSON.parse(spray.allocation) as SprayAllocation[];
  
  return {
    ...spray,
    allocation,
    effectiveAmount: spray.effectiveAmount.toNumber(),
    expectedPayout: spray.expectedPayout.toNumber(),
  };
}

/**
 * Calculate payout date based on trench level
 */
function calculatePayoutDate(level: string): Date {
  const now = new Date();
  
  const durations: Record<string, number> = {
    'RAPID': 3, // 3 days
    'MID': 14, // 14 days
    'DEEP': 30, // 30 days
  };
  
  const days = durations[level] || 3;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get minimum amount for trench level
 */
function getTrenchMinAmount(level: string): number {
  const amounts: Record<string, number> = {
    'RAPID': 5,
    'MID': 100,
    'DEEP': 1000,
  };
  return amounts[level] || 5;
}

/**
 * Get maximum amount for trench level
 */
function getTrenchMaxAmount(level: string): number {
  const amounts: Record<string, number> = {
    'RAPID': 1000,
    'MID': 10000,
    'DEEP': 100000,
  };
  return amounts[level] || 1000;
}

/**
 * Preview spray allocation (without creating entry)
 */
export async function previewSpray(
  trenchId: string,
  amount: number
): Promise<{
  fee: number;
  effectiveAmount: number;
  allocation: SprayAllocation[];
  expectedPayout: number;
  riskLevel: string;
}> {
  const trench = await prisma.trenchV2.findUnique({
    where: { id: trenchId },
    include: { featuredProjects: { where: { status: 'ACTIVE' } } },
  });
  
  if (!trench) {
    throw new Error('Trench not found');
  }
  
  const fee = amount * DEPOSIT_FEE_PERCENT;
  const effectiveAmount = amount - fee;
  
  const allocation = calculateAllocation(
    effectiveAmount,
    trench.featuredProjects,
    trench.totalReserveUsd.toNumber()
  );
  
  const avgApy = trench.featuredProjects.length > 0
    ? trench.featuredProjects.reduce((sum, p) => sum + p.promisedApy.toNumber(), 0) / trench.featuredProjects.length
    : DEFAULT_APY;
  
  const expectedPayout = effectiveAmount * avgApy;
  const risk = calculateRiskAssessment(trench);
  
  return {
    fee,
    effectiveAmount,
    allocation,
    expectedPayout,
    riskLevel: risk.level,
  };
}
