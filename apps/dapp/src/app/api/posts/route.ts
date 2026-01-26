import { NextResponse } from 'next/server';
import { submitPost, getReviewPool } from '@/services/belief.service';

// POST /api/posts - Submit a new post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, platform, url, contentType } = body;

        if (!userId || !platform || !url || !contentType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, platform, url, contentType' },
                { status: 400 }
            );
        }

        const post = await submitPost({ userId, platform, url, contentType });

        return NextResponse.json({
            success: true,
            data: post,
        });
    } catch (error) {
        console.error('Error submitting post:', error);
        const message = error instanceof Error ? error.message : 'Failed to submit post';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// GET /api/posts?validatorId=xxx - Get review pool for validator
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const validatorId = searchParams.get('validatorId');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        if (!validatorId) {
            return NextResponse.json(
                { success: false, error: 'validatorId is required' },
                { status: 400 }
            );
        }

        const posts = await getReviewPool(validatorId, limit);

        return NextResponse.json({
            success: true,
            data: posts,
        });
    } catch (error) {
        console.error('Error fetching review pool:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch review pool' },
            { status: 500 }
        );
    }
}
