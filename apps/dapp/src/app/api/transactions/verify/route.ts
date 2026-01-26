import { NextResponse } from 'next/server';
import { scanRecentBlocks } from '@/services/blockchain.monitor';

/**
 * Manually trigger verification scan (for testing/debugging)
 * In production, this should be called by a scheduled job or event
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const blockCount = body.blockCount || 10;

        await scanRecentBlocks(blockCount);

        return NextResponse.json({
            success: true,
            message: `Scanned last ${blockCount} blocks`,
        });
    } catch (error) {
        console.error('Error in manual verification:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
