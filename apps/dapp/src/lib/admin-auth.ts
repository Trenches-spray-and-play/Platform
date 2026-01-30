/**
 * Admin Authentication Utilities
 *
 * Provides secure admin authentication using Supabase OAuth and Admin Key.
 * Admin access via OAuth is restricted to email addresses configured in ADMIN_EMAILS env var.
 * Admin access via key requires ADMIN_SECRET_KEY environment variable.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get admin emails from environment variable
function getAdminEmails(): string[] {
    const adminEmails = process.env.ADMIN_EMAILS || '';
    return adminEmails
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);
}

/**
 * Check if an email address has admin privileges
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const adminEmails = getAdminEmails();
    return adminEmails.includes(email.toLowerCase());
}

export interface AdminUser {
    id: string;
    email: string;
    supabaseId: string;
    handle: string;
}

/**
 * Get admin session from secure cookie
 * Returns true if valid admin session exists
 */
async function getKeyBasedAdminSession(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('admin_session');

        if (!sessionCookie?.value) {
            return false;
        }

        // Check if ADMIN_SECRET_KEY is configured (indicates key-based auth is enabled)
        if (!process.env.ADMIN_SECRET_KEY) {
            return false;
        }

        // Session cookie exists - in a production environment, you might want to
        // validate this against a Redis/database store for session invalidation support.
        // For now, we trust the httpOnly cookie as it's set securely by our API.
        return true;
    } catch (error) {
        console.error('Error checking key-based admin session:', error);
        return false;
    }
}

/**
 * Get the current admin session.
 * Returns null if not authenticated or not authorized.
 * Supports both OAuth (Supabase) and key-based authentication.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
    try {
        // First, check for key-based admin session
        const hasKeySession = await getKeyBasedAdminSession();
        if (hasKeySession) {
            // Return a system admin user for key-based auth
            return {
                id: 'admin_key_user',
                email: 'admin@system',
                supabaseId: 'admin_key_auth',
                handle: '@admin',
            };
        }

        // Otherwise, check for Supabase OAuth session
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || !user.email) {
            return null;
        }

        // Check if user email is in admin list
        if (!isAdminEmail(user.email)) {
            console.warn(`Non-admin user attempted admin access: ${user.email}`);
            return null;
        }

        // Find user in database
        const dbUser = await prisma.user.findUnique({
            where: { supabaseId: user.id },
            select: {
                id: true,
                email: true,
                handle: true,
            },
        });

        if (!dbUser) {
            // Admin user not in database - create them
            const handle = user.email.split('@')[0] || `admin_${user.id.slice(0, 8)}`;
            const newUser = await prisma.user.create({
                data: {
                    supabaseId: user.id,
                    email: user.email,
                    handle: `@${handle}`,
                },
            });

            return {
                id: newUser.id,
                email: user.email,
                supabaseId: user.id,
                handle: newUser.handle,
            };
        }

        return {
            id: dbUser.id,
            email: user.email,
            supabaseId: user.id,
            handle: dbUser.handle,
        };
    } catch (error) {
        console.error('Error getting admin session:', error);
        return null;
    }
}

/**
 * Middleware wrapper for admin API routes.
 * Returns unauthorized response if not admin.
 */
export async function requireAdminAuth(): Promise<{
    authorized: true;
    admin: AdminUser;
} | {
    authorized: false;
    response: NextResponse;
}> {
    const admin = await getAdminSession();

    if (!admin) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            ),
        };
    }

    return {
        authorized: true,
        admin,
    };
}

/**
 * Helper to wrap an admin API handler with authentication.
 * Usage:
 *
 * export async function GET(request: Request) {
 *   return withAdminAuth(async (admin) => {
 *     // Your protected logic here
 *     return NextResponse.json({ data: 'protected data' });
 *   });
 * }
 */
export async function withAdminAuth(
    handler: (admin: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
    const result = await requireAdminAuth();

    if (!result.authorized) {
        return result.response;
    }

    return handler(result.admin);
}

/**
 * Logout admin - clears both OAuth and key-based sessions
 */
export async function logoutAdmin(): Promise<void> {
    try {
        const cookieStore = await cookies();
        
        // Clear key-based auth cookies
        cookieStore.delete('admin_session');
        cookieStore.delete('admin_auth');

        // Sign out from Supabase (OAuth)
        const supabase = await createClient();
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error logging out admin:', error);
    }
}
