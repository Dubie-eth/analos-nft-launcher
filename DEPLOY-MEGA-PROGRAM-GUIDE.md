# 🚀 Deploy MEGA NFT Launchpad Core - Complete Guide

## 📋 What You're Deploying

**MEGA-NFT-LAUNCHPAD-CORE.rs** - The complete, production-ready program with:

✅ **20+ Instructions:**
- Platform initialization & admin controls
- Collection creation (NFT-Only or NFT-to-Token modes)
- Whitelist stages (3 tiers + public) with incremental pricing
- NFT minting with enforced platform fees
- NFT registration & tracking
- Rarity system (merged from Rarity Oracle)
- Creator profiles & social verification
- NFT staking (earn tokens by staking NFTs)
- LOS holder staking (earn platform fees)
- Holder rewards distribution
- CTO voting (democratic governance)
- Referral system (viral growth)
- Admin controls for everything

✅ **Blockchain-Level Fee Enforcement:**
- Cannot be bypassed
- Automatic collection
- Transparent on-chain

✅ **Your Admin Wallet:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

---

## 🎯 DEPLOYMENT STEPS

### Step 1: Open Solana Playground

1. Go to: **https://beta.solpg.io**
2. Click "Create a new project"
3. Select "Anchor"
4. Name it: `analos-mega-launchpad`

### Step 2: Copy the Code

1. Open file: `MEGA-NFT-LAUNCHPAD-CORE.rs`
2. **Copy ALL code** (entire file)
3. In Solana Playground, open `src/lib.rs`
4. **Delete all existing code**
5. **Paste** the mega program code

### Step 3: First Build (Get Program ID)

1. Click **"Build"** (hammer icon)
2. Wait 1-2 minutes for compilation
3. Look for output: `"Program ID: XXXX..."`
4. **COPY THIS PROGRAM ID**

### Step 4: Update Program ID

1. In the code, find line ~21:
   ```rust
   declare_id!("11111111111111111111111111111111");
   ```
2. Replace with YOUR program ID:
   ```rust
   declare_id!("YOUR_PROGRAM_ID_FROM_BUILD");
   ```
3. Click **"Build"** again

### Step 5: Configure Analos RPC

1. Click ⚙️ **Settings** icon (top-right)
2. Find "Custom RPC Endpoint"
3. Enter: `https://rpc.analos.io`
4. Click "Save"

### Step 6: Connect Wallet

1. Click "Connect Wallet" (top-right)
2. Select your wallet (Phantom, Solflare, etc.)
3. Approve connection
4. **CRITICAL:** Use wallet: `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`
   - This is the admin wallet
   - Will have full platform control

### Step 7: Fund Wallet

Make sure your wallet has enough LOS:
- **Deployment cost:** ~2-3 LOS
- **Testing:** 1-2 LOS
- **Total needed:** ~5 LOS

Check balance:
```bash
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW --url https://rpc.analos.io
```

### Step 8: Deploy!

1. Click **"Deploy"** (rocket icon 🚀)
2. Approve transaction in your wallet
3. Wait for confirmation (30-60 seconds)
4. Look for: "✅ Program deployed successfully!"

### Step 9: Verify Deployment

```bash
# Check program exists
solana program show YOUR_PROGRAM_ID --url https://rpc.analos.io

# Should show:
# - Executable: Yes
# - Owner: BPFLoaderUpgradeable...
# - Upgrade Authority: 86oK6fa5...
```

### Step 10: Export IDL

1. In Solana Playground, find IDL tab/export
2. Download the IDL JSON
3. Save as: `analos_nft_launchpad_core.json`

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Immediate Actions:

- [ ] Program deployed successfully
- [ ] Program ID saved and backed up
- [ ] IDL exported and saved
- [ ] Program verified on explorer
- [ ] Upgrade authority confirmed (your wallet)

### Initialize Platform:

```bash
# Call initialize_platform() instruction
# This sets up the admin wallet and all default configurations
# Only needs to be done ONCE
```

### Update Configurations:

```typescript
// In your frontend/backend
const MEGA_LAUNCHPAD_PROGRAM_ID = "YOUR_PROGRAM_ID_HERE";

// Save in:
// - minimal-repo/src/config/analos-programs.ts
// - Backend configs
// - Documentation
```

---

## 🎛️ INITIALIZE PLATFORM (Critical First Step)

### Via Frontend or Script:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://rpc.analos.io', 'confirmed');
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(idl, provider);

// Initialize platform (FIRST TRANSACTION EVER)
const [platformConfigPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('platform_config')],
  program.programId
);

