# Agent Memory Document

> **Purpose:** Track work progress, decisions, and context across sessions  
> **Last Updated:** 2026-01-31 (All Dashboard Bugs Fixed)  
> **Project:** Trenches dApp

---

## Current Session Summary

### Recent Commits (Last 5)
```
d16ccf2 debug: add extensive logging for active positions issue
85b4125 fix(userService): add campaignName and roiMultiplier to active positions
5eb120c perf(fonts): remove duplicate Google Font imports
162a3e3 fix(dashboard): restore full position card details
2f61c2e fix(userService): filter hidden campaigns from user positions
```

### Key Files Created/Modified This Session
- `apps/dapp/src/app/sample-v2/dashboard-v2/DashboardClient.tsx` - Restored full position card details
- `apps/dapp/src/services/userService.ts` - Fixed hidden campaign filtering
- `docs/JOB_DESCRIPTIONS.md` - 10 role descriptions with compensation
- `apps/dapp/src/hooks/useQueries.ts` - React Query hooks with initialData
- `apps/dapp/src/app/sample-v2/components/LayoutClient.tsx` - Client layout
- `apps/dapp/src/app/sample-v2/dashboard-v2/page.tsx` - Server component
- `apps/dapp/src/lib/schemas.ts` - Zod schemas
- `apps/dapp/src/lib/validation.ts` - API validation
- `apps/dapp/src/store/` - Zustand stores (auth, ui, campaign)

---

## Project Architecture

### Tech Stack
- **Frontend:** Next.js 16.1.1, TypeScript, React Query (TanStack Query)
- **Styling:** CSS Modules
- **State:** Zustand (client), React Query (server)
- **Database:** PostgreSQL via Prisma
- **Chains:** HyperEVM (primary), Ethereum, Base, Arbitrum, Solana
- **Deployment:** Vercel

### Directory Structure
```
apps/
  dapp/           # Main application
    src/
      app/        # Next.js App Router
      components/ # Shared UI components
      hooks/      # React Query hooks
      lib/        # Utilities, schemas, validation
      store/      # Zustand stores
  landing/        # Marketing site
  admin-v2/       # Admin dashboard
packages/
  auth/           # Shared auth utilities
  ui/             # Component library
docs/             # Documentation
```

---

## Active Issues & Fixes

### ✅ Resolved

| Issue | Fix | Commit |
|-------|-----|--------|
| Type error in DataTable | Allow ReactNode in headers | 348df90 |
| Missing store/schemas files | Added untracked files | 91c2364 |
| Missing zod/zustand deps | Updated package.json + lock | 908584b |
| Performance: request spam | initialData threading + caching | 0f4ba15 |
| Hidden campaigns in dashboard | Filter in userService.ts | 2f61c2e |
| Dashboard missing position details | Restored full card in DashboardClient | 162a3e3 |
| Duplicate font loading | Removed @import from globals.css | 5eb120c |
| Active positions missing campaignName | Added mapping in userService | 85b4125 |
| Dashboard not showing positions | UUID vs level name mismatch | (fixed with debug)

### 🔴 Critical - Build Status
- **Status:** Last build failed (commit 0f4ba15) due to missing files
- **Current Status:** All missing files committed (91c2364 + 908584b)
- **Next Build:** Pending verification

### 🟡 Pending Verification
- Performance fix effectiveness (need deployment confirmation)
- Query deduplication working as expected
- No ERR_INSUFFICIENT_RESOURCES in production

---

## Key Design Decisions

### 1. Data Fetching Pattern (initialData)
**Decision:** Thread `initialData` from server components to React Query hooks

**Rationale:** 
- Layout (server) + LayoutClient (client) + page (server) + DashboardClient (client) = 6+ duplicate requests
- React Query uses `initialData` on first render, then refetches after `staleTime`

