# Debug Guide for Dudu - Campaign Detail & Spray Issues
**Date:** January 31, 2026  
**Assignee:** Dudu  
**Priority:** 🔴 CRITICAL (Blocking user flows)

---

## 🎯 Issues to Fix

1. **Campaign Detail Page**: Clicking campaign card → "Campaign Not Found"
2. **Dashboard Spray Button**: May not work correctly

---

## Issue #1: Campaign Detail Page "Not Found"

### Current Flow
```
1. User clicks CampaignCard on /sample-v2
2. Card links to: /sample-v2/campaign-v2/${id}
3. Page uses useCampaign(id) hook
4. Hook calls: GET /api/campaigns/${id}
5. Page shows "Campaign Not Found" if API returns null/404
```

### Files Involved
| File | Purpose |
|------|---------|
| `apps/dapp/src/app/sample-v2/components/CampaignCard.tsx` | Links to campaign detail |
| `apps/dapp/src/app/sample-v2/campaign-v2/[id]/page.tsx` | Campaign detail page |
| `apps/dapp/src/hooks/useQueries.ts` | useCampaign hook (line 304) |
| `apps/dapp/src/app/api/campaigns/[id]/route.ts` | API route (NEW - created by TBO) |

---

### DEBUG CHECKLIST

#### Step 1: Verify API Route Exists
```bash
# Check if the file exists
ls -la apps/dapp/src/app/api/campaigns/[id]/

# Should show:
# route.ts
```

