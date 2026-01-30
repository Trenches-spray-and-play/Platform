import { createClient } from '@/lib/supabase/server';
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

        const supabase = await createClient();
        console.log('[Auth Callback] Supabase client created');

        // Exchange the code for a session
        console.log('[Auth Callback] Code received, exchanging for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Code exchange failed:', error.message);
        } else if (data.user) {
            console.log('[Auth Callback] Session exchanged successfully for', data.user.email);
        }

        console.log('[Auth Callback] Exchange result:', {
            hasUser: !!data.user,
            error: error?.message,
            hasSession: !!data.session,
            userEmail: data.user?.email
        });

        if (error || !data.user) {
            console.error('[Auth Callback] Exchange error:', error);
            const errorRedirect = isAdminFlow ? '/admin/login' : '/login';
            return NextResponse.redirect(`${origin}${errorRedirect}?error=auth_failed`);
        }

        console.log('[Auth Callback] User authenticated:', data.user.email);

        // Debug: Check what cookies are set after exchange
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const authCookies = allCookies.filter(c => c.name.includes('auth') || c.name.includes('supabase'));
        console.log('[Auth Callback] Cookies after exchange:', authCookies.map(c => ({ name: c.name, valueLen: c.value?.length })));

        // Handle admin login flow
        if (isAdminFlow) {
            if (isAdminEmail(data.user.email)) {
                console.log(`[Auth Callback] Admin login: ${data.user.email}`);
                return NextResponse.redirect(`${origin}/admin`);
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
                            
                            // Clear the referral cookie since we've applied it
                            const response = NextResponse.redirect(`${origin}/register?refApplied=true`);
                            response.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
                            return response;
                        } else {
                            console.log('[Auth Callback] Invalid referral code:', referralCode);
                        }
                    } catch (err) {
                        console.error('[Auth Callback] Error applying referral:', err);
                    }
                }
                
                // Redirect to registration for new users
                return NextResponse.redirect(`${origin}/register`);
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
                            
                            // Clear the referral cookie
                            const response = NextResponse.redirect(`${origin}/register?refApplied=true`);
                            response.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
                            return response;
                        }
                    } catch (err) {
                        console.error('[Auth Callback] Error applying referral to existing user:', err);
                    }
                }
                
                return NextResponse.redirect(`${origin}/register`);
            }

            console.log('[Auth Callback] Existing user with custom handle - redirecting to dashboard');

            // User has completed registration - clear any stale referral cookie
            const response = NextResponse.redirect(`${origin}${next}`);
            response.cookies.set('referralCode', '', { maxAge: 0, path: '/' });
            return response;
            
        } catch (dbError: any) {
            console.error('[Auth Callback] Database error:', dbError);
            // If DB fails, still redirect to dashboard - user is authenticated with Supabase
            return NextResponse.redirect(`${origin}${next}`);
        }
    } catch (err: any) {
        console.error('[Auth Callback] Fatal error:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://trenches-dapp.vercel.app'}/login?error=auth_failed`);
    }
}
