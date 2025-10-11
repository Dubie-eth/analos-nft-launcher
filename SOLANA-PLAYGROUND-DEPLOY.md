# 🌐 Deploy Using Solana Playground (Browser-Based)

## Why Use Solana Playground?

✅ No local setup needed  
✅ All build tools pre-configured  
✅ Works on any OS (Windows/Mac/Linux)  
✅ Build and deploy in minutes  
✅ No dependency conflicts  

## 🚀 Step-by-Step Instructions

### Step 1: Open Solana Playground
Visit: **https://beta.solpg.io/**

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Anchor"** framework
3. Name it: `analos-nft-launchpad`

### Step 3: Copy Your Code

**Copy this code** to `lib.rs` in the playground:

```rust
// See the simplified program code below
```

### Step 4: Update Program ID
1. In Playground, click **"Build"**
2. It will generate a program ID
3. Click **"Copy Program ID"**
4. Replace `declare_id!("...")` in the code with your new ID
5. Click **"Build"** again

### Step 5: Connect Wallet
1. Click **"Connect"** in top right
2. Select your wallet (Phantom, Solflare, etc.)
3. Switch network to **Custom RPC**
4. Enter: `https://rpc.analos.io`

### Step 6: Deploy
1. Click **"Deploy"**
2. Approve the transaction in your wallet
3. Wait ~30 seconds
4. ✅ Deployed!

### Step 7: Verify
Visit: `https://explorer.analos.io/address/<YOUR_PROGRAM_ID>`

## 💾 Download Artifacts

After deployment:
1. Click **"Export"** → **"Download Program"**
2. Save the `.so` file
3. Save the IDL JSON

---

## ⚡ Alternative: Deploy Your Existing Code

You can also:
1. Import your existing `lib.rs` into Playground
2. Upload your `Cargo.toml` dependencies
3. Build and deploy from there

This bypasses ALL Windows environment issues!

