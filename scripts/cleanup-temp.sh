#!/bin/bash

# 🗑️ TEMPORARY FILE CLEANUP SCRIPT
# Automatically removes temporary keypair files after operations

echo "🗑️ Running Temporary File Cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CLEANED_FILES=0

# Find and remove temporary keypair files
echo "🔍 Scanning for temporary keypair files..."

# Look for temp keypair files
TEMP_FILES=$(find . -name "temp-*.json" -o -name "tmp-*.json" -o -name "*temp*.json" | grep -v ".secure-keypairs" | grep -v "scripts")

if [ -n "$TEMP_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found temporary keypair files:${NC}"
    echo "$TEMP_FILES"
    echo ""
    echo -e "${RED}🚨 SECURITY RISK: These files contain private keys!${NC}"
    echo "Deleting immediately..."
    
    for file in $TEMP_FILES; do
        if [ -f "$file" ]; then
            echo "🗑️  Deleting: $file"
            rm "$file"
            CLEANED_FILES=$((CLEANED_FILES + 1))
        fi
    done
    
    echo -e "${GREEN}✅ Cleaned up $CLEANED_FILES temporary files${NC}"
else
    echo -e "${GREEN}✅ No temporary keypair files found${NC}"
fi

# Check for any .json files in root that might be keypairs
echo "🔍 Checking for keypair files in project root..."
ROOT_KEYPAIRS=$(find . -maxdepth 1 -name "*keypair*.json" -o -name "*wallet*.json" | grep -v ".secure-keypairs")

if [ -n "$ROOT_KEYPAIRS" ]; then
    echo -e "${RED}❌ CRITICAL: Keypair files found in project root!${NC}"
    echo "Files found:"
    echo "$ROOT_KEYPAIRS"
    echo ""
    echo -e "${RED}🚨 IMMEDIATE ACTION REQUIRED:${NC}"
    echo "1. Move these files to .secure-keypairs/ directory"
    echo "2. Run: mv filename.json .secure-keypairs/"
    echo "3. Verify they are not staged for git commit"
    exit 1
fi

# Verify git staging is clean
echo "🔍 Checking git staging area..."
STAGED_KEYPAIRS=$(git diff --cached --name-only | grep -E "\.(json)$" | grep -E "(keypair|wallet|private)")

if [ -n "$STAGED_KEYPAIRS" ]; then
    echo -e "${RED}❌ CRITICAL: Keypair files staged for commit!${NC}"
    echo "Files staged:"
    echo "$STAGED_KEYPAIRS"
    echo ""
    echo -e "${RED}🚨 IMMEDIATE ACTION REQUIRED:${NC}"
    echo "1. Remove from staging: git reset HEAD filename.json"
    echo "2. Move to secure directory: mv filename.json .secure-keypairs/"
    echo "3. Verify .gitignore excludes keypair files"
    exit 1
fi

# Summary
echo ""
echo "📊 Cleanup Summary:"
echo -e "${GREEN}✅ Temporary files cleaned: $CLEANED_FILES${NC}"
echo -e "${GREEN}✅ Project root is clean${NC}"
echo -e "${GREEN}✅ Git staging is clean${NC}"
echo -e "${GREEN}🛡️ Security maintained${NC}"

echo ""
echo "🔒 Remember the 5 Golden Rules:"
echo "1. 🚫 NEVER leave keypairs in project root"
echo "2. 🗑️ ALWAYS delete temporary copies after use"
echo "3. 📵 NEVER commit keypair files to git"
echo "4. ✅ ALWAYS verify recipient before sharing"
echo "5. 🔐 ALWAYS use secure communication channels"
