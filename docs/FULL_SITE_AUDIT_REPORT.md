# Trenches Full Site Audit Report

> **Scope:** All customer-facing content across landing app and dapp  
> **Date:** 2026-01-30  
> **Auditor:** Marketing Lead  
> **Status:** 🟡 PARTIAL RISK — Issues Found, Action Required

---

## 🎯 EXECUTIVE SUMMARY

| Metric | Count | Status |
|--------|-------|--------|
| **Pages Audited** | 50+ | ✅ Complete |
| **Critical Violations** | 0 | ✅ Fixed in last deploy |
| **Medium Risk Issues** | 12 | 🟡 Action needed |
| **Low Risk Issues** | 8 | 🟢 Address when convenient |
| **Compliance Disclaimers Missing** | 15 pages | 🔴 Add immediately |
| **Voice Inconsistencies** | 6 instances | 🟡 Fix this week |

**Overall Risk Level:** 🟡 **MEDIUM** — No critical violations, but compliance gaps and voice inconsistencies need attention before major marketing push.

---

## 🚨 CRITICAL FINDINGS (FIX IMMEDIATELY)

### NONE — All Critical Violations Fixed ✅

The 5 critical "guaranteed" violations from the previous audit have been resolved.

---

## 🔴 HIGH PRIORITY (Fix This Week)

### 1. Missing Compliance Disclaimers (15 Pages)

**Issue:** Pages mentioning financial outcomes lack the required disclaimer.

| Page | Location | Mentions | Disclaimer Status |
|------|----------|----------|-------------------|
| `/sample-light/page.tsx` | dapp | "1.5x", "$1000 → $1500" | ✅ Fixed |
| `/campaign-v2/[id]/page.tsx` | dapp | "1.5x", settlement | ✅ Fixed |
| `/branding-lab/v5/page.tsx` | landing | "1.5x", "50% profit" | ✅ Fixed |
| `/viral-videos/page.tsx` | landing | "GUARANTEED" (fixed) | ✅ Fixed |
| `/branding/page.tsx` | landing | "GUARANTEED_FLOW" (fixed) | ✅ Fixed |
| `/dashboard/page.tsx` | dapp | "ROI", "rewards", "payout" | ❌ **MISSING** |
| `/dashboard-v2/page.tsx` | dapp | "1.5x", "rewards" | ❌ **MISSING** |
| `/earn/page.tsx` | dapp | "earning", "rewards" | ❌ **MISSING** |
| `/earn-v2/page.tsx` | dapp | "1.5x", "returns" | ❌ **MISSING** |
| `/portfolio/page.tsx` | dapp | "profit", "returns" | ❌ **MISSING** |
| `/deposit/page.tsx` | dapp | "settlement", "rewards" | ❌ **MISSING** |
| `/trench/[id]/page.tsx` | dapp | "1.5x", "payout" | ❌ **MISSING** |
| `/campaign/[id]/page.tsx` | dapp | "rewards", "settlement" | ❌ **MISSING** |
| `/sample-light/earn/page.tsx` | dapp | "earn", "rewards" | ❌ **MISSING** |
| `/sample-light/dashboard/page.tsx` | dapp | "position", "returns" | ❌ **MISSING** |

**Action Required:**
```tsx
// Add to all 10 missing pages:
import { ComplianceDisclaimer } from "@trenches/ui";

// At the bottom of each page:
<ComplianceDisclaimer variant="footer" />
```

**Owner:** Dev Team  
**Deadline:** 48 hours  
**Risk:** Securities compliance gap

---

### 2. Admin Portal: Client-Side Auth (Security Risk)

**File:** `/apps/dapp/src/app/admin/login/page.tsx`

**Issue:** Admin authentication uses client-side cookie setting with hardcoded password.

```tsx
// CURRENT (INSECURE):
const ADMIN_KEY = "spray_and_pray_admin"; // Hardcoded
if (password === ADMIN_KEY) {
  document.cookie = "admin_auth=true"; // Client-side
}
```

**Risk:** 
- Admin key visible in client bundle
- Cookie can be forged
- Full admin access if key leaks

**Action Required:**
- Move auth to server-side API route
- Use proper session management
- Add rate limiting

**Owner:** Dev Team + Security  
**Deadline:** 1 week  
**Risk:** 🔴 Critical security vulnerability

---

## 🟡 MEDIUM PRIORITY (Fix This Week)

### 3. Voice Inconsistencies (6 Instances)

