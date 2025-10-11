# 🎮 Deploy to Analos Using Solana Playground (5 Minutes!)

## ✨ The Easy Way - No Windows Hassles!

Solana Playground is a browser-based IDE that has everything pre-configured. This **completely bypasses** all the local environment issues.

---

## 🚀 Quick Start (Copy-Paste Ready!)

### Step 1: Open Playground
👉 **https://beta.solpg.io/**

### Step 2: Create Project
1. Click **"Create a new project"** or **"+"**
2. Name: `analos-nft-launchpad`
3. Framework: **Anchor**

### Step 3: Copy Code
1. Open the file: `programs/analos-nft-launchpad/lib-for-playground.rs`
2. **Copy ALL the code** (Select All → Copy)
3. In Playground, delete everything in `lib.rs`
4. **Paste** the code you copied

### Step 4: First Build (Get Program ID)
1. Click **"Build"** button (hammer icon)
2. Wait ~30 seconds
3. You'll see: `Build successful!`
4. Click the **program ID** shown (it will copy)

### Step 5: Update Program ID in Code
1. Find line 18: `declare_id!("11111111111111111111111111111111");`
2. Replace with your program ID: `declare_id!("YOUR_ID_HERE");`
3. Click **"Build"** again
4. Wait ~30 seconds

### Step 6: Connect Your Wallet
1. Click **"Not connected"** in top right
2. Select your wallet (Phantom, Solflare, etc.)
3. Approve connection

### Step 7: Switch to Analos Network
1. In Playground, find network dropdown (usually says "Devnet")
2. Select **"Custom"**
3. Enter RPC URL: `https://rpc.analos.io`
4. Click **"Save"**

### Step 8: Deploy!
1. Click **"Deploy"** button
2. In your wallet:
   - You'll see transaction to approve
   - **Approve it**
3. Wait ~30 seconds
4. You'll see: **"Program deployed successfully!"**

###Step 9: Verify
Visit: `https://explorer.analos.io/address/YOUR_PROGRAM_ID`

✅ **YOU'RE DEPLOYED!**

---

## 📋 After Deployment

### Get Your Program Files
In Playground:
1. Click **"Export"** → **"Download"**
2. Save the `.so` file
3. Save the IDL JSON
4. Copy program ID

### Initialize Your Collection
Use the TypeScript client code from `scripts/initialize-collection.ts` but update the program ID.

---

## 💡 Why This is Better

| Local Build (Windows) | Solana Playground |
|----------------------|-------------------|
| 2+ hours setup | 0 minutes |
| Dependency conflicts | Pre-configured |
| Version issues | Always up to date |
| 10-20 min builds | 30 second builds |
| Admin rights needed | Browser only |
| OS-specific issues | Works anywhere |

---

## 🎯 What You Get

✅ **Blind Mint** - Mystery box NFTs  
✅ **Reveal System** - Threshold-based reveals  
✅ **On-Chain Randomness** - Fair rarity distribution  
✅ **Admin Controls** - Pause, update, withdraw  
✅ **Event Emission** - Track all actions  
✅ **5% Royalties** - Built-in creator fees  

### Rarity System
- 🌟 Legendary: 5% (0-4 score)
- 💎 Epic: 15% (5-19 score)
- ⭐ Rare: 30% (20-49 score)
- 🔹 Common: 50% (50-99 score)

---

## 🔧 Customization

Before deploying, edit these values in the code:

```rust
// Line ~70: Collection parameters
max_supply: 10000,           // Change to your supply
price_lamports: 100000000,   // 0.1 SOL (adjust as needed)
reveal_threshold: 5000,      // 50% - when reveal unlocks
```

---

## 🆘 Troubleshooting

**Build fails?**
- Check you copied ALL the code
- Make sure `declare_id!()` has valid program ID after first build

**Deploy fails?**
- Ensure wallet is connected
- Verify RPC URL is `https://rpc.analos.io`
- Check wallet has SOL balance

**Transaction fails?**
- Make sure you're on Analos network (not Devnet/Mainnet)
- Verify wallet has enough SOL for deployment (~2-3 SOL)

---

## ✅ Success Checklist

- [ ] Opened Solana Playground
- [ ] Created new Anchor project
- [ ] Pasted code from `lib-for-playground.rs`
- [ ] Built and got program ID
- [ ] Updated `declare_id!()` with program ID
- [ ] Built again
- [ ] Connected wallet
- [ ] Switched to Analos RPC
- [ ] Deployed successfully
- [ ] Verified on explorer

---

## 🎉 Next Steps After Deployment

1. **Initialize Collection**
   ```typescript
   // Use scripts/initialize-collection.ts
   // Update program ID in the script
   npx ts-node scripts/initialize-collection.ts
   ```

2. **Build Frontend**
   - Copy program ID
   - Update `app/mint-ui-example.tsx`
   - Deploy to Vercel/Netlify

3. **Launch!** 🚀

---

**This is the easiest way to deploy! No Windows hassles!** ✨