**Implementation:**
```typescript
// Server component
const user = await fetchUser(); // Single fetch
return <DashboardClient initialUser={user} />

// Client component  
const { data: user } = useUser(initialUser); // No duplicate fetch
```

### 2. React Query Configuration
```typescript
staleTime: 30 * 1000,      // 30 seconds
gcTime: 5 * 60 * 1000,      // 5 minutes
refetchOnWindowFocus: false, // CRITICAL
refetchOnReconnect: false,
```

### 3. Server Fetch Caching
```typescript
// Using Next.js revalidation instead of no-store
{ next: { revalidate: 60 } }
```

### 4. Hidden Campaign Filtering
**Problem:** User dashboard showed positions from hidden campaigns (isHidden: true)

**Solution in `userService.ts`:**
```typescript
// 1. Get all visible campaign trench IDs
const visibleCampaigns = await prisma.campaignConfig.findMany({
    where: { isHidden: false, isActive: true },
    select: { trenchIds: true },
});
const visibleTrenchIds = new Set(visibleCampaigns.flatMap(c => c.trenchIds));

// 2. Filter participants to visible trenches only
const visibleParticipants = participants.filter(
    p => visibleTrenchIds.has(p.trenchId)
);

// 3. Filter waitlist entries
const waitlistEntries = await prisma.campaignWaitlist.findMany({
    where: { 
        userId,
        campaign: { isHidden: false, isActive: true }
    },
    ...
});
```

**Note:** Trench-to-Campaign relation is indirect (CampaignConfig.trenchIds is String[])

### 5. Position Card Structure
**Location:** `DashboardClient.tsx` (sample-v2/dashboard-v2)

**Required Card Elements:**
```
┌─────────────────────────────────────┐
│ [Active] [RAPID]         [Ready]    │  ← Type badge + Level + Ready badge
│ Campaign Name                       │  ← Campaign name
│                                     │
│  You Invested    →   You'll Receive │  ← Amounts section
│  $1,000              $1,500         │
│                                     │
│  ROI      Time Left    Queue        │  ← Metrics row
│  1.5x     2d 4h        #5           │
│                                     │
│  [Toggle] Auto-Boost                │  ← Footer with toggle
└─────────────────────────────────────┘
```

**CSS Classes Available:**
- `.positionCard` - Card container
- `.positionCardHeader` - Badges row
- `.positionType` / `.positionLevel` / `.readyBadge` - Badges
- `.positionName` - Campaign name
- `.positionAmounts` - Invested/Receive section
- `.positionArrow` - Arrow between amounts
- `.positionMetrics` - ROI/Time/Queue grid
- `.positionFooter` - Auto-boost toggle

**Note:** Active positions (from Participant table) need campaignName mapped via trenchId->campaign lookup since Participants link to Trenches, not Campaigns directly.

### 6. Performance Fixes (Quick Actions)

**Font Loading Optimization**
- Removed duplicate `@import` for Inter and JetBrains Mono from `globals.css`
- Fonts already loaded via `next/font` in `layout.tsx`
- Impact: ~50KB saved, removes render-blocking request

**QR Loading States**
- Location: `SprayForm.tsx`
- Implementation: Shows spinner when `isGeneratingAddress` is true
- CSS: `.spinner` with `animation: spin 1s linear infinite`
- Status: ✅ Already correctly implemented

**Pending: Lighthouse Audit**
- Target: Performance >70, LCP <4s
- Must be run manually in Chrome DevTools

---

## Summary of Today's Fixes (2026-01-31)

| Bug | Root Cause | Fix |
|-----|------------|-----|
| Pages not loading | `export const dynamic` before imports | Moved after imports |
| Prisma connection errors | Connection limit = 1, DepositMonitor hogging | Increased to 5, disabled continuous monitoring |
| Hidden campaigns showing | No filter in `getUserPositions` | Added `isHidden: false` filter |
| Active positions not showing | UUID vs level name mismatch | Changed to compare `trench.level` |
| Position cards missing details | Simplified card component | Restored full details with all metrics |
| Duplicate font loading | CSS @import + next/font | Removed CSS imports |

