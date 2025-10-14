# Keys Directory

⚠️ **DO NOT COMMIT ANY KEYPAIR FILES TO THIS DIRECTORY**

This directory is for **local development keys ONLY**.

## This directory is protected by .gitignore

Any `.json` files in this directory will NOT be committed to git.

## For Production Keys

Production and mainnet keys should NEVER be stored in this repository.
Store them in a secure location outside the repository:

```
~/analos-keys/              # Recommended location
├── mainnet/
│   └── deployer.json
├── devnet/
│   └── deployer.json
└── backup/
    └── (encrypted backups)
```

## Generating Local Test Keys

```bash
# Generate a local test keypair
solana-keygen new --outfile ./keys/local-test.json --no-bip39-passphrase

# Or using Anchor
anchor keys list
```

## See Also

- `../SECURE-KEY-MANAGEMENT.md` - Complete security guide
- `../CRITICAL-SECURITY-ALERT.md` - Security incident information

---

**Remember:** This directory is for development/testing ONLY. Never use these keys on mainnet!

