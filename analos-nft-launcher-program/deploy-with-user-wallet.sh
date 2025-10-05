#!/bin/bash

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

echo "🚀 Deploying Anchor NFT Launcher Program to Analos Network"
echo "=================================================="

# Configure Solana for Analos network
echo "📡 Configuring Solana for Analos network..."
solana config set --url https://rpc.analos.io

# Set the user's wallet as the deployer
echo "👤 Setting up deployment wallet..."
solana config set --keypair ~/.config/solana/id.json

# Check if we have SOL
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Try to get SOL from airdrop
echo "🎁 Requesting SOL airdrop..."
solana airdrop 1 || echo "⚠️  Airdrop failed, trying alternative..."

# Check balance again
echo "💰 Balance after airdrop:"
solana balance

# Build the program first
echo "🔨 Building Anchor program..."
cd /mnt/c/Users/dusti/OneDrive/Desktop/LosLauncher/analos-nft-launcher-program
anchor build

# Check if build was successful
if [ -f "target/deploy/analos_nft_launcher_program.so" ]; then
    echo "✅ Program built successfully!"
    
    # Deploy the program
    echo "🚀 Deploying program to Analos network..."
    solana program deploy target/deploy/analos_nft_launcher_program.so
    
    echo "✅ Deployment completed!"
    echo "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
    echo "🌐 Network: https://rpc.analos.io"
    echo "🔗 Explorer: https://explorer.analos.io"
    
else
    echo "❌ Build failed - program file not found"
    exit 1
fi

echo "🎉 Full Anchor NFT Launcher deployed to Analos blockchain!"
