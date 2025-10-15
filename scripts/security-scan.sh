#!/bin/bash

# 🔒 SECURITY SCAN SCRIPT
# Scans for keypair files and enforces security rules

echo "🔒 Running Security Scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Security violations counter
VIOLATIONS=0

echo "📋 Checking Security Rules..."

# Rule 1: Check for keypairs in project root
echo "🔍 Rule 1: Checking for keypairs in project root..."
if find . -maxdepth 1 -name "*keypair*.json" -o -name "*wallet*.json" | grep -v ".secure-keypairs" | grep -v "./scripts" | grep -q .; then
    echo -e "${RED}❌ VIOLATION: Keypair files found in project root!${NC}"
    echo "Files found:"
    find . -maxdepth 1 -name "*keypair*.json" -o -name "*wallet*.json" | grep -v ".secure-keypairs"
    echo "Move these files to .secure-keypairs/ directory immediately!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ PASS: No keypairs in project root${NC}"
fi

# Rule 2: Check for temporary keypair files
echo "🔍 Rule 2: Checking for temporary keypair files..."
if find . -name "temp-*.json" -o -name "tmp-*.json" | grep -q .; then
    echo -e "${RED}❌ VIOLATION: Temporary keypair files found!${NC}"
    echo "Files found:"
    find . -name "temp-*.json" -o -name "tmp-*.json"
    echo "Delete these temporary files immediately!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ PASS: No temporary keypair files${NC}"
fi

# Rule 3: Check git staging for sensitive files
echo "🔍 Rule 3: Checking git staging for sensitive files..."
if git diff --cached --name-only | grep -E "\.(json)$" | grep -E "(keypair|wallet|private)" | grep -q .; then
    echo -e "${RED}❌ VIOLATION: Sensitive files staged for commit!${NC}"
    echo "Files staged:"
    git diff --cached --name-only | grep -E "\.(json)$" | grep -E "(keypair|wallet|private)"
    echo "Remove these files from staging immediately!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ PASS: No sensitive files in git staging${NC}"
fi

# Rule 4: Verify .secure-keypairs directory exists and is protected
echo "🔍 Rule 4: Checking secure storage..."
if [ -d ".secure-keypairs" ]; then
    echo -e "${GREEN}✅ PASS: Secure keypairs directory exists${NC}"
    if git check-ignore .secure-keypairs/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: Secure directory is git-ignored${NC}"
    else
        echo -e "${RED}❌ VIOLATION: Secure directory not git-ignored!${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
else
    echo -e "${RED}❌ VIOLATION: Secure keypairs directory missing!${NC}"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Rule 5: Check for hardcoded private keys in code
echo "🔍 Rule 5: Scanning for hardcoded private keys..."
if grep -r -E "\[[0-9, ]{64,}\]" --include="*.rs" --include="*.ts" --include="*.js" --include="*.tsx" . | grep -v ".secure-keypairs" | grep -v "scripts" | grep -q .; then
    echo -e "${RED}❌ VIOLATION: Potential hardcoded private keys found!${NC}"
    echo "Files with potential private keys:"
    grep -r -E "\[[0-9, ]{64,}\]" --include="*.rs" --include="*.ts" --include="*.js" --include="*.tsx" . | grep -v ".secure-keypairs" | grep -v "scripts"
    echo "Remove hardcoded private keys immediately!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ PASS: No hardcoded private keys found${NC}"
fi

# Summary
echo ""
echo "📊 Security Scan Summary:"
if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL SECURITY RULES PASSED!${NC}"
    echo -e "${GREEN}🛡️ System is secure${NC}"
    exit 0
else
    echo -e "${RED}❌ $VIOLATIONS SECURITY VIOLATIONS FOUND!${NC}"
    echo -e "${RED}🚨 IMMEDIATE ACTION REQUIRED${NC}"
    echo ""
    echo "🔒 The 5 Golden Rules:"
    echo "1. 🚫 NEVER leave keypairs in project root"
    echo "2. 🗑️ ALWAYS delete temporary copies after use"
    echo "3. 📵 NEVER commit keypair files to git"
    echo "4. ✅ ALWAYS verify recipient before sharing"
    echo "5. 🔐 ALWAYS use secure communication channels"
    exit 1
fi
