import { NextResponse } from 'next/server';
import { getCachedReserve, refreshReserveCache, ROUNDING_OPTIONS } from '@/services/reserve.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/reserves?campaignId=xxx - Get cached reserve balance
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');

        if (campaignId) {
            // Get specific campaign reserve
            const reserve = await getCachedReserve(campaignId);
            return NextResponse.json({
                success: true,
                data: { reserve },
            });
        }

        // Get all active campaigns with their reserves
        const campaigns = await prisma.campaignConfig.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                trenchIds: true,
                tokenSymbol: true,
                reserveCachedBalance: true,
                reserveCacheUpdatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: campaigns,
        });
    } catch (error) {
        console.error('Error fetching reserves:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reserves' },
            { status: 500 }
        );
    }
}

// POST /api/reserves - Force refresh reserve cache
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaignId } = body;

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'campaignId is required' },
                { status: 400 }
            );
        }

        const reserve = await refreshReserveCache(campaignId);

        return NextResponse.json({
            success: true,
            data: { reserve },
            message: 'Reserve cache refreshed',
        });
    } catch (error) {
        console.error('Error refreshing reserve:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to refresh reserve' },
            { status: 500 }
        );
    }
}

// GET rounding options
export async function OPTIONS() {
    return NextResponse.json({
        success: true,
        data: ROUNDING_OPTIONS,
    });
}
