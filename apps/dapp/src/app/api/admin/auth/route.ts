import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { redis } from '@/lib/redis';

const RATE_LIMIT_MAX = 5; // attempts
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds

/**
 * POST /api/admin/auth - Authenticate admin with secret key
 * Sets secure httpOnly session cookie on success
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adminKey } = body;

        // Get IP address for rate limiting
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const rateLimitKey = `admin_auth:${ip}`;

        // Check rate limit
        const attempts = await redis.get<number>(rateLimitKey) || 0;
        if (attempts >= RATE_LIMIT_MAX) {
            console.warn(`Admin auth rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
                { status: 429 }
            );
        }

        // Validate request
        if (!adminKey || typeof adminKey !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Admin key is required' },
                { status: 400 }
            );
        }

        // Get expected key from environment variable
        const expectedKey = process.env.ADMIN_SECRET_KEY;

        // Check if ADMIN_SECRET_KEY is configured
        if (!expectedKey) {
            console.error('ADMIN_SECRET_KEY environment variable is not set');
            return NextResponse.json(
                { success: false, error: 'Authentication service unavailable' },
                { status: 503 }
            );
        }

        // Validate the admin key
        if (adminKey !== expectedKey) {
            console.warn(`Failed admin authentication attempt for IP: ${ip}`);
            // Increment rate limit counter
            await redis.set(rateLimitKey, attempts + 1, { ex: RATE_LIMIT_WINDOW });

            return NextResponse.json(
                { success: false, error: 'Invalid admin key' },
                { status: 401 }
            );
        }

        // On success, reset rate limit
        await redis.del(rateLimitKey);

        // Generate secure session token
        const sessionToken = randomBytes(32).toString('hex');
        const sessionExpiry = new Date();
        sessionExpiry.setHours(sessionExpiry.getHours() + 8); // 8 hour session

        // Set secure httpOnly cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: sessionExpiry,
            path: '/',
        });

        // Set a non-httpOnly cookie for client-side session awareness
        cookieStore.set('admin_auth', 'true', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: sessionExpiry,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            message: 'Authentication successful',
            expiresAt: sessionExpiry.toISOString(),
        });
    } catch (error) {
        console.error('Admin authentication error:', error);
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/auth - Logout admin
 * Clears session cookies
 */
export async function DELETE() {
    const cookieStore = await cookies();

    // Clear session cookies
    cookieStore.delete('admin_session');
    cookieStore.delete('admin_auth');

    return NextResponse.json({
        success: true,
        message: 'Logged out successfully',
    });
}
