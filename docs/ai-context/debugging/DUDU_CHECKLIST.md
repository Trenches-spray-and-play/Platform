# Dudu Checklist - Campaign & Spray Fixes

## 🔴 Issue 1: Campaign Detail "Not Found"

### □ Step 1: API Route Verification (2 min)
```bash
# Check file exists
ls apps/dapp/src/app/api/campaigns/[id]/route.ts

# Check server is running
curl http://localhost:3004/api/trenches | head -20
```
**Result:** _______________

### □ Step 2: Find Valid Campaign ID (2 min)
```bash
# Option A: From browser console
# Open homepage → Network tab → find /api/trenches → copy an ID

# Option B: From database
npx prisma studio
# Or: SELECT id FROM "CampaignConfig" LIMIT 1;
```
**Campaign ID:** _______________

### □ Step 3: Test API Directly (2 min)
```bash
curl http://localhost:3004/api/campaigns/YOUR_ID
```
**Response:** _______________

- [ ] Returns 200 with data → API works, issue is frontend
- [ ] Returns 404 → Campaign not found in DB or wrong ID
- [ ] Returns 500 → Server error, check logs

### □ Step 4: Browser Debug (5 min)
Open homepage → Click campaign card → DevTools:

**Console Errors:**
```
Paste any red errors here:
_________________________________________________
_________________________________________________
```

**Network Tab:**
- Request URL: _______________
- Status Code: _______________
- Response Preview: _______________

### □ Step 5: Add Debug Logs (3 min)
In `campaign-v2/[id]/page.tsx`, add after line 17:
```typescript
console.log('[DEBUG] Campaign ID from URL:', campaignId);
console.log('[DEBUG] Campaign from hook:', campaign);
console.log('[DEBUG] isLoading:', isLoadingCampaign);
```

**Browser Console Output:**
```
Paste output here:
_________________________________________________
```

### □ Step 6: Database Check (3 min)
```sql
-- Run in Prisma Studio or psql
SELECT id, name, isActive, isHidden, "trenchIds" 
FROM "CampaignConfig" 
WHERE id = 'YOUR_CAMPAIGN_ID';
```

**Result:**
- isActive: _______________
- isHidden: _______________
- trenchIds: _______________

**Issues to fix:**
- [ ] If isActive = false → Need to enable campaign
- [ ] If isHidden = true → Need to unhide or check visibility filter
- [ ] If no results → Wrong ID format

---

## 🔴 Issue 2: Dashboard Spray Button

### □ Step 1: Verify Button Link (1 min)
In `DashboardClient.tsx` line 99:
```typescript
<Link href="/sample-v2/spray" className={styles.sprayBtn}>
```

**Check:** Does clicking navigate to `/sample-v2/spray`?
- [ ] Yes → Continue to Step 2
- [ ] No → Link might be broken

### □ Step 2: Direct Page Test (2 min)
Navigate directly:
```
http://localhost:3004/sample-v2/spray
```

**Result:**
- [ ] Page loads → Button works, issue elsewhere
- [ ] 404 error → Route missing
- [ ] Blank/Error → Component issue

### □ Step 3: Check Spray Form Props (2 min)
In `SprayForm.tsx`, add at top of component:
```typescript
console.log('[DEBUG] SprayForm campaigns:', campaigns);
console.log('[DEBUG] SprayForm user:', user);
```

**Browser Console:**
- campaigns array length: _______________
- user object: _______________

### □ Step 4: Test Spray Submission (5 min)
1. Open spray page
2. Select campaign
3. Enter amount
4. Click Submit
5. Check Network tab for `POST /api/spray/apply`

**Request:**
- Status: _______________
- Payload: _______________
- Response: _______________

**Issues:**
- [ ] 404 → API route missing
- [ ] 400 → Validation error
- [ ] 401/403 → Auth issue
- [ ] 500 → Server error

---

## 🔧 Quick Fixes

### If API Route Missing
Create `apps/dapp/src/app/api/campaigns/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    
    try {
        const campaign = await prisma.campaignConfig.findUnique({
            where: { id },
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Calculate phase
        const now = new Date();
        let phase = 'LIVE';
        if (campaign.isPaused) phase = 'PAUSED';
        else if (campaign.startsAt && campaign.startsAt > now) {
            phase = campaign.acceptDepositsBeforeStart ? 'ACCEPTING' : 'WAITLIST';
        }

        // Get participant count
        const counts = await prisma.participant.groupBy({
            by: ['trenchId'],
            where: { trenchId: { in: campaign.trenchIds } },
            _count: true,
        });

        const level = campaign.trenchIds.includes('RAPID') ? 'RAPID' 
            : campaign.trenchIds.includes('MID') ? 'MID' 
            : 'DEEP';

        return NextResponse.json({
            data: {
                ...campaign,
                phase,
                level,
                participantCount: counts.reduce((s, c) => s + c._count, 0),
                entryRange: { 
                    min: level === 'RAPID' ? 5 : level === 'MID' ? 100 : 1000,
                    max: level === 'RAPID' ? 1000 : level === 'MID' ? 10000 : 100000 
                },
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}
```

### If Data Structure Mismatch
Check what the page expects vs what API returns:

**Page expects (campaign-v2/[id]/page.tsx):**
- campaign.name
- campaign.tokenSymbol
- campaign.chainName
- campaign.roiMultiplier
- campaign.trenchIds
- (campaign as any).level
- (campaign as any).participantCount
- (campaign as any).entryRange

**Verify API returns all these fields**

---

## ✅ Verification Steps

After fixes, verify:

- [ ] Homepage loads with campaign cards
- [ ] Clicking card navigates to `/sample-v2/campaign-v2/[id]`
- [ ] Campaign detail shows correct name, ROI, entry range
- [ ] Dashboard Spray button navigates to `/sample-v2/spray`
- [ ] Spray page shows campaign dropdown
- [ ] Spray form submits successfully

---

## 🆘 Still Stuck?

**Gather this info and ask TBO:**
1. Exact error message from browser console
2. Network tab screenshot (request + response)
3. Database query result for the campaign ID
4. What you've already tried

**Contact:** Forward findings to Dom to escalate to TBO

---

**Start Time:** _______________  
**Estimated Time:** 30 minutes  
**Completed:** _______________
