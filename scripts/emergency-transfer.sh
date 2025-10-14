#!/bin/bash
# Emergency Transfer Script - Use when a key is compromised
# Usage: ./emergency-transfer.sh <compromised-keypair.json> <new-safe-pubkey>

set -e

COMPROMISED_KEY=$1
NEW_SAFE_PUBKEY=$2

if [ -z "$COMPROMISED_KEY" ] || [ -z "$NEW_SAFE_PUBKEY" ]; then
    echo "❌ Usage: $0 <compromised-keypair.json> <new-safe-pubkey>"
    exit 1
fi

if [ ! -f "$COMPROMISED_KEY" ]; then
    echo "❌ Compromised keypair file not found: $COMPROMISED_KEY"
    exit 1
fi

echo "🚨 EMERGENCY FUND TRANSFER INITIATED"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will transfer ALL funds from the compromised key"
echo "Compromised key: $COMPROMISED_KEY"
echo "Destination: $NEW_SAFE_PUBKEY"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

COMPROMISED_PUBKEY=$(solana-keygen pubkey "$COMPROMISED_KEY")
echo ""
echo "📋 Compromised Address: $COMPROMISED_PUBKEY"
echo "📋 Safe Destination: $NEW_SAFE_PUBKEY"
echo ""

# Check balance
echo "💰 Checking SOL balance..."
BALANCE=$(solana balance "$COMPROMISED_PUBKEY" 2>&1)
echo "Balance: $BALANCE"

# List all SPL token accounts
echo ""
echo "🪙 Checking SPL token accounts..."
spl-token accounts --owner "$COMPROMISED_PUBKEY" || echo "No SPL token accounts found"

echo ""
read -p "Proceed with transfer? (yes/no): " confirm2

if [ "$confirm2" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

# Transfer SOL (keep small amount for rent)
echo ""
echo "📤 Transferring SOL..."
solana transfer "$NEW_SAFE_PUBKEY" ALL \
    --from "$COMPROMISED_KEY" \
    --allow-unfunded-recipient \
    || echo "⚠️  SOL transfer failed or no balance"

# Note: SPL token transfers need to be done manually for each token
echo ""
echo "⚠️  NOTE: SPL token transfers must be done manually:"
echo "spl-token transfer <token-address> <amount> <destination> --owner $COMPROMISED_KEY"

echo ""
echo "✅ Emergency transfer process complete!"
echo ""
echo "🔒 NEXT STEPS:"
echo "1. Verify funds arrived at destination"
echo "2. Update all program authorities to use new keys"
echo "3. Securely delete the compromised keypair:"
echo "   shred -vfz -n 10 $COMPROMISED_KEY"
echo "4. Update your .env and configuration files"
echo "5. See SECURE-KEY-MANAGEMENT.md for key rotation guide"

