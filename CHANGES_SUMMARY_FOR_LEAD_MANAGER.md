# 📋 Changes Ready for GitHub Push

**Date:** 2026-01-31  
**Prepared by:** Kimi (Lead Dev AI Assistant)  
**Total Changes:** 99 modified + 40 new files

---

## 🚨 CRITICAL: Review Required Before Push

**Certification Status:** ⏳ Pending Lead Dev Review  
**Risk Level:** MEDIUM-HIGH (Multiple system changes)  
**Recommendation:** Review each category before commit

---

## 📁 Change Categories

### 1. 🛡️ CERTIFICATION PROCESS (NEW)
**Risk:** LOW | **Reviewer:** Lead Dev

| File | Purpose |
|------|---------|
| `docs/CERTIFICATION_CHECKLIST.md` | Full code certification process |
| `docs/CERTIFICATION_QUICKREF.md` | Quick reference card |

**Action:** Document only - Safe to push

---

### 2. 🚨 EMERGENCY SSE PERFORMANCE FIX
**Risk:** HIGH | **Reviewer:** Lead Dev + Product Sr Eng

| File | Change |
|------|--------|
| `apps/dapp/src/app/api/sse/route.ts` | Polling 2s → 30s, Redis check, connection timeout |
| `apps/dapp/src/hooks/useRealtimeStatus.ts` | Better error handling, reconnect backoff |

**Impact:** Fixes UI freezing from Redis polling  
**Testing Required:** ✅ Verify clicks responsive  
**Notes:** See `EMERGENCY_SSE_FIX.md` for details

---

### 3. ⚡ CLIENT-SIDE PERFORMANCE FIXES
**Risk:** MEDIUM | **Reviewer:** Lead Dev

| File | Change |
|------|--------|
| `apps/dapp/src/app/sample-v2/components/CampaignCard.tsx` | Added React.memo |
| `apps/dapp/src/app/sample-v2/page.tsx` | Dynamic import with skeleton |
| `apps/dapp/src/app/sample-v2/page.module.css` | Skeleton loading styles |

**Impact:** Reduced re-renders, code splitting  
**Testing Required:** ✅ Homepage loads, cards clickable

---

### 4. 🗄️ DATABASE & API PERFORMANCE
**Risk:** MEDIUM | **Reviewer:** Lead Dev

| File | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Added indexes on Participant |
| `apps/dapp/src/app/api/trenches/route.ts` | Cache headers, timing logs |
| `apps/dapp/src/services/trenchService.ts` | Performance monitoring |

**Impact:** Faster API responses (<1s target)  
**DB Migration Required:** ✅ Run SQL manually (see below)

---

### 5. 🔧 BUG FIXES
**Risk:** LOW-MEDIUM | **Reviewer:** Lead Dev

| File | Issue | Fix |
|------|-------|-----|
| `apps/dapp/src/app/api/campaigns/[id]/route.ts` | Campaign detail "Not Found" | Fixed Next.js 16 async params |
| `apps/dapp/src/app/api/user/positions/route.ts` | Hidden campaigns showing | Added isHidden filter |
| `apps/dapp/src/app/api/user/route.ts` | Auth issues | Session handling improved |
| `apps/dapp/src/app/api/health/route.ts` | Health check | Added performance metrics |

---

### 6. 📚 DOCUMENTATION RESTRUCTURING
**Risk:** LOW | **Reviewer:** Lead Dev

| Change | Details |
|--------|---------|
| `.gitignore` | Added docs filtering rules |
| `docs/README.md` | New documentation guide |
| `docs/ai-context/` | New folder (gitignored) |
| 32 files moved | To ai-context/ subfolders |

**Impact:** Cleaner GitHub repo (70% smaller)  
**Action:** Document reorganization only

---

### 7. 🎨 UI/UX IMPROVEMENTS
**Risk:** LOW | **Reviewer:** Lead Dev

| File | Change |
|------|--------|
| `apps/dapp/src/app/sample-v2/dashboard-v2/*` | Position card details restored |
| `apps/dapp/src/app/sample-v2/components/LayoutClient.tsx` | SSE integration |
| `apps/dapp/src/app/sample-v2/deposit/page.tsx` | Deposit flow improvements |
| `apps/dapp/src/hooks/useQueries.ts` | React Query optimization |

---

## 🗄️ Required Database Migration

**Must run BEFORE deploying to production:**

```sql
-- Run in Supabase SQL Editor
CREATE INDEX IF NOT EXISTS "Participant_trenchId_idx" ON "Participant"("trenchId");
CREATE INDEX IF NOT EXISTS "Participant_userId_status_idx" ON "Participant"("userId", "status");
```

