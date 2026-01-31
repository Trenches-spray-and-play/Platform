# Domain Migration Summary: trenches.fund → playtrenches.xyz

**Status:** ✅ **COMPLETE**  
**Migration Date:** 2026-01-31  
**Performed By:** Infrastructure Engineer

---

## 🎯 Migration Scope

Updated all hardcoded domain references from `trenches.fund` to `playtrenches.xyz` in infrastructure and monitoring configurations.

---

## 📁 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `.github/workflows/cd.yml` | 4 URLs updated | ✅ |
| `.github/workflows/staging.yml` | 6 URLs updated | ✅ |
| `.github/MONITORING_SETUP_GUIDE.md` | 1 email domain updated | ✅ |
| `.claude/INFRA_MEMORY.md` | Domain note added | ✅ |

---

## 🔗 URL Mappings

### Production
| Old | New |
|-----|-----|
| `https://app.trenches.fund` | `https://app.playtrenches.xyz` |
| `https://trenches.fund` | `https://playtrenches.xyz` |
| `alerts@trenches.fund` | `alerts@playtrenches.xyz` |

### Staging
| Old | New |
|-----|-----|
| `https://staging-app.trenches.fund` | `https://staging-app.playtrenches.xyz` |
| `https://staging.trenches.fund` | `https://staging.playtrenches.xyz` |

---

## 🧪 Verification Checklist

- [ ] Update Vercel project domains (if custom domains configured)
- [ ] Update DNS records to point to new domain
- [ ] Configure SSL certificates for playtrenches.xyz
- [ ] Update UptimeRobot monitors with new URLs
- [ ] Test health endpoints on new domains
- [ ] Verify email sending from alerts@playtrenches.xyz
- [ ] Update any external service integrations (OAuth callbacks, webhooks)

---

## 🚀 Post-Migration Steps

### 1. Vercel Configuration
Ensure Vercel projects are configured with the new domains:
```bash
# For DApp
cd apps/dapp
vercel --scope=trenches  # Update domains in Vercel dashboard

# For Landing
cd apps/landing
vercel --scope=trenches
```

### 2. Environment Variables
Update any environment variables that reference the old domain:
```bash
# Check for any remaining references
grep -r "trenches.fund" apps/dapp/.env.local apps/landing/.env.local 2>/dev/null || echo "No local env files with old domain"
```

### 3. External Services
Update callback URLs in:
- Supabase Auth (OAuth callbacks)
- Telegram Bot (webhook URL if used)
- Any third-party integrations

---

## 📝 Notes

- The codebase was already predominantly using `playtrenches.xyz`
- This migration focused on infrastructure/CD configuration files
- Application code already references the correct domain via environment variables
- Lighthouse audit files and documentation memory files were not modified (they're historical records)

---

**Next Action Required:** Configure the actual domain in Vercel dashboard and update DNS records.
