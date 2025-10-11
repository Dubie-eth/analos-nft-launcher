# 🚀 **Complete Deployment Walkthrough**

## **Step-by-Step Guide to Deploy All 4 Programs**

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

- [x] All 4 programs compiled without errors
- [x] Integration tests created
- [x] Documentation complete
- [x] Fee structure finalized (69/25/6)
- [x] Oracle service ready
- [x] SDK and React hooks ready

---

## 🎯 **DEPLOYMENT ORDER**

1. Price Oracle (no dependencies)
2. Rarity Oracle (no dependencies)
3. Token Launch (no dependencies)
4. NFT Launchpad (calls other 3 via CPI)

---

## 📦 **STEP 1: Deploy Price Oracle**

### **Via Solana Playground:**

1. **Open Playground:**
   - Go to: https://beta.solpg.io
   - Click "Create a new project"
   - Name: "analos-price-oracle"
   - Select: "Anchor (Rust)"

2. **Copy Code:**
   - Open: `programs/analos-price-oracle/src/lib.rs`
   - Select ALL code (Ctrl+A)
   - Copy (Ctrl+C)
   - Paste into Playground editor (Ctrl+V)

3. **Build:**
   ```
   $ build
   ```
   - Wait 20-30 seconds
   - Should see: ✅ "Build successful. Completed in XXs."

4. **Deploy to Devnet:**
   ```
   $ deploy
   ```
   - Wait for deployment
   - Copy the **Program Id** (looks like: `A1B2C3D4...`)
   - Save it somewhere safe!

5. **Update declare_id:**
   - Replace line 3 in code: `declare_id!("YOUR_PROGRAM_ID_HERE");`
   - Rebuild: `$ build`
   - Redeploy: `$ deploy` (to update with correct ID)

6. **Export:**
   - Click "Export" button (top right)
   - Save ZIP file as `price-oracle-devnet.zip`

7. **Extract .so file:**
   - Unzip the file
   - Find the `.so` file in `target/deploy/`
   - Rename to: `analos-price-oracle.so`

**✅ Price Oracle Ready!**

---

## 📦 **STEP 2: Deploy Rarity Oracle**

### **Same Process:**

1. **New Project** in Playground: "analos-rarity-oracle"
2. **Copy** `programs/analos-rarity-oracle/src/lib.rs`
3. **Build:** `$ build`
4. **Deploy:** `$ deploy`
5. **Save Program ID**
6. **Update** `declare_id!` and redeploy
7. **Export** and extract `.so` file
8. **Rename** to `analos-rarity-oracle.so`

**✅ Rarity Oracle Ready!**

---

## 📦 **STEP 3: Deploy Token Launch**

### **Same Process:**

1. **New Project:** "analos-token-launch"
2. **Copy** `programs/analos-token-launch/src/lib.rs`
3. **Build:** `$ build`
4. **Deploy:** `$ deploy`
5. **Save Program ID**
6. **Update** `declare_id!` and redeploy
7. **Export** `.so` file
8. **Rename** to `analos-token-launch.so`

**✅ Token Launch Ready!**

---

## 📦 **STEP 4: Update NFT Launchpad** (Optional)

**Option A: Use existing deployment** `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

**Option B: Deploy updated version**
1. New Project: "analos-nft-launchpad-v2"
2. Copy updated `programs/analos-nft-launchpad/src/lib.rs`
3. Build & deploy
4. Save new Program ID

---

## 🌐 **STEP 5: Deploy to Analos**

### **Download from Devnet:**

```bash
# Make sure you have the Devnet Program IDs saved!

# Download Price Oracle
solana program dump [PRICE_ORACLE_DEVNET_ID] analos-price-oracle.so --url https://api.devnet.solana.com

# Download Rarity Oracle
solana program dump [RARITY_ORACLE_DEVNET_ID] analos-rarity-oracle.so --url https://api.devnet.solana.com

# Download Token Launch
solana program dump [TOKEN_LAUNCH_DEVNET_ID] analos-token-launch.so --url https://api.devnet.solana.com
```

### **Deploy to Analos:**

```bash
# Make this script executable
chmod +x deploy-to-analos.sh

# Run deployment
./deploy-to-analos.sh
```

**Or manually:**

```bash
# Price Oracle
solana program deploy analos-price-oracle.so --use-rpc --url https://rpc.analos.io

# Rarity Oracle
solana program deploy analos-rarity-oracle.so --use-rpc --url https://rpc.analos.io

