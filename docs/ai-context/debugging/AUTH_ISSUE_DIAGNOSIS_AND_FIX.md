# Auth Issue: "API Request Failed" + "Already Logged In" Popup
**Status:** ✅ RESOLVED — Fix Implemented  
**Root Cause:** Session cookie mismatch between client and server  
**Fix Applied By:** Dom — January 31, 2026

---

## Problem Description

Users experience:
1. Login with Google OAuth appears to succeed
2. Popup shows "Already Connected" with "Go to Dashboard" button
3. Clicking dashboard button fails with "API request failed" error
4. User is stuck in login loop

## Root Cause Analysis

### The Mismatch
| Component | Thinks User Is | Reality |
|-----------|---------------|---------|
| Client-side Auth (AuthProvider) | ✅ Logged in | ❌ Session invalid |
| Server-side (getSession) | ❌ Not logged in | ❌ No valid cookie |
| Dashboard API | ❌ Returns 401/error | ❌ Validation fails |

### Why This Happens

1. **OAuth Callback succeeds** — Supabase exchanges code for session
2. **Cookies NOT properly set** — The `cookies()` API in Route Handlers doesn't persist to response
3. **Client gets session** — Supabase client-side stores session in memory
4. **Server rejects requests** — No cookie = no session validation
5. **"Already logged in" popup** — Client sees user object, server doesn't

### Code Evidence

In `auth/callback/route.ts` (line 54-57):
```typescript
// Debug: Check what cookies are set after exchange
const cookieStore = await cookies();
const allCookies = cookieStore.getAll();
// This only logs — doesn't ensure cookies are in response!
```

The callback redirects WITHOUT ensuring cookies are in the response.

---

## Diagnosis Steps (Do This First)

### Step 1: Check Browser Console
1. Open Chrome DevTools → Console tab
2. Try logging in
3. Look for:
   - `[Supabase Cookie] Set success: sb-access-token`
   - `[Supabase Cookie] Set FAILED`
   - Any red errors

### Step 2: Check Application Cookies
1. DevTools → Application tab → Cookies
2. Look for:
   - `sb-access-token`
   - `sb-refresh-token`
   - Domain should match your site

### Step 3: Check Network Tab
1. DevTools → Network tab
2. Filter by "api"
3. Look at `/api/user` or dashboard requests
4. Check Request Headers — should include Cookie with sb-access-token
5. Check Response — should be 200, not 401

---

## The Fix

### Option A: Fix Cookie Persistence in Auth Callback (RECOMMENDED)

**File:** `apps/dapp/src/app/auth/callback/route.ts`

**Problem:** The callback creates a Supabase client but doesn't ensure cookies are set in the response.

**Solution:** Use the response-based cookie setting pattern.

```typescript
// AT THE TOP of the file — add this import
import { NextResponse } from 'next/server';

// REPLACE the entire GET function with this fixed version:
export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/sample-v2/dashboard-v2';

        console.log('[Auth Callback] Triggered:', { hasCode: !!code, next });

        if (!code) {
            console.error('[Auth Callback] No code provided');
            return NextResponse.redirect(`${origin}/login?error=auth_failed`);
        }

        // Create response first
        let response = NextResponse.redirect(`${origin}${next}`);
        
        // Get cookie store
        const cookieStore = await cookies();
        
        // Create Supabase client with cookie methods that write to response
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        console.log(`[Auth Callback] Setting ${cookiesToSet.length} cookies`);
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                            console.log(`[Auth Callback] Cookie set: ${name}`);
                        });
                    },
                },
            }
        );

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user) {
            console.error('[Auth Callback] Exchange failed:', error);
            return NextResponse.redirect(`${origin}/login?error=auth_failed`);
        }

        console.log('[Auth Callback] Success:', data.user.email);
        
        // The cookies are already set in response via setAll above
        return response;
        
    } catch (err: any) {
        console.error('[Auth Callback] Fatal error:', err);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
}
```

**Key Changes:**
1. Create `response` BEFORE creating Supabase client
2. Use `setAll` instead of individual `set` operations
3. `setAll` writes cookies directly to the response object
4. Return the same response object at the end