**If missing:** The API route needs to be created (see TBO's implementation in memory)

#### Step 2: Test API Directly
```bash
# Get a valid campaign ID from the database or from the homepage
# Then test:
curl http://localhost:3004/api/campaigns/YOUR_CAMPAIGN_ID

# Expected response:
{
  "data": {
    "id": "...",
    "name": "...",
    "tokenSymbol": "...",
    "phase": "LIVE",
    "level": "RAPID",
    "participantCount": 42,
    "entryRange": { "min": 5, "max": 1000 }
  }
}

# Or if not found:
{ "error": "Campaign not found" }
```

#### Step 3: Check Browser Console
1. Open browser dev tools
2. Click a campaign card
3. Check Console tab for errors:
   - Network errors (404, 500)
   - JavaScript errors
   - React errors

#### Step 4: Check Network Tab
1. Open Network tab
2. Click a campaign card
3. Look for request to `/api/campaigns/[id]`
4. Check:
   - Status code (200, 404, 500)
   - Response body
   - Request URL (is ID correct?)

#### Step 5: Database Check
```bash
# Check if campaigns exist in database
npx prisma studio

# Or query directly:
SELECT id, name, isActive, isHidden FROM "CampaignConfig";
```

**Common issues:**
- Campaign `isHidden = true`
- Campaign `isActive = false`
- Wrong ID format (cuid vs uuid)

#### Step 6: Verify Hook Logic
In `apps/dapp/src/hooks/useQueries.ts` (line 304):
```typescript
export function useCampaign(id: string) {
    return useQuery({
        queryKey: queryKeys.campaign(id),
        queryFn: async (): Promise<Campaign | null> => {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            const data = await res.json();
            return data.data || null;  // <-- Check this returns correct data
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!id,
    });
}
```

**Check:** Does `data.data` match the API response structure?

#### Step 7: Verify Page Logic
In `apps/dapp/src/app/sample-v2/campaign-v2/[id]/page.tsx` (line 78):
```typescript
if (!campaign) {
  return (
    <div className={styles.error}>
      <h1>Campaign Not Found</h1>
      ...
    </div>
  );
}
```

**Check:** Is `campaign` actually null or just missing expected fields?

Add debug logging:
```typescript
console.log('[DEBUG] Campaign ID:', campaignId);
console.log('[DEBUG] Campaign data:', campaign);
console.log('[DEBUG] isLoading:', isLoadingCampaign);
```

---

## Issue #2: Dashboard Spray Button

### Current Flow
```
1. Dashboard shows "Spray" button
2. Button links to: /sample-v2/spray
3. Spray page shows campaign selection form
```

### Files Involved
| File | Purpose |
|------|---------|
| `apps/dapp/src/app/sample-v2/dashboard-v2/DashboardClient.tsx` | Spray button (line 99) |
| `apps/dapp/src/app/sample-v2/spray/page.tsx` | Spray page |
| `apps/dapp/src/app/sample-v2/spray/components/SprayForm.tsx` | Campaign selection form |

---

### DEBUG CHECKLIST

#### Step 1: Verify Spray Button Link
In `DashboardClient.tsx`:
```typescript
<Link href="/sample-v2/spray" className={styles.sprayBtn}>
    <span>◆</span>
    Spray
</Link>
```

**Check:** Does clicking this navigate to `/sample-v2/spray`?

#### Step 2: Verify Spray Page Loads
1. Navigate directly: `http://localhost:3004/sample-v2/spray`
2. Check if page loads without errors

#### Step 3: Check Spray Form
In `SprayForm.tsx`:
```typescript
// Does it receive campaigns prop?
interface SprayFormProps {
  campaigns: any[];  // <-- Check this is populated
  user: any;
}
```

**Check:** Are campaigns being passed from page to form?

#### Step 4: Debug Spray Submission
In `SprayForm.tsx`, check `handleSubmit`:
```typescript
// Line ~113
router.push(`/sample-v2/spray/finalize?id=${data.data.sprayEntryId}`);
```

**Common issues:**
- `data.data` is undefined
- `sprayEntryId` is null
- API error not handled

Add debug logging:
```typescript
console.log('[DEBUG] Spray submit response:', data);
console.log('[DEBUG] sprayEntryId:', data.data?.sprayEntryId);
```

#### Step 5: Check API Endpoints
The spray flow uses:
1. `POST /api/spray/apply` - Create spray entry
2. `GET /api/spray/finalize?id=...` - Finalize page

**Verify both exist:**
```bash
ls apps/dapp/src/app/api/spray/
# Should show: apply/, finalize/
```

---

## Common Root Causes

### 1. Missing API Routes
**Symptom:** 404 errors in Network tab  
**Fix:** Create missing route.ts files

### 2. Database Mismatch
**Symptom:** API returns 404 but data exists  
**Fix:** Check ID format (cuid vs uuid), check isActive/isHidden flags

### 3. React Query Cache Issues
**Symptom:** Old data, stale errors  
**Fix:** Clear React Query cache or add `staleTime: 0` for testing

### 4. Type Mismatches
**Symptom:** Data exists but page shows "Not Found"  
**Fix:** Check `data.data` vs `data` structure

### 5. Missing Environment Variables
**Symptom:** API errors, auth failures  
**Fix:** Check `.env.local` has all required vars

---

## Quick Fixes to Try

### Fix 1: Clear React Query Cache
```typescript
// In browser console:
localStorage.clear();
location.reload();
```

### Fix 2: Restart Dev Server
```bash
# Sometimes Next.js doesn't pick up new files
Ctrl+C
npm run dev:dapp
```

### Fix 3: Check Database Connection
```bash
# Test Prisma connection
npx prisma db pull
```

### Fix 4: Verify API Route is Registered
Add to `apps/dapp/src/app/api/campaigns/[id]/route.ts`:
```typescript
console.log('[API] Campaign route hit with ID:', id);
```

Then check server logs when clicking a campaign.

---

## Success Criteria

- [ ] Clicking campaign card → Shows campaign detail page
- [ ] Campaign detail shows correct data (name, ROI, entry range)
- [ ] Dashboard Spray button → Navigates to spray page
- [ ] Spray page shows campaign selection
- [ ] Spray form submission → Creates entry → Goes to finalize

---

## Communication

**Update this doc as you find issues:**
- What was the root cause?
- What fixed it?
- Any side effects?

**Escalate to TBO if:**
- Database schema issues
- Auth/session problems
- Complex React Query issues

---

**Assigned:** Dudu  
**Created by:** TBO  
**Date:** January 31, 2026
