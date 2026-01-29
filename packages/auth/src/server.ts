import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side usage (Server Components, Route Handlers).
 * Handles cookie management for session persistence.
 */
export async function createClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            async get(name: string) {
                const value = cookieStore.get(name)?.value;
                if (name.includes('auth')) {
                    console.log(`[Supabase Cookie] Get: ${name}=${value ? 'exists(len:'+value.length+')' : 'not found'}`);
                }
                return value;
            },
            async set(name: string, value: string, options: CookieOptions) {
                try {
                    if (name.includes('auth')) {
                        console.log(`[Supabase Cookie] Set: ${name}, path: ${options.path}, httpOnly: ${options.httpOnly}, maxAge: ${options.maxAge}`);
                    }
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    console.error(`[Supabase Cookie] Set error for ${name}:`, error);
                }
            },
            async remove(name: string, options: CookieOptions) {
                try {
                    if (name.includes('auth')) {
                        console.log(`[Supabase Cookie] Remove: ${name}`);
                    }
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    console.error(`[Supabase Cookie] Remove error for ${name}:`, error);
                }
            },
        },
    });
}
