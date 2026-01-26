// @trenches/auth - Shared Authentication Utilities
//
// IMPORTANT: This index only exports client-safe code.
// For server-side imports, use '@trenches/auth/server' directly.

// Client-side Supabase client
export { createClient as createBrowserClient } from './client';

// React Provider & Hook (client-side only)
export { AuthProvider, useAuth, type AuthContextType } from './AuthProvider';

// Re-export useful types from Supabase
export type { User, Session } from '@supabase/supabase-js';
