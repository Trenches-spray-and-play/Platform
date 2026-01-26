/**
 * Admin Authentication Utilities
 *
 * Provides secure admin authentication using Supabase OAuth.
 * Admin access is restricted to email addresses configured in ADMIN_EMAILS env var.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

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
 * Get the current admin session.
 * Returns null if not authenticated or not an admin.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
    try {
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
