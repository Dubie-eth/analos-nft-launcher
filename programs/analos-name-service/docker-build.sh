#!/bin/bash

echo "🐳 Building ANS Program in Docker..."
echo ""

# Build using official Solana Docker image
docker run --rm \
  -v "$(pwd)/../..:/workspace" \
  -w /workspace \
  projectserum/build:v0.29.0 \
  anchor build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📁 Program binary:"
    ls -lh ../../target/deploy/analos_name_service.so
    echo ""
    echo "📄 IDL file:"
    ls -lh ../../target/idl/analos_name_service.json
    echo ""
    echo "🚀 Ready to deploy to Analos!"
    echo ""
    echo "Deploy command:"
    echo "  solana config set --url https://rpc.analos.io"
    echo "  solana program deploy ../../target/deploy/analos_name_service.so --with-compute-unit-price 1000 --max-sign-attempts 100 --use-quic"
else
    echo "❌ Build failed!"
    exit 1
fi

