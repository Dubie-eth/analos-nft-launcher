# 🔐 Verified Builds & Security.txt Implementation Guide

Based on [Solana's official verified builds documentation](https://solana.com/docs/programs/verified-builds).

---

## 📋 What You Need to Implement

### 1. **Security.txt Files** ✅ (Created!)
- Embedded contact info in programs
- Standardized security disclosure
- Shows on Analos Explorer

### 2. **Verified Builds** (To Do)
- Deterministic Docker builds
- On-chain hash verification  
- Transparency badge on explorer

---

## 🔧 STEP 1: Update Security.txt Files

I've created security.txt files for all 9 programs using the [official Solana format](https://solana.com/docs/programs/verified-builds#securitytxt-for-solana-programs).

### Format Used (Based on Solana Docs):
```
name: "Program Name"
project_url: "https://github.com/username/repo"
contacts: "email:security@domain.com,discord:server,twitter:@handle"
policy: "https://github.com/username/repo/blob/main/SECURITY.md"
preferred_languages: "en"
source_code: "https://github.com/username/repo"
source_revision: "PROGRAM_ID_OR_COMMIT_HASH"
source_release: "v1.0.0"
auditors: "None"
acknowledgements: "Thank you message"
expiry: ""
```

### ⚠️ Update Required:
Replace in ALL security.txt files:
- `yourusername` → Your GitHub username
- `support@launchonlos.fun` → Your security email
- `@analos_io` → Your Twitter handle
- `analos` → Your Discord server name

---

## 🐳 STEP 2: Implement Security.txt in Source Code

According to [Solana's documentation](https://solana.com/docs/programs/verified-builds#how-to-implement-securitytxt), you need to add security.txt **directly in your Rust code**.

### Add to Each Program's lib.rs:

```rust
#[cfg(not(feature = "no-entrypoint"))]
use {default_env::default_env, solana_security_txt::security_txt};

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Analos NFT Launchpad",
    project_url: "https://github.com/yourusername/analos-nft-launchpad",
    contacts: "email:support@launchonlos.fun,discord:analos,twitter:@analos_io",
    policy: "https://github.com/yourusername/analos-nft-launchpad/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/yourusername/analos-nft-launchpad",
    source_revision: "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT",
    source_release: "v1.0.0",
    auditors: "None",
    acknowledgements: "Thank you to all security researchers!"
}
```

### Add Dependency to Cargo.toml:

```toml
[dependencies]
solana-security-txt = "1.1.1"
default-env = "0.1.1"
```

---

## 🏗️ STEP 3: Create Verified Builds

According to [Solana's verified builds guide](https://solana.com/docs/programs/verified-builds#how-do-i-create-verified-builds), follow these steps:

### Install Tools:

```bash
# Install Docker
# Visit: https://www.docker.com/products/docker-desktop

# Install Solana Verify CLI
cargo install solana-verify

# Or specific version:
cargo install solana-verify --version $VERSION
```

### Prepare Workspace:

Create a root `Cargo.toml` if you don't have one:

```toml
[workspace]
members = [
    "programs/analos-nft-launchpad",
    "programs/analos-token-launch",
    "programs/analos-rarity-oracle",
    "programs/analos-price-oracle",
    "programs/analos-otc-enhanced",
    "programs/analos-airdrop-enhanced",
    "programs/analos-vesting-enhanced",
    "programs/analos-token-lock-enhanced",
    "programs/analos-monitoring-system",
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
```

### Generate Lockfile:

```bash
cargo generate-lockfile
```

### Build Verifiable Programs:

```bash
# Build all programs
solana-verify build

# Or build specific program
solana-verify build --library-name analos_nft_launchpad
```

This builds in Docker for deterministic builds that match across all systems.

### Get Executable Hash:

```bash
solana-verify get-executable-hash target/deploy/analos_nft_launchpad.so
```

### Deploy Verifiable Program:

```bash
solana program deploy --program-id <PROGRAM_KEYPAIR> \
  target/deploy/analos_nft_launchpad.so
```

⚠️ **IMPORTANT:** Deploy the verified build from `target/deploy/`, NOT from `anchor build` or `cargo build-sbf` as those won't match!

---

## 🔍 STEP 4: Verify Programs

### Verify Against Repository:

```bash
solana-verify verify-from-repo \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --commit-hash YOUR_COMMIT_HASH \
  --library-name analos_nft_launchpad \
  https://github.com/yourusername/analos-nft-launchpad
```

### Verify via API:

```bash
solana-verify verify-from-repo \
  -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT_HASH
```

The `-um` flag uploads verification data to [OtterSec's API](https://verify.osec.io/) so it shows on explorers.

---

## 📦 STEP 5: Verify on Analos Explorer

After verification, check [https://explorer.analos.io/](https://explorer.analos.io/):

1. Search for your program ID
2. Should see:
   - ✅ Green "Verified" badge
   - Security.txt information
   - Link to source code
   - Contact information

---

## 🔄 For Programs Controlled by Multisig (Squads)

If your programs are controlled by Squads multisig, follow the [special process](https://solana.com/docs/programs/verified-builds#how-to-verify-your-program-when-its-controlled-by-a-multisig-like-squads):

### 1. Build Verifiable Program:
```bash
solana-verify build --library-name analos_nft_launchpad
```

### 2. Deploy Program:
```bash
solana program deploy --program-id <KEYPAIR> target/deploy/analos_nft_launchpad.so
```

### 3. Commit and Verify:
```bash
git add . && git commit -m "Verified build"
git push
```

### 4. Transfer Authority to Squads:
```bash
solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <SQUADS_ADDRESS>
```

### 5. Export PDA Transaction:
```bash
solana-verify export-pda-tx \
  --program-id <PROGRAM_ID> \
  --payer <SQUADS_VAULT> \
  --export-file pda.json \
  --rpc-url https://api.mainnet-beta.solana.com
```

### 6. Submit Through Squads:
Upload the `pda.json` transaction in Squads UI

### 7. Submit Remote Verification:
```bash
solana-verify verify-from-repo \
  -um \
  --program-id <PROGRAM_ID> \
  --commit-hash <HASH> \
  https://github.com/yourusername/repo
```

---

## 📋 All Your Programs to Verify

### Program 1: NFT Launchpad
```bash
solana-verify verify-from-repo -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --library-name analos_nft_launchpad \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 2: Token Launch
```bash
solana-verify verify-from-repo -um \
  --program-id CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf \
  --library-name analos_token_launch \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 3: Rarity Oracle
```bash
solana-verify verify-from-repo -um \
  --program-id 3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2 \
  --library-name analos_rarity_oracle \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 4: Price Oracle
```bash
solana-verify verify-from-repo -um \
  --program-id 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD \
  --library-name analos_price_oracle \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 5: OTC Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id 7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY \
  --library-name analos_otc_enhanced \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 6: Airdrop Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC \
  --library-name analos_airdrop_enhanced \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 7: Vesting Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY \
  --library-name analos_vesting_enhanced \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 8: Token Lock Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id 3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH \
  --library-name analos_token_lock_enhanced \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

### Program 9: Monitoring System
```bash
solana-verify verify-from-repo -um \
  --program-id 7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG \
  --library-name analos_monitoring_system \
  https://github.com/yourusername/analos-nft-launchpad \
  --commit-hash YOUR_COMMIT
```

---

## 🎯 Quick Implementation Checklist

### Security.txt Files:
- [ ] Update contact info in all 9 security.txt files
- [ ] Add security_txt! macro to each lib.rs
- [ ] Add solana-security-txt dependency
- [ ] Rebuild programs

### Verified Builds:
- [ ] Install Docker
- [ ] Install solana-verify CLI
- [ ] Create workspace Cargo.toml
- [ ] Generate Cargo.lock
- [ ] Build with solana-verify
- [ ] Deploy verified builds
- [ ] Verify against repository
- [ ] Upload to API with -um flag
- [ ] Check on Analos Explorer

### For Each of 9 Programs:
- [ ] Build verifiable
- [ ] Deploy
- [ ] Verify
- [ ] Check explorer

---

## 🔍 Query Security.txt

Test your security.txt locally before deploying:

```bash
# Install query tool
cargo install --git https://github.com/neodyme-labs/solana-security-txt query-security-txt

# Query local binary
query-security-txt target/deploy/analos_nft_launchpad.so

# Query on-chain program
query-security-txt 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
```

---

## 📊 Expected Results

### On Analos Explorer:
- ✅ Green "Verified Build" badge
- ✅ Security.txt tab visible
- ✅ Contact information displayed
- ✅ Link to source code
- ✅ Commit hash shown
- ✅ Build reproducible

### Verification Output:
```
Executable Program Hash from repo: abc123...
On-chain Program Hash: abc123...
Program hash matches ✅
```

---

## ⚠️ Important Notes

### From Solana Docs:

1. **Docker is Required**: Builds must be done in Docker for deterministic results
2. **Don't Overwrite**: Don't run `anchor build` or `cargo build-sbf` after `solana-verify build`
3. **Commit First**: Commit your code to GitHub before verifying
4. **Library Name**: Use `lib` name from Cargo.toml, not package name
5. **Cargo.lock**: Must exist in repository root
6. **Workspace Setup**: Use proper workspace structure for multiple programs

### Security Considerations:

- Verified builds ensure transparency but don't guarantee security
- Docker images are provided by Solana Foundation
- For complete trustlessness, build your own Docker images
- OtterSec API is trusted by default; run your own for trustless verification

---

## 🔗 Official Resources

- [Solana Verified Builds Documentation](https://solana.com/docs/programs/verified-builds)
- [Ellipsis Labs Verify Repository](https://github.com/Ellipsis-Labs/solana-verifiable-build)
- [OtterSec Verify API](https://verify.osec.io/)
- [Neodyme Security.txt](https://github.com/neodyme-labs/solana-security-txt)
- [Solana Explorer](https://explorer.solana.com/)
- [Analos Explorer](https://explorer.analos.io/)

---

## 💡 Quick Start Commands

```bash
# 1. Install tools
cargo install solana-verify
cargo install --git https://github.com/neodyme-labs/solana-security-txt query-security-txt

# 2. Add to Cargo.toml
# [dependencies]
# solana-security-txt = "1.1.1"

# 3. Generate lockfile
cargo generate-lockfile

# 4. Build verified
solana-verify build

# 5. Deploy
solana program deploy target/deploy/your_program.so

# 6. Verify and upload
solana-verify verify-from-repo -um \
  --program-id YOUR_PROGRAM_ID \
  --commit-hash YOUR_COMMIT \
  https://github.com/yourusername/repo

# 7. Check explorer
# Visit: https://explorer.analos.io/address/YOUR_PROGRAM_ID
```

---

**Last Updated:** October 2025  
**Based on:** [Solana Official Documentation](https://solana.com/docs/programs/verified-builds)  
**Status:** Security.txt files created, awaiting verified builds implementation


