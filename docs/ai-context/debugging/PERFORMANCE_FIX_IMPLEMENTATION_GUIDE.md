# Performance Fix Implementation Guide
**Priority:** Pre-Launch  
**Estimated Time:** 30 minutes  
**Risk:** Low (all changes are safe)

---

## Issue #1: Duplicate Font Loading (CRITICAL - 2 min fix)

### Problem Description
Fonts are being loaded **twice**:
1. Via CSS `@import` in `globals.css` (render-blocking)
2. Via `next/font` in `layout.tsx` (optimized)

This causes:
- Extra network request (~50KB wasted)
- Render-blocking CSS fetch
- Potential FOUT (Flash of Unstyled Text)

### Evidence
```css
/* apps/dapp/src/app/sample-v2/globals.css - Lines 1-2 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

```tsx
/* apps/dapp/src/app/layout.tsx - Lines 6-18 */
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

### Solution
Remove the CSS imports since `next/font` is the correct approach.

### Implementation Steps

**Step 1:** Edit `apps/dapp/src/app/sample-v2/globals.css`

```diff
- @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
- @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  /* ========================================
     TRENCHES DESIGN SYSTEM v2.0
```

**Step 2:** Verify the CSS variables still work

Check that these CSS variables are defined (should already exist):
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Verification Checklist
- [x] Open `globals.css` and confirm lines 1-2 are deleted — ✅ DONE
- [x] Run `npm run build` — should complete without errors — ✅ DONE
- [x] Load any sample-v2 page in browser — ✅ DONE
- [x] Open DevTools → Network tab — ✅ DONE
- [x] Filter by "Font" — should show NO requests to fonts.googleapis.com — ✅ DONE
- [x] Fonts should still render correctly (Inter for body, JetBrains Mono for code) — ✅ DONE

**Status:** ✅ Issue #1 RESOLVED — January 31, 2026

---

## Issue #2: Verify QR Code Loading States (MEDIUM - 10 min)

### Problem Description
QR codes are generated client-side using the `qrcode` library (~80KB). If this blocks the main thread or doesn't show loading state, users may see:
- Frozen UI while generating
- Layout shift when QR appears
- Confusion if generation takes >1s

### Affected Files
1. `apps/dapp/src/app/sample-v2/spray/components/SprayForm.tsx`
2. `apps/dapp/src/app/sample-v2/deposit/AddressDisplay.tsx`
3. `apps/dapp/src/app/sample-v2/deposit/page.tsx`

### Current Implementation Analysis

**SprayForm.tsx (Line 78):**
```tsx
const qr = await QRCode.toDataURL(address, { width: 200, margin: 2 });
```

**Already has loading state (Line 207-210):**
```tsx
{isGeneratingAddress ? (
    <div className={styles.qrPlaceholder}>
        <div className={styles.spinner} />
        <span>Generating Address...</span>
    </div>
) : qrCode ? (...)
```

### Solution
✅ **Already implemented correctly** — just verify it works.

### Verification Checklist
- [x] Navigate to `/sample-v2/spray` — ✅ DONE
- [x] Select a campaign — ✅ DONE
- [x] Enter amount exceeding balance (to trigger deposit flow) — ✅ DONE
- [x] Select a chain — ✅ DONE
- [x] Verify loading spinner appears before QR code — ✅ VERIFIED
- [x] Check that UI doesn't freeze during generation — ✅ VERIFIED
- [ ] Repeat for `/sample-v2/deposit` page — Optional

**Status:** ✅ Issue #2 VERIFIED — Already correctly implemented with `{isGeneratingAddress ? <div className={styles.spinner} /> : ...}` pattern

### If Loading State Missing (Fallback Fix)

If verification shows missing loading states, add this pattern:

```tsx
const [isGeneratingQR, setIsGeneratingQR] = useState(false);

const generateQR = async (address: string) => {
  setIsGeneratingQR(true);
  try {
    const qr = await QRCode.toDataURL(address, { width: 200, margin: 2 });
    setQrCode(qr);
  } finally {
    setIsGeneratingQR(false);
  }
};

// In JSX:
{isGeneratingQR ? (
  <div className={styles.skeleton}>Generating QR...</div>
) : (
  <img src={qrCode} alt="Deposit QR" />
)}
```

---

## Issue #3: Lighthouse Audit & Runtime Verification (CRITICAL - 15 min)

### What to Check
Cannot verify from code alone — need runtime data.

### Implementation Steps

**Step 1:** Open Chrome DevTools → Lighthouse tab

**Step 2:** Run audit with these settings:
- Device: Mobile (priority) + Desktop
- Categories: Performance, Accessibility, Best Practices, SEO
- Throttling: Applied Slow 4G

**Step 3:** Record these metrics:

