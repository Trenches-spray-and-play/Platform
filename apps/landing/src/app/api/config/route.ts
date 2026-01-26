import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

// Public read-only endpoint for platform config
export async function GET(request: Request) {
    // Apply rate limiting - general rate (60 requests per minute)
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'general');
    if (limited) return rateLimitResponse;

    try {
        let config = await prisma.platformConfig.findUnique({
            where: { id: 'default' }
        });

        if (!config) {
            // Return default values if config doesn't exist
            const response = NextResponse.json({
                id: 'default',
                deploymentDate: null,
                telegramUrl: 'https://t.me/trenchesprotocol',
                twitterUrl: 'https://x.com/traboraofficial',
                twitterHandle: '@traboraofficial',
                onboardingTweetText: 'Just enlisted in the @traboraofficial deployment queue. Spray and Pray! 🔫',
                platformName: 'Trenches',
                referralDomain: 'playtrenches.xyz',
                waitlistStatusMessage: 'WAITLIST PROTOCOL ACTIVE',
                deploymentStatusMessage: 'DEPLOYMENT WINDOW OPEN',
            });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        const response = NextResponse.json(config);
        return addRateLimitHeaders(response, rateLimitResult);
    } catch (error) {
        console.error('Failed to fetch config:', error);
        const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        return addRateLimitHeaders(response, rateLimitResult);
    }
}
