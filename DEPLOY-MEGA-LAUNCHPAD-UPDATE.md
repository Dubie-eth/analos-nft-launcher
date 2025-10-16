# 🚀 Deploy Updated MEGA NFT Launchpad Core

**Date:** October 15, 2025  
**Program ID:** `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`  
**What's New:** Creator airdrop system with 2.5% platform fee

---

## 📦 What's Being Updated

### New Features in This Deployment:
1. **Creator Airdrop Campaigns** - Full on-chain campaign management
2. **Platform Fee Treasury** - 2.5% fee collection system
3. **Airdrop Claim Records** - Track user claims on-chain
4. **Campaign Activation** - Fee payment and token deposit system

### New Instructions:
- `create_creator_airdrop_campaign` - Create new airdrop campaign
- `activate_creator_airdrop_campaign` - Activate with fee payment
- `claim_creator_airdrop` - Users claim their airdrop

### New Accounts:
- `CreatorAirdropCampaign` - Campaign configuration
- `AirdropClaimRecord` - Individual claim tracking
- `PlatformFeeTreasury` - Fee collection account (added to platform init)

---

## 🎯 Deployment Method: Solana Playground

**Why Solana Playground?**
- ✅ No local build environment issues
- ✅ Handles all dependencies automatically
- ✅ Direct deployment to Analos mainnet
- ✅ Proven to work from our previous deployments

---

## 📋 Step-by-Step Deployment

### Step 1: Open Solana Playground
1. Go to: https://beta.solpg.io
2. Connect your wallet (use deployer wallet: `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`)

### Step 2: Create New Project
1. Click "New Project"
2. Name it: `analos-nft-launchpad-core-v2`
3. Select "Anchor" framework

### Step 3: Copy Program Code
1. Delete the default code in `src/lib.rs`
2. Copy the entire contents from: `MEGA-NFT-LAUNCHPAD-CORE.rs`
3. Paste into Playground editor

### Step 4: Update Cargo.toml
Replace the Cargo.toml with:

```toml
[package]
name = "analos-nft-launchpad-core"
version = "1.0.0"
description = "Complete Analos NFT Launchpad with all features"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_nft_launchpad_core"

[features]
no-entrypoint = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
solana-security-txt = "1.1.1"
default_env = "0.1.1"
```

### Step 5: Set Custom RPC
1. Click on settings (gear icon)
2. Under "Endpoint", select "Custom"
3. Enter: `https://rpc.analos.io`

### Step 6: Import Program Keypair
Since we're upgrading an existing program, we need the program keypair.

**Option A: If you have the keypair file**
1. In Playground, click "Import"
2. Select the program keypair file
3. It should match program ID: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`

**Option B: If you don't have the keypair**
You'll need to recover it first:
```bash
# From your local machine
solana-keygen recover prompt://program-keypair.json
# Enter your seed phrase when prompted
```

### Step 7: Build the Program
1. Click "Build" button (hammer icon)
2. Wait for build to complete (30-60 seconds)
3. Check for any errors in the output

**Expected Output:**
```
✓ Compiled successfully
Program ID: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
Build took: ~40s
```

### Step 8: Deploy to Analos Mainnet
1. Ensure you have enough LOS for deployment (~5-10 LOS)
2. Click "Deploy" button
3. Confirm the transaction in your wallet
4. Wait for deployment to complete

**Expected Cost:**
- Deployment: ~4-5 LOS
- Transaction fee: ~0.001 LOS
- Total: ~5 LOS

### Step 9: Verify Deployment
After deployment completes:

```bash
# Check program account
solana program show BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr --url https://rpc.analos.io

# Expected output:
# Program Id: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: [address]
# Authority: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
# Last Deployed In Slot: [slot number]
# Data Length: ~200000 bytes
```

### Step 10: Download New IDL
1. In Playground, click "Download" → "IDL"
2. Save as: `analos_nft_launchpad_core.json`
3. Copy to: `minimal-repo/src/idl/analos_nft_launchpad_core.json`

---

## 🔧 Alternative: Local Deployment

**If you prefer to deploy locally:**

### Prerequisites:
```bash
# Ensure Solana CLI is configured
solana config set --url https://rpc.analos.io

