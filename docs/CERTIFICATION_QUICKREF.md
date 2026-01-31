# 🛡️ Certification Quick Reference

## Before You Request Certification

### Must Pass (Run These)
```bash
# 1. Build
npm run build

# 2. Type Check
npx tsc --noEmit

# 3. Compliance
npm run compliance:check

# 4. Test
npm test
```

### Must Check (Manual)
- ☐ No `console.log` debug statements
- ☐ Error handling implemented
- ☐ Mobile responsive tested
- ☐ AGENT_MEMORY.md updated (if arch changes)

---

## Risk Level Assessment

| Low Risk | Medium Risk | High Risk |
|----------|-------------|-----------|
| UI text changes | New API endpoints | Deposit/payout logic |
| CSS styling | Database queries | Auth changes |
| Minor bugfixes | Component changes | Schema migrations |
| Copy updates | Performance fixes | Smart contract calls |

**High Risk = Requires Product Senior Engineer sign-off**

---

## Certification Request Format

Send to Lead Dev:
```
Subject: CERT REQUEST - [Brief Description]

Change: [One sentence summary]
Risk Level: [Low/Medium/High]
Files: [List main files changed]

Build: ☐ Pass
Types: ☐ Pass
Compliance: ☐ Pass
Tests: ☐ Pass

[Link to branch/PR]
```

---

## Lead Dev Checklist

### Quick 5-Minute Review
- [ ] Code readable and follows patterns
- [ ] No obvious security issues
- [ ] Error handling present
- [ ] No performance red flags
- [ ] Tests appropriate

### Decision
- ☐ **CERTIFIED** - Push to GitHub
- ☐ **NEEDS CHANGES** - See comments
- ☐ **NEEDS PRODUCT SR REVIEW** - High risk

---

## Emergency Hotfix

**For production-critical issues ONLY:**

1. Fix the issue
2. Get **verbal/async approval** from Lead Dev
3. Push and deploy
4. **Retroactive certification within 24 hours**

---

## Sign-Off Template

```
CERTIFIED by: _________________
Date: _________
Risk: Low/Medium/High

Notes: _________________________
________________________________

☐ Ready for GitHub push
```

---

**Full Process:** See `CERTIFICATION_CHECKLIST.md`
