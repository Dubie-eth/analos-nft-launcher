# 🚀 Deploy MEGA Launchpad Core NOW - Quick Guide

## Step 1: Open Solana Playground
Go to: **https://beta.solpg.io**

## Step 2: Connect Your Wallet
1. Click "Connect Wallet" (top right)
2. Select Phantom or Solflare
3. Connect your deployer wallet: `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

## Step 3: Set Custom RPC
1. Click the ⚙️ settings icon (bottom left)
2. Under "Endpoint", select "**Custom**"
3. Enter: `https://rpc.analos.io`
4. Click "Save"

## Step 4: Import Existing Program
Since we're upgrading an existing program, we need to import it:

1. Click "File" → "Import from file system"
2. Or create a new Anchor project and replace the code

## Step 5: Replace Code
1. Open `src/lib.rs` in Playground
2. **Delete everything**
3. Copy **ALL** contents from: `MEGA-NFT-LAUNCHPAD-CORE.rs`
4. Paste into Playground

## Step 6: Update Cargo.toml
Replace Cargo.toml with:

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

## Step 7: Build
1. Click the 🔨 "Build" button
2. Wait ~30-60 seconds
3. Check console for success message

**Expected:**
```
✓ Build successful!
```

## Step 8: Set Program ID (IMPORTANT!)
Since this is an upgrade, we need to use the existing program ID:

**Program ID:** `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr`

Playground should detect this from the `declare_id!()` in the code.

## Step 9: Deploy
1. Click the 🚀 "Deploy" button
2. **Confirm you have ~5-10 LOS** in your wallet
3. Approve the transaction
4. Wait for deployment to complete (~1-2 minutes)

**Cost:** ~4-5 LOS + tx fees

## Step 10: Download New IDL
After successful deployment:

1. Click "Download" button
2. Select "IDL"
3. Save as `analos_nft_launchpad_core.json`

---

## ✅ Verify Deployment

After deployment, check:

```bash
solana program show BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr --url https://rpc.analos.io
```

Should show:
- Program is executable
- Authority: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
- Updated slot number

---

## 🎉 After Deployment

1. Copy the new IDL to: `minimal-repo/src/idl/analos_nft_launchpad_core.json`
2. Commit and push to GitHub
3. Test creator airdrops in admin dashboard
4. Platform fees will now work on-chain!

---

## ⚠️ Troubleshooting

**"Insufficient funds"**
- Need at least 5-10 LOS
- Check balance: `solana balance`

**"Program is not writeable"**
- Ensure using correct deployer wallet
- Check authority: `solana program show [program-id]`

**Build errors**
- Check Cargo.toml dependencies
- Verify all code copied correctly

---

**Ready? Let's deploy! 🚀**

Time estimate: 10 minutes

