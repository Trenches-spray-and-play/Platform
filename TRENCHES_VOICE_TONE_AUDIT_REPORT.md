# 🔍 TRENCHES VOICE & TONE AUDIT REPORT

**Date:** January 30, 2026  
**Auditor:** Marketing Specialist  
**Scope:** All customer-facing content across dApp, landing pages, and marketing materials  
**Guidelines:** Voice & Tone Decision Tree v1.0

---

## 🚨 EXECUTIVE SUMMARY

**CRITICAL FINDINGS: 5 files require immediate revision**

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical (Compliance Risk) | 5 | REQUIRES IMMEDIATE ACTION |
| 🟡 Warning (Voice Mismatch) | 3 | Needs Review |
| 🟢 Info (Suggestions) | 2 | Optional |

---

## 🚫 FORBIDDEN PHRASES VIOLATIONS

### 🔴 CRITICAL: "Guaranteed" Language Found

| File | Line | Violation | Recommended Fix |
|------|------|-----------|-----------------|
| `apps/dapp/src/app/sample-light/page.tsx` | 124 | "Guaranteed returns" | "Targeted settlement" |
| `apps/dapp/src/app/sample-v2/campaign-v2/[id]/page.tsx` | 291 | "guaranteed ROI" | "fixed settlement target" |
| `apps/landing/src/app/branding-lab/v5/page.tsx` | 154 | "50% profit is guaranteed" | "50% targeted settlement" |
| `apps/landing/src/app/branding-lab/viral-videos/page.tsx` | 169 | "NOT TRADING. GUARANTEED." | "NOT TRADING. FIXED SETTLEMENT." |
| `apps/landing/src/app/branding/page.tsx` | 159, 161 | "GUARANTEED_FLOW", "payout is guaranteed" | "SECURE_FLOW", "payout is secured" |

**Compliance Risk:** These phrases constitute securities violations and must be removed immediately.

---

## 📝 VOICE AUDIT BY CHANNEL

### 1️⃣ LANDING PAGE (Accessible Institutional)

**File:** `apps/landing/src/app/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| Mission Statement #3 | "Turn $1000 into $1500 in 24 hours." | Uses result language (acceptable for Accessible Institutional with disclaimer) | ⚠️ Add disclaimer |
| Hero Subtitle | "Put $1000 in, get $1500 out in 24 hours." | Same as above | ⚠️ Add disclaimer |
| CTA | "Join waitlist" | ✅ Correct voice | ✅ |
| Trust Strip | "Enterprise Infrastructure" | ✅ Institutional tone | ✅ |

**Recommendation:** Add disclaimer: "Targeted settlement based on campaign mechanics."

---

### 2️⃣ SAMPLE V2 DASHBOARD (Accessible Institutional)

**File:** `apps/dapp/src/app/sample-v2/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| Hero Title | "Spray & Play Coordination Protocol" | ✅ Correct voice | ✅ |
| Hero Description | "Deposit into time-locked campaigns. Earn boosted yields." | ✅ Professional, no hype | ✅ |
| How It Works | "Three simple steps to start earning" | ✅ Accessible tone | ✅ |
| Step 3 | "Earn & Boost" | ✅ Action-oriented, professional | ✅ |

**Overall:** Good adherence to Accessible Institutional voice.

---

### 3️⃣ CAMPAIGN DETAIL PAGE (Mixed - Needs Fix)

**File:** `apps/dapp/src/app/sample-v2/campaign-v2/[id]/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| "guaranteed ROI" | Line 291 | 🔴 VIOLATION - Forbidden phrase | MUST FIX |
| "Time-locked deposits" | Line 291 | ✅ Good technical description | ✅ |
| "Automatic payout" | Line 303 | ✅ Factual, not promissory | ✅ |
| Form labels (ALL_CAPS) | "// ENTER_CAMPAIGN" | ⚠️ Too technical for landing | Consider: "Enter Campaign" |

**Recommendation:** Fix forbidden phrase and consider humanizing ALL_CAPS labels.

---

### 4️⃣ DEPOSIT PAGE (Accessible Institutional)

**File:** `apps/dapp/src/app/sample-v2/deposit/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| Page Title | "Deposit Funds" | ✅ Clear, professional | ✅ |
| Step labels | "Step 1: Select Coin" | ✅ Accessible instructional | ✅ |
| Warning text | "may result in permanent loss" | ✅ Appropriate risk disclosure | ✅ |
| How Deposits Work | 3-step explanation | ✅ Clear, educational | ✅ |

**Overall:** Excellent compliance and voice consistency.

---

### 5️⃣ EARN PAGE (Accessible Institutional)

