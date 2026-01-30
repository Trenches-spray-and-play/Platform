#!/bin/bash

# =============================================================================
# Trenches Compliance Check Script
# =============================================================================
# This script scans for forbidden words that violate securities laws.
# Add to CI/CD pipeline to block deployments with compliance violations.
#
# Usage:
#   ./scripts/compliance-check.sh
#
# Exit codes:
#   0 = No violations found
#   1 = Violations detected
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Running Trenches Compliance Check..."
echo ""

# Forbidden words/phrases (case insensitive)
# These constitute securities violations and CANNOT be used in production
FORBIDDEN_PATTERNS=(
  "guaranteed return"
  "guaranteed returns"
  "guaranteed profit"
  "guaranteed profits"
  "guaranteed roi"
  "guaranteed money"
  "risk-free"
  "risk free"
  "100% certain"
  "free money"
  "get rich quick"
  "get rich"
  "ponzi"
)

# Files/directories to exclude (build artifacts, node_modules, docs)
EXCLUDE_DIRS=(
  "node_modules"
  ".next"
  ".vercel"
  "dist"
  "build"
  "_bmad"
  "_bmad-output"
  "docs"  # Excluded - contains examples of forbidden words for reference
)

# Build exclude pattern for grep
EXCLUDE_PATTERN=""
for dir in "${EXCLUDE_DIRS[@]}"; do
  EXCLUDE_PATTERN="${EXCLUDE_PATTERN} --exclude-dir=${dir}"
done

VIOLATIONS_FOUND=0

# Check each forbidden pattern
echo "📋 Checking for forbidden words/phrases:"
echo ""

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  # Search in TSX, TS, JSX, JS, and MD files
  matches=$(grep -ri \
    ${EXCLUDE_PATTERN} \
    --include="*.tsx" \
    --include="*.ts" \
    --include="*.jsx" \
    --include="*.js" \
    --include="*.md" \
    "${pattern}" \
    ./apps ./packages ./docs 2>/dev/null || true)
  
  if [ -n "$matches" ]; then
    echo "${RED}🚨 VIOLATION: '${pattern}'${NC}"
    echo "$matches" | head -5
    echo ""
    VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
  fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "${GREEN}✅ COMPLIANCE CHECK PASSED${NC}"
  echo "No securities violations detected."
  echo ""
  exit 0
else
  echo "${RED}❌ COMPLIANCE CHECK FAILED${NC}"
  echo "${RED}Found ${VIOLATIONS_FOUND} violation(s)${NC}"
  echo ""
  echo "These words/phrases violate securities laws and must be removed:"
  echo "  • 'guaranteed' in any financial context"
  echo "  • 'risk-free' or 'risk free'"
  echo "  • '100% certain'"
  echo "  • 'free money'"
  echo "  • 'get rich quick'"
  echo "  • 'ponzi' (even jokingly)"
  echo ""
  echo "See docs/VOICE_TONE_DECISION_TREE.md for compliant alternatives."
  echo ""
  exit 1
fi