# Verify deployer wallet
solana address
# Should show: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW

# Check balance
solana balance
# Should have at least 5-10 LOS
```

### Build Locally:
```bash
# From project root
anchor build --arch sbf

# Verify the .so file was created
ls -la target/deploy/analos_nft_launchpad_core.so
```

### Deploy Locally:
```bash
solana program deploy \
  target/deploy/analos_nft_launchpad_core.so \
  --program-id BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr \
  --keypair ~/.config/solana/deployer-keypair.json \
  --url https://rpc.analos.io \
  --with-compute-unit-price 1000 \
  --use-rpc
```

---

## ✅ Post-Deployment Checklist

### 1. Verify Program
- [ ] Program shows correct ID
- [ ] Program is executable
- [ ] Authority is correct (deployer wallet)
- [ ] No errors in deployment

### 2. Update Frontend
- [ ] Copy new IDL to `minimal-repo/src/idl/`
- [ ] Commit and push IDL update
- [ ] Trigger Vercel redeployment

### 3. Initialize New Accounts (If Needed)
The platform may already be initialized. Check first:

```bash
# Check if PlatformConfig exists
# If it doesn't, you'll need to run initialize_platform
```

### 4. Test Creator Airdrops
- [ ] Connect as admin
- [ ] Create test campaign
- [ ] Activate with fee payment
- [ ] Verify fee collected
- [ ] Test user claim

---

## 🐛 Troubleshooting

### Build Errors

**Error: "cannot find attribute `security_txt`"**
```toml
# Add to Cargo.toml dependencies:
solana-security-txt = "1.1.1"
default_env = "0.1.1"
```

**Error: "unresolved import"**
```rust
// Ensure these imports at top of lib.rs:
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
```

### Deployment Errors

**Error: "insufficient funds"**
- Check balance: `solana balance --url https://rpc.analos.io`
- Need at least 5-10 LOS
- Get more from: [Your LOS source]

**Error: "program has incorrect authority"**
- Ensure you're using the correct deployer keypair
- Verify: `solana address`
- Should be: `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

**Error: "websocket connection failed"**
- Use `--use-rpc` flag
- Use `--with-compute-unit-price 1000` flag
- This bypasses websocket issues with custom RPC

---

## 📊 What Changes After Deployment

### For Creators:
✅ Can create airdrop campaigns on-chain  
✅ Platform collects 2.5% fee automatically  
✅ Campaigns stored permanently on blockchain  
✅ Claim records tracked on-chain  

### For Users:
✅ Can claim airdrops directly from blockchain  
✅ Claims verified on-chain  
✅ No trust in centralized backend  

### For Platform:
✅ Fees collected automatically  
✅ Complete audit trail  
✅ Fully decentralized airdrop system  
✅ Revenue tracking on-chain  

---

## 🎯 Expected Results

After successful deployment:

1. **Program Updated** ✅
   - Same program ID
   - New instructions available
   - New account types supported

2. **Frontend Compatible** ✅
   - Existing features still work
   - New features available
   - No breaking changes

3. **Creator Airdrops Active** ✅
   - Creators can create campaigns
   - Platform fees collected
   - Users can claim

---

## 📞 Need Help?

**If deployment fails:**
1. Check error message carefully
2. Verify wallet has enough LOS
3. Ensure using correct RPC
4. Try Solana Playground method (most reliable)

**Contact:**
- Email: support@launchonlos.fun
- Twitter: @EWildn
- Telegram: t.me/Dubie_420

---

## 🚀 Ready to Deploy?

**Recommended Method:** Solana Playground (most reliable)

**Steps:**
1. Go to https://beta.solpg.io
2. Copy code from MEGA-NFT-LAUNCHPAD-CORE.rs
3. Build → Deploy → Done!

**Estimated Time:** 10-15 minutes

Let's do this! 🎉

