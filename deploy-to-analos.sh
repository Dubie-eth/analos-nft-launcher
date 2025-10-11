#!/bin/bash

# Deploy All Programs to Analos Mainnet
# Run this after deploying to Devnet and downloading the .so files

echo "🚀 Deploying Analos NFT-to-Token Launch System to Analos"
echo "=========================================================="
echo ""

# Configuration
ANALOS_RPC="https://rpc.analos.io"
WALLET_PATH="$HOME/.config/solana/id.json"

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance --url $ANALOS_RPC --keypair $WALLET_PATH)
echo "   Balance: $BALANCE"
echo ""

# Deploy NFT Launchpad (update existing or deploy new)
echo "📦 Deploying NFT Launchpad..."
if [ -f "analos-nft-launchpad.so" ]; then
    NFT_LAUNCHPAD_ID=$(solana program deploy analos-nft-launchpad.so --use-rpc --url $ANALOS_RPC --keypair $WALLET_PATH --program-id nft-launchpad-keypair.json 2>&1 | grep "Program Id:" | awk '{print $3}')
    echo "   ✅ NFT Launchpad: $NFT_LAUNCHPAD_ID"
else
    echo "   ⚠️  analos-nft-launchpad.so not found, skipping..."
fi
echo ""

# Deploy Token Launch
echo "📦 Deploying Token Launch..."
if [ -f "analos-token-launch.so" ]; then
    TOKEN_LAUNCH_ID=$(solana program deploy analos-token-launch.so --use-rpc --url $ANALOS_RPC --keypair $WALLET_PATH 2>&1 | grep "Program Id:" | awk '{print $3}')
    echo "   ✅ Token Launch: $TOKEN_LAUNCH_ID"
else
    echo "   ❌ analos-token-launch.so not found!"
    echo "   Please download from Devnet first:"
    echo "   solana program dump [DEVNET_ID] analos-token-launch.so --url https://api.devnet.solana.com"
    exit 1
fi
echo ""

# Deploy Rarity Oracle
echo "📦 Deploying Rarity Oracle..."
if [ -f "analos-rarity-oracle.so" ]; then
    RARITY_ORACLE_ID=$(solana program deploy analos-rarity-oracle.so --use-rpc --url $ANALOS_RPC --keypair $WALLET_PATH 2>&1 | grep "Program Id:" | awk '{print $3}')
    echo "   ✅ Rarity Oracle: $RARITY_ORACLE_ID"
else
    echo "   ❌ analos-rarity-oracle.so not found!"
    exit 1
fi
echo ""

# Deploy Price Oracle
echo "📦 Deploying Price Oracle..."
if [ -f "analos-price-oracle.so" ]; then
    PRICE_ORACLE_ID=$(solana program deploy analos-price-oracle.so --use-rpc --url $ANALOS_RPC --keypair $WALLET_PATH 2>&1 | grep "Program Id:" | awk '{print $3}')
    echo "   ✅ Price Oracle: $PRICE_ORACLE_ID"
else
    echo "   ❌ analos-price-oracle.so not found!"
    exit 1
fi
echo ""

# Create program IDs file
echo "📝 Creating PROGRAM-IDS.md..."
cat > PROGRAM-IDS.md << EOF
# Program IDs - Analos Mainnet

**Deployed:** $(date)

## Programs:
- **NFT Launchpad:** \`$NFT_LAUNCHPAD_ID\`
- **Token Launch:** \`$TOKEN_LAUNCH_ID\`
- **Rarity Oracle:** \`$RARITY_ORACLE_ID\`
- **Price Oracle:** \`$PRICE_ORACLE_ID\`

## Environment Variables:

### Frontend (Vercel):
\`\`\`bash
NEXT_PUBLIC_NFT_LAUNCHPAD_ID=$NFT_LAUNCHPAD_ID
NEXT_PUBLIC_TOKEN_LAUNCH_ID=$TOKEN_LAUNCH_ID
NEXT_PUBLIC_RARITY_ORACLE_ID=$RARITY_ORACLE_ID
NEXT_PUBLIC_PRICE_ORACLE_ID=$PRICE_ORACLE_ID
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
\`\`\`

### Backend (Railway):
\`\`\`bash
NFT_LAUNCHPAD_PROGRAM_ID=$NFT_LAUNCHPAD_ID
TOKEN_LAUNCH_PROGRAM_ID=$TOKEN_LAUNCH_ID
RARITY_ORACLE_PROGRAM_ID=$RARITY_ORACLE_ID
PRICE_ORACLE_PROGRAM_ID=$PRICE_ORACLE_ID
ANALOS_RPC_URL=https://rpc.analos.io
LOS_TOKEN_MINT=LoSVGc4rXHmeXcGF5VmT7uKYVQbLEKx6vVqKvVVpump
\`\`\`
EOF

echo "✅ PROGRAM-IDS.md created"
echo ""

echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================================="
echo ""
echo "📋 Program IDs:"
echo "   NFT Launchpad: $NFT_LAUNCHPAD_ID"
echo "   Token Launch: $TOKEN_LAUNCH_ID"
echo "   Rarity Oracle: $RARITY_ORACLE_ID"
echo "   Price Oracle: $PRICE_ORACLE_ID"
echo ""
echo "📝 Next Steps:"
echo "   1. Update environment variables in Vercel"
echo "   2. Update environment variables in Railway"
echo "   3. Test on Analos testnet"
echo "   4. Launch! 🚀"
echo ""

