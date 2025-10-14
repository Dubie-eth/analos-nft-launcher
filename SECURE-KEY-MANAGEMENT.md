# 🔐 Secure Key Management Guide

## Overview
This guide establishes best practices for managing private keys and sensitive credentials in the Analos project.

## Key Storage Structure

### Production Keys (NEVER in repository)
```
~/analos-keys/              # Outside repository, in home directory
├── mainnet/
│   ├── deployer.json       # Main deployment authority
│   ├── upgrade-authority.json
│   └── fee-collector.json
├── devnet/
│   ├── deployer.json
│   └── test-authority.json
└── backup/
    └── (encrypted backups)
```

### Development Keys (Local only, in .gitignore)
```
./keys/                     # In project root, blocked by .gitignore
├── local-deployer.json     # For local validator testing
├── test-wallet.json
└── README.md               # Instructions only
```

## Security Levels

### 🔴 CRITICAL - Never Commit
- **Mainnet deployment keys**
- **Upgrade authority keys**
- **Keys holding real funds**
- **API keys and secrets**

**Storage:** Hardware wallet or secure external storage

### 🟡 SENSITIVE - Use with Caution  
- **Devnet deployment keys**
- **Test authority keys**
- **Service account keys**

**Storage:** Encrypted files outside repository, environment variables

### 🟢 LOW RISK - Local Only
- **Local validator keys**
- **Throwaway test keys**

**Storage:** Local `.gitignore` protected directory

## Best Practices

### 1. Use Environment Variables
```bash
# .env (NEVER commit this file!)
DEPLOYER_KEYPAIR_PATH=/home/user/analos-keys/mainnet/deployer.json
UPGRADE_AUTHORITY=/home/user/analos-keys/mainnet/upgrade-authority.json
RPC_URL=https://api.mainnet-beta.solana.com
```

```typescript
// In your code
import * as fs from 'fs';

const deployerPath = process.env.DEPLOYER_KEYPAIR_PATH;
if (!deployerPath) {
  throw new Error('DEPLOYER_KEYPAIR_PATH not set');
}

const keypair = JSON.parse(fs.readFileSync(deployerPath, 'utf-8'));
```

### 2. Use Anchor's Wallet Configuration
```toml
# Anchor.toml
[provider]
cluster = "mainnet"
wallet = "~/analos-keys/mainnet/deployer.json"  # Path outside repo

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 3. Create Key Generation Script
```bash
# scripts/generate-keys.sh (SAFE to commit)
#!/bin/bash

KEYS_DIR="$HOME/analos-keys"

echo "🔐 Generating secure keypairs..."

# Create directory structure
mkdir -p "$KEYS_DIR"/{mainnet,devnet,backup}

# Generate keys with encryption
solana-keygen new --outfile "$KEYS_DIR/mainnet/deployer.json" --force
solana-keygen new --outfile "$KEYS_DIR/devnet/deployer.json" --no-bip39-passphrase --force

echo "✅ Keys generated in $KEYS_DIR"
echo "⚠️  BACKUP these keys securely!"
```

### 4. Use Git Hooks to Prevent Accidents

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Check for potential keypair files
if git diff --cached --name-only | grep -E "keypair|\.json" | grep -v "package"; then
  echo "⚠️  WARNING: You're about to commit JSON files that might contain keys!"
  echo "Files:"
  git diff --cached --name-only | grep -E "keypair|\.json"
  echo ""
  echo "Are these files safe? (y/n)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Commit aborted"
    exit 1
  fi
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Deployment Workflow

### Secure Deployment Process
```bash
# 1. Set environment
export ANCHOR_WALLET=~/analos-keys/mainnet/deployer.json
export ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com

# 2. Verify key is NOT in repo
git ls-files | grep -i keypair
# Should return nothing!

# 3. Deploy
anchor build
anchor deploy --provider.cluster mainnet

