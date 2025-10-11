# 🚀 **METADATA PROGRAM DEPLOYMENT GUIDE**

## 📍 **Files Ready on Your Desktop:**

```
C:\Users\dusti\OneDrive\Desktop\anal404s\
├── PLAYGROUND-READY-lib.rs        ✅ Ready to copy
└── PLAYGROUND-READY-Cargo.toml     ✅ Ready to copy
```

---

## 🎯 **COMPLETE STEP-BY-STEP DEPLOYMENT:**

### **STEP 1: Open Solana Playground** (1 minute)
1. Open browser
2. Go to: **https://beta.solpg.io**
3. Click **"Create new project"**
4. Select **"Anchor"** framework
5. Name: `analos-metadata`
6. Click **"Create"**

---

### **STEP 2: Copy lib.rs** (2 minutes)

**On your computer:**
```powershell
# Open the file
notepad C:\Users\dusti\OneDrive\Desktop\anal404s\PLAYGROUND-READY-lib.rs
```

1. Select ALL (Ctrl+A)
2. Copy (Ctrl+C)

**In Solana Playground:**
1. Click `src/lib.rs` in file tree
2. Select ALL (Ctrl+A)
3. Paste (Ctrl+V)
4. Save (Ctrl+S)

**✅ Verify:** Should see 243 lines starting with:
```rust
use anchor_lang::prelude::*;
declare_id!("META11111111111111111111111111111111111111");
```

---

### **STEP 3: Copy Cargo.toml** (1 minute)

**On your computer:**
```powershell
notepad C:\Users\dusti\OneDrive\Desktop\anal404s\PLAYGROUND-READY-Cargo.toml
```

1. Select ALL (Ctrl+A)
2. Copy (Ctrl+C)

**In Solana Playground:**
1. Click `Cargo.toml` in file tree
2. Select ALL (Ctrl+A)
3. Paste (Ctrl+V)
4. Save (Ctrl+S)

---

### **STEP 4: Connect Wallet** (2 minutes)

**In Playground (bottom left):**
1. Click network dropdown → Select **"Devnet"**
2. Click wallet icon → **"Connect Wallet"**
3. Choose Phantom/Solflare
4. Approve connection

**Get SOL:**
```bash
solana airdrop 2
```

---

### **STEP 5: Build** (1 minute)

**In terminal (bottom of Playground):**
```bash
build
```

**Wait 30-60 seconds...**

**✅ Success:** `Build successful. Completed in X.XXs.`

---

### **STEP 6: Deploy to Devnet** (2 minutes)

**In terminal:**
```bash
deploy
```

**Approve transaction in wallet!**

**✅ Success:**
```
Deployment successful. Completed in X.XXs.
Program Id: 7jK9mNpQrXyZv4Lb2RsH3wF8dT6cX5nM9pQ1rS2tU3vW
```