| Metric | Target | Your Score |
|--------|--------|------------|
| Performance | > 90 | ___ |
| LCP (Largest Contentful Paint) | < 2.5s | ___ |
| INP (Interaction to Next Paint) | < 200ms | ___ |
| CLS (Cumulative Layout Shift) | < 0.1 | ___ |
| TBT (Total Blocking Time) | < 200ms | ___ |

**Step 4:** Check specific issues:

### Verification Checklist
- [ ] Run Lighthouse on playtrenches.xyz (landing)
- [ ] Run Lighthouse on trenches-dapp.vercel.app/sample-v2 (dapp)
- [ ] Screenshot results for both mobile and desktop
- [ ] Note any "Opportunities" flagged by Lighthouse
- [ ] Check "Diagnostics" section for long tasks

### Expected Issues (If Any)

If Lighthouse flags these, they're likely false positives or acceptable:

| Issue | Why It's Flagged | Action Needed |
|-------|------------------|---------------|
| "Serve images in next-gen formats" | QR codes are data URLs | None — already using WebP/AVIF for static images |
| "Reduce unused JavaScript" | ethers, viem, solana libs | None — all are used, tree-shaken via `optimizePackageImports` |
| "Avoid enormous network payloads" | Large crypto libraries | Monitor but likely acceptable |

### Critical Thresholds

If you see these, stop and fix immediately:

| Red Flag | Threshold | Fix |
|----------|-----------|-----|
| LCP | > 4s | Check hero image loading, font display |
| TTFB | > 1s | Vercel function cold start — contact support |
| Hydration | > 500ms | Split large components (deposit page) |

---

## Issue #4: Bundle Analysis (OPTIONAL - 10 min)

### Purpose
Understand exactly what's in your JS bundles.

### Implementation Steps

**Step 1:** Install/run analyzer
```bash
cd apps/dapp
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build
```

**Step 2:** Review the generated report (opens automatically)

**Step 3:** Look for:
- Large dependencies (>100KB)
- Duplicate libraries (e.g., two versions of ethers)
- Unnecessary imports

### Verification Checklist
- [ ] Run bundle analyzer
- [ ] Identify largest chunks
- [ ] Verify ethers, viem, solana-web3.js are tree-shaken
- [ ] Check for any unexpected large dependencies

---

## Issue #5: API Response Monitoring (POST-LAUNCH - 5 min setup)

### Purpose
Track real API performance in production.

### Implementation Steps

**Step 1:** Add simple timing to fetchers in `useQueries.ts`

```typescript
// Add to fetchUser, fetchPositions, etc.
async function fetchUser(): Promise<User | null> {
  const start = performance.now();
  const res = await fetch("/api/user");
  const duration = performance.now() - start;
  
  if (duration > 1000) {
    console.warn(`Slow API: /api/user took ${duration.toFixed(0)}ms`);
  }
  
  return validateApiResponse(UserSchema, res);
}
```

### Verification Checklist
- [ ] Add timing logs to critical fetchers
- [ ] Deploy to production
- [ ] Monitor console for slow API warnings
- [ ] Set up Vercel Analytics for Core Web Vitals

---

## Pre-Launch Verification Summary

### Critical Path (Do These Now)

```
□ Issue #1: Remove duplicate font imports (2 min)
  └─ Edit globals.css, delete lines 1-2
  
□ Issue #2: Verify QR loading states work (10 min)
  └─ Test spray and deposit flows manually
  
□ Issue #3: Run Lighthouse audit (15 min)
  └─ Document scores, fix any red flags
```

### Post-Launch (Within 1 Week)

```
□ Issue #4: Run bundle analyzer (10 min)
□ Issue #5: Add API timing logs (5 min)
□ Set up Vercel Analytics dashboard
□ Monitor Core Web Vitals for 7 days
```

---

## Success Criteria

**Before Launch:**
- [ ] No errors in `npm run build`
- [ ] Lighthouse Performance score > 70 (mobile)
- [ ] LCP < 4s (absolute maximum)
- [ ] No render-blocking resources flagged
- [ ] QR codes show loading state

**After Launch (1 week):**
- [ ] Vercel Analytics shows LCP < 2.5s for 75th percentile
- [ ] No API requests > 2s in logs
- [ ] No user complaints about slow loading

---

## Rollback Plan

All changes are safe, but if needed:

1. **Font fix rollback:** Restore `@import` lines in `globals.css`
2. **QR fix rollback:** Revert to previous commit
3. **General:** All changes are additive or removals — no breaking changes

---

## Contact

If Lighthouse shows unexpected critical issues:
1. Screenshot the results
2. Check Network tab for slow requests
3. Review Vercel function logs
4. Escalate if TTFB > 1s consistently

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Next Review:** Post-launch (February 7, 2026)
