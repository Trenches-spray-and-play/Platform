# Lighthouse Audit Report - Local Dapp
**Date:** January 31, 2026  
**Audited URL:** http://localhost:3004/sample-v2/  
**Tool:** Lighthouse 12.8.2 (Mobile)

---

## 📊 Overall Scores

| Category | Score | Grade |
|----------|-------|-------|
| **Performance** | 35/100 | 🔴 Poor |
| **Accessibility** | 92/100 | 🟢 Excellent |
| **Best Practices** | 96/100 | 🟢 Good |
| **SEO** | 82/100 | 🟡 Needs Improvement |

---

## 🔴 CRITICAL: Performance Issues

### Core Web Vitals

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **LCP** (Largest Contentful Paint) | 15.3s | < 2.5s | 🔴 Poor |
| **FCP** (First Contentful Paint) | 1.9s | < 1.8s | 🟡 Needs Improvement |
| **CLS** (Cumulative Layout Shift) | 0 | < 0.1 | 🟢 Perfect |
| **TBT** (Total Blocking Time) | 10,470ms | < 200ms | 🔴 Poor |
| **Speed Index** | 10.1s | < 3.4s | 🔴 Poor |
| **TTFB** | 190ms | < 200ms | 🟢 Good |

### Root Cause Analysis

**This is a DEVELOPMENT build, not production!**

#### Bundle Size Analysis
| Type | Requests | Size |
|------|----------|------|
| **Total** | 45 | **1,419 KB** |
| Scripts | 33 | **1,255 KB** |
| Fonts | 3 | 115 KB |
| Document | 1 | 22 KB |
| Stylesheets | 3 | 15 KB |

**Comparison to Landing Page:**
| Metric | Landing Page | Local Dapp | Difference |
|--------|--------------|------------|------------|
| Total Size | 389 KB | 1,419 KB | **+1,030 KB (+265%)** |
| JavaScript | 266 KB | 1,255 KB | **+989 KB (+372%)** |
| Performance | 16 | 35 | Better but still poor |

#### Main Thread Work Breakdown (16.6s total)
| Task | Duration | % of Time |
|------|----------|-----------|
| Script Evaluation | 9,453ms | 57% |
| Other | 2,924ms | 18% |
| Style & Layout | 2,122ms | 13% |
| Script Parsing & Compilation | 1,712ms | 10% |
| Parse HTML & CSS | 187ms | 1% |
| Rendering | 174ms | 1% |

---

## 🚨 CRITICAL FINDING: DEV Tools in Bundle

### Unused JavaScript: 543 KB (38% of total!)

| Source | Wasted | % Unused | Issue |
|--------|--------|----------|-------|
| **Next Devtools** | 139 KB | 64% | 🔴 DEV ONLY |
| **TanStack Query Devtools** | 75 KB | 77% | 🔴 DEV ONLY |
| Zod | 69 KB | 74% | 🟡 Tree-shaking issue |
| Next Client | 64 KB | 53% | 🟡 Potential optimization |
| React DOM | 60 KB | 34% | 🟡 Potential optimization |

### Long Tasks (Killing Main Thread)

| Source | Duration |
|--------|----------|
| **TanStack Query Devtools** | **2,480ms** |
| React DOM | 1,130ms |
| Next Compiled | 968ms |
| **Next Devtools** | **909ms** |
| Next Compiled | 873ms |

**The two devtools alone are blocking for 3.4 seconds!**

---

## 🎯 Key Differences: Landing Page vs Local Dapp

| Aspect | Landing Page | Local Dapp | Analysis |
|--------|--------------|------------|----------|
| **Bundle Size** | 389 KB | 1,419 KB | Dapp is 3.6x larger |
| **JavaScript** | 266 KB | 1,255 KB | Dapp has 4.7x more JS |
| **FCP** | 7.2s | 1.9s | Dapp renders faster initially |
| **LCP** | 13.1s | 15.3s | Dapp worse (more content) |
| **TBT** | 10,550ms | 10,470ms | Both terrible |
| **CLS** | 0.196 | 0 | Dapp has perfect layout stability |
| **Third-party** | 9 KB | 0 KB | Dapp has no third-party scripts |