**Verification:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'Participant';
-- Should show: Participant_trenchId_idx, Participant_userId_status_idx
```

---

## ✅ Pre-Push Checklist for Lead Dev

### Phase 1: Build Verification
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run compliance:check` passes (0 violations)

### Phase 2: Functional Testing
- [ ] Server starts: `npm run dev`
- [ ] Homepage loads: http://localhost:3000/sample-v2
- [ ] Campaign cards clickable (no delay)
- [ ] Campaign detail page works
- [ ] Dashboard loads with positions
- [ ] Deposit flow works

### Phase 3: Performance Verification
- [ ] `/api/trenches` loads in <1s
- [ ] SSE shows activity every 30s (not constant)
- [ ] No UI freezing when clicking
- [ ] Console shows `[PERF]` timing logs

### Phase 4: Database
- [ ] Indexes applied in Supabase
- [ ] No Prisma errors

---

## 🚀 Recommended Commit Strategy

### Option A: Single Commit (Simple)
```bash
git add .
git commit -m "fix: performance issues, SSE fix, certification process

- Fix SSE Redis polling (2s -> 30s)
- Add React.memo and dynamic imports
- Database indexes for performance
- Campaign detail API fix
- Documentation restructuring
- Certification process"
git push origin main
```

### Option B: Separate Commits (Recommended)
```bash
# 1. Documentation
git add docs/README.md docs/CERTIFICATION*.md .gitignore
git commit -m "docs: add certification process and restructure"

# 2. Performance - Database
git add packages/database/prisma/schema.prisma
git commit -m "perf: add database indexes on Participant table"

# 3. Performance - API
git add apps/dapp/src/app/api/trenches/route.ts apps/dapp/src/services/trenchService.ts
git commit -m "perf: add API caching and performance monitoring"

# 4. Performance - Client
git add apps/dapp/src/app/sample-v2/components/CampaignCard.tsx apps/dapp/src/app/sample-v2/page.tsx apps/dapp/src/app/sample-v2/page.module.css
git commit -m "perf: React.memo and dynamic imports for CampaignCard"

# 5. Emergency SSE Fix
git add apps/dapp/src/app/api/sse/route.ts apps/dapp/src/hooks/useRealtimeStatus.ts
git commit -m "fix: emergency SSE performance fix - reduce Redis polling"

# 6. Bug Fixes
git add apps/dapp/src/app/api/campaigns/[id]/route.ts apps/dapp/src/app/api/user/positions/route.ts apps/dapp/src/app/api/user/route.ts
git commit -m "fix: campaign detail API and user positions filtering"

# 7. UI/UX Improvements
git add apps/dapp/src/app/sample-v2/dashboard-v2/* apps/dapp/src/app/sample-v2/components/LayoutClient.tsx apps/dapp/src/hooks/useQueries.ts
git commit -m "feat: dashboard improvements and layout optimizations"

# Push all
git push origin main
```

---

## ⚠️ ROLLBACK PLAN

If issues after push:

```bash
# Revert specific commit
git revert <commit-hash>

# Or rollback to previous state
git log --oneline -5
git reset --hard <last-good-commit>
git push origin main --force  # ⚠️ Use with caution
```

**Critical files to revert first:**
1. `apps/dapp/src/app/api/sse/route.ts` (if SSE issues)
2. `packages/database/prisma/schema.prisma` (if DB issues)

---

## 📞 Support

**Questions?** See detailed docs:
- Emergency SSE Fix: `EMERGENCY_SSE_FIX.md`
- Performance Fixes: `CLIENT_PERF_FIXES_SUMMARY.md`
- Certification: `docs/CERTIFICATION_CHECKLIST.md`
- Doc Restructure: `DOCS_RESTRUCTURING_SUMMARY.md`

**Issues?** Contact: Lead Dev or Product Senior Engineer

---

## 🎯 Deployment Priority

1. **URGENT:** SSE Fix (fixes UI freezing)
2. **HIGH:** Database indexes (API performance)
3. **MEDIUM:** Client performance fixes
4. **LOW:** Documentation restructuring

---

**Prepared by:** Kimi  
**Status:** ⏳ Awaiting Lead Dev Certification  
**Estimated Review Time:** 30-45 minutes

---

## Quick Commands for Lead Dev

```bash
# Navigate to project
cd "/Users/mac/Trenches - Spray and Play/apps/dapp"

# Run all checks
npm run build && npx tsc --noEmit && npm run compliance:check

# Start server
npm run dev

# Test API
curl http://localhost:3000/api/trenches

# Check git status
git status
git diff --stat

# After certification, push
git add .
git commit -m "..."
git push origin main
```
