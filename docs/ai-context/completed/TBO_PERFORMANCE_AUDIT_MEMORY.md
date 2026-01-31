# TBO Performance Audit Memory Doc
**Date:** January 31, 2026  
**Audited URLs:** 
- playtrenches.xyz (landing)
- trenches-dapp.vercel.app/sample-v2 (dapp)

---

## Executive Summary

Completed code-level performance audit of Trenches platform. Found 2 quick wins before launch, 3 medium-priority optimizations post-launch. No blockers identified.

**Overall Grade:** B+ (Good foundation, minor polish needed)

---

## ✅ Strengths Confirmed

| Area | Implementation | Status |
|------|---------------|--------|
| Next.js Config | `standalone` output, WebP/AVIF, compression enabled | ✅ |
| Package Optimization | `optimizePackageImports` for ethers, viem, solana | ✅ |
| Font Loading | `next/font` with `display: swap` | ✅ |
| React Query | Proper stale times (60s user, 30s positions, 5min campaigns) | ✅ |
| Middleware | Excludes static files from auth check | ✅ |
| Image Formats | WebP/AVIF configured | ✅ |

---

## 🟡 Issues Identified

### 1. Double Font Loading (QUICK FIX)
**Location:** `apps/dapp/src/app/sample-v2/globals.css` Lines 1-2

**Problem:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter...');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono...');
```

Fonts already loaded via `next/font` in `layout.tsx`.

**Fix:** Remove CSS @import statements.

---

### 2. Large Page Components
| Page | Lines | Risk |
|------|-------|------|
| `deposit/page.tsx` | 978 | Slow hydration |
| `earn-v2/page.tsx` | 414 | Moderate |

**Recommendation:** Monitor hydration time in React DevTools.

---

### 3. QR Code Images
**Files:**
- `spray/components/SprayForm.tsx:210`
- `deposit/AddressDisplay.tsx:68`
- `deposit/page.tsx:565`

**Status:** Using `<img>` with data URLs (acceptable). Not using next/Image (also fine for data URLs).

---

### 4. Limited Dynamic Imports
Only 2 dynamic imports found:
- `CampaignFormModal` (admin-v2)
- `ContentSubmitModal` (earn-v2)

**Opportunity:** Lazy load heavy components (charts, QR generation).

---

### 5. CSS Size
| File | Lines |
|------|-------|
| `globals.css` | 536 |
| `globals.mobile.css` | 499 |
| **Total** | **1,035** |

Acceptable for current approach. Could optimize with PurgeCSS if needed.

---

## 🔴 Runtime Verification Needed

Cannot verify without actual Lighthouse/runtime testing:

| Metric | Target | Tool |
|--------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| TTFB (Time to First Byte) | < 200ms | WebPageTest |
| Hydration Time | < 200ms | React DevTools |
| Bundle Size | Analyze | `npm run analyze` |
| Core Web Vitals | RUM data | Vercel Analytics |

---

## Quick Wins Checklist

### ✅ COMPLETED

- [x] **Remove duplicate font imports** (2 min) — DONE
  - File: `apps/dapp/src/app/sample-v2/globals.css`
  - Removed lines 1-2
  - Impact: ~50KB saved, removed render-blocking request

- [x] **Verify QR loading states** (10 min) — VERIFIED
  - SprayForm.tsx already has spinner + "Generating Address..." text
  - Implementation: `{isGeneratingAddress ? <div className={styles.spinner} /> : ...}`
  - Status: Working correctly

### ⏳ PENDING

- [ ] **Run Lighthouse** (15 min)
  - Test both mobile and desktop
  - Target: Performance >70, LCP <4s
  - Requires: Chrome DevTools manual test

---

## Dependencies Analysis

**Heavy packages identified:**
- `ethers` ^6.16.0 — ~500kb
- `viem` ^2.0.0 — ~300kb
- `@solana/web3.js` ^1.98.4 — ~400kb
- `qrcode` ^1.5.4 — ~80kb
- `framer-motion` ^12.29.2 — ~150kb

**Mitigation:** `optimizePackageImports` configured in next.config.ts

---

## Architecture Notes

### Data Fetching Strategy
- Server components fetch initial data
- React Query handles client-side caching
- `force-dynamic` on API routes prevents stale data

### Caching Configuration
```typescript
// React Query stale times
user: 60s
positions: 30s
campaigns: 5min
tasks/raids: 5min
```

### Middleware Impact
- Auth check runs on all routes except static
- Could add latency to TTFB
- Excludes: `_next/static`, `_next/image`, `favicon.ico`, etc.

---

## Recommendations by Priority

### Pre-Launch (P0)
1. Remove duplicate font loading
2. Run Lighthouse audit
3. Verify deposit page hydration isn't sluggish

### Post-Launch (P1)
1. Add Vercel Analytics for Core Web Vitals
2. Consider dynamic imports for QR generation
3. Monitor real user metrics

### Future (P2)
1. CSS purging if file size grows
2. Component code splitting for large pages
3. Edge caching strategy for API routes

---

## Related Documents

- `docs/TBO_COMPLETION_REPORT.md` — Architecture verification
- `apps/dapp/next.config.ts` — Configuration
- `apps/dapp/src/app/sample-v2/layout.tsx` — Font loading
- `apps/dapp/src/app/sample-v2/globals.css` — Styles

---

## Implementation Guide

**Detailed fix instructions:** See `docs/PERFORMANCE_FIX_IMPLEMENTATION_GUIDE.md`

Contains:
- Step-by-step fixes for each issue
- Code diffs (before/after)
- Verification checklists
- Rollback plans
- Success criteria

---

## Last Updated
January 31, 2026 — TBO Performance Audit Complete
- Created implementation guide
- Ready for pre-launch fixes
