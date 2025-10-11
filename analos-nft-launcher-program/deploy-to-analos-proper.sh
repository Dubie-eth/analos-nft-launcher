#!/bin/bash

# Analos-specific deployment script
echo "🚀 DEPLOYING TO ANALOS BLOCKCHAIN"
echo "=================================="

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

# Configure for Analos network
echo "📡 Configuring for Analos network..."
solana config set --url https://rpc.analos.io

# Check current configuration
echo "🔍 Current Solana configuration:"
solana config get

# Check balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Check if we have enough SOL for deployment
MIN_BALANCE=0.1
if (( $(echo "$BALANCE < $MIN_BALANCE" | bc -l) )); then
    echo "⚠️  Warning: Low balance ($BALANCE SOL). Deployment may fail."
    echo "💡 Consider requesting an airdrop or adding more SOL."
fi

# Build the program for Analos
echo "🔨 Building Anchor program for Analos..."
anchor build --arch sbf

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the build output above."
    exit 1
fi

echo "✅ Build successful!"

# Check if the program file exists
if [ ! -f "target/deploy/analos_nft_launcher_program.so" ]; then
    echo "❌ Program file not found: target/deploy/analos_nft_launcher_program.so"
    exit 1
fi

# Deploy to Analos
echo "🚀 Deploying program to Analos blockchain..."
solana program deploy target/deploy/analos_nft_launcher_program.so --program-id target/deploy/analos_nft_launcher_program-keypair.json

if [ $? -eq 0 ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
    echo "🌐 Network: Analos (https://rpc.analos.io)"
    echo "🔗 Explorer: https://explorer.analos.io/account/9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
    echo ""
    echo "🎉 YOUR ANCHOR PROGRAM IS NOW LIVE ON ANALOS!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    echo "💡 Common issues:"
    echo "   - Insufficient SOL balance"
    echo "   - Network connectivity issues"
    echo "   - Program already deployed with same ID"
    exit 1
fi
