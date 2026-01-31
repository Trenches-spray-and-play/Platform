import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin-auth';
import { validateReferralCode, applyReferral } from '@/services/referral.service';

export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/sample-v2/dashboard-v2';

        console.log('[Auth Callback] Triggered:', { hasCode: !!code, next, origin: origin.slice(0, 50) });

        // Check if this is an admin login flow
        const isAdminFlow = next === '/admin' || next.startsWith('/admin');

        if (!code) {
            console.error('[Auth Callback] No code provided');
            const errorRedirect = isAdminFlow ? '/admin/login' : '/login';
            return NextResponse.redirect(`${origin}${errorRedirect}?error=auth_failed`);
        }

        // Initialize response object early so Supabase can write cookies to it
        let response = NextResponse.redirect(`${origin}${next}`);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const cookieStore = await cookies();

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options as CookieOptions);
                    });
                },
            },
        });

        console.log('[Auth Callback] Supabase client created with response-sync');

        // Exchange the code for a session
        console.log('[Auth Callback] Code received, exchanging for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Code exchange failed:', error.message);
        } else if (data.user) {
            console.log('[Auth Callback] Session exchanged successfully for', data.user.email);
        }

        if (error || !data.user) {
            console.error('[Auth Callback] Exchange error:', error);
            const errorRedirect = isAdminFlow ? '/admin/login' : '/login';
            return NextResponse.redirect(`${origin}${errorRedirect}?error=auth_failed`);
        }

        console.log('[Auth Callback] User authenticated:', data.user.email);

        // Debug: Check what cookies are set after exchange
        const allCookies = response.cookies.getAll();
        console.log('[Auth Callback] Cookies in response after exchange:', allCookies.map(c => ({ name: c.name, valueLen: c.value?.length })));

        // Handle admin login flow
        if (isAdminFlow) {
            if (isAdminEmail(data.user.email)) {
                console.log(`[Auth Callback] Admin login: ${data.user.email}`);
                // Re-initialize redirect to preserve cookies
                const adminResponse = NextResponse.redirect(`${origin}/admin`);
                response.cookies.getAll().forEach(c => adminResponse.cookies.set(c.name, c.value, c as any));
                return adminResponse;
            } else {
                await supabase.auth.signOut();
                console.warn(`[Auth Callback] Non-admin login attempt: ${data.user.email}`);
                return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
            }
        }

        // Regular user flow
        try {
            // Check if user exists in database
            let existingUser = await prisma.user.findUnique({
                where: { supabaseId: data.user.id }
            });

            // Get referral code from cookie (set by /ref/[code] page)
            const referralCode = cookieStore.get('referralCode')?.value;
            console.log('[Auth Callback] Referral code from cookie:', referralCode);

            if (!existingUser) {
                console.log('[Auth Callback] New user - creating user record');

                // Create user with potential referral
                const handle = data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`;

                existingUser = await prisma.user.create({
                    data: {
                        supabaseId: data.user.id,
                        email: data.user.email,
                        handle: `@${handle}`,
                    }
                });

                // Apply referral if code exists and is valid
                if (referralCode) {
                    try {
                        const validation = await validateReferralCode(referralCode);
                        if (validation.valid && validation.referrer) {
                            await applyReferral(existingUser.id, validation.referrer.id);
                            console.log(`[Auth Callback] Applied referral ${referralCode} to new user ${existingUser.id}`);

                            // Re-initialize redirect to /register
                            const registerResponse = NextResponse.redirect(`${origin}/register?refApplied=true`);
                            response.cookies.getAll().forEach(c => registerResponse.cookies.set(c.name, c.value, c as any));
                            registerResponse.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
                            return registerResponse;
                        } else {
                            console.log('[Auth Callback] Invalid referral code:', referralCode);
                        }
                    } catch (err) {
                        console.error('[Auth Callback] Error applying referral:', err);
                    }
                }

                // Redirect to registration for new users
                const registerResponse = NextResponse.redirect(`${origin}/register`);
                response.cookies.getAll().forEach(c => registerResponse.cookies.set(c.name, c.value, c as any));
                return registerResponse;
            }

            // Check if user needs to complete registration (has auto-generated handle)
            const autoGeneratedPattern = /^@user_[a-f0-9]{8}$/;
            const emailPrefix = data.user.email?.split('@')[0];
            const hasAutoHandle = autoGeneratedPattern.test(existingUser.handle) ||
                existingUser.handle === `@${emailPrefix}`;

            if (hasAutoHandle) {
                console.log('[Auth Callback] User needs to complete registration');

                // If there's a referral code and user doesn't have a referrer yet, apply it
                if (referralCode && !existingUser.referredById) {
                    try {
                        const validation = await validateReferralCode(referralCode);
                        if (validation.valid && validation.referrer) {
                            await applyReferral(existingUser.id, validation.referrer.id);
                            console.log(`[Auth Callback] Applied referral ${referralCode} to existing user ${existingUser.id}`);

                            // Re-initialize redirect to /register
                            const registerResponse = NextResponse.redirect(`${origin}/register?refApplied=true`);
                            response.cookies.getAll().forEach(c => registerResponse.cookies.set(c.name, c.value, c as any));
                            registerResponse.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
                            return registerResponse;
                        }
                    } catch (err) {
                        console.error('[Auth Callback] Error applying referral to existing user:', err);
                    }
                }

                const registerResponse = NextResponse.redirect(`${origin}/register`);
                response.cookies.getAll().forEach(c => registerResponse.cookies.set(c.name, c.value, c as any));
                return registerResponse;
            }

            console.log('[Auth Callback] Existing user with custom handle - redirecting to dashboard');

            // User has completed registration - clear any stale referral cookie
            response.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
            return response;

        } catch (dbError: any) {
            console.error('[Auth Callback] Database error:', dbError);
            // If DB fails, still redirect to dashboard - user is authenticated with Supabase
            return response;
        }
    } catch (err: any) {
        console.error('[Auth Callback] Fatal error:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://playtrenches.xyz'}/login?error=auth_failed`);
    }
}
