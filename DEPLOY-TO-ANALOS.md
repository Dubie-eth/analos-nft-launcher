# 🚀 Deploy to Analos - Complete Guide

## ✅ STEP 1: Export Your Project from Playground

### Method 1: Use Export Button (Recommended)
1. In Solana Playground, click **"Export"** button (top-left, folder icons area)
2. This downloads a `.zip` file containing:
   - Your source code (`src/lib.rs`)
   - **The compiled program** (`.so` file)
   - All project files

### Method 2: Manual Download via Browser DevTools
1. Press `F12` to open DevTools
2. Go to **Application** → **IndexedDB** → **SolPG**
3. Find your project's compiled `.so` file
4. Right-click → Save


---

## ✅ STEP 2: Extract the Compiled Program

After exporting:

1. **Extract the .zip file**
2. Navigate to the build folder:
   ```
   analos-nft-launchpad/
   └── target/
       └── deploy/
           └── analos_nft_launchpad.so  ← THIS IS YOUR COMPILED PROGRAM!
   ```

**OR** if not in the zip, the Playground stores it in browser. You'll need to rebuild locally OR use the browser to extract it.

---

## ✅ STEP 3: Verify You Have Solana CLI

Open PowerShell and check:

```powershell
solana --version
```

**Expected:** `solana-cli 1.18.26` (or similar)

**If not installed:**
- Use the Solana CLI you already have at: `D:\SolanaDev\solana\releases\1.18.26\solana-release\bin`

---

## ✅ STEP 4: Set Up Analos Configuration

### Create/Update Solana Config for Analos:

```powershell
# Set Analos as your cluster
solana config set --url https://rpc.analos.io

# Verify it worked
solana config get
```

**Expected output:**
```
Config File: C:\Users\dusti\.config\solana\cli\config.yml
RPC URL: https://rpc.analos.io
WebSocket URL: wss://rpc.analos.io/ (computed)
Keypair Path: C:\Users\dusti\.config\solana\id.json
Commitment: confirmed
```

---

## ✅ STEP 5: Prepare Your Wallet

### Option A: Create New Analos Wallet
```powershell
solana-keygen new --outfile $env:USERPROFILE\.config\solana\analos-keypair.json
```

### Option B: Use Existing Wallet
If you already have a wallet, make sure it has $LOS (Analos native token)

### Check Balance:
```powershell
solana balance
```

**You need ~3 $LOS for deployment** (program deployment costs ~2-2.5 SOL equivalent)

---

## ✅ STEP 6: Deploy to Analos!

Navigate to your project directory and deploy:

```powershell
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad

# Deploy the compiled program
solana program deploy target/deploy/analos_nft_launchpad.so --url https://rpc.analos.io
```

### If you exported from Playground and have the .so file elsewhere:

```powershell
# Use the full path to the .so file
solana program deploy "C:\path\to\analos_nft_launchpad.so" --url https://rpc.analos.io
```

---

## ✅ STEP 7: Update Program ID

After successful deployment, you'll see output like:

```
Program Id: AbCdEf123456789...
```

**Copy that Program ID** and update two files:

### 1. Update `lib.rs` (line 4):
```rust
declare_id!("YOUR_NEW_ANALOS_PROGRAM_ID_HERE");
```

### 2. Update `Anchor.toml`:
```toml
[programs.mainnet]
analos_nft_launchpad = "YOUR_NEW_ANALOS_PROGRAM_ID_HERE"
```

---

## ✅ STEP 8: Verify Deployment

Check your program on Analos Explorer:

```
https://explorer.analos.io/address/YOUR_PROGRAM_ID
```

---

## 🎯 QUICK REFERENCE: One-Liner Deploy

If everything is set up:

```powershell
solana program deploy target/deploy/analos_nft_launchpad.so --url https://rpc.analos.io --keypair $env:USERPROFILE\.config\solana\id.json
```

---

## 🆘 Troubleshooting

### Issue: "Insufficient funds"
**Solution:** Get more $LOS
- Use Analos faucet (if available)
- Bridge tokens to Analos
- Ask in Analos Discord

### Issue: "Failed to send transaction"
**Solution:** Check RPC connection
```powershell
# Test RPC endpoint
curl https://rpc.analos.io
```

### Issue: "Program deployment timed out"
**Solution:** Increase timeout and retry
```powershell
solana program deploy target/deploy/analos_nft_launchpad.so `
  --url https://rpc.analos.io `
  --timeout 120
```

---

## 📝 Notes

- ✅ Your program was tested and **verified working** on Solana Devnet
- ✅ The same `.so` file will work on Analos (it's a Solana fork)
- ✅ Program ID will be **different** on Analos vs Devnet
- ✅ You can redeploy/upgrade the program later using the same keypair

---

## 🎊 Next Steps After Deployment

1. **Initialize your collection** using the deployed program
2. **Build frontend** to interact with it
3. **Test minting** on Analos
4. **Launch your NFT collection!**

---

**Need help? Share your terminal output if you encounter issues!**