---

### Option B: Fix @trenches/auth Server Client (If Option A Doesn't Work)

**File:** `packages/auth/src/server.ts`

The current implementation might fail because `cookieStore.set()` in Server Components doesn't always persist. Ensure it's using the correct pattern:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();
    
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // This can fail in Server Components — acceptable
                        console.error(`Cookie set error: ${name}`, error);
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        console.error(`Cookie remove error: ${name}`, error);
                    }
                },
            },
        }
    );
}
```

---

### Option C: Quick Workaround (Emergency Only)

If fixes don't work immediately, add client-side session refresh:

**File:** `apps/dapp/src/components/AuthProvider.tsx` or where `useAuth` is defined

Add this effect to force session sync:

```typescript
useEffect(() => {
    // Force session refresh on mount
    const refreshSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Session refresh error:', error);
            // Clear invalid session
            await supabase.auth.signOut();
        }
    };
    refreshSession();
}, []);
```

---

## Verification Checklist

After applying Option A fix:

### Immediate Test
- [ ] Clear all cookies for your domain
- [ ] Open browser console (preserve log)
- [ ] Navigate to `/login`
- [ ] Click "Continue with Google"
- [ ] Complete OAuth flow
- [ ] **Check console for:** `[Auth Callback] Cookie set: sb-access-token`
- [ ] Should redirect to dashboard automatically

### Cookie Verification
- [ ] DevTools → Application → Cookies
- [ ] Verify `sb-access-token` exists
- [ ] Verify `sb-refresh-token` exists
- [ ] Check Expires/Max-Age is in the future (not session)

### API Verification
- [ ] Dashboard should load without "API request failed" error
- [ ] Network tab → `/api/user` should return 200 with user data
- [ ] No redirect back to login

### Session Persistence
- [ ] Refresh page — should stay logged in
- [ ] Close tab, reopen — should stay logged in
- [ ] Wait 10 minutes, refresh — should stay logged in (token refresh working)

---

## Common Issues & Solutions

### Issue: "Cookies not being set"
**Cause:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Fix:** Check environment variables in Vercel dashboard

### Issue: "Cookie set error" in console
**Cause:** Server Component can't set cookies in certain contexts
**Fix:** This is expected in some cases — the auth callback fix (Option A) is the solution

### Issue: "User shows in UI but API fails"
**Cause:** Client has user in memory, but no cookie for server
**Fix:** Clear browser cookies and re-login after applying fix

### Issue: "Infinite redirect loop"
**Cause:** Middleware or auth callback misconfiguration
**Fix:** Check that auth callback doesn't require auth, and middleware excludes `/auth/callback`

---

## Rollback Plan

If fix breaks something:

1. Revert `auth/callback/route.ts` to previous version
2. Redeploy
3. Clear Vercel cache if needed
4. Alternative: Disable auth and use demo mode temporarily

---

## Files Modified

| File | Change |
|------|--------|
| `apps/dapp/src/app/auth/callback/route.ts` | Fixed cookie persistence in response |

---

## Related Docs

- Supabase SSR Docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js Cookies: https://nextjs.org/docs/app/api-reference/functions/cookies

---

**Priority:** ✅ RESOLVED — Auth cookie persistence fixed  
**Implementation:** Response-First Pattern with Cookie Synchronization  
**Applied To:** `apps/dapp/src/app/auth/callback/route.ts`

---

## Implementation Summary

### Response-First Pattern
Initialize the NextResponse redirect object BEFORE the Supabase code exchange:
```typescript
let response = NextResponse.redirect(`${origin}${next}`);
```

### Cookie Synchronization
Configure Supabase client to write tokens directly into the response object's cookies:
```typescript
setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as CookieOptions);
    });
}
```

### Redirect Preservation
For complex flows (new user registration, admin redirects), manually copy all auth cookies to secondary redirect responses to prevent session loss:
```typescript
const redirectResponse = NextResponse.redirect(`${origin}/register`);
response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c as any));
return redirectResponse;
```
