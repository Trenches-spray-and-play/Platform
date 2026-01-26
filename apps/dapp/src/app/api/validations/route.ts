import { NextResponse } from 'next/server';
import { validatePost } from '@/services/belief.service';

// POST /api/validations - Submit a validation for a post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, validatorId, rating, proofUrl, endorsed } = body;

        if (!postId || !validatorId || rating === undefined || endorsed === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: postId, validatorId, rating, endorsed' },
                { status: 400 }
            );
        }

        const validation = await validatePost({
            postId,
            validatorId,
            rating,
            proofUrl,
            endorsed,
        });

        return NextResponse.json({
            success: true,
            data: validation,
            message: endorsed
                ? 'Post endorsed! Boost points awarded.'
                : 'Validation submitted.',
        });
    } catch (error) {
        console.error('Error submitting validation:', error);
        const message = error instanceof Error ? error.message : 'Failed to submit validation';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
