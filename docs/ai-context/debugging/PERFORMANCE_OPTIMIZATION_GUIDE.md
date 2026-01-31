# Performance Optimization Guide - Slow Click Response
**Date:** January 31, 2026  
**Issue:** Page response is slow, clicks take long time to respond  
**Root Cause:** Main thread blocked by large JavaScript bundle (1,200+ KB)

---

## 🔴 Critical Issues Identified

### 1. Main Thread Blocking (HIGHEST PRIORITY)

**Lighthouse Findings:**
- **Total Blocking Time:** 10,000ms+ (target: <200ms)
- **Script Evaluation:** 9,453ms on main thread
- **Long Tasks:** 2-3 seconds each

**What This Means:**
Every click has to wait for JavaScript to finish executing. The main thread is choked.

### 2. Large Bundle Size

**Current:**
- JavaScript: 1,255 KB (dev), ~1,200 KB expected (prod)
- Total: 1,419 KB

**Target:**
- JavaScript: <500 KB
- Total: <600 KB

### 3. Heavy Libraries in Bundle

**Found in client bundle:**
- `ethers` - Ethereum library (~500 KB)
- `viem` - Alternative Ethereum library (~300 KB)
- `@solana/web3.js` - Solana library (~400 KB)
- `motion-dom` - Animation library (49 KB unused)

**These should NOT be in the client bundle!**

---

## 🚀 Immediate Fixes (Do These Now)

### Fix 1: Audit Service Imports in Client Code

**Problem:** Services using ethers/viem might be imported in client components

**Check These Files:**
```bash
# Find if blockchain services are imported in client components
grep -r "from '@/services'" apps/dapp/src/app/sample-v2/ --include="*.tsx"
grep -r "from '@/services'" apps/dapp/src/components/ --include="*.tsx"
```

**Services to Check:**
- `balance.service.ts` - Imports `ethers`
- `reserve.service.ts` - Imports `ethers`, `@solana/web3.js`
- `deposit-address.service.ts` - Imports `ethers`, `@solana/web3.js`
- `deposit-monitor.service.ts` - Imports `viem`
- `sweep.service.ts` - Imports `viem`
- `payout.service.ts` - Imports `ethers`

**Fix:** Ensure these are ONLY used in:
- API routes (`app/api/**`)
- Server Components (no "use client")
- Not in "use client" components

### Fix 2: Dynamic Import Heavy Components

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

**Current:**
```typescript
import CampaignCard from "./components/CampaignCard";
```

**Optimized:**
```typescript
import dynamic from 'next/dynamic';

const CampaignCard = dynamic(() => import("./components/CampaignCard"), {
  loading: () => <div className={styles.cardSkeleton} />
});
```

### Fix 3: Add Code Splitting for Below-Fold Content

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

```typescript
import dynamic from 'next/dynamic';

// Lazy load sections below the fold
const CampaignsSection = dynamic(() => import('./components/CampaignsSection'));
const FeaturesSection = dynamic(() => import('./components/FeaturesSection'));
const FooterSection = dynamic(() => import('./components/FooterSection'));
```

### Fix 4: Optimize React Query Client

**File:** `apps/dapp/src/lib/queryClient.ts`

**Current Issues:**
- `staleTime: 30s` might be too aggressive
- `retry: 2` with exponential backoff adds delay

**Optimized:**
```typescript
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,        // Increase to 60s
                gcTime: 10 * 60 * 1000,      // Increase to 10 min
                retry: 1,                     // Reduce to 1 retry
                retryDelay: 1000,             // Fixed 1s delay
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
            mutations: {
                retry: 0,                     // No retry for mutations
            },
        },
    });
}
```

### Fix 5: Memoize Expensive Components

**File:** `apps/dapp/src/app/sample-v2/components/CampaignCard.tsx`

**Add React.memo:**
```typescript
import { memo } from 'react';

function CampaignCard({...}) {
  // ... component code
}

export default memo(CampaignCard);
```

### Fix 6: Debounce Click Handlers

**If click handlers are expensive, add debounce:**

```typescript
import { useCallback } from 'react';
import { debounce } from 'lodash-es'; // or use-debounce

const handleClick = useCallback(
  debounce((id) => {
    router.push(`/sample-v2/campaign-v2/${id}`);
  }, 100),
  [router]
);
```

### Fix 7: Use CSS Transitions Instead of JS Animations

**Already done by Kimi for landing page ✅**

**Check dapp for remaining Framer Motion:**
```bash
grep -r "framer-motion" apps/dapp/src/ --include="*.tsx" --include="*.ts"
```

**Replace with CSS:**
```css
/* Instead of Framer Motion */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📊 Build Analysis (Do This First)

### Step 1: Install Bundle Analyzer
```bash
npm install --save-dev @next/bundle-analyzer
```

### Step 2: Add to next.config.js
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});
```

### Step 3: Run Analysis
```bash
ANALYZE=true npm run build
```

**Look for:**
- Large libraries (ethers, viem, solana)
- Duplicate imports
- Unused code

---

## 🔍 Debugging Slow Clicks

### Step 1: Chrome DevTools Performance Tab

1. Open DevTools → Performance tab
2. Click record button
3. Click the slow element
4. Stop recording
5. Analyze:
   - Long tasks (yellow blocks)
   - Script execution (purple)
   - Layout/paint (green/purple)

### Step 2: Check for Forced Reflow

**In Performance tab, look for:**
```
[Violation] Forced reflow took 50ms
```

**Common causes:**
- Reading layout properties (offsetHeight, clientWidth) then writing
- Animating width/height/top/left instead of transform

### Step 3: React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Record while clicking
4. Look for:
   - Unnecessary re-renders
   - Slow components
   - Large commit times

---

## 📋 Checklist for Dudu

### Immediate (30 minutes)

- [ ] Run bundle analyzer: `ANALYZE=true npm run build`
- [ ] Identify largest chunks
- [ ] Check if ethers/viem are in client bundle
- [ ] Add dynamic imports for CampaignCard
- [ ] Add React.memo to CampaignCard

### Short Term (2 hours)

- [ ] Move all blockchain service imports to API routes only
- [ ] Implement code splitting for below-fold content
- [ ] Optimize React Query settings
- [ ] Remove unused Framer Motion imports
- [ ] Add debounce to expensive click handlers

### Testing

- [ ] Run Lighthouse after each change
- [ ] Target: TBT < 1,000ms
- [ ] Target: Performance score > 50
- [ ] Test click responsiveness on mobile

---

## 🎯 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Bundle Size | 1,200 KB | ~600 KB |
| TBT | 10,000ms | <1,000ms |
| Performance | 35/100 | >50/100 |
| Click Response | 2-3s delay | <100ms |

---

## 🆘 Quick Wins (Do These First)

1. **Add `React.memo` to CampaignCard** - 5 min
2. **Dynamic import CampaignCard** - 5 min
3. **Check service imports** - 10 min
4. **Optimize React Query** - 5 min

**Total:** 25 minutes for noticeable improvement

---

**Assigned:** Dudu  
**Created by:** TBO  
**Date:** January 31, 2026
