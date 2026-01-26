import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Re-export for apps that need to build their own middleware
export { createServerClient, type CookieOptions };

// Note: updateSession must be defined in each app's lib/supabase/middleware.ts
// due to Next.js type version conflicts in monorepos.
// See apps/dapp/src/lib/supabase/middleware.ts for implementation.
