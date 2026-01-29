/**
 * Email Confirmation Link Handler
 * 
 * GET - Confirm address and start 24h countdown
 */

import { NextResponse } from 'next/server';
import { confirmAddress } from '@/services/address-book.service';

/**
 * GET /api/user/addresses/confirm/[token]
 * Confirm address email and start 24h activation countdown
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    if (!token) {
        return NextResponse.json(
            { success: false, error: 'Token required' },
            { status: 400 }
        );
    }

    try {
        const result = await confirmAddress(token);

        if (!result.success) {
            // Redirect to error page
            return NextResponse.redirect(
                new URL(`/settings/addresses?error=${encodeURIComponent(result.error || 'Confirmation failed')}`,
                    process.env.NEXT_PUBLIC_APP_URL || 'https://playtrenches.xyz')
            );
        }

        // Redirect to success page
        return NextResponse.redirect(
            new URL('/settings/addresses?confirmed=true',
                process.env.NEXT_PUBLIC_APP_URL || 'https://playtrenches.xyz')
        );
    } catch (error) {
        console.error('Error confirming address:', error);
        return NextResponse.redirect(
            new URL('/settings/addresses?error=Server%20error',
                process.env.NEXT_PUBLIC_APP_URL || 'https://playtrenches.xyz')
        );
    }
}