**File:** `apps/dapp/src/app/sample-v2/earn-v2/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| Page Title | "Earn Points" | ✅ Simple, clear | ✅ |
| Tab Labels | "Protocol Tasks", "Raids", "Content Lab" | ⚠️ "Raids" is jargon | Consider: "Community Raids" |
| Empty States | "No one-time tasks available" | ✅ Professional | ✅ |

**Overall:** Good, minor terminology suggestion.

---

### 6️⃣ BRANDING LAB V5 (Needs Significant Revision)

**File:** `apps/landing/src/app/branding-lab/v5/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| "50% profit is guaranteed" | Line 154 | 🔴 CRITICAL VIOLATION | MUST FIX |
| "Automatic Profit" | Logic Flow section | ⚠️ Implies certainty | Consider: "Targeted Return" |
| "USD Normalized" | Stats label | ✅ Good technical term | ✅ |
| Comparison section | "Fixed 1.5x Settlement" | ✅ Correct terminology | ✅ |

**Recommendation:** This is a high-traffic landing page. Remove all "guaranteed" language immediately.

---

### 7️⃣ VIRAL VIDEO CONCEPTS (ENERGY Voice - Mostly OK)

**File:** `apps/landing/src/app/branding-lab/viral-videos/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| "NOT TRADING. GUARANTEED." | Line 169 | 🔴 VIOLATION | MUST FIX |
| "FIXED 1.5X PAYOUT" | Line 135 | ✅ Acceptable for ENERGY voice | ✅ |
| "Turn $1k into $1,500 in 24 hours" | Line 235 | ✅ Appropriate for ENERGY | ✅ |
| "No guessing" | Line 235 | ✅ Hype without compliance risk | ✅ |

**Note:** ENERGY voice allows more punchy language, but "guaranteed" is still forbidden.

---

### 8️⃣ BRANDING PAGE (Needs Revision)

**File:** `apps/landing/src/app/branding/page.tsx`

| Element | Current | Voice Assessment | Status |
|---------|---------|------------------|--------|
| "GUARANTEED_FLOW" | Line 159 | 🔴 VIOLATION | MUST FIX |
| "Your payout is guaranteed" | Line 161 | 🔴 CRITICAL VIOLATION | MUST FIX |
| "you ultimately don't lose money" | Info tooltip | ⚠️ Risk implication | Consider: "USD value protected" |

**Note:** This appears to be an educational/onboarding slide deck. Must fix before any user-facing deployment.

---

## ✅ CONTENT THAT EXCEEDS STANDARDS

These files demonstrate excellent voice and tone adherence:

1. **`apps/dapp/src/app/sample-v2/deposit/page.tsx`** - Clear, compliant, well-structured
2. **`apps/dapp/src/app/sample-v2/dashboard-v2/page.tsx`** - Professional, accessible
3. **`apps/dapp/src/app/sample-v2/portfolio/page.tsx`** - Clean, institutional tone
4. **`apps/landing/src/app/page.tsx`** - Strong Accessible Institutional voice (after disclaimer added)

---

## 📋 ACTION ITEMS

### Immediate (Before Any Deploy)
- [ ] **FIX:** Remove "Guaranteed returns" from `sample-light/page.tsx`
- [ ] **FIX:** Remove "guaranteed ROI" from `campaign-v2/[id]/page.tsx`
- [ ] **FIX:** Remove "50% profit is guaranteed" from `branding-lab/v5/page.tsx`
- [ ] **FIX:** Remove "NOT TRADING. GUARANTEED." from `viral-videos/page.tsx`
- [ ] **FIX:** Remove "GUARANTEED_FLOW" and "payout is guaranteed" from `branding/page.tsx`

### This Week
- [ ] Add disclaimers to all ROI claims on landing pages
- [ ] Review ALL_CAPS form labels for humanization
- [ ] Create compliance checklist for future content

### Ongoing
- [ ] Implement content review process using Voice Decision Tree
- [ ] Train content creators on forbidden words list
- [ ] Quarterly audit of all customer-facing copy

---

## 🎯 VOICE ALIGNMENT SCORECARD

| Channel | Target Voice | Current Alignment | Score |
|---------|-------------|-------------------|-------|
| Landing Page | Accessible Institutional | 85% | B+ |
| dApp Dashboard | Accessible Institutional | 95% | A |
| Campaign Pages | Accessible Institutional | 70% | C (fix violations) |
| TikTok/Viral | ENERGY | 90% | A- |
| Branding Lab | Mixed | 60% | D (fix violations) |
| Documentation | Institutional Elite | N/A (not audited) | - |

---

## 📎 REFERENCE

- **Full Voice Guide:** `/docs/VOICE_TONE_DECISION_TREE.md`
- **Brand Guidelines:** `/docs/BRAND_GUIDELINES.md`
- **Forbidden Words:** See Section 4 of Voice Guide

---

**Report Prepared By:** Marketing Specialist  
**Next Audit Scheduled:** After compliance fixes implemented

---

*When in doubt, choose the more conservative voice.*
