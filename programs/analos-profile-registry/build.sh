#!/bin/bash

# Analos Profile Registry - Build Script
# Builds and prepares the program for deployment

set -e

echo "🔨 Building Analos Profile Registry Program..."
echo ""

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: cargo not found"
    echo "Install Rust: https://rustup.rs/"
    exit 1
fi

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Error: solana CLI not found"
    echo "Install Solana: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Build the program
echo "📦 Building program..."
cargo build-bpf

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📁 Program binary: target/deploy/analos_profile_registry.so"
    echo ""
    
    # Get program size
    SIZE=$(wc -c < target/deploy/analos_profile_registry.so)
    echo "📊 Program size: $SIZE bytes"
    echo ""
    
    # Estimate deployment cost
    COST=$(echo "scale=4; $SIZE / 1024 / 1024 * 2" | bc)
    echo "💰 Estimated deployment cost: ~${COST} SOL"
    echo ""
    
    echo "🚀 Next steps:"
    echo "1. Deploy to devnet for testing:"
    echo "   solana program deploy --url devnet --keypair ~/.config/solana/id.json target/deploy/analos_profile_registry.so"
    echo ""
    echo "2. Deploy to Analos mainnet:"
    echo "   solana program deploy --url https://rpc.analos.io --keypair ~/.config/solana/id.json target/deploy/analos_profile_registry.so"
    echo ""
    echo "3. Update program ID in:"
    echo "   - programs/analos-profile-registry/src/lib.rs (declare_id!)"
    echo "   - src/lib/analos-profile-registry-sdk.ts (PROFILE_REGISTRY_PROGRAM_ID)"
    echo "   - src/config/analos-programs.ts (add to ANALOS_PROGRAMS)"
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    echo "Check the errors above and try again."
    exit 1
fi

