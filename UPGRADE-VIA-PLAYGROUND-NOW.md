# 🚀 Upgrade MEGA Launchpad Core via Playground - Same as Last Time

## ✅ This is How We Deployed Last Time

You're right! We deployed the original program through **Solana Playground**, so we'll upgrade it the same way.

---

## 📋 Quick Upgrade Steps (10 Minutes)

### **Step 1: Open Playground**
Go to: **https://beta.solpg.io**

---

### **Step 2: Connect Your DEPLOYMENT Wallet**
**IMPORTANT:** Connect this wallet (not the admin wallet):
```
4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q
```

This is your **program upgrade authority** ✅

**How:**
1. Click "Connect Wallet" (top right)
2. Select your wallet type (Phantom/Solflare)
3. Connect the wallet ending in `...EQ4q`

---

### **Step 3: Set Analos RPC**
1. Click ⚙️ (settings icon, bottom left)
2. Find "Endpoint" dropdown
3. Select "**Custom**"
4. Enter: `https://rpc.analos.io`
5. Click "Save"

---

### **Step 4: Open Your Existing Project OR Create New**

**Option A: If you saved the original project**
- Find it in your Playground projects
- Open it

**Option B: Create fresh (recommended)**
1. Click "New Project"
2. Name: `analos-mega-launchpad-upgrade`
3. Framework: **Anchor**
4. Click "Create"

---

### **Step 5: Replace lib.rs**
1. Open `src/lib.rs` in Playground
2. **Delete ALL existing code**
3. Go to your local file: `MEGA-NFT-LAUNCHPAD-CORE.rs`
4. **Copy ALL contents** (Ctrl+A, Ctrl+C)
5. **Paste into Playground** `src/lib.rs` (Ctrl+V)

**Verify the program ID at line 43:**
```rust
declare_id!("BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr");
```

This should match your existing program ID ✅

---

### **Step 6: Update Cargo.toml**
1. Open `Cargo.toml` in Playground
2. Replace with:

```toml
[package]
name = "analos-nft-launchpad-core"
version = "1.1.0"
description = "Analos NFT Launchpad with Creator Airdrops"
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

---

### **Step 7: Build**
1. Click the 🔨 **Build** button (left sidebar)
2. Wait 30-60 seconds
3. Look for success message in console

**Expected:**
```
✓ Build successful!
✓ Program: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
```

**If errors:** Check that all code copied correctly

---

### **Step 8: Deploy (Upgrade)**
1. Click the 🚀 **Deploy** button (left sidebar)
2. **IMPORTANT:** Playground will detect this is an upgrade (same program ID)
3. Confirm you have enough LOS (you have 17.12 ✅)
4. Approve the transaction in your wallet
5. Wait for deployment (~1-2 minutes)

**Cost:** ~4-5 LOS

**Transaction will show:**
```
✓ Upgrading program BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
✓ Transaction confirmed
```

---

### **Step 9: Verify Upgrade**
After deployment, check the console output:

**Should show:**
- ✓ Program upgraded successfully
- New data length
- Updated slot number

**Double-check with CLI:**
```bash
solana program show BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr --url https://rpc.analos.io
```

Look for a **newer slot number** than before (was: 6909773)

---

### **Step 10: Download Updated IDL**
1. In Playground, click "**≡**" (menu, top left)
2. Select "**Export**"
3. Choose "**IDL**"
4. Save as: `analos_nft_launchpad_core.json`
5. Copy to: `minimal-repo/src/idl/analos_nft_launchpad_core.json`

---

## ✅ Post-Upgrade Checklist

### 1. Update Frontend IDL
```bash
# Copy the downloaded IDL
cd minimal-repo
# Replace: src/idl/analos_nft_launchpad_core.json
# With the file you just downloaded
```

### 2. Commit & Push
```bash
git add src/idl/analos_nft_launchpad_core.json
git commit -m "feat: Update MEGA Launchpad Core IDL with creator airdrop support"
git push origin master
```

### 3. Verify in Frontend
1. Wait for Vercel deployment (~2 min)
2. Go to admin dashboard
3. Check "Creator Airdrops" tab
4. Try creating a test campaign

---

## 🎯 What's New After Upgrade

### New On-Chain Features:
✅ **Creator Airdrop Campaigns** - Create campaigns on blockchain  
✅ **Platform Fee Collection** - 2.5% automatic collection  
✅ **Claim Records** - Track user claims on-chain  
✅ **Campaign Activation** - Fee payment + token deposit  

### New Instructions:
- `create_creator_airdrop_campaign`
- `activate_creator_airdrop_campaign`
- `claim_creator_airdrop`

### New Accounts:
- `CreatorAirdropCampaign`
- `AirdropClaimRecord`
- `PlatformFeeTreasury` (in platform init)

---

## 🔍 Before vs After

### BEFORE (Current):
```
Program: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr
Slot: 6909773
Features: NFT Launchpad, Rarity Oracle, Staking, Referrals
```

### AFTER (Upgraded):
```
Program: BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr (same)
Slot: [New higher number]
Features: Everything above + Creator Airdrops + Platform Fees
```

---

## ⚠️ Important Notes

### **Program ID Stays The Same**
- Same address: `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`
- Same upgrade authority: `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`
- Existing functionality preserved ✅

### **No Breaking Changes**
- All existing features still work
- Frontend stays compatible
- Just adds new features

### **Backward Compatible**
- Existing collections: ✅ Work
- Existing stakes: ✅ Work
- Existing referrals: ✅ Work
- New airdrops: ✅ Now available

---

## 🐛 Troubleshooting

### **"Program is not writeable"**
**Cause:** Wrong wallet connected  
**Fix:** Use wallet `4ea9k...EQ4q` (not the admin wallet)

### **"Insufficient funds"**
**Cause:** Not enough LOS  
**Fix:** You have 17.12 LOS, should be plenty. If error persists, try again.

### **"Build failed"**
**Cause:** Code not copied correctly  
**Fix:** 
1. Re-copy ALL code from `MEGA-NFT-LAUNCHPAD-CORE.rs`
2. Ensure no characters missing
3. Check `declare_id!()` matches

### **"Signature verification failed"**
**Cause:** Wrong wallet or RPC not set  
**Fix:**
1. Verify RPC: `https://rpc.analos.io`
2. Verify wallet: `4ea9k...EQ4q`
3. Try transaction again

---

## 📊 Expected Timeline

| Step | Time |
|------|------|
| Setup Playground | 2 min |
| Copy code | 1 min |
| Build | 1-2 min |
| Deploy | 1-2 min |
| Download IDL | 1 min |
| Update frontend | 2 min |
| **Total** | **8-10 min** |

---

## 🎉 You're Ready!

**Same process as last time:**
1. Playground ✅
2. Connect wallet (`4ea9k...`) ✅
3. Set RPC (Analos) ✅
4. Build → Deploy ✅

**You've done this before - it's the same steps!**

**Let me know when you're ready to start, and I'll guide you through each step!** 🚀