# Token Launch
solana program deploy analos-token-launch.so --use-rpc --url https://rpc.analos.io
```

**Save all Program IDs!**

---

## 🔧 **STEP 6: Initialize Systems**

### **Initialize Price Oracle:**

```typescript
const tx = await priceOracle.methods
  .initializeOracle(
    new anchor.BN(1_000_000 * 1e6)  // $1M initial market cap
  )
  .accounts({
    priceOracle: priceOraclePDA,
    authority: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([admin])
  .rpc();

console.log("✅ Price Oracle initialized");
```

### **Initial Price Update:**

```typescript
await priceOracle.methods
  .updateLosMarketCap(
    new anchor.BN(1_000_000 * 1e6),      // $1M market cap
    new anchor.BN(1_000_000_000 * 1e9)   // 1B LOS supply
  )
  .accounts({
    priceOracle: priceOraclePDA,
    updater: oracleBot.publicKey,
  })
  .signers([oracleBot])
  .rpc();

console.log("✅ Initial $LOS price set: $0.001");
```

---

## 🖥️ **STEP 7: Deploy Oracle Service**

### **Add to Railway:**

1. **Update `package.json`:**
   ```json
   {
     "scripts": {
       "start": "node server-simple.js",
       "oracle": "node oracle-updater-service.js",
       "start:all": "concurrently \"npm run start\" \"npm run oracle\""
     },
     "dependencies": {
       "concurrently": "^8.0.0",
       "node-fetch": "^2.6.1"
     }
   }
   ```

2. **Add Environment Variables on Railway:**
   ```bash
   PRICE_ORACLE_PROGRAM_ID=[deployed_id]
   LOS_TOKEN_MINT=LoSVGc4rXHmeXcGF5VmT7uKYVQbLEKx6vVqKvVVpump
   BIRDEYE_API_KEY=[your_key]
   ORACLE_UPDATE_INTERVAL=300
   ```

3. **Push to GitHub:**
   ```bash
   git add oracle-updater-service.js
   git commit -m "Add price oracle service"
   git push origin main
   ```

4. **Railway Auto-Deploys!**

---

## 🌐 **STEP 8: Update Frontend (Vercel)**

### **Add Environment Variables:**

```bash
NEXT_PUBLIC_NFT_LAUNCHPAD_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
NEXT_PUBLIC_TOKEN_LAUNCH_ID=[deployed_id]
NEXT_PUBLIC_RARITY_ORACLE_ID=[deployed_id]
NEXT_PUBLIC_PRICE_ORACLE_ID=[deployed_id]
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
```

### **Add Client Files:**

1. Copy `client/types.ts` to `src/lib/types.ts`
2. Copy `client/sdk.ts` to `src/lib/sdk.ts`
3. Copy `client/useAnalosLaunch.tsx` to `src/hooks/useAnalosLaunch.tsx`

### **Push to GitHub:**

```bash
git add src/lib/ src/hooks/
git commit -m "Add Analos Launch SDK"
git push origin main
```

**Vercel Auto-Deploys!**

---

## 🧪 **STEP 9: Testing**

### **Test Checklist:**

- [ ] Initialize Price Oracle
- [ ] Update $LOS price
- [ ] Initialize NFT Collection
- [ ] Initialize Token Launch
- [ ] Initialize Rarity Oracle
- [ ] Add Rarity Tiers
- [ ] Mint NFT
- [ ] Verify tokens minted to escrow
- [ ] Reveal NFT
- [ ] Verify rarity determined
- [ ] Verify tokens distributed
- [ ] Test price updates
- [ ] Test fee distribution
- [ ] Trigger bonding
- [ ] Verify vesting schedule
- [ ] Test creator claims
- [ ] Test buyback
- [ ] Verify all stats

---

## 📊 **STEP 10: Verify Deployment**

### **Check Program Accounts:**

```bash
# NFT Launchpad
solana account [NFT_LAUNCHPAD_ID] --url https://rpc.analos.io

# Token Launch
solana account [TOKEN_LAUNCH_ID] --url https://rpc.analos.io

# Rarity Oracle
solana account [RARITY_ORACLE_ID] --url https://rpc.analos.io

# Price Oracle
solana account [PRICE_ORACLE_ID] --url https://rpc.analos.io
```

### **Verify on Explorer:**

```
https://explorer.analos.io/address/[PROGRAM_ID]
```

---

## ✅ **DEPLOYMENT COMPLETE!**

### **What You'll Have:**

**On Analos:**
- ✅ 4 deployed programs
- ✅ All verified on explorer
- ✅ Ready for collections

**On Railway:**
- ✅ Backend API
- ✅ Oracle updater service
- ✅ Auto-updating $LOS prices

**On Vercel:**
- ✅ Frontend with SDK
- ✅ React hooks
- ✅ Auto-updating UI

---

## 🎯 **LAUNCH FIRST COLLECTION**

### **Example: "Analos Pioneers"**

```typescript
// 1. Initialize
await sdk.initializeCollection({
  maxSupply: 1000,
  targetPriceUsd: 5,
  revealThreshold: 500,
  collectionName: "Analos Pioneers",
  collectionSymbol: "PION",
  placeholderUri: "ipfs://...",
});

// 2. Initialize token launch
await sdk.initializeTokenLaunch({
  nftCollectionConfig: collectionPDA,
  tokensPerNft: 10000,
  poolPercentageBps: 6900,
  tokenName: "Pioneer Token",
  tokenSymbol: "PION",
});

// 3. Initialize rarity
await sdk.initializeRarityConfig(collectionPDA);

// 4. Add rarity tiers
await sdk.addRarityTier({
  rarityConfig: rarityConfigPDA,
  tierId: 0,
  tierName: "Common",
  tokenMultiplier: 1,
  probabilityBps: 7000,
});
// ... add all 6 tiers

// 5. Announce launch! 🎉
```

---

## 🎉 **READY TO LAUNCH!**

**All systems operational:**
- ✅ Smart contracts
- ✅ Backend services
- ✅ Frontend SDK
- ✅ Documentation
- ✅ Tests

**Next:** Deploy and test! 🚀
