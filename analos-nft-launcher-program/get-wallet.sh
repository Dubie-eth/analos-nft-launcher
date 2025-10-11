#!/bin/bash

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

echo "🔑 Getting deployment wallet address..."

# Get the wallet address
WALLET_ADDRESS=$(solana-keygen pubkey ~/.config/solana/id.json)

echo "📋 Deployment Wallet Address: $WALLET_ADDRESS"
echo ""
echo "💰 Please send $LOS tokens to this address for deployment:"
echo "$WALLET_ADDRESS"
echo ""
echo "🌐 Network: https://rpc.analos.io"
echo "🔗 Explorer: https://explorer.analos.io/account/$WALLET_ADDRESS"