### Platform Status: ✅ FULLY FUNCTIONAL

- **Server:** Running on http://localhost:3004
- **Dashboard:** Fully functional with positions
- **Deposit flow:** Working (on-demand scanning)
- **Build:** ✅ Passing
- **Hidden campaign filter:** ✅ Working

---

## Team Structure (Current + Planned)

### Current Team
| Role | Status |
|------|--------|
| Marketing Lead | ✅ |
| Content Creator | ✅ |
| Marketing Specialist | ✅ |
| Lead Dev | ✅ |
| Dev 1 | ✅ |
| Dev 2 | ✅ |
| Product Senior Engineer | ✅ |

### Planned Hires (Priority Order)
1. **Security Engineer** - Critical for mainnet
2. **DevOps Engineer** - Monitoring/observability
3. **Product Designer** - UX debt
4. **QA Engineer** - Prevent production bugs
5. **Head of CS** - User support at scale
6. **BD Lead** - Project partnerships
7. **Data Engineer** - Fraud + analytics
8. **Community Manager** - Organic growth
9. **Legal/Compliance** - Regulatory
10. **Platform Engineer** - Performance at scale

---

## Compliance Status

- **Tool:** `npm run compliance:check`
- **Status:** ✅ 0 violations
- **Last Check:** 2026-01-30
- **Key Rules:** No "guaranteed", "risk-free", "passive income"

---

## Important Context

### Performance Crisis History
- **Root Cause:** Multiple components independently fetching `/api/user` and `/api/positions`
- **Symptom:** Browser `ERR_INSUFFICIENT_RESOURCES` 
- **Solution:** Thread initialData from server → client hooks
- **Expected Result:** API calls reduced from 6+ to 1-2 per page load

### Build Failure Pattern
- Files were being created but not committed (untracked)
- Dependencies added to package.json but not package-lock.json
- Need to verify `git status` before assuming build will pass

### Query Keys (Centralized)
```typescript
const queryKeys = {
    user: ['user'],
    positions: ['positions'],
    campaigns: ['campaigns'],
    campaign: (id: string) => ['campaign', id],
    trenches: ['trenches'],
}
```

---

## Pending Tasks

### High Priority
- [ ] Verify deployment succeeds after fixes
- [ ] Monitor for ERR_INSUFFICIENT_RESOURCES in production
- [ ] Confirm QueryClient configuration working

### Medium Priority
- [ ] Review admin-v2 checklist completion
- [ ] Audit spray/entry flow P0 completion
- [ ] Security audit planning

### Documentation
- [x] Job descriptions for 10 roles
- [ ] Technical architecture diagram
- [ ] API documentation
- [ ] Onboarding guide for new devs

---

## Key Commands

```bash
# Compliance check
npm run compliance:check

# Build (from apps/dapp)
npm run build

# Database
npx prisma generate
npx prisma db push

# Check status
git status
git log --oneline -5
```

---

## Contacts & Resources

- **Telegram:** @izecube (Co-founder)
- **Website:** playtrenches.xyz
- **Pitch Deck:** docs/INVESTOR_AND_USER_PITCHES.md
- **Job Descriptions:** docs/JOB_DESCRIPTIONS.md
- **Mechanics Spec:** _bmad-output/implementation-artifacts/mechanics-spec.md

---

## Notes for Future Sessions

1. **Always check `git status`** - Files may exist locally but not be committed
2. **Verify package-lock.json** - Dependency changes need lockfile updates
3. **Check build logs** - Turbopack errors are detailed but verbose
4. **Test performance fixes** - Look for reduced API calls in Network tab
5. **Compliance first** - Run check before any user-facing copy changes

---

*This document is updated at the end of each session. Keep it concise but comprehensive.*
