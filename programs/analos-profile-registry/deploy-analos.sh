#!/bin/bash

# Analos Profile Registry - Deployment Script
# Deploys the program to Analos mainnet

set -e

echo "🚀 Deploying Analos Profile Registry to Analos Mainnet..."
echo ""

# Check if program is built
if [ ! -f "target/deploy/analos_profile_registry.so" ]; then
    echo "❌ Error: Program not built"
    echo "Run ./build.sh first"
    exit 1
fi

# Configuration
RPC_URL="https://rpc.analos.io"
PROGRAM_PATH="target/deploy/analos_profile_registry.so"
KEYPAIR_PATH="${1:-~/.config/solana/id.json}"

echo "📊 Configuration:"
echo "  RPC: $RPC_URL"
echo "  Program: $PROGRAM_PATH"
echo "  Keypair: $KEYPAIR_PATH"
echo ""

# Check balance
echo "💰 Checking deployer balance..."
BALANCE=$(solana balance --url $RPC_URL --keypair $KEYPAIR_PATH)
echo "  Balance: $BALANCE"
echo ""

# Get program size
SIZE=$(wc -c < $PROGRAM_PATH)
COST=$(echo "scale=4; $SIZE / 1024 / 1024 * 2" | bc)

echo "⚠️  DEPLOYMENT WARNING:"
echo "  Program size: $SIZE bytes"
echo "  Estimated cost: ~${COST} SOL"
echo ""

read -p "Deploy to Analos mainnet? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "📤 Deploying to Analos..."
echo ""

# Deploy
PROGRAM_ID=$(solana program deploy \
    --url $RPC_URL \
    --keypair $KEYPAIR_PATH \
    --program-id target/deploy/analos_profile_registry-keypair.json \
    $PROGRAM_PATH \
    | grep -oP 'Program Id: \K\w+')

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📍 Program ID: $PROGRAM_ID"
echo "🔗 Explorer: https://explorer.analos.io/address/$PROGRAM_ID"
echo ""
echo "📋 TODO:"
echo "1. Update program ID in lib.rs:"
echo "   declare_id!(\"$PROGRAM_ID\");"
echo ""
echo "2. Update SDK:"
echo "   export const PROFILE_REGISTRY_PROGRAM_ID = new PublicKey('$PROGRAM_ID');"
echo ""
echo "3. Rebuild program with correct ID"
echo "4. Upgrade deployed program"
echo "5. Test on mainnet"
echo ""
echo "🎉 Ready for production!"

