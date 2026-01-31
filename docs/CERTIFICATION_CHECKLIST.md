# 🛡️ Code Certification Checklist

> **Purpose:** Ensure all code changes meet quality standards before GitHub push  
> **Authority:** Lead Dev (Primary) | Product Senior Engineer (Secondary)  
> **Status:** QA Engineer role vacant - process owned by Lead Dev

---

## 📋 Certification Workflow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  DEV MAKES      │───→│  DEV COMPLETES  │───→│  LEAD DEV       │
│  CHANGES        │    │  CHECKLIST      │    │  REVIEWS &      │
│                 │    │  (Self-Verify)  │    │  CERTIFIES      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PUSH TO        │←───│  FINAL SIGN-OFF │←───│  PRODUCT SR     │
│  GITHUB         │    │  (If Required)  │    │  ENGINEER       │
│                 │    │                 │    │  (Secondary)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## ✅ Phase 1: Developer Self-Verification

*Complete ALL items before requesting certification*

### 1.1 Pre-Commit Checks

| # | Check | Command/Method | Pass Criteria |
|---|-------|----------------|---------------|
| ☐ | **Build Success** | `npm run build` | No errors, exit code 0 |
| ☐ | **Type Check** | `npx tsc --noEmit` | Zero type errors |
| ☐ | **Lint Check** | `npm run lint` | No linting errors |
| ☐ | **Compliance Check** | `npm run compliance:check` | 0 violations |
| ☐ | **Test Suite** | `npm test` | All tests pass |

### 1.2 Functional Testing

| # | Check | Verification Method |
|---|-------|---------------------|
| ☐ | **Local Dev Test** | `npm run dev` → Test affected pages |
| ☐ | **API Endpoints** | Test all modified endpoints |
| ☐ | **Database Migrations** | `npx prisma migrate status` (if applicable) |
| ☐ | **Error Handling** | Verify graceful error states |
| ☐ | **Mobile Responsive** | Test on mobile viewport |

### 1.3 Files Verification

| # | Check | Command |
|---|-------|---------|
| ☐ | **No Console Logs** | `grep -r "console.log" src/` (remove debug logs) |
| ☐ | **Env Variables** | `.env.example` updated if new vars added |
| ☐ | **Documentation** | `AGENT_MEMORY.md` updated if architectural changes |
| ☐ | **Dependencies** | `package.json` and lockfile in sync |

---

## ✅ Phase 2: Lead Dev Certification

*Lead Dev reviews and certifies the changes*

### 2.1 Code Review Checklist

| # | Review Item | Approved | Notes |
|---|-------------|----------|-------|
| ☐ | **Code Quality** - Clean, readable, follows project patterns | ☐ | |
| ☐ | **Type Safety** - Proper TypeScript types, no `any` abuse | ☐ | |
| ☐ | **Error Handling** - Try/catch, error boundaries, user feedback | ☐ | |
| ☐ | **Performance** - No N+1 queries, efficient React patterns | ☐ | |
| ☐ | **Security** - No hardcoded secrets, proper auth checks | ☐ | |
| ☐ | **Database** - Proper Prisma queries, indexes considered | ☐ | |
| ☐ | **API Design** - RESTful, consistent error responses | ☐ | |

### 2.2 Architecture Review (If Applicable)

| # | Review Item | Approved | Notes |
|---|-------------|----------|-------|
| ☐ | **Breaking Changes** - Backward compatible | ☐ | |
| ☐ | **State Management** - Proper use of Zustand/React Query | ☐ | |
| ☐ | **Component Design** - Reusable, properly memoized | ☐ | |
| ☐ | **File Structure** - Follows established conventions | ☐ | |

### 2.3 Testing Verification

| # | Check | Approved | Notes |
|---|-------|----------|-------|
| ☐ | **Unit Tests** - Added/updated for new logic | ☐ | |
| ☐ | **Integration Tests** - Critical paths covered | ☐ | |
| ☐ | **Manual Testing** - Dev confirmed working locally | ☐ | |
| ☐ | **Edge Cases** - Empty states, errors, loading handled | ☐ | |

---

## ✅ Phase 3: Secondary Review (High-Risk Changes)

*Product Senior Engineer reviews for:*
- Architectural changes
- Database schema changes
- Financial/business logic changes
- Security-sensitive changes

### 3.1 High-Risk Indicators

☑️ **Require Secondary Review** if ANY of the following:
- [ ] Changes to payout/deposit logic
- [ ] Database schema modifications
- [ ] Authentication/authorization changes
- [ ] Smart contract interactions
- [ ] API rate limiting or security changes
- [ ] Performance-critical paths modified
- [ ] New external dependencies added

### 3.2 Product Senior Engineer Sign-Off

