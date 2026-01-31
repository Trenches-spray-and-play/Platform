# Quick Performance Fixes - Click Response

## 🚨 Do These 4 Fixes NOW (25 minutes total)

---

## Fix 1: Add React.memo to CampaignCard (5 min)

**File:** `apps/dapp/src/app/sample-v2/components/CampaignCard.tsx`

```typescript
import { memo } from 'react';

function CampaignCard({...}) {
  // ... existing code
}

export default memo(CampaignCard);
```

**Why:** Prevents unnecessary re-renders when parent updates

---

## Fix 2: Dynamic Import CampaignCard (5 min)

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

```typescript
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CampaignCard = dynamic(() => import("./components/CampaignCard"), {
  loading: () => <div style={{ height: '200px', background: '#1a1a1a' }} />
});

// In render:
<Suspense fallback={<div>Loading...</div>}>
  <CampaignCard {...props} />
</Suspense>
```

**Why:** Only loads CampaignCard when needed

---

## Fix 3: Check for Blockchain Libraries in Client Bundle (10 min)

**Run:**
```bash
cd apps/dapp
npm run build 2>&1 | head -100
```

**Then check if these are in the output:**
- `ethers`
- `viem`
- `@solana/web3.js`

**If found, check imports:**
```bash
grep -r "from '@/services'" src/app/sample-v2/ --include="*.tsx"
grep -r "from '@/services'" src/components/ --include="*.tsx"
grep -r "from '@/lib'" src/app/sample-v2/ --include="*.tsx" | grep -v "types\|utils"
```

**If any service is imported in client components, move to API route!**

---

## Fix 4: Optimize React Query (5 min)

**File:** `apps/dapp/src/lib/queryClient.ts`

```typescript
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,        // Was: 30s
                gcTime: 10 * 60 * 1000,      // Was: 5min
                retry: 1,                     // Was: 2
                retryDelay: 1000,             // Was: exponential
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}
```

---

## Test After Each Fix

```bash
# Restart dev server
Ctrl+C
npm run dev:dapp

# Test click response
# Open http://localhost:3004/sample-v2
# Click a campaign card - should feel snappy
```

---

## If Still Slow - Debug Further

### Check Main Thread in DevTools

1. Open Chrome DevTools → Performance tab
2. Click record (circle button)
3. Click slow element
4. Stop recording
5. Look for:
   - **Long yellow blocks** = Script execution
   - **Purple blocks** = Layout/Style
   - **Long tasks** (>50ms)

### Check for Re-renders

1. Install React DevTools extension
2. Open Components tab
3. Enable "Highlight updates when components render"
4. Click around - look for flashing components

---

## Expected Improvement

| Fix | Expected Impact |
|-----|-----------------|
| React.memo | -50% unnecessary re-renders |
| Dynamic import | -100KB initial bundle |
| Remove blockchain libs | -500KB bundle |
| React Query优化 | Faster data fetching |

---

**Total Time:** 25 minutes  
**Expected Result:** Click response <100ms
