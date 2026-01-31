import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getUserProfile } from '@/services/userService';

/**
 * GET /api/user - Get current authenticated user's profile
 */
export async function GET(request: Request) {
    try {
        console.log('[API /user] Request received');

        // Debug: Log all cookies from the request
        const cookieHeader = request.headers.get('cookie');
        console.log('[API /user] All cookies:', cookieHeader?.slice(0, 500));

        const session = await getSession();
        console.log('[API /user] Session result:', { hasSession: !!session, userId: session?.id });

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await getUserProfile(session.id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user - Update user profile (wallet address)
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { wallet, walletEvm, walletSol } = await request.json();

        const updated = await prisma.user.update({
            where: { id: session.id },
            data: {
                ...(wallet !== undefined && { wallet }),
                ...(walletEvm !== undefined && { walletEvm }),
                ...(walletSol !== undefined && { walletSol }),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                wallet: updated.wallet,
                walletEvm: updated.walletEvm,
                walletSol: updated.walletSol,
            },
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
