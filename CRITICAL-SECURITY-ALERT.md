# 🚨 CRITICAL SECURITY ALERT 🚨

## STATUS: IMMEDIATE ACTION REQUIRED

### What Happened
The file `token-lock-new-keypair.json` was committed and pushed to your public GitHub repository:
- Repository: https://github.com/Dubie-eth/analos-nft-launcher.git
- This means the private key is **PUBLICLY EXPOSED**

### ⚠️ ASSUME THIS KEY IS COMPROMISED ⚠️

## IMMEDIATE ACTIONS REQUIRED

### 1. DO NOT USE THE EXPOSED KEYPAIR
**The `token-lock-new-keypair.json` keypair is now considered compromised and should NEVER be used for any production purposes.**

### 2. Generate New Keypairs
```bash
# Generate a new keypair (DO NOT commit this!)
solana-keygen new --outfile ./keys/new-secure-keypair.json

# Or for program deployment:
anchor keys list
anchor keys sync
```

### 3. If Any Funds Were in the Compromised Address
**IMMEDIATELY transfer them to a new, secure address:**
```bash
# Check balance of compromised key
solana balance <compromised-pubkey>

# Transfer to new secure address ASAP
solana transfer <new-secure-pubkey> ALL --from ./token-lock-new-keypair.json
```

### 4. Revoke Any Program Authorities
If this keypair was used as a program authority or upgrade authority:
```bash
# Check program authority
solana program show <program-id>

# Transfer upgrade authority to new keypair
solana program set-upgrade-authority <program-id> --upgrade-authority ./keys/new-secure-keypair.json <new-authority-pubkey>
```

### 5. Clean Git History (Advanced)
The keypair is in your git history. Even though we removed it, it's still accessible. Options:

#### Option A: Force Push (if you're the only collaborator)
```bash
git add .gitignore
git commit -m "security: remove exposed keypair and add security rules"
git push origin main --force
```

⚠️ **WARNING**: This rewrites history. Only do this if you're the sole contributor.

#### Option B: Use BFG Repo-Cleaner (Recommended for thorough cleanup)
```bash
# Install BFG (if not installed)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror https://github.com/Dubie-eth/analos-nft-launcher.git

# Remove the file from all history
bfg --delete-files token-lock-new-keypair.json analos-nft-launcher.git

# Clean up
cd analos-nft-launcher.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push
git push --force
```

#### Option C: Create New Repository (Cleanest)
1. Create a new GitHub repository
2. Copy only the code (not .git directory)
3. Initialize fresh git repo
4. Push to new repo
5. Delete old repository

## SECURITY MEASURES NOW IN PLACE

### ✅ Updated .gitignore
All keypair files are now blocked from being committed:
- `**/*keypair*.json`
- `*-keypair.json`
- `program-keypair.json`
- All `.env` files

### ✅ Proper Key Storage Structure
Created `/keys/` directory structure (see SECURE-KEY-MANAGEMENT.md)

## GOING FORWARD

### Never Store Keys in the Repository
- Use environment variables
- Store keys in secure vaults (AWS Secrets Manager, HashiCorp Vault, etc.)
- For local development, use `~/keys/` directory outside the repo

### Pre-commit Checks
Consider installing a pre-commit hook to prevent accidental commits:
```bash
# See .git/hooks/pre-commit-keypair-check.sh
```

---

## Contact & Resources
- GitHub Security: https://docs.github.com/en/code-security
- Solana Key Management: https://docs.solana.com/cli/conventions
- Report Security Issues: Create a private security advisory on GitHub

**Last Updated:** October 14, 2025
**Status:** ⚠️ ACTIVE SECURITY INCIDENT

