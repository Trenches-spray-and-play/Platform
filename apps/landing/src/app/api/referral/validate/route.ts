import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit';

// Validate a referral code exists in the database
export async function GET(request: Request) {
    // Apply rate limiting - 10 requests per minute per IP
    const { limited, response: rateLimitResponse, rateLimitResult } = await rateLimit(request, 'referralValidate');
    if (limited) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        const response = NextResponse.json({
            valid: false,
            error: 'Missing referral code'
        }, { status: 400 });
        return addRateLimitHeaders(response, rateLimitResult);
    }

    try {
        const referrer = await prisma.user.findUnique({
            where: { referralCode: code.toUpperCase() },
            select: {
                id: true,
                handle: true,
                referralCode: true
            }
        });

        if (referrer) {
            const response = NextResponse.json({
                valid: true,
                referrer: {
                    handle: referrer.handle,
                    code: referrer.referralCode
                }
            });
            return addRateLimitHeaders(response, rateLimitResult);
        }

        const response = NextResponse.json({
            valid: false,
            error: 'Invalid referral code'
        });
        return addRateLimitHeaders(response, rateLimitResult);
    } catch (error) {
        console.error('Referral validation error:', error);
        const response = NextResponse.json({
            valid: false,
            error: 'Failed to validate referral code'
        }, { status: 500 });
        return addRateLimitHeaders(response, rateLimitResult);
    }
}
