/**
 * Trench Service V2 - 3 Trenches Model with Insurance
 * 
 * Features:
 * - Insurance buffer (10% of total reserve)
 * - Reserve thresholds (20%/10%/5%)
 * - Risk level calculation
 * - Status management
 */

import { prisma } from '@/lib/db';
import type { TrenchV2, FeaturedProject, TrenchStatusV2 } from '@prisma/client';

// Constants
const INSURANCE_BUFFER_PERCENT = 0.10; // 10%
const THRESHOLD_CAUTION = 0.20; // 20%
const THRESHOLD_PAUSED = 0.10; // 10%
const THRESHOLD_EMERGENCY = 0.05; // 5%

export interface TrenchWithProjects extends TrenchV2 {
  featuredProjects: FeaturedProject[];
}

export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: TrenchStatusV2;
  bufferPercent: number;
  reserveHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  canSpray: boolean;
}

export interface TrenchDisplay {
  level: string;
  name: string;
  description: string;
  
  // Reserve
  totalReserveUsd: number;
  insuranceBuffer: number;
  minThreshold: number;
  
  // Status
  status: TrenchStatusV2;
  canSpray: boolean;
  
  // Risk
  riskLevel: string;
  riskIndicators: {
    insuranceBufferPercent: number;
    reserveHealth: string;
  };
  
  // Projects
  featuredProjects: FeaturedProjectDisplay[];
  reserveComposition: ReserveComposition[];
  
  // Stats
  participantCount: number;
  totalSprayed: number;
  avgApy: number;
  duration: string;
  entryRange: { min: number; max: number };
  themeColor: string;
}

export interface FeaturedProjectDisplay {
  id: string;
  name: string;
  tokenSymbol: string;
  tokenAddress: string;
  logoUrl?: string;
  reserveUsd: number;
  proportion: number;
  status: string;
  apy: number;
}

export interface ReserveComposition {
  tokenSymbol: string;
  percentage: number;
  usdValue: number;
}

/**
 * Calculate risk level and status based on insurance buffer
 */
export function calculateRiskAssessment(trench: TrenchV2): RiskAssessment {
  const bufferPercent = trench.totalReserveUsd > 0
    ? (trench.insuranceBuffer / trench.totalReserveUsd) * 100
    : 0;
  
  // Determine status based on thresholds
  if (bufferPercent >= THRESHOLD_CAUTION * 100) {
    return {
      level: 'LOW',
      status: 'ACTIVE',
      bufferPercent,
      reserveHealth: 'HEALTHY',
      canSpray: true,
    };
  }
  
  if (bufferPercent >= THRESHOLD_PAUSED * 100) {
    return {
      level: 'MEDIUM',
      status: 'ACTIVE',
      bufferPercent,
      reserveHealth: 'WARNING',
      canSpray: true,
    };
  }
  
  if (bufferPercent >= THRESHOLD_EMERGENCY * 100) {
    return {
      level: 'HIGH',
      status: 'PAUSED',
      bufferPercent,
      reserveHealth: 'CRITICAL',
      canSpray: false,
    };
  }
  
  return {
    level: 'CRITICAL',
    status: 'EMERGENCY',
    bufferPercent,
    reserveHealth: 'CRITICAL',
    canSpray: false,
  };
}

/**
 * Get all trenches with full details for display
 */
export async function getTrenchesV2(): Promise<TrenchDisplay[]> {
  const trenches = await prisma.trenchV2.findMany({
    include: {
      featuredProjects: {
        where: { status: 'ACTIVE' },
        orderBy: { reserveUsdValue: 'desc' },
      },
    },
    orderBy: { level: 'asc' },
  });
  
  return trenches.map(trench => formatTrenchForDisplay(trench));
}

/**
 * Get single trench by level
 */
export async function getTrenchByLevel(level: string): Promise<TrenchDisplay | null> {
  const trench = await prisma.trenchV2.findFirst({
    where: { level: level.toUpperCase() as any },
    include: {
      featuredProjects: {
        where: { status: 'ACTIVE' },
        orderBy: { reserveUsdValue: 'desc' },
      },
    },
  });
  
  if (!trench) return null;
  return formatTrenchForDisplay(trench);
}

/**
 * Format trench for API response
 */
