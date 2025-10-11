#!/bin/bash
# Deployment script for Analos NFT Launchpad

set -e  # Exit on error

echo "🚀 Analos NFT Launchpad - Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="https://rpc.analos.io"
EXPLORER_URL="https://explorer.analos.io"
WALLET_PATH="${HOME}/.config/analos/id.json"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Install with: cargo install --git https://github.com/coral-xyz/anchor avm${NC}"
    exit 1
fi

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Install from https://docs.solana.com/cli/install-solana-cli-tools${NC}"
    exit 1
fi

if [ ! -f "$WALLET_PATH" ]; then
    echo -e "${RED}❌ Wallet not found at $WALLET_PATH${NC}"
    echo "Generate with: solana-keygen new --outfile $WALLET_PATH"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Configure Solana CLI
echo -e "\n${YELLOW}Configuring Solana CLI for Analos...${NC}"
solana config set --url $RPC_URL
solana config set --keypair $WALLET_PATH

# Check wallet balance
echo -e "\n${YELLOW}Checking wallet balance...${NC}"
WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance --lamports | awk '{print $1}')
MIN_BALANCE=1000000000  # 1 LOS minimum

echo "Wallet: $WALLET_ADDRESS"
echo "Balance: $(echo "scale=4; $BALANCE / 1000000000" | bc) LOS"

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo -e "${RED}❌ Insufficient balance. Need at least 1 LOS for deployment${NC}"
    echo "Fund your wallet with LOS from Analos bridge or faucet"
    exit 1
fi

echo -e "${GREEN}✅ Wallet funded${NC}"

# Build the program
echo -e "\n${YELLOW}Building Anchor program...${NC}"
anchor build --provider.cluster mainnet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/analos_nft_launchpad-keypair.json)
echo -e "\nProgram ID: ${GREEN}$PROGRAM_ID${NC}"

# Update Anchor.toml with program ID
echo -e "\n${YELLOW}Updating Anchor.toml with program ID...${NC}"
sed -i.bak "s/ANALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$PROGRAM_ID/g" Anchor.toml
rm Anchor.toml.bak

# Update lib.rs with program ID
echo -e "${YELLOW}Updating lib.rs with program ID...${NC}"
sed -i.bak "s/ANALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$PROGRAM_ID/g" programs/analos-nft-launchpad/src/lib.rs
rm programs/analos-nft-launchpad/src/lib.rs.bak

# Rebuild with correct program ID
echo -e "\n${YELLOW}Rebuilding with updated program ID...${NC}"
anchor build --provider.cluster mainnet

# Deploy to Analos mainnet
echo -e "\n${YELLOW}Deploying to Analos mainnet...${NC}"
echo "This may take a few minutes..."

anchor deploy \
  --provider.cluster mainnet \
  --provider.url $RPC_URL \
  --provider.wallet $WALLET_PATH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Program deployed successfully!${NC}"

# Initialize IDL
echo -e "\n${YELLOW}Initializing IDL...${NC}"
anchor idl init $PROGRAM_ID \
  --provider.cluster mainnet \
  --provider.url $RPC_URL \
  --provider.wallet $WALLET_PATH \
  --filepath target/idl/analos_nft_launchpad.json

echo -e "${GREEN}✅ IDL initialized${NC}"

# Display summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================"
echo "Program ID: $PROGRAM_ID"
echo "Network: Analos Mainnet"
echo "RPC: $RPC_URL"
echo "Explorer: ${EXPLORER_URL}/address/${PROGRAM_ID}"
echo ""
echo "Next Steps:"
echo "1. Save your program ID for frontend integration"
echo "2. Initialize your collection with initialize_collection"
echo "3. Upload metadata to IPFS/Arweave"
echo "4. Build and deploy your frontend"
echo ""
echo "View deployment on explorer:"
echo "${EXPLORER_URL}/address/${PROGRAM_ID}"
echo "========================================"

# Save deployment info
echo -e "\n${YELLOW}Saving deployment info...${NC}"
cat > deployment-info.json << EOF
{
  "programId": "$PROGRAM_ID",
  "network": "analos-mainnet",
  "rpcUrl": "$RPC_URL",
  "explorerUrl": "$EXPLORER_URL",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployedBy": "$WALLET_ADDRESS"
}
EOF

echo -e "${GREEN}✅ Deployment info saved to deployment-info.json${NC}"
echo -e "\n${GREEN}All done! 🚀${NC}"

