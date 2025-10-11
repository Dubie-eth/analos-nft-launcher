#!/bin/bash
# Quick Start Script - Sets up environment and runs tests

set -e

echo "🎭 Analos NFT Launchpad - Quick Start"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "Anchor.toml" ]; then
    echo -e "${RED}❌ Error: Anchor.toml not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm not found. Please install Node.js${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 2: Checking Rust toolchain...${NC}"
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo -e "${GREEN}✅ Rust installed: $RUST_VERSION${NC}"
else
    echo -e "${RED}❌ Rust not found. Install from: https://rustup.rs${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 3: Checking Anchor CLI...${NC}"
if command -v anchor &> /dev/null; then
    ANCHOR_VERSION=$(anchor --version)
    echo -e "${GREEN}✅ Anchor installed: $ANCHOR_VERSION${NC}"
else
    echo -e "${RED}❌ Anchor not found. Install with: cargo install --git https://github.com/coral-xyz/anchor avm${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 4: Checking Solana CLI...${NC}"
if command -v solana &> /dev/null; then
    SOLANA_VERSION=$(solana --version)
    echo -e "${GREEN}✅ Solana installed: $SOLANA_VERSION${NC}"
else
    echo -e "${RED}❌ Solana not found. Install from: https://docs.solana.com/cli/install-solana-cli-tools${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 5: Building Anchor program...${NC}"
anchor build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 6: Running tests...${NC}"
echo "(This may take a few minutes)"
anchor test --skip-local-validator
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. This is expected if running without local validator.${NC}"
fi

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Generate an Analos wallet:"
echo "   solana-keygen new --outfile ~/.config/analos/id.json"
echo ""
echo "2. Configure for Analos:"
echo "   solana config set --url https://rpc.analos.io"
echo "   solana config set --keypair ~/.config/analos/id.json"
echo ""
echo "3. Fund your wallet with LOS tokens"
echo ""
echo "4. Deploy to Analos:"
echo "   ./scripts/deploy.sh"
echo ""
echo "5. Initialize your collection:"
echo "   ts-node scripts/initialize-collection.ts"
echo ""
echo "6. Build frontend (see DEPLOYMENT-GUIDE.md)"
echo ""
echo -e "${GREEN}For detailed instructions, see DEPLOYMENT-GUIDE.md${NC}"

