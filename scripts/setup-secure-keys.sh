#!/bin/bash
# Secure Key Setup Script
# Creates proper directory structure and generates development keys

set -e

echo "🔐 Analos Secure Key Setup"
echo "=========================="
echo ""

# Create secure keys directory outside repository
KEYS_DIR="$HOME/analos-keys"
echo "📁 Creating secure keys directory: $KEYS_DIR"

mkdir -p "$KEYS_DIR"/{mainnet,devnet,localnet,backup}

# Generate development keys
echo ""
echo "🔑 Generating development keypairs..."
echo ""

# Devnet keys
if [ ! -f "$KEYS_DIR/devnet/deployer.json" ]; then
    echo "Creating devnet deployer key..."
    solana-keygen new --outfile "$KEYS_DIR/devnet/deployer.json" --no-bip39-passphrase --force
else
    echo "✓ Devnet deployer key already exists"
fi

# Localnet keys
if [ ! -f "$KEYS_DIR/localnet/deployer.json" ]; then
    echo "Creating localnet deployer key..."
    solana-keygen new --outfile "$KEYS_DIR/localnet/deployer.json" --no-bip39-passphrase --force
else
    echo "✓ Localnet deployer key already exists"
fi

# Create .env.example in project
echo ""
echo "📝 Creating .env.example file..."
cat > .env.example << 'EOF'
# Analos Environment Configuration
# Copy this to .env and fill in your values
# DO NOT COMMIT .env FILE!

# Network Configuration
SOLANA_NETWORK=devnet
RPC_URL=https://api.devnet.solana.com

# Key Paths (stored outside repository for security)
DEPLOYER_KEYPAIR_PATH=~/analos-keys/devnet/deployer.json

# Program IDs (Safe to share)
AIRDROP_PROGRAM_ID=
OTC_PROGRAM_ID=
VESTING_PROGRAM_ID=
TOKEN_LOCK_PROGRAM_ID=
METADATA_PROGRAM_ID=
MONITORING_PROGRAM_ID=
NFT_LAUNCHPAD_PROGRAM_ID=

# Optional: Mainnet Configuration (Production Only)
# MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
# MAINNET_DEPLOYER_KEYPAIR_PATH=~/analos-keys/mainnet/deployer.json
EOF

# Create local keys README
mkdir -p ./keys
cat > ./keys/README.md << 'EOF'
# Local Development Keys

⚠️ **This directory is for local testing ONLY**

All files in this directory are ignored by git (.gitignore).

## Generating Local Keys

```bash
solana-keygen new --outfile ./keys/local-test.json --no-bip39-passphrase
```

## Production Keys

**NEVER** store production keys here!
Production keys are in: `~/analos-keys/mainnet/`

See `../SECURE-KEY-MANAGEMENT.md` for details.
EOF

# Set restrictive permissions
chmod 700 "$KEYS_DIR"
chmod 700 "$KEYS_DIR"/*
find "$KEYS_DIR" -type f -name "*.json" -exec chmod 600 {} \;

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "  Secure keys directory: $KEYS_DIR"
echo "  Devnet deployer: $KEYS_DIR/devnet/deployer.json"
echo "  Localnet deployer: $KEYS_DIR/localnet/deployer.json"
echo ""
echo "🔒 Security recommendations:"
echo "  1. Backup your keys securely (encrypted)"
echo "  2. Never commit keypair .json files to git"
echo "  3. Use environment variables for key paths"
echo "  4. For mainnet, use hardware wallet or secure custody"
echo ""
echo "📖 Next steps:"
echo "  1. Copy .env.example to .env: cp .env.example .env"
echo "  2. Configure your .env file with key paths"
echo "  3. Read SECURE-KEY-MANAGEMENT.md for full guidance"
echo ""
echo "🎯 Ready to develop securely!"