function formatTrenchForDisplay(trench: TrenchWithProjects): TrenchDisplay {
  const risk = calculateRiskAssessment(trench);
  const totalReserve = trench.totalReserveUsd.toNumber();
  
  // Calculate reserve composition
  const composition = calculateReserveComposition(trench.featuredProjects, totalReserve);
  
  // Calculate average APY
  const avgApy = trench.featuredProjects.length > 0
    ? trench.featuredProjects.reduce((sum, p) => sum + p.promisedApy.toNumber(), 0) / trench.featuredProjects.length
    : 0;
  
  return {
    level: trench.level,
    name: getTrenchName(trench.level),
    description: getTrenchDescription(trench.level),
    
    totalReserveUsd: totalReserve,
    insuranceBuffer: trench.insuranceBuffer.toNumber(),
    minThreshold: trench.minReserveThreshold.toNumber(),
    
    status: risk.status,
    canSpray: risk.canSpray,
    
    riskLevel: risk.level,
    riskIndicators: {
      insuranceBufferPercent: risk.bufferPercent,
      reserveHealth: risk.reserveHealth,
    },
    
    featuredProjects: trench.featuredProjects.map(p => ({
      id: p.id,
      name: p.name,
      tokenSymbol: p.tokenSymbol,
      tokenAddress: p.tokenAddress,
      logoUrl: p.logoUrl ?? undefined,
      reserveUsd: p.reserveUsdValue.toNumber(),
      proportion: p.reserveProportion.toNumber(),
      status: p.status,
      apy: p.promisedApy.toNumber(),
    })),
    
    reserveComposition: composition,
    
    participantCount: trench.participantCount,
    totalSprayed: trench.totalSprayed.toNumber(),
    avgApy: Math.round(avgApy * 10) / 10,
    duration: getTrenchDuration(trench.level),
    entryRange: getTrenchEntryRange(trench.level),
    themeColor: getTrenchThemeColor(trench.level),
  };
}

/**
 * Calculate reserve composition percentages
 */
function calculateReserveComposition(
  projects: FeaturedProject[],
  totalReserve: number
): ReserveComposition[] {
  if (totalReserve === 0 || projects.length === 0) {
    return [];
  }
  
  return projects.map(p => ({
    tokenSymbol: p.tokenSymbol,
    percentage: Math.round((p.reserveUsdValue.toNumber() / totalReserve) * 100),
    usdValue: p.reserveUsdValue.toNumber(),
  }));
}

/**
 * Update trench status based on current reserve health
 */
export async function updateTrenchStatus(trenchId: string): Promise<void> {
  const trench = await prisma.trenchV2.findUnique({
    where: { id: trenchId },
  });
  
  if (!trench) return;
  
  const risk = calculateRiskAssessment(trench);
  
  // Only update if status changed
  if (risk.status !== trench.status) {
    await prisma.trenchV2.update({
      where: { id: trenchId },
      data: { status: risk.status },
    });
    
    // Log the status change
    console.log(`[TrenchV2] Status changed for ${trench.level}: ${trench.status} → ${risk.status}`);
  }
}

/**
 * Initialize default trenches (RAPID, MID, DEEP)
 */
export async function initializeTrenchesV2(): Promise<void> {
  const existingCount = await prisma.trenchV2.count();
  if (existingCount > 0) {
    console.log('[TrenchV2] Trenches already initialized');
    return;
  }
  
  const defaultTrenches = [
    {
      level: 'RAPID',
      totalReserveUsd: 0,
      insuranceBuffer: 0,
      minReserveThreshold: 0,
    },
    {
      level: 'MID',
      totalReserveUsd: 0,
      insuranceBuffer: 0,
      minReserveThreshold: 0,
    },
    {
      level: 'DEEP',
      totalReserveUsd: 0,
      insuranceBuffer: 0,
      minReserveThreshold: 0,
    },
  ];
  
  for (const trench of defaultTrenches) {
    await prisma.trenchV2.create({ data: trench as any });
  }
  
  console.log('[TrenchV2] Default trenches initialized');
}

// Helper functions
function getTrenchName(level: string): string {
  const names: Record<string, string> = {
    'RAPID': 'Rapid Trench',
    'MID': 'Mid Trench',
    'DEEP': 'Deep Trench',
  };
  return names[level] || level;
}

function getTrenchDescription(level: string): string {
  const descriptions: Record<string, string> = {
    'RAPID': 'Quick rotations, 1-3 days',
    'MID': 'Balanced growth, 7-14 days',
    'DEEP': 'Maximum yield, 30-60 days',
  };
  return descriptions[level] || '';
}

function getTrenchDuration(level: string): string {
  const durations: Record<string, string> = {
    'RAPID': '1-3 days',
    'MID': '7-14 days',
    'DEEP': '30-60 days',
  };
  return durations[level] || '';
}

function getTrenchEntryRange(level: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    'RAPID': { min: 5, max: 1000 },
    'MID': { min: 100, max: 10000 },
    'DEEP': { min: 1000, max: 100000 },
  };
  return ranges[level] || { min: 0, max: 0 };
}

function getTrenchThemeColor(level: string): string {
  const colors: Record<string, string> = {
    'RAPID': '#00FF66',
    'MID': '#2ECC71',
    'DEEP': '#1E8449',
  };
  return colors[level] || '#00FF66';
}
