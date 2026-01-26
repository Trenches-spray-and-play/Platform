import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export interface AuthUser {
    id: string;
    email: string | null;
    handle: string;
    wallet: string | null;
    beliefScore: number;
    supabaseId: string;
}

/**
 * Get the current session user. Returns null if not authenticated.
 */
export async function getSession(): Promise<AuthUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
    });

    if (!dbUser) {
        // Check if user exists by email
        dbUser = await prisma.user.findUnique({
            where: { email: user.email ?? undefined },
        });

        if (dbUser) {
            // Link existing user to Supabase
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { supabaseId: user.id },
            });
        } else {
            // Create new user
            const handle = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
            dbUser = await prisma.user.create({
                data: {
                    supabaseId: user.id,
                    email: user.email,
                    handle: `@${handle}`,
                },
            });
        }
    }

    return {
        id: dbUser.id,
        email: dbUser.email,
        handle: dbUser.handle,
        wallet: dbUser.wallet,
        beliefScore: dbUser.beliefScore,
        supabaseId: user.id,
    };
}

/**
 * Require authentication. Redirects to login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return session;
}

/**
 * Get session without database lookup (faster, for API routes)
 */
export async function getSupabaseUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
