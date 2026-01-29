import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates the Supabase session in middleware.
 * Call this in your middleware.ts to refresh expired sessions.
 *
 * Note: This is kept local to each app due to Next.js type version constraints in monorepos.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options as CookieOptions)
                );
            },
        },
    });

    // Refresh session if expired - this is crucial for maintaining the session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
        console.log('[Middleware] Session found for:', user.email);
    } else if (error) {
        console.log('[Middleware] No valid session:', error.message);
    }

    return supabaseResponse;
}