---

## ✅ What's Working Well

1. **CLS (0)** - Perfect layout stability, no shifts
2. **TTFB (190ms)** - Good server response time
3. **No Third-party Scripts** - Clean, self-contained
4. **FCP (1.9s)** - Initial render is reasonable
5. **Accessibility (92)** - Good a11y support

---

## 🔴 Critical Issues

### 1. DEVELOPMENT Build Artifacts (HIGHEST PRIORITY)
**Impact:** 214 KB of devtools blocking for 3.4+ seconds

**Problem:**
- Next.js Devtools included (139 KB unused)
- TanStack Query Devtools included (75 KB unused)
- These are for development only and should NOT be in production

**Fix:**
```bash
# Ensure NODE_ENV=production for builds
NODE_ENV=production npm run build

# Or check if devtools are conditionally imported
# In React Query client setup:
const queryClient = new QueryClient({
  defaultOptions: { ... }
});

// Remove this in production:
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

### 2. Massive JavaScript Bundle (1,255 KB)
**Impact:** 9.4s script evaluation, 1.7s parsing

**Likely Causes:**
- Web3 libraries (ethers, viem, solana-web3.js) loaded synchronously
- No code splitting
- Large dependencies not tree-shaken

**Fix:**
- [ ] Implement dynamic imports for wallet connections
- [ ] Lazy load heavy components (campaign lists, charts)
- [ ] Audit bundle with `@next/bundle-analyzer`
- [ ] Tree-shake unused Zod schemas (69 KB unused)

### 3. Script Parsing & Compilation (1.7s)
**Impact:** Delayed interactivity

**Fix:**
- [ ] Use `<script type="module">` with `async`/`defer`
- [ ] Preload critical scripts
- [ ] Consider Web Workers for heavy computation

---

## 🟡 Secondary Issues

### Accessibility (92 → 100)
- Color contrast issues
- Touch target sizing
- Missing descriptive link text

### SEO (82 → 100)
- Meta description optimization
- Structured data improvements

### Best Practices (96 → 100)
- Console errors need cleanup
- Missing source maps (expected in dev)
- bfcache issues

---

## 📈 Recommendations by Impact

### Immediate (Fix Before Production)

| Priority | Action | Expected Impact |
|----------|--------|-----------------|
| 🔴 P0 | Remove devtools from production build | -214 KB, -3.4s blocking |
| 🔴 P0 | Run production build for audit | Accurate metrics |
| 🟡 P1 | Audit bundle with analyzer | Identify bloat sources |
| 🟡 P1 | Implement dynamic imports | Faster initial load |
| 🟢 P2 | Tree-shake Zod schemas | -69 KB |

### Expected Improvements (After Devtools Removal)

| Metric | Current | Expected After Fix |
|--------|---------|-------------------|
| Bundle Size | 1,419 KB | ~1,200 KB |
| TBT | 10,470ms | ~7,000ms |
| Performance Score | 35 | ~50-60 |

---

## 🧪 Testing Recommendation

**DO NOT use this audit for production readiness.** This is a development build with devtools included.

**Correct approach:**
1. Build for production: `NODE_ENV=production npm run build`
2. Start production server: `npm start`
3. Re-run Lighthouse
4. Compare results

---

## 📁 Raw Data

- **Lighthouse Version:** 12.8.2
- **Tested On:** Mobile (Moto G4 emulation)
- **Network:** Simulated Fast 3G
- **CPU:** 4x slowdown
- **Environment:** Development (Next.js dev server)

---

**Report Generated:** January 31, 2026  
**Audited By:** TBO (Senior Product Engineer AI)
