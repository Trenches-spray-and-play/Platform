import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

/**
 * POST /api/admin/auth - Authenticate admin with secret key
 * Sets secure httpOnly session cookie on success
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adminKey } = body;

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
            console.warn('Failed admin authentication attempt');
            return NextResponse.json(
                { success: false, error: 'Invalid admin key' },
                { status: 401 }
            );
        }

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
