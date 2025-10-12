# 🔐 Analos Programs Verification Guide - For Already Deployed Programs

## 👤 Your Info
- **GitHub**: [@Dubie-eth](https://github.com/Dubie-eth)
- **Twitter**: [@EWildn](https://x.com/EWildn)
- **Telegram**: [t.me/Dubie_420](https://t.me/Dubie_420)
- **Repo**: analos-nft-launchpad-program

---

## ✅ What I've Done

I've updated the security.txt files for all 9 programs with YOUR real contact info:
- ✅ GitHub: Dubie-eth/analos-nft-launchpad-program
- ✅ Twitter: @EWildn
- ✅ Telegram: t.me/Dubie_420
- ✅ Email: security@analos.io

---

## 🎯 Your Situation

Based on [Solana's verified builds documentation](https://solana.com/docs/programs/verified-builds), since your **programs are already deployed**, here's what you need to know:

### Good News:
✅ All 9 programs are deployed and working  
✅ You have the program IDs  
✅ Security.txt files are created and updated  

### What You Need:
1. **Source Code on GitHub** ← Most important!
2. **Add security_txt! macro to Rust code** ← Required
3. **Rebuild with verified builds** ← For verification
4. **Create verification PDA** ← For explorer badge

---

## 📦 IMPORTANT: GitHub Repository Setup

According to the [Solana docs](https://solana.com/docs/programs/verified-builds), you need:

### Option A: Use Existing Repo (Recommended)
If you want to use an existing repo:
1. Push your program source code to: `https://github.com/Dubie-eth/analos-nft-launchpad-program`
2. Make sure it's PUBLIC (required for verification)
3. Include all 9 programs in `programs/` directory
4. Add Cargo.toml and Cargo.lock at root

### Option B: Create New Repo (Alternative)
If you want a dedicated repo:
1. Create new repo: `https://github.com/Dubie-eth/analos-programs`
2. Push all program source code
3. Update security.txt files with new repo URL
4. Make it PUBLIC

**I recommend Option A** - using analos-nft-launchpad-program as your main repo.

---

## 🔧 Step-by-Step Implementation

### STEP 1: Push Source Code to GitHub (30 min)

```bash
cd c:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad

# Initialize git if not already
git init

# Add remote (your repo)
git remote add origin https://github.com/Dubie-eth/analos-nft-launchpad-program.git

# Add all files
git add .

# Commit
git commit -m "Add Analos programs with security.txt"

# Push to GitHub
git push -u origin main
```

⚠️ **Make sure the repo is PUBLIC** - verification requires public source code!

---

### STEP 2: Add Security Macro to Each Program (1 hour)

For EACH of your 9 programs, add this to the **TOP of lib.rs** (after imports, before declare_id!):

#### Example for NFT Launchpad:
```rust
// Add these imports at the top
#[cfg(not(feature = "no-entrypoint"))]
use {default_env::default_env, solana_security_txt::security_txt};

// Add this macro right after imports, before declare_id!
#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Analos NFT Launchpad",
    project_url: "https://github.com/Dubie-eth/analos-nft-launchpad-program",
    contacts: "email:security@analos.io,twitter:@EWildn,telegram:t.me/Dubie_420",
    policy: "https://github.com/Dubie-eth/analos-nft-launchpad-program/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/Dubie-eth/analos-nft-launchpad-program",
    source_revision: "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT",
    source_release: "v1.0.0",
    auditors: "None",
    acknowledgements: "Thank you to all security researchers!"
}

declare_id!("5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT");
// ... rest of your code
```

**Repeat for all 9 programs** with their respective:
- Program name
- Program ID in source_revision

### Add Dependency to Each Cargo.toml:
```toml
[dependencies]
solana-security-txt = "1.1.1"
default-env = "0.1.1"
```

---

### STEP 3: Since Programs Are Already Deployed

You have **two options**:

#### Option A: Keep Existing Deployments + Add Verification (Easier)
Since your programs are already deployed and working, you can:

1. **Add the security_txt! macro** to source code
2. **Commit to GitHub**
3. **Create verification PDA** without redeploying

This means:
- ✅ Programs stay live
- ✅ No redeploy needed
- ✅ Users aren't interrupted
- ✅ Just add verification data

**How to add verification for existing programs:**

```bash
# For each program, after committing code with security_txt macro:

# Create the verification PDA
solana-verify verify-from-repo -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --library-name analos_nft_launchpad \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_LATEST_COMMIT_HASH
```

⚠️ **Note**: The verification might not match 100% if the deployed version was built differently. But the security.txt will still be embedded in the next update!

#### Option B: Rebuild & Redeploy with Verification (Complete)
For full verification:

1. **Build with Docker** (deterministic):
```bash
# Install tools
cargo install solana-verify

# Generate lockfile
cargo generate-lockfile

# Build each program
solana-verify build --library-name analos_nft_launchpad
```

2. **Upgrade the programs**:
```bash
solana program upgrade \
  target/deploy/analos_nft_launchpad.so \
  5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
```

3. **Verify**:
```bash
solana-verify verify-from-repo -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --library-name analos_nft_launchpad \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT_HASH
```

**I recommend Option A first** - add verification without disrupting live programs!

---

## 🚀 Quick Implementation (Minimum Viable)

### Fastest Way to Get Verified Badge:

1. **Add security_txt! macro** to each lib.rs (1 hour)
2. **Add dependencies** to each Cargo.toml (10 min)
3. **Commit to GitHub** (5 min)
4. **Run verification** for each program (30 min)

Total: **~2 hours**

---

## 📋 All Your Programs

Here are the verification commands for all 9 programs (run after committing with security_txt! macro):

### 1. NFT Launchpad
```bash
solana-verify verify-from-repo -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --library-name analos_nft_launchpad \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 2. Token Launch
```bash
solana-verify verify-from-repo -um \
  --program-id CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf \
  --library-name analos_token_launch \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 3. Rarity Oracle
```bash
solana-verify verify-from-repo -um \
  --program-id 3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2 \
  --library-name analos_rarity_oracle \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 4. Price Oracle
```bash
solana-verify verify-from-repo -um \
  --program-id 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD \
  --library-name analos_price_oracle \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 5. OTC Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id 7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY \
  --library-name analos_otc_enhanced \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 6. Airdrop Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC \
  --library-name analos_airdrop_enhanced \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 7. Vesting Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY \
  --library-name analos_vesting_enhanced \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 8. Token Lock Enhanced
```bash
solana-verify verify-from-repo -um \
  --program-id 3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH \
  --library-name analos_token_lock_enhanced \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

### 9. Monitoring System
```bash
solana-verify verify-from-repo -um \
  --program-id 7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG \
  --library-name analos_monitoring_system \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash YOUR_COMMIT
```

---

## ✅ What You'll See on Explorer

After verification, on [explorer.analos.io](https://explorer.analos.io/):

1. Search your program ID
2. See:
   - ✅ Green "Verified" badge
   - ✅ Security tab with your info:
     - Twitter: @EWildn
     - Telegram: t.me/Dubie_420
     - Email: security@analos.io
     - GitHub: Dubie-eth/analos-nft-launchpad-program
   - ✅ Link to source code
   - ✅ Commit hash shown

---

## 🎯 Action Plan

### Today (2 hours):
1. ✅ Security.txt files updated (Done!)
2. [ ] Push source code to GitHub
3. [ ] Make repo PUBLIC
4. [ ] Add security_txt! macro to 9 lib.rs files
5. [ ] Add dependencies to 9 Cargo.toml files
6. [ ] Commit and push

### Tomorrow (1 hour):
7. [ ] Install solana-verify CLI
8. [ ] Run verification for all 9 programs
9. [ ] Check explorer.analos.io
10. [ ] Confirm verified badges appear

### Optional (Later):
- [ ] Rebuild with verified builds
- [ ] Upgrade programs
- [ ] Run verification again for 100% match

---

## 📞 Questions?

Based on [Solana's docs](https://solana.com/docs/programs/verified-builds), you asked about:

### Q: Should we make special GitHub for source code?
**A:** You can use your existing `Dubie-eth/analos-nft-launchpad-program` repo. Just make sure it's PUBLIC and has all program source code. That's what I've configured in the security.txt files.

### Q: How to format security.txt?
**A:** ✅ Done! I've formatted all 9 files using Solana's official format with your real contact info (Twitter @EWildn, Telegram t.me/Dubie_420).

### Q: How to make everything verifiable?
**A:** Follow the 3 steps above:
1. Add security_txt! macro to Rust code
2. Push to public GitHub
3. Run solana-verify commands

The `-um` flag uploads verification data to OtterSec's API so it appears on explorers!

---

## 🔑 Key Takeaways

### Since Programs Are Already Deployed:
- ✅ No rush to redeploy
- ✅ Can add verification without disruption
- ✅ security_txt! macro goes in next update
- ✅ Verification PDA can be created now

### Priority Actions:
1. **Push code to GitHub** (most important!)
2. **Add security_txt! macro** (required for badge)
3. **Run verification commands** (creates PDA)

---

**Your Contact Info (Now in all security.txt files):**
- Twitter: [@EWildn](https://x.com/EWildn)
- Telegram: [t.me/Dubie_420](https://t.me/Dubie_420)
- GitHub: [@Dubie-eth](https://github.com/Dubie-eth)
- Repo: analos-nft-launchpad-program

**Status:** Ready to verify once code is on GitHub! 🚀