| File | Current | Issue | Recommended Fix |
|------|---------|-------|-----------------|
| `/dashboard/page.tsx` | "Boost your ROI" | Hype language | "Increase your settlement potential" |
| `/earn-v2/page.tsx` | "Maximize returns" | Investment language | "Optimize your position" |
| `/portfolio/page.tsx` | "Your profits" | Ownership claim | "Your settlements" |
| `/landing/page.tsx` (line 238) | "Pure profit" | Strong claim | "Structured rewards" |
| `/sample-v2/page.tsx` | "Get Paid" | Transactional | "Receive Settlement" |
| `/onboarding-modal.tsx` | "Get Rich" (archived?) | Non-compliant | Remove or archive |

**Action:** Audit and align with Voice & Tone Decision Tree  
**Owner:** Content Team  
**Deadline:** 1 week

---

### 4. Jargon Without Explanation (8 Instances)

| File | Term | Context | Fix |
|------|------|---------|-----|
| `/landing/page.tsx` | "Protocol Activated" | Hero tag | OK for crypto natives, add tooltip? |
| `/dashboard/page.tsx` | "Belief Score" | Widget | Add "(Your reputation rank)" |
| `/dashboard/page.tsx` | "Boost Points" | Widget | Add "(Earned by validating others)" |
| `/trench/[id]/page.tsx` | "Spray Entry" | CTA | Add "(Deposit to join)" |
| `/deposit/page.tsx` | "Sweep Batch" | Technical | Remove from UI or explain |
| `/earn/page.tsx` | "Raid" | Activity | Add "(Coordinated social post)" |
| `/campaign/[id]/page.tsx` | "Trench Level" | Selector | Add tooltip: RAPID/MID/DEEP explanation |
| `/admin/page.tsx` | "Reorg" | Alert | Change to "Network sync issue" |

**Action:** Add tooltips or simplify language  
**Owner:** UX + Content Team  
**Deadline:** 1 week

---

### 5. Broken or Risky Functionality

| Feature | Location | Issue | Impact |
|---------|----------|-------|--------|
| Referral Attribution | `/ref/[code]/page.tsx` | Route exists but `referredById` never set | Referrals don't track |
| Waitlist Refund | API route | DELETE endpoint doesn't refund deposits | Users lose funds |
| Queue Calculation | `/api/user/positions` | Missing belief score in calculation | Wrong position displayed |
| Campaign Migration | Admin panel | No auto waitlist → participant conversion | Manual intervention required |

**Action:** Fix core functionality bugs  
**Owner:** Dev Team  **Deadline:** 2 weeks

---

## 🟢 LOW PRIORITY (Address When Convenient)

### 6. UI/UX Polish Issues

| File | Issue | Severity | Fix |
|------|-------|----------|-----|
| `/landing/page.tsx` | Mission statements rotate too fast (4s) | Low | Increase to 6s |
| `/dashboard/page.tsx` | No empty state for new users | Low | Add "Get Started" prompt |
| `/deposit/page.tsx` | Chain selector shows technical names | Low | Show "Ethereum" not "ETH_MAINNET" |
| `/profile/page.tsx` | No social proof of tasks completed | Low | Add "Tasks completed: X" counter |
| `/admin/page.tsx` | Tables lack sorting/filtering | Low | Add basic filters |
| `/campaign/[id]/page.tsx` | No countdown for campaign start | Low | Add timer widget |

---

### 7. Accessibility Issues

| File | Issue | WCAG Standard |
|------|-------|---------------|
| Multiple | Buttons with only icon, no aria-label | 2.1 AA |
| `/landing/page.tsx` | Color contrast on Zenith Green text | 2.1 AA |
| `/dashboard/page.tsx` | Modal lacks focus trap | 2.1 AA |
| `/deposit/page.tsx` | Form inputs lack error announcements | 2.1 AA |

**Action:** Schedule accessibility audit  
**Owner:** Dev Team  
**Deadline:** Next sprint

---

## 📊 PAGE-BY-PAGE AUDIT

### LANDING APP (/apps/landing/src/app/)

