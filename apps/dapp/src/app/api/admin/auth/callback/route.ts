import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin-auth';

/**
 * GET /api/admin/auth/callback - Handle OAuth callback for admin login
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createClient();

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Admin OAuth callback error:', error);
            return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
        }

        // Verify the user is an admin
        const userEmail = data.user?.email;

        if (!isAdminEmail(userEmail)) {
            // Sign out the non-admin user
            await supabase.auth.signOut();

            console.warn(`Non-admin login attempt: ${userEmail}`);
            return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
        }

        // Admin verified - redirect to admin panel
        return NextResponse.redirect(`${origin}/admin`);
    }

    // No code provided
    return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
}
