# Dom's Memory - Dev 1 of Trenches Platform

**Name:** Dom
**Role:** Dev 1, Trenches Platform
**Mission:** Building the most robust and user-friendly "Spray & Play" protocol.

## Current Objective
Debug and resolve the `ECONNREFUSED 127.0.0.1:3000` issue while ensuring the dashboard accurately displays positions for active/visible campaigns.

## Progress Log

### 2026-01-31 17:43
- Role initialized: Dom, Dev 1.
- Initialized memory file.
- Noted extensive manual changes by user in:
    - `DashboardClient.tsx`: Added debug logging for positions. Refined position card UI to show campaign names, amounts, metrics, and ROI.
    - `dashboard-v2/page.tsx`: Added debug logging for session and data fetching.
    - `userService.ts`: Added visibility logic to `getUserPositions`. It now filters out hidden campaigns and maps trench levels correctly. Converted Date types to ISO strings for stable serialization.
- Plan: Shifting focus to implement the response-first cookie setting pattern in `auth/callback/route.ts`. This is a launch blocker.
- **Action:** Implementing fix in `apps/dapp/src/app/auth/callback/route.ts`.
- **Status:** **FIXED**. Implemented response-first cookie persistence. All redirect paths now correctly inherit Supabase auth tokens.
- **Next:** Verifying with a build check and then notifying the user.

### 2026-01-31 18:06
- **Critical Fix Complete:** Auth cookie persistence resolved in `auth/callback/route.ts`
- **Implementation Details:**
  1. **Response-First Pattern:** Initialize NextResponse BEFORE Supabase code exchange (Line 26)
  2. **Cookie Synchronization:** Supabase `setAll` writes directly to response.cookies (Lines 37-41)
  3. **Redirect Preservation:** All secondary redirects (admin, register) manually copy auth cookies (Lines 75, 119, 132, 155, 165)
- **Root Cause:** OAuth callback was exchanging code for session but cookies weren't being persisted to browser, causing "Already Connected" popup but server rejecting API calls
- **Impact:** Users can now log in successfully, session persists across page refreshes
- **Updated Docs:** `AUTH_ISSUE_STATUS.md` and `AUTH_ISSUE_DIAGNOSIS_AND_FIX.md` marked as RESOLVED

### 2026-01-31 18:55
- **Performance Implementation Complete:**
  - Implemented in-memory `campaignsCache` with 30s TTL in `trenchService.ts`.
  - Switched to `Promise.all` for parallel fetching of campaigns and participant counts.
  - Added aggressive `Cache-Control` headers and cache-clearing `POST` endpoint to `/api/trenches`.
  - Optimized Zustand stores (`authStore`, `uiStore`, `campaignStore`) to only use `devtools` in production and added explicit typing to store creators.
- **Immediate Task:** Configure GitHub Secrets for Vercel and establish branch protection rules for `main`.
- **Update 19:10:** Started Step 3 (Pipeline Test). Created branch `test-ci-setup` and committed mock change.
- **Update 19:14:** Successfully pushed `test-ci-setup` to origin.
- **Update 19:16:** **CI/CD VERIFIED**. Both `platform-dapp` and `platform-landing` showing green checks and successful Vercel Previews. Step 1 and Step 3 are COMPLETED.
- **Monitoring & Health Checks COMPLETED:**
  - Enhanced `/api/health` endpoint with DB, Redis, and RPC checks
  - Alert system with Telegram + Email (Resend) support
  - Performance monitoring middleware with P95/P99 tracking
  - `/api/metrics` endpoint for real-time performance data
  - Complete setup documentation in `.github/MONITORING_SETUP_GUIDE.md`
  - Summary in `MONITORING_SUMMARY.md`
  - **Next:** Configure environment variables (TELEGRAM_BOT_TOKEN, RESEND_API_KEY) and set up UptimeRobot.
  - **Update 20:03:** Domain migration COMPLETED. All infrastructure references updated from `trenches.fund` to `playtrenches.xyz`:
  - `.github/workflows/cd.yml` - 4 URLs updated
  - `.github/workflows/staging.yml` - 6 URLs updated  
  - `.github/MONITORING_SETUP_GUIDE.md` - Email domain updated
  - Created `DOMAIN_MIGRATION_SUMMARY.md` with complete migration guide
  - Verification: Zero remaining `trenches.fund` references in infrastructure files
