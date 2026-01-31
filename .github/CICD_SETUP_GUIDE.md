# CI/CD Setup Guide

This guide walks you through setting up the CI/CD pipeline for the Trenches platform.

## 🚀 Quick Start

The CI/CD pipeline includes:
- **CI Workflow**: Lint, build, test, compliance, and security checks on PRs
- **CD Workflow**: Automatic production deployment on main branch merges
- **Preview Workflow**: Preview deployments for PRs
- **Staging Workflow**: Staging environment deployment on develop branch

## 📋 Prerequisites

### 1. GitHub Secrets

Navigate to **Settings > Secrets and variables > Actions** and add the following secrets:

#### Required Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel Organization ID | Run `vercel teams list` or check `.vercel/project.json` |
| `VERCEL_PROJECT_ID_DAPP` | DApp Project ID | From `.vercel/project.json` in `apps/dapp` |
| `VERCEL_PROJECT_ID_LANDING` | Landing Project ID | From `.vercel/project.json` in `apps/landing` |

#### Optional Secrets (for database migrations)

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Production database connection string |
| `DIRECT_URL` | Direct database connection (for migrations) |

### 2. Vercel Project Setup

Ensure both apps are linked to Vercel:

```bash
# For DApp
cd apps/dapp
vercel link

# For Landing
cd apps/landing
vercel link
```

### 3. Branch Protection Rules

Set up branch protection for `main`:

1. Go to **Settings > Branches**
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date before merging
   - **Status checks**: `lint`, `build`, `compliance`, `test`
   - ✅ Restrict pushes that create files larger than 100MB

## 🔄 Workflow Overview

### CI Workflow (`ci.yml`)

Triggers on: PR to `main`/`develop`, push to `main`/`develop`

| Job | Purpose | Fail Action |
|-----|---------|-------------|
| `changes` | Detect which apps changed | - |
| `lint` | ESLint checks | Block merge |
| `build` | Build verification | Block merge |
| `compliance` | Legal/compliance check | Block merge |
| `test` | Unit tests | Warn (continues) |
| `database-check` | Validate Prisma schema | Block merge |
| `security` | npm audit, secret scan | Warn (continues) |

### CD Workflow (`cd.yml`)

Triggers on: Push to `main`, manual trigger

| Job | Purpose |
|-----|---------|
| `deploy-dapp` | Deploy DApp to production |
| `deploy-landing` | Deploy Landing to production |
| `health-check` | Verify deployments are healthy |
| `migrate-database` | Run Prisma migrations |

### Preview Workflow (`preview.yml`)

Triggers on: PR opened/updated

| Job | Purpose |
|-----|---------|
| `preview-dapp` | Deploy DApp preview, comment URL |
| `preview-landing` | Deploy Landing preview, comment URL |

### Staging Workflow (`staging.yml`)

Triggers on: Push to `develop`/`staging`

| Job | Purpose |
|-----|---------|
| `deploy-dapp-staging` | Deploy DApp to staging |
| `deploy-landing-staging` | Deploy Landing to staging |

## 🌿 Git Workflow

```
feature/xyz ──┐
              ├──► develop ──► main (production)
hotfix/abc ───┘       ▲
                      └── staging
```

1. Create feature branch from `develop`
2. Open PR → triggers CI checks
3. Merge to `develop` → auto-deploys to staging
4. Merge `develop` to `main` → auto-deploys to production

## 🛠️ Customization

### Add New Environment Variables

1. Add to Vercel dashboard (Project Settings > Environment Variables)
2. For CI builds, add to workflow `env` section:

```yaml
- name: Build DApp
  env:
    NEW_VAR: ${{ secrets.NEW_VAR }}
  run: npm run build --workspace=apps/dapp
```

### Skip CI for specific commits

Add `[skip ci]` or `[ci skip]` to commit message:
```bash
git commit -m "Update docs [skip ci]"
```

### Manual Deployment

Go to **Actions > CD > Run workflow** to trigger manual deployment.

## 🚨 Troubleshooting

### "Vercel project not found"
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID_*` are correct
- Run `vercel link` in each app directory to get IDs

### "Build fails in CI but works locally"
- Check if environment variables are set in workflow
- Ensure all dependencies are in `package.json` (not devDependencies if needed for build)

### "Database migration fails"
- Verify `DATABASE_URL` secret is set
- Check migration is compatible with production schema

## 📊 Monitoring

After deployment, check:
- Vercel Dashboard for deployment status
- GitHub Actions logs for build details
- Application health endpoints

## 🔒 Security Notes

- Never commit `.env` files
- All secrets are stored in GitHub Secrets
- Security scanning runs on every PR
- npm audit runs with `moderate` level (adjust as needed)