**📋 COPY THIS PROGRAM ID!** (You'll need it for Step 9)

---

### **STEP 7: Download Compiled Program** (2 minutes)

**On your computer (PowerShell):**
```powershell
# Navigate to project
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad

# Make sure you're on Devnet
solana config set --url https://api.devnet.solana.com

# Download (replace YOUR_DEVNET_ID with ID from Step 6)
solana program dump YOUR_DEVNET_ID target\deploy\analos_metadata.so
```

**Example:**
```powershell
solana program dump 7jK9mNpQrXyZv4Lb2RsH3wF8dT6cX5nM9pQ1rS2tU3vW target\deploy\analos_metadata.so
```

**✅ Success:** `Wrote program to target\deploy\analos_metadata.so`

---

### **STEP 8: Generate Keypair** (1 minute)

```powershell
# Generate new keypair for Analos deployment
solana-keygen new --outfile target\deploy\analos_metadata-keypair.json --no-bip39-passphrase
```

**✅ You'll see:**
```
pubkey: 9xYzAbC123dEf456GhI789jKl012MnO345pQr678StU901
```

**📋 THIS IS YOUR ANALOS METADATA PROGRAM ID! SAVE IT!**

---

### **STEP 9: Deploy to Analos** (3 minutes)

```powershell
# Switch to Analos
solana config set --url https://rpc.analos.io

# Check balance (need ~5 LOS)
solana balance

# Deploy
solana program deploy target\deploy\analos_metadata.so --program-id target\deploy\analos_metadata-keypair.json --use-rpc
```

**Wait for deployment... (1-2 minutes)**

**✅ Success:**
```
Program Id: 9xYzAbC123dEf456GhI789jKl012MnO345pQr678StU901
```

---

### **STEP 10: Verify Deployment** (1 minute)

```powershell
# Verify it's live
solana program show YOUR_ANALOS_PROGRAM_ID
```

**✅ Success:**
```
Program Id: YOUR_PROGRAM_ID
Owner: BPFLoaderUpgradeab1e11111111111111111111111
Data Length: ~50000 bytes
```

---

### **STEP 11: Update Frontend Configuration** (1 minute)

**After deployment, update the program ID in your frontend:**

```typescript
// In frontend-minimal/src/lib/metadata-service.ts
export const METADATA_PROGRAM_CONFIG = {
  PROGRAM_ID: 'YOUR_ANALOS_PROGRAM_ID_FROM_STEP_8', // UPDATE THIS
  NETWORK: 'Analos Mainnet',
};
```

---

## 🎉 **DEPLOYMENT COMPLETE!**

### **You Now Have 5 Programs on Analos:**

1. ✅ **NFT Launchpad** - `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`
2. ✅ **Price Oracle** - `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`
3. ✅ **Rarity Oracle** - `H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6`
4. ✅ **Token Launch** - `HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx`
5. ✅ **Metadata** - `[YOUR_NEW_ID]` ← Just deployed!

---

## 💡 **What the Metadata Program Does:**

### **Features:**
- ✅ Create on-chain metadata for NFTs
- ✅ Store name, symbol, URI (IPFS link)
- ✅ Update metadata (if mutable)
- ✅ Transfer update authority
- ✅ Verify collections
- ✅ Freeze metadata (make immutable)

### **Benefits for Marketplace:**
- 🎨 **Better NFT Display** - Names, descriptions, images
- 📊 **Richer Listings** - Full metadata on-chain
- 🔍 **Better Search** - Search by name/attributes
- 📈 **Improved UX** - Fast metadata loading
- ✅ **Verification** - On-chain collection verification

---

## 🔧 **Integration with Your Launchpad:**

### **After Minting:**
```typescript
// 1. Mint placeholder from NFT Launchpad
const mintResult = await mintingService.mintPlaceholderNFT(...);

// 2. Create metadata on-chain
const metadataResult = await metadataService.createNFTMetadata(
  new PublicKey(mintResult.mintAddress),
  collectionName,
  collectionSymbol,
  mintNumber,
  attributes,
  imageUrl
);

// Now the NFT has both:
// - Mint record from NFT Launchpad
// - Metadata from Metadata Program
```

### **When Displaying NFTs:**
```typescript
// Load metadata
const metadata = await metadataService.getMetadata(mintAddress);
if (metadata) {
  // Fetch full JSON from IPFS
  const json = await metadataService.fetchMetadataJSON(metadata.uri);
  // Display name, image, attributes
}
```

---

## 📊 **Program Comparison:**

| Feature | NFT Launchpad | Metadata Program |
|---------|---------------|------------------|
| **Minting** | ✅ Yes | ❌ No |
| **Pricing** | ✅ Yes | ❌ No |
| **Bonding Curves** | ✅ Yes | ❌ No |
| **Metadata Storage** | ⚠️ URI only | ✅ Full metadata |
| **Name/Symbol** | ⚠️ Collection level | ✅ NFT level |
| **Attributes** | ❌ No | ✅ Yes (via URI) |
| **Marketplace Display** | ⚠️ Limited | ✅ Rich |

**Together:** Complete NFT system! 🎯

---

## 🎯 **Quick Start (15 minutes):**

```bash
# 1. Open Playground
https://beta.solpg.io

# 2. Copy files (from desktop)
- PLAYGROUND-READY-lib.rs → src/lib.rs
- PLAYGROUND-READY-Cargo.toml → Cargo.toml

# 3. Build & Deploy to Devnet
build
deploy

# 4. Download & Deploy to Analos
# (Use commands from Steps 7-10 above)
```

---

## 🆘 **Troubleshooting:**

### **"Build failed"**
- Check you copied BOTH files
- Verify no syntax errors
- Try refreshing Playground

### **"Deploy failed"**
- Check wallet has SOL on Devnet
- Run: `solana airdrop 2`
- Try again

### **"Program dump failed"**
- Verify you're on correct network
- Check program ID is correct
- Try: `solana config get` to verify

---

## 📝 **After Deployment Checklist:**

- [ ] Program deployed to Analos
- [ ] Program ID saved
- [ ] Verified with `solana program show`
- [ ] Updated `METADATA_PROGRAM_CONFIG.PROGRAM_ID` in frontend
- [ ] Tested metadata creation
- [ ] Integrated with minting flow

---

## 🎊 **Ready to Deploy?**

**Files are waiting on your desktop!**

Start here: https://beta.solpg.io

**Need help?** Let me know which step you're on and I'll guide you through it! 🚀