const tx = await program.methods
  .initializePlatform()
  .accounts({
    platformConfig: platformConfigPda,
    admin: wallet.publicKey, // 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log('Platform initialized!', tx);
console.log('Admin wallet:', wallet.publicKey.toString());
console.log('Default fees set: 2.5% mint, 5% token launch');
console.log('Holder rewards: 30% of all fees');
```

---

## 🧪 TEST THE PROGRAM

### Test 1: Create Collection

```typescript
const collectionTx = await program.methods
  .initializeCollection(
    10000,              // max_supply
    100_000_000,        // price (0.1 LOS)
    5000,               // reveal_threshold
    "Test Collection",  // name
    "TEST",             // symbol
    "https://...",      // placeholder_uri
    { nftToToken: {} }  // launch_mode
  )
  .accounts({
    collectionConfig: collectionConfigPda,
    platformConfig: platformConfigPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log('Collection created!', collectionTx);
```

### Test 2: Configure Stages

```typescript
await program.methods
  .configureStages(
    50_000_000,   // WL1 price: 0.05 LOS
    1000,         // WL1 supply
    5,            // WL1 max per wallet
    80_000_000,   // WL2 price: 0.08 LOS
    2000,         // WL2 supply
    3,            // WL2 max per wallet
    100_000_000,  // WL3 price: 0.1 LOS
    2000,         // WL3 supply
    2,            // WL3 max per wallet
    150_000_000   // Public price: 0.15 LOS
  )
  .accounts({
    collectionConfig: collectionConfigPda,
    authority: wallet.publicKey,
  })
  .rpc();

console.log('Stages configured with incremental pricing!');
```

### Test 3: Initialize Rarity

```typescript
const [rarityConfigPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('rarity_config'), collectionConfigPda.toBuffer()],
  program.programId
);

await program.methods
  .initializeRarityConfig()
  .accounts({
    rarityConfig: rarityConfigPda,
    collectionConfig: collectionConfigPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log('Rarity config initialized!');
```

---

## 📊 UPDATE FRONTEND

### Step 1: Copy IDL

```bash
# Copy IDL to frontend
cp analos_nft_launchpad_core.json \
  minimal-repo/src/idl/analos_nft_launchpad_core.json
```

### Step 2: Update Config

`minimal-repo/src/config/analos-programs.ts`:
```typescript
export const ANALOS_PROGRAMS = {
  // OLD - Remove these
  // PRICE_ORACLE: new PublicKey('9dEJ2oK4...'),
  // RARITY_ORACLE: new PublicKey('C2YCPD3Z...'),
  // NFT_LAUNCHPAD: new PublicKey('5gmay...'),
  
  // NEW - Single mega program
  NFT_LAUNCHPAD_CORE: new PublicKey('YOUR_MEGA_PROGRAM_ID'),
  
  // Keep these
  TOKEN_LAUNCH: new PublicKey('Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw'),
  OTC_ENHANCED: new PublicKey('7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY'),
  // ... rest
};
```

### Step 3: Update Components

All components that used separate programs now use the mega program:
- `PriceOracleInitializer` → Now uses `NFT_LAUNCHPAD_CORE`
- `RarityOracleInitializer` → Now uses `NFT_LAUNCHPAD_CORE`
- `NFTLaunchpadInitializer` → Now uses `NFT_LAUNCHPAD_CORE`

---

## 🎉 SUCCESS CRITERIA

You'll know deployment succeeded when:

1. ✅ Build completes without errors
2. ✅ Deploy transaction confirms
3. ✅ Program shows on Analos Explorer
4. ✅ Program marked as "Executable"
5. ✅ Upgrade authority is your wallet
6. ✅ `initialize_platform()` succeeds
7. ✅ Can create test collection
8. ✅ IDL exported successfully

---

## 📞 WHAT YOU HAVE

**Single MEGA Program ID** instead of 3 separate programs:
- ❌ ~~Price Oracle: 9dEJ2oK4...~~
- ❌ ~~Rarity Oracle: C2YCPD3Z...~~
- ❌ ~~NFT Launchpad: 5gmaywN...~~
- ✅ **NFT Launchpad Core: [YOUR_NEW_ID]**

**All functionality in ONE place:**
- Collections + Rarity + Platform Config + Rewards + Governance

**Still separate:**
- Token Launch (complex token economics)
- Enhanced Programs (generic utilities)

---

## 🚀 NEXT STEPS AFTER DEPLOYMENT

1. **Initialize Platform** - Set up admin wallet and defaults
2. **Create Test Collection** - Verify everything works
3. **Update Frontend** - New program ID and IDL
4. **Test Complete Flow** - Mint → Rarity → Tokens
5. **Deploy to Production** - Open to public
6. **Announce Launch** - Marketing campaign

---

## 💡 QUICK START COMMANDS

```bash
# Check if you have LOS
solana balance 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW \
  --url https://rpc.analos.io

# If low, get some LOS first!

# After deployment, verify
solana program show YOUR_PROGRAM_ID \
  --url https://rpc.analos.io

# View on explorer
# https://explorer.analos.io/address/YOUR_PROGRAM_ID
```

---

## 🆘 TROUBLESHOOTING

### Build Fails
- Check for syntax errors in Playground
- Try refreshing page and rebuilding
- Verify Anchor version compatibility

### Deploy Fails
- Check wallet has enough LOS (~5 LOS)
- Verify RPC endpoint is correct
- Try again - network might be busy

### Program Not Showing
- Wait 1-2 minutes for indexing
- Check transaction signature instead
- Verify on explorer directly

---

## ✅ YOU'RE READY!

**File to use:** `MEGA-NFT-LAUNCHPAD-CORE.rs`  
**Where to deploy:** https://beta.solpg.io  
**RPC:** https://rpc.analos.io  
**Admin wallet:** 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW  

**This is your complete NFT launchpad in ONE program!** 🎉

Ready to deploy? Let me know if you need help with any step!

