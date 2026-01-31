# Vercel Deployment Fix

## Issue
Both landing and dapp deployments are failing on the pull request.

## Root Cause
The GitHub Actions CD workflow uses secrets that may not be configured correctly:
- `VERCEL_PROJECT_ID_DAPP` 
- `VERCEL_PROJECT_ID_LANDING`

## Current Project IDs (from local .vercel configs)

### DApp Project
- **Project ID:** `prj_FsyZShwk3SbHjZ4jpKtop1AGJV0k`
- **Org ID:** `team_qkZitYNHH8H89sRahssNraIq`
- **Location:** Root `.vercel/project.json`
- **Root Directory:** `apps/dapp`

### Landing Project  
- **Project ID:** `prj_H0BRxoWSz43vmJKoS96y9zEgvMTD`
- **Org ID:** `team_qkZitYNHH8H89sRahssNraIq`
- **Location:** `apps/landing/.vercel/project.json`
- **Root Directory:** `apps/landing`

## Fix Required

### Option 1: Configure GitHub Secrets (Recommended)

1. Go to GitHub Repository → Settings → Secrets and Variables → Actions
2. Add the following secrets:

```
Name: VERCEL_PROJECT_ID_DAPP
Value: prj_FsyZShwk3SbHjZ4jpKtop1AGJV0k

Name: VERCEL_PROJECT_ID_LANDING  
Value: prj_H0BRxoWSz43vmJKoS96y9zEgvMTD

Name: VERCEL_ORG_ID
Value: team_qkZitYNHH8H89sRahssNraIq

Name: VERCEL_TOKEN
Value: [Your Vercel personal access token]
```

### Option 2: Vercel Git Integration

If using Vercel's native Git integration instead of GitHub Actions:

1. Go to Vercel Dashboard → DApp Project → Settings → Git
2. Ensure GitHub repository is connected
3. Set Root Directory to `apps/dapp`
4. Repeat for Landing project with Root Directory `apps/landing`

## Verification

After setting secrets, redeploy by pushing a new commit:
```bash
git commit --allow-empty -m "trigger: redeploy after secrets fix"
git push origin main
```

## Local Testing

Both apps build successfully locally:
```bash
# DApp
npm run build --workspace=apps/dapp  ✅ PASS

# Landing  
npm run build --workspace=apps/landing  ✅ PASS
```

## Deployment URLs

- **DApp:** https://app.playtrenches.xyz
- **Landing:** https://playtrenches.xyz
