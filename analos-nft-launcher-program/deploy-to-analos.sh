#!/bin/bash

# Set up environment
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/root/.cargo/bin:$PATH"

# Configure Solana for Analos network
solana config set --url https://rpc.analos.io

# Create keypair if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating Solana keypair..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase --force
fi

# Get current directory
cd /mnt/c/Users/dusti/OneDrive/Desktop/LosLauncher/analos-nft-launcher-program

echo "Current directory: $(pwd)"
echo "Solana config:"
solana config get

# Check balance
echo "Current balance:"
solana balance

# Request airdrop if balance is low
echo "Requesting airdrop..."
solana airdrop 2 || echo "Airdrop failed, continuing..."

# Build the program
echo "Building Anchor program..."
anchor build

# Deploy the program
echo "Deploying program to Analos network..."
solana program deploy target/deploy/analos_nft_launcher_program.so

echo "Deployment complete!"
echo "Program ID: 9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym"
