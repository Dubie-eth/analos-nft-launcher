# FINAL DEPLOYMENT INSTRUCTIONS - Use Solana Playground

## ✅ Status: All Code Updated
- Program ID: **H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6**
- Source code: `programs/analos-price-oracle/src/lib.rs` (UPDATED)
- Frontend config: `minimal-repo/src/config/analos-programs.ts` (UPDATED)
- Anchor.toml: (UPDATED)

## 🚀 Deploy Using Solana Playground (2 Minutes)

Based on the [official Solana tutorial](https://solana.com/developers/guides/getstarted/intro-to-anchor), here's the fastest path:

### Step 1: Open Solana Playground
Go to https://beta.solpg.io

### Step 2: Create New Anchor Project
- Click "Create a new project"
- Select "Anchor (Rust)"
- Name it: `analos-price-oracle`

### Step 3: Replace lib.rs
Copy **ALL** contents from:
```
programs/analos-price-oracle/src/lib.rs
```

Paste into Playground's `lib.rs` (replace everything)

**The file already contains the correct program ID:**
```rust
declare_id!("H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6");
```

### Step 4: Update Anchor.toml in Playground
Find `Anchor.toml` in the file tree and update to:
```toml
[toolchain]
anchor_version = "0.29.0"

[programs.mainnet]
analos_price_oracle = "H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6"
```

### Step 5: Build (30 seconds)
- Click the **Build** button (🔨 icon)
- Wait for "Build successful ✅" message

### Step 6: Download the Binary
- After successful build, find `target/deploy/analos_price_oracle.so` in the file explorer
- Right-click and download it

### Step 7: Deploy to Analos (Local Machine)
Open your terminal and run:

```bash
# Set RPC to Analos
solana config set --url https://rpc.analos.io

# Check your balance (should have ~32 SOL)
solana balance

# Deploy the program
solana program deploy analos_price_oracle.so \
  --program-id H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6 \
  --keypair price-oracle-program-id.json \
  --use-rpc
```

**Important**: Use the keypair file we generated earlier:
`price-oracle-program-id.json` (it's in your project root)

### Step 8: Initialize the Oracle

Once deployed, go to your website:
1. Visit https://www.onlyanal.fun
2. Connect your wallet
3. Go to Admin Panel
4. Find "Price Oracle Initializer"
5. Set market cap (e.g., $1,000,000)
6. Click "Initialize Price Oracle"

**Done!** 🎉

---

## 📦 Alternative: Use the Analos SDKs

The Analos team has already deployed working programs. If you want to use their approach:

### Option A: Reference Their Code
Check out these SDKs for examples:
- `@analosfork/dynamic-bonding-curve-sdk`
- `@analosfork/damm-sdk`

These show how the core team structures their programs.

### Option B: Fork Their Approach
Since these programs are already on Analos, you could:
1. Study their implementation
2. Adapt their patterns to your price oracle
3. Use their proven deployment methods

---

## 🔍 Why Solana Playground Works

According to the [official Solana guide](https://solana.com/developers/guides/getstarted/intro-to-anchor):

✅ No local dependency issues
✅ Pre-configured Anchor 0.29.0
✅ Builds in ~30 seconds
✅ Zero setup required
✅ Same environment for all developers

This is the **standard recommended approach** for Solana development when you're having local build issues.

---

## 📝 What's Been Updated

All files now reference the correct program ID:

1. ✅ `programs/analos-price-oracle/src/lib.rs` - declare_id and security.txt
2. ✅ `Anchor.toml` - program mapping
3. ✅ `minimal-repo/src/config/analos-programs.ts` - frontend config
4. ✅ `minimal-repo/src/config/analos-programs.ts` - explorer URLs
5. ✅ Program keypair file created: `price-oracle-program-id.json`

---

## 🎯 Next Steps After Deployment

1. **Update GitHub analos-programs repo** with the new program ID
2. **Test initialization** from the admin panel
3. **Verify on explorer**: https://explorer.analos.io/address/H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6
4. **Start using it** for USD-pegged NFT pricing

---

## ⚡ Quick Commands Reference

```bash
# Check balance
solana balance

# Check config
solana config get

# View program
solana program show H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6

# Monitor logs (after deployment)
solana logs H1D51xLreqzot34KkeuA4K3hwAGM7w7PBhtTukBdtrx6
```