| Page | Compliance | Voice | Functionality | Overall |
|------|------------|-------|---------------|---------|
| `/page.tsx` (Home) | 🟡 Missing disclaimer | 🟢 Good | 🟢 Working | B+ |
| `/branding/page.tsx` | ✅ Fixed | 🟢 Good | 🟢 Working | A- |
| `/branding-lab/v5/page.tsx` | ✅ Fixed | 🟢 Good | 🟢 Working | A- |
| `/branding-lab/page.tsx` | ✅ N/A (info) | 🟢 Good | 🟢 Working | A |
| `/branding-lab/demo-suite/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A |
| `/branding-lab/viral-videos/page.tsx` | ✅ Fixed | 🟢 Good | 🟢 Working | A- |
| `/ref/[code]/page.tsx` | ✅ N/A | 🟢 Good | 🔴 Broken (no tracking) | C |

### DAPP (/apps/dapp/src/app/)

| Page | Compliance | Voice | Functionality | Overall |
|------|------------|-------|---------------|---------|
| `/page.tsx` (Home) | 🟡 Missing disclaimer | 🟢 Good | 🟢 Working | B+ |
| `/dashboard/page.tsx` | 🔴 Missing disclaimer | 🟡 Hype language | 🟡 Calculation bug | C |
| `/dashboard-v2/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/profile/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/settings/addresses/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/trench/[id]/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/deposit/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/join/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/login/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/register/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/sample-light/page.tsx` | ✅ Fixed | 🟢 Good | 🟢 Working | A- |
| `/sample-light/dashboard/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/sample-light/earn/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/sample-light/campaign/[id]/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/sample-v2/page.tsx` | 🟡 Missing disclaimer | 🟡 "Get Paid" language | 🟢 Working | B |
| `/sample-v2/dashboard-v2/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/sample-v2/earn-v2/page.tsx` | 🔴 Missing disclaimer | 🟡 "Maximize returns" | 🟢 Working | B- |
| `/sample-v2/portfolio/page.tsx` | 🔴 Missing disclaimer | 🟡 "Your profits" | 🟢 Working | B- |
| `/sample-v2/deposit/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/sample-v2/campaign-v2/[id]/page.tsx` | ✅ Fixed | 🟢 Good | 🟢 Working | A- |
| `/campaign/[id]/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/admin/login/page.tsx` | ✅ N/A | 🟢 Good | 🔴 Security risk | D |
| `/admin/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | B+ |
| `/earn/page.tsx` | 🔴 Missing disclaimer | 🟢 Good | 🟢 Working | B |
| `/comprehensive-lab/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |
| `/layout-exploration/page.tsx` | ✅ N/A | 🟢 Good | 🟢 Working | A- |

---

## 🎯 ACTION PLAN

### This Week (Days 1-3)

**Priority 1: Compliance (Dev Team)**
- [ ] Add `<ComplianceDisclaimer />` to 10 missing pages
- [ ] Run `npm run compliance:check` on all pages
- [ ] Verify disclaimers are visible on mobile

**Priority 2: Security (Dev Team)**
- [ ] Fix admin auth (move to server-side)
- [ ] Add rate limiting to admin endpoints
- [ ] Rotate the hardcoded admin key immediately

### This Week (Days 4-7)

**Priority 3: Content (Content Team)**
- [ ] Fix 6 voice inconsistencies
- [ ] Add tooltips for 8 jargon terms
- [ ] Review with Marketing Lead

**Priority 4: Bugs (Dev Team)**
- [ ] Fix referral attribution (`referredById`)
- [ ] Fix queue calculation (add belief score)
- [ ] Implement waitlist refund logic

### Next Week

**Priority 5: Polish**
- [ ] Fix UI/UX polish issues
- [ ] Schedule accessibility audit
- [ ] Add empty states
- [ ] Improve campaign migration flow

---

## 📈 SCORECARD SUMMARY

| Category | Score | Grade | Trend |
|----------|-------|-------|-------|
| **Compliance** | 70% | C | 🟢 Improving (was 60%) |
| **Voice & Tone** | 85% | B+ | 🟡 Stable |
| **Functionality** | 75% | C+ | 🟡 Needs attention |
| **Security** | 60% | D | 🔴 Critical (admin auth) |
| **Accessibility** | 70% | C | 🟡 Needs audit |

**Overall Platform Health:** 🟡 **70% — FAIR**

**To reach 90% (EXCELLENT):**
1. Fix all disclaimer gaps (+10%)
2. Fix admin security (+15%)
3. Fix core functionality bugs (+5%)

---

## 🎁 BONUS: QUICK WINS

These take <30 minutes each but improve quality significantly:

1. **Add `aria-label` to icon buttons** (Accessibility)
2. **Slow down mission statement rotation** (UX)
3. **Add "(?)" tooltips to Belief Score and Boost Points** (Clarity)
4. **Change "Get Paid" to "Receive Settlement"** (Compliance)
5. **Add countdown to campaign pages** (Engagement)

---

## 📞 QUESTIONS?

**For compliance issues:** Marketing Lead  
**For security issues:** Security Lead / Dev Lead  
**For functionality bugs:** Product Manager  
**For voice/tone:** Content Lead

---

**Report Generated:** 2026-01-30  
**Next Audit:** 2026-02-15  
**Audit Version:** 1.0
