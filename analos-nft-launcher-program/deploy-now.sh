#!/bin/bash

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

echo "🚀 DEPLOYING ANCHOR NFT LAUNCHER TO ANALOS BLOCKCHAIN"
echo "=================================================="

# Configure for Analos
echo "📡 Configuring for Analos network..."
solana config set --url https://rpc.analos.io

# Check balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Deploy the program
echo "🚀 Deploying program to Analos blockchain..."
solana program deploy target/deploy/analos_nft_launcher_program.so --program-id target/deploy/analos_nft_launcher_program-keypair.json

echo "✅ DEPLOYMENT COMPLETE!"
echo "📋 Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
echo "🌐 Network: https://rpc.analos.io"
echo "🔗 Explorer: https://explorer.analos.io/account/9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
echo ""
echo "🎉 FULL ANCHOR NFT LAUNCHER DEPLOYED TO ANALOS BLOCKCHAIN!"
