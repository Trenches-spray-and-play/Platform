/**
 * GET /api/trenches/v2
 * 
 * Returns exactly 3 trench objects with full details for the 3 Trenches model.
 * Includes insurance buffer, risk indicators, and featured projects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrenchesV2, initializeTrenchesV2 } from '@/services/trenchServiceV2';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Initialize default trenches if none exist
    await initializeTrenchesV2();
    
    // Get trenches with full details
    const trenches = await getTrenchesV2();
    
    // Get platform stats
    const platformStats = await prisma.trenchV2.aggregate({
      _sum: {
        totalReserveUsd: true,
        totalSprayed: true,
      },
    });
    
    const totalSprayers = await prisma.sprayEntryV2.groupBy({
      by: ['userId'],
      _count: { userId: true },
    });
    
    const featuredProjectCount = await prisma.featuredProject.count({
      where: { status: 'ACTIVE' },
    });
    
    // Calculate average APY across all trenches
    const avgApy = trenches.length > 0
      ? trenches.reduce((sum, t) => sum + t.avgApy, 0) / trenches.length
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        trenches: trenches.map(t => ({
          level: t.level,
          name: t.name,
          description: t.description,
          
          // Reserve with insurance
          totalReserveUsd: t.totalReserveUsd,
          insuranceBuffer: t.insuranceBuffer,
          minThreshold: t.minThreshold,
          
          // Status
          status: t.status,
          canSpray: t.canSpray,
          
          // Risk
          riskLevel: t.riskLevel,
          riskIndicators: t.riskIndicators,
          
          // Featured projects
          featuredProjects: t.featuredProjects,
          
          // Composition for bar chart
          reserveComposition: t.reserveComposition,
          
          // Stats
          participantCount: t.participantCount,
          totalSprayed: t.totalSprayed,
          avgApy: t.avgApy,
          duration: t.duration,
          entryRange: t.entryRange,
          themeColor: t.themeColor,
        })),
        platformStats: {
          totalReserveUsd: platformStats._sum.totalReserveUsd?.toNumber() || 0,
          totalSprayers: totalSprayers.length,
          featuredProjectCount,
          avgPlatformApy: Math.round(avgApy * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trenches v2:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trenches' },
      { status: 500 }
    );
  }
}
