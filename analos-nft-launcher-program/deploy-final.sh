#!/bin/bash

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

echo "🚀 Deploying Anchor NFT Launcher Program to Analos Network"
echo "=================================================="

# Build first (this doesn't need network access)
echo "🔨 Building Anchor program..."
cd /mnt/c/Users/dusti/OneDrive/Desktop/LosLauncher/analos-nft-launcher-program
anchor build

# Check if build was successful
if [ ! -f "target/deploy/analos_nft_launcher_program.so" ]; then
    echo "❌ Build failed - program file not found"
    exit 1
fi

echo "✅ Program built successfully!"

# Configure Solana for Analos network
echo "📡 Configuring Solana for Analos network..."
solana config set --url https://rpc.analos.io

# Try to get some SOL from devnet first, then transfer to Analos
echo "🎁 Getting SOL from devnet for deployment..."
solana config set --url https://api.devnet.solana.com
solana airdrop 2 || echo "⚠️  Devnet airdrop failed"

# Get the devnet SOL balance
DEVNET_BALANCE=$(solana balance | grep -o '[0-9.]*' | head -1)
echo "💰 Devnet balance: $DEVNET_BALANCE SOL"

# Switch back to Analos
echo "📡 Switching to Analos network..."
solana config set --url https://rpc.analos.io

# Try airdrop on Analos
echo "🎁 Requesting SOL airdrop on Analos..."
solana airdrop 1 || echo "⚠️  Analos airdrop failed"

# Check final balance
echo "💰 Final balance:"
solana balance

# Deploy the program
echo "🚀 Deploying program to Analos network..."
solana program deploy target/deploy/analos_nft_launcher_program.so --program-id target/deploy/analos_nft_launcher_program-keypair.json

echo "✅ Deployment completed!"
echo "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
echo "🌐 Network: https://rpc.analos.io"
echo "🔗 Explorer: https://explorer.analos.io"

echo "🎉 Full Anchor NFT Launcher deployed to Analos blockchain!"
