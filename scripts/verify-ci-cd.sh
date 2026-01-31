#!/bin/bash
# Verify CI/CD Setup Script
# Run this to check if CI/CD is properly configured

echo "🔍 Verifying CI/CD Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_result=0

# Check if GitHub Actions workflows exist
echo "📁 Checking GitHub Actions workflows..."
if [ -d ".github/workflows" ]; then
    workflow_count=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)
    if [ $workflow_count -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Found $workflow_count workflow(s):"
        ls -1 .github/workflows/*.yml | sed 's/^/  - /'
    else
        echo -e "${RED}✗${NC} No workflow files found in .github/workflows/"
        check_result=1
    fi
else
    echo -e "${RED}✗${NC} .github/workflows directory does not exist"
    check_result=1
fi

echo ""

# Check if Vercel is linked
echo "🔗 Checking Vercel project links..."
if [ -f "apps/dapp/.vercel/project.json" ]; then
    echo -e "${GREEN}✓${NC} DApp is linked to Vercel"
    DAPP_PROJECT_ID=$(cat apps/dapp/.vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    echo "  Project ID: $DAPP_PROJECT_ID"
else
    echo -e "${RED}✗${NC} DApp is NOT linked to Vercel"
    echo "  Run: cd apps/dapp && vercel link"
    check_result=1
fi

if [ -f "apps/landing/.vercel/project.json" ]; then
    echo -e "${GREEN}✓${NC} Landing is linked to Vercel"
    LANDING_PROJECT_ID=$(cat apps/landing/.vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    echo "  Project ID: $LANDING_PROJECT_ID"
else
    echo -e "${RED}✗${NC} Landing is NOT linked to Vercel"
    echo "  Run: cd apps/landing && vercel link"
    check_result=1
fi

echo ""

# Check for GitHub CLI and secrets
echo "🔐 Checking GitHub Secrets (requires gh CLI)..."
if command -v gh &> /dev/null; then
    if gh auth status &>/dev/null; then
        echo -e "${GREEN}✓${NC} GitHub CLI authenticated"
        
        # List secrets (this will fail if not a repo admin, which is fine)
        secrets=$(gh secret list 2>/dev/null | grep -E "VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID" || true)
        if [ -n "$secrets" ]; then
            echo -e "${GREEN}✓${NC} Found Vercel-related secrets:"
            echo "$secrets" | sed 's/^/  - /'
        else
            echo -e "${YELLOW}⚠${NC} No Vercel secrets found in GitHub"
            echo "  Run: gh secret set VERCEL_TOKEN --body 'your-token'"
        fi
    else
        echo -e "${YELLOW}⚠${NC} GitHub CLI not authenticated"
        echo "  Run: gh auth login"
    fi
else
    echo -e "${YELLOW}⚠${NC} GitHub CLI not installed"
    echo "  Install: https://cli.github.com/"
fi

echo ""

# Check package.json scripts
echo "📦 Checking package.json scripts..."
if grep -q "compliance:check" package.json; then
    echo -e "${GREEN}✓${NC} compliance:check script found"
else
    echo -e "${YELLOW}⚠${NC} compliance:check script not found"
fi

if grep -q "prisma:generate" package.json; then
    echo -e "${GREEN}✓${NC} prisma:generate script found"
else
    echo -e "${YELLOW}⚠${NC} prisma:generate script not found"
fi

echo ""

# Summary
echo "═══════════════════════════════════════════════════"
if [ $check_result -eq 0 ]; then
    echo -e "${GREEN}✅ CI/CD Setup looks good!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure GitHub Secrets are configured:"
    echo "     - VERCEL_TOKEN"
    echo "     - VERCEL_ORG_ID"
    echo "     - VERCEL_PROJECT_ID_DAPP"
    echo "     - VERCEL_PROJECT_ID_LANDING"
    echo ""
    echo "  2. Set up branch protection rules for 'main'"
    echo ""
    echo "  3. Push to main to trigger first deployment"
else
    echo -e "${RED}⚠️  Some checks failed. Please review above.${NC}"
    echo ""
    echo "See .github/CICD_SETUP_GUIDE.md for setup instructions"
fi
echo "═══════════════════════════════════════════════════"

exit $check_result
