#!/bin/bash

# 🔒 SECURITY VALIDATION SCRIPT
# Run this before deployments to ensure no sensitive data is exposed

echo "🔐 Starting Security Validation..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check for exposed private keys
echo ""
echo "1️⃣  Checking for exposed private keys..."
if grep -r "privateKey\s*=\s*['\"]" src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Hardcoded private key found!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No hardcoded private keys${NC}"
fi

# 2. Check for .env files in git
echo ""
echo "2️⃣  Checking for .env files in repository..."
if git ls-files | grep -q ".env"; then
    echo -e "${RED}❌ CRITICAL: .env file committed to git!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No .env files in repository${NC}"
fi

# 3. Check for keypair files
echo ""
echo "3️⃣  Checking for keypair files in repository..."
if git ls-files | grep -E "keypair.*\.json|\.pem|\.key$"; then
    echo -e "${RED}❌ CRITICAL: Keypair files found in repository!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No keypair files in repository${NC}"
fi

# 4. Check .gitignore configuration
echo ""
echo "4️⃣  Checking .gitignore configuration..."
if grep -q ".secure-keypairs" .gitignore && grep -q "*.key" .gitignore; then
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: .gitignore missing security entries${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Check for console.log with sensitive data
echo ""
echo "5️⃣  Checking for sensitive data in console.log..."
if grep -r "console\.log.*password\|console\.log.*secret\|console\.log.*private" src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Sensitive data in console.log${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No sensitive data in console.log${NC}"
fi

# 6. Check environment variable usage
echo ""
echo "6️⃣  Checking environment variable usage..."
if grep -r "process\.env\..*KEY.*=.*['\"]" src/ --exclude-dir=node_modules 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Hardcoded environment variables!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Environment variables not hardcoded${NC}"
fi

# 7. Check for TODO security items
echo ""
echo "7️⃣  Checking for security TODOs..."
TODO_COUNT=$(grep -r "TODO.*security\|FIXME.*security" src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: $TODO_COUNT security TODO items found${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No pending security TODOs${NC}"
fi

# 8. Check for exposed API keys in code
echo ""
echo "8️⃣  Checking for exposed API keys..."
if grep -rE "['\"]([a-zA-Z0-9]{32,})['\"]" src/ --exclude-dir=node_modules | grep -i "api.*key\|secret.*key" 2>/dev/null | head -5; then
    echo -e "${YELLOW}⚠️  WARNING: Possible exposed API keys (review manually)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No obvious exposed API keys${NC}"
fi

# Final Report
echo ""
echo "=================================="
echo "🔐 Security Validation Complete"
echo "=================================="
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ CRITICAL: $ERRORS security error(s) found!${NC}"
    echo -e "${RED}🚨 DO NOT DEPLOY until fixed!${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo -e "${YELLOW}📋 Review and fix before production${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo -e "${GREEN}🚀 Safe to deploy${NC}"
    exit 0
fi

