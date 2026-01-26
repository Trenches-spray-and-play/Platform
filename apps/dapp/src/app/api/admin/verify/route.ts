import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * GET /api/admin/verify - Verify admin authentication status
 */
export async function GET() {
    const admin = await getAdminSession();

    if (!admin) {
        return NextResponse.json(
            { authenticated: false, error: 'Not authenticated or not authorized' },
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: true,
        admin: {
            email: admin.email,
            handle: admin.handle,
        },
    });
}
