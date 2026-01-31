import { NextResponse } from 'next/server';
import { getTrenchGroups, clearCampaignsCache } from '@/services/trenchService';

/**
 * GET /api/trenches - Get campaigns grouped by trench level
 * 
 * Cache strategy: 
 * - In-memory: 30 seconds (reduces DB queries)
 * - CDN/Edge: 60 seconds with stale-while-revalidate for 5 minutes
 * - Campaigns don't change frequently, so this reduces database load significantly
 */
export async function GET() {
    const startTime = performance.now();
    
    try {
        const data = await getTrenchGroups();
        
        const duration = performance.now() - startTime;
        console.log(`[PERF] /api/trenches completed in ${duration.toFixed(2)}ms`);

        const response = NextResponse.json({
            data,
            meta: {
                updatedAt: new Date().toISOString(),
                totalLevels: data.length,
                responseTimeMs: Math.round(duration),
            },
        });

        // Aggressive caching to reduce DB load:
        // - s-maxage=60: Cache on CDN/server for 60 seconds
        // - stale-while-revalidate=300: Serve stale content for 5 min while refreshing
        // - This means users get instant responses after first request
        response.headers.set(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=300'
        );

        return response;
    } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`[PERF] /api/trenches failed after ${duration.toFixed(2)}ms:`, error);
        
        return NextResponse.json(
            { error: 'Failed to fetch trenches' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/trenches - Clear the campaigns cache (admin use)
 * Call this when campaigns are updated to refresh the cache immediately
 */
export async function POST() {
    clearCampaignsCache();
    return NextResponse.json({ 
        success: true, 
        message: 'Campaigns cache cleared' 
    });
}
