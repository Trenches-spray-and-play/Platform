import { NextResponse } from 'next/server';
import { getTrenchQueue, getQueueStats } from '@/services/queue.service';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: trenchId } = await params;

        // Get queue with positions
        const queue = await getTrenchQueue(trenchId);
        const stats = await getQueueStats(trenchId);

        return NextResponse.json({
            success: true,
            data: {
                queue,
                stats,
            },
        });
    } catch (error) {
        console.error('Error fetching queue:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch queue' },
            { status: 500 }
        );
    }
}
