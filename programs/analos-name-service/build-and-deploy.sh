#!/bin/bash

echo "🔨 Building Analos Name Service (ANS) Program..."
echo ""

# Build with Anchor
echo "📦 Building with Anchor..."
anchor build --program-name analos_name_service

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Show the program binary
echo "📁 Program binary location:"
ls -lh ../../target/deploy/analos_name_service.so

echo ""
echo "🚀 Ready to deploy to Analos!"
echo ""
echo "To deploy, run:"
echo "  solana config set --url https://rpc.analos.io"
echo "  solana program deploy ../../target/deploy/analos_name_service.so --with-compute-unit-price 1000 --max-sign-attempts 100"
echo ""

