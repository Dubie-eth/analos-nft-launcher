#!/bin/bash

# Deploy Analos NFT Launcher Smart Contracts
echo "🚀 Deploying Analos NFT Launcher Smart Contracts..."

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor first:"
    echo "   npm install -g @coral-xyz/anchor-cli"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana CLI first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.16.0/install)\""
    exit 1
fi

# Navigate to contracts directory
cd contracts

echo "📦 Building smart contracts..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🧪 Running tests..."
anchor test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed!"
    exit 1
fi

echo "🚀 Deploying to Analos devnet..."
anchor deploy --provider.cluster devnet

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Smart contracts deployed successfully!"
echo "📝 Program ID: $(solana address -k target/deploy/analos_nft_launcher-keypair.json)"
echo "🌐 Network: Analos Devnet"
echo "🔗 Explorer: https://explorer.analos.io"

# Update the program ID in the backend
PROGRAM_ID=$(solana address -k target/deploy/analos_nft_launcher-keypair.json)
echo "📝 Update your backend with Program ID: $PROGRAM_ID"