| # | Review Item | Approved | Notes |
|---|-------------|----------|-------|
| ☐ | **Architecture Alignment** - Fits system design | ☐ | |
| ☐ | **Risk Assessment** - Acceptable risk level | ☐ | |
| ☐ | **Rollback Plan** - Can revert if issues | ☐ | |
| ☐ | **Documentation** - Technical docs updated | ☐ | |

---

## ✅ Phase 4: Final Certification

### 4.1 Certification Sign-Off

```
╔════════════════════════════════════════════════════════════════╗
║  CERTIFICATION SIGN-OFF                                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Change Description: _______________________________________   ║
║                                                                ║
║  Files Modified: ___________________________________________   ║
║                                                                ║
║  Risk Level: ☐ Low  ☐ Medium  ☐ High                          ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐    ║
║  │  LEAD DEV CERTIFICATION                                │    ║
║  │                                                        │    ║
║  │  Name: _______________________ Date: _______________   │    ║
║  │                                                        │    ║
║  │  Signature: _______________________________________   │    ║
║  │                                                        │    ║
║  │  ☐ Certified - Ready for GitHub push                   │    ║
║  │  ☐ Needs Changes (see notes)                           │    ║
║  │                                                        │    ║
║  │  Notes: ____________________________________________   │    ║
║  │  ___________________________________________________   │    ║
║  └────────────────────────────────────────────────────────┘    ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐    ║
║  │  PRODUCT SR ENGINEER SIGN-OFF (High Risk Only)         │    ║
║  │                                                        │    ║
║  │  Name: _______________________ Date: _______________   │    ║
║  │                                                        │    ║
║  │  Signature: _______________________________________   │    ║
║  │                                                        │    ║
║  │  ☐ Approved for deployment                             │    ║
║  │  ☐ Requires additional review                          │    ║
║  └────────────────────────────────────────────────────────┘    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Phase 5: Post-Certification

### 5.1 GitHub Push Checklist

| # | Check | Command/Action |
|---|-------|----------------|
| ☐ | **Commit Message** | Follows conventional commits format |
| ☐ | **Branch Clean** | No WIP commits, rebased on main |
| ☐ | **Push to Remote** | `git push origin <branch-name>` |
| ☐ | **Create PR** | Include certification checklist |
| ☐ | **Link Issues** | Reference related GitHub issues |

### 5.2 PR Template (Copy to PR Description)

```markdown
## Change Summary
- **Type:** ☐ Feature ☐ Bugfix ☐ Performance ☐ Refactor
- **Risk Level:** ☐ Low ☐ Medium ☐ High
- **Affected Areas:** _______________

## Certification
- [ ] Build passes
- [ ] Type check passes  
- [ ] Compliance check passes (0 violations)
- [ ] Lead Dev certified: @<lead-dev-name>
- [ ] Product Sr Eng approved (if high risk): @<product-sr-eng>

## Testing
- [ ] Local testing completed
- [ ] API endpoints tested
- [ ] Error states verified
- [ ] Mobile responsive verified

## Notes
<!-- Any special deployment considerations, rollback procedures, etc. -->
```

---

## ⚠️ Emergency Procedures

### Hotfix Certification (Critical Production Issues)

For critical bugs affecting production:

| Step | Action | Owner |
|------|--------|-------|
| 1 | Create hotfix branch from main | Dev |
| 2 | Apply minimal fix | Dev |
| 3 | **Lead Dev verbal approval** (can be async) | Lead Dev |
| 4 | Push and deploy | Dev |
| 5 | **Retroactive certification** within 24hrs | Lead Dev |
| 6 | Document in AGENT_MEMORY.md | Dev |

### Bypass Criteria (Document After)

Only bypass certification if:
1. Production is down
2. Security vulnerability needs immediate patching
3. Financial loss is actively occurring

**Must document:**
- Reason for bypass
- Who authorized
- Retroactive review completed

---

## 📊 Certification Metrics

Track these metrics weekly:

| Metric | Target | Current |
|--------|--------|---------|
| Certification Pass Rate | >95% | ___% |
| Avg Time to Certify | <4 hours | ___ hours |
| Post-Certification Bugs | <2/week | ___/week |
| Emergency Bypasses | <1/month | ___/month |

---

## 📝 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-31 | Created certification process | Kimi |
| | | |

---

## 🎯 Future Improvements (When QA Engineer Hired)

- [ ] Automated test coverage gates (80%+ required)
- [ ] CI/CD pipeline with automated certification checks
- [ ] Staging environment for pre-production testing
- [ ] Regression test suite
- [ ] Performance benchmarking in CI
- [ ] Security scanning (SAST/DAST)
- [ ] Contract audit integration

---

**Process Owner:** Lead Dev  
**Review Frequency:** Monthly until QA Engineer hired  
**Next Review Date:** 2026-02-28