# 4. Save program ID securely
echo "PROGRAM_ID=$(solana address -k target/deploy/program-keypair.json)" >> ~/analos-keys/mainnet/program-ids.txt
```

## Key Rotation

### When to Rotate Keys
- ✅ Every 90 days for production
- ✅ Immediately if exposed (like now!)
- ✅ When team members leave
- ✅ After security incidents

### How to Rotate
```bash
# 1. Generate new keypair
solana-keygen new --outfile ~/analos-keys/mainnet/deployer-new.json

# 2. Transfer funds
solana transfer <new-pubkey> ALL --from ~/analos-keys/mainnet/deployer.json

# 3. Update program authorities
solana program set-upgrade-authority <program-id> \
  --upgrade-authority ~/analos-keys/mainnet/deployer.json \
  <new-authority-pubkey>

# 4. Securely delete old key
shred -vfz -n 10 ~/analos-keys/mainnet/deployer.json

# 5. Rename new key
mv ~/analos-keys/mainnet/deployer-new.json ~/analos-keys/mainnet/deployer.json
```

## Backup Strategy

### Encrypted Backups
```bash
# Encrypt keypair with GPG
gpg --symmetric --cipher-algo AES256 ~/analos-keys/mainnet/deployer.json

# Store encrypted version in cloud/USB
cp ~/analos-keys/mainnet/deployer.json.gpg /path/to/backup/

# Decrypt when needed
gpg --decrypt ~/analos-keys/mainnet/deployer.json.gpg > ~/analos-keys/mainnet/deployer.json
```

### Hardware Wallet (Most Secure)
For production mainnet deployments, use Ledger or similar:
```bash
# Set Ledger as wallet
solana config set --keypair usb://ledger

# Deploy using hardware wallet
anchor deploy --provider.wallet usb://ledger
```

## Emergency Response

### If a Key is Exposed
1. ⚠️ **STOP** - Do not panic, act quickly
2. 🔒 **SECURE** - Transfer all funds immediately
3. 🔄 **ROTATE** - Generate new keys
4. 📝 **DOCUMENT** - Record what was exposed
5. 🧹 **CLEAN** - Remove from git history
6. 📢 **NOTIFY** - Inform team/users if needed

### Emergency Transfer Script
```bash
#!/bin/bash
# emergency-transfer.sh

COMPROMISED_KEY=$1
NEW_SAFE_KEY=$2

echo "🚨 Emergency fund transfer initiated"

# Get all token accounts
spl-token accounts --owner $(solana-keygen pubkey $COMPROMISED_KEY)

# Transfer SOL
solana transfer $(solana-keygen pubkey $NEW_SAFE_KEY) ALL \
  --from $COMPROMISED_KEY \
  --allow-unfunded-recipient

echo "✅ Transfer complete"
```

## Monitoring

### Set up Monitoring for Your Keys
- Use Solana Explorer alerts
- Monitor wallet balance changes
- Set up transaction notifications
- Regular security audits

### Check for Exposed Keys
```bash
# Use GitGuardian or similar
# Install: npm install -g @gitguardian/ggshield

ggshield secret scan repo .
```

## Team Access Management

### Multi-Signature for Production
```bash
# Use Squads Protocol or similar for production
# Requires M-of-N signatures for critical operations

# Example: 2-of-3 multisig
squads create-multisig --threshold 2 \
  --member <pubkey1> \
  --member <pubkey2> \
  --member <pubkey3>
```

## Checklist

### Before Every Commit
- [ ] No .json files with private keys
- [ ] No .env files
- [ ] No hardcoded secrets
- [ ] All sensitive paths in .gitignore

### Before Deployment
- [ ] Keys stored outside repository
- [ ] Environment variables configured
- [ ] Backup created and tested
- [ ] Authority keys verified

### Monthly Security Audit
- [ ] Review all access logs
- [ ] Verify no keys in git history
- [ ] Test backup recovery
- [ ] Rotate keys if needed

---

## Additional Resources

- [Solana Key Management](https://docs.solana.com/cli/conventions)
- [Anchor Security Best Practices](https://www.anchor-lang.com/docs/security)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

**Remember: Keys are like cash - once exposed, they're gone forever. Treat them accordingly.**

