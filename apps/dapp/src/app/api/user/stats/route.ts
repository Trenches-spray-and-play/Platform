import { NextResponse } from 'next/server';
import { getUserBeliefStats } from '@/services/belief.service';

// GET /api/user/stats?userId=xxx - Get user belief stats
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId is required' },
                { status: 400 }
            );
        }

        const stats = await getUserBeliefStats(userId);

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user stats' },
            { status: 500 }
        );
    }
}
