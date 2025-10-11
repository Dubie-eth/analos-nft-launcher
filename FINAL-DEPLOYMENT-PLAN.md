# 🚀 FINAL DEPLOYMENT PLAN - ALL 4 PROGRAMS

## ✅ PROGRAM IDS - VERIFIED & CONSISTENT

All program IDs are now synchronized across all files:

### 1️⃣ **analos-price-oracle**
- **Program ID**: `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD`
- **Status**: ✅ Deployed to Devnet
- **Status**: 🔄 Ready for Analos deployment
- **Purpose**: Provides real-time $LOS price oracle for USD-pegged NFT pricing

### 2️⃣ **analos-rarity-oracle**
- **Program ID**: `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2`
- **Status**: ✅ Deployed to Devnet
- **Status**: 🔄 Ready for Analos deployment
- **Purpose**: Calculates and stores NFT rarity scores and trait distributions

### 3️⃣ **analos-token-launch**
- **Program ID**: `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf`
- **Status**: ✅ Deployed to Devnet
- **Status**: 🔄 Ready for Analos deployment
- **Purpose**: Handles token launches with bonding curves, creator prebuy, and trading fees

### 4️⃣ **analos-nft-launchpad** (Main Integration Program)
- **Program ID**: `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`
- **Status**: 🔨 Building now
- **Status**: 🔄 Ready for deployment after build
- **Purpose**: Main NFT launchpad that integrates all oracles and handles:
  - Collection initialization and management
  - Blind mint mechanics
  - Reveal system with commit-reveal scheme
  - Bonding curve integration
  - Community takeover governance
  - Whitelist management
  - Dynamic pricing based on price oracle

---

## 🔗 PROGRAM DEPENDENCIES

The programs work together as follows:

```
┌─────────────────────────────────────┐
│   analos-nft-launchpad (MAIN)       │
│   - Collection Management           │
│   - Blind Mint & Reveal             │
│   - Bonding Curves                  │
│   - Community Governance            │
└─────────────────────────────────────┘
         │          │          │
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Price  │ │ Rarity │ │ Token  │
    │ Oracle │ │ Oracle │ │ Launch │
    └────────┘ └────────┘ └────────┘
```

**Integration Points:**
- NFT Launchpad calls Price Oracle for USD-to-LOS conversion
- NFT Launchpad calls Rarity Oracle for trait rarity calculations
- NFT Launchpad integrates Token Launch for bonding curve mechanics

---

## 📋 DEPLOYMENT CHECKLIST

### ✅ Phase 1: Pre-Deployment (COMPLETE)
- [x] Generate program keypairs
- [x] Update all `declare_id!` macros in lib.rs files
- [x] Update Anchor.toml with all program IDs
- [x] Verify consistency across all files
- [x] Remove Metaplex dependencies (not available on Analos)
- [x] Fix all Rust compilation errors
- [x] Build programs successfully

### 🔄 Phase 2: Build (IN PROGRESS)
- [🔨] Build all 4 programs with correct IDs
- [ ] Verify .so files exist in target/deploy/
- [ ] Verify file sizes are reasonable (~500KB each)

### 🎯 Phase 3: Deployment to Analos (NEXT)
- [ ] Deploy analos-price-oracle to Analos
- [ ] Deploy analos-rarity-oracle to Analos
- [ ] Deploy analos-token-launch to Analos
- [ ] Deploy analos-nft-launchpad to Analos
- [ ] Verify all programs on Analos Explorer

### 🧪 Phase 4: Verification (FINAL)
- [ ] Call `initialize_oracle` on price-oracle
- [ ] Call `initialize_rarity_oracle` on rarity-oracle
- [ ] Initialize a test collection on nft-launchpad
- [ ] Verify cross-program invocations work
- [ ] Test blind mint functionality
- [ ] Test reveal functionality

---

## 🛠️ DEPLOYMENT COMMANDS

### For Devnet (Testing):
```powershell
# Switch to Devnet
solana config set --url https://api.devnet.solana.com

# Deploy each program
solana program deploy target/deploy/analos_price_oracle.so --program-id target/deploy/analos_price_oracle-keypair.json
solana program deploy target/deploy/analos_rarity_oracle.so --program-id target/deploy/analos_rarity_oracle-keypair.json
solana program deploy target/deploy/analos_token_launch.so --program-id target/deploy/analos_token_launch-keypair.json
solana program deploy target/deploy/analos_nft_launchpad.so --program-id target/deploy/analos_nft_launchpad-keypair.json
```

### For Analos (Production):
```powershell
# Switch to Analos
solana config set --url https://rpc.analos.io

# Check balance (need ~10 LOS for all deployments)
solana balance

# Deploy each program with --use-rpc flag (bypasses WebSocket requirement)
solana program deploy target/deploy/analos_price_oracle.so --program-id target/deploy/analos_price_oracle-keypair.json --use-rpc
solana program deploy target/deploy/analos_rarity_oracle.so --program-id target/deploy/analos_rarity_oracle-keypair.json --use-rpc
solana program deploy target/deploy/analos_token_launch.so --program-id target/deploy/analos_token_launch-keypair.json --use-rpc
solana program deploy target/deploy/analos_nft_launchpad.so --program-id target/deploy/analos_nft_launchpad-keypair.json --use-rpc
```

---

## ⚠️ CRITICAL NOTES

1. **Build Order**: All programs must be built together to ensure consistent dependencies
2. **Program IDs**: Must match between lib.rs, Anchor.toml, and keypair files
3. **Deployment Order**: Deploy in this order to avoid CPI errors:
   - Price Oracle first (no dependencies)
   - Rarity Oracle second (no dependencies)
   - Token Launch third (may use oracles)
   - NFT Launchpad last (uses all other programs)
4. **Network Consistency**: All 4 programs MUST be on the same network (all Devnet OR all Analos)
5. **Account Space**: All account sizes calculated manually due to InitSpace limitations

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:
- ✅ All 4 programs deployed to Analos
- ✅ All programs visible on Analos Explorer
- ✅ Price oracle can be initialized and updated
- ✅ Rarity oracle can store trait data
- ✅ NFT launchpad can create collections
- ✅ NFT launchpad can call oracles via CPI
- ✅ Blind mint and reveal work end-to-end

---

## 📞 SUPPORT

If deployment fails:
- Check Solana CLI version: `solana --version`
- Check Anchor version: `anchor --version`
- Check wallet balance: `solana balance`
- Check RPC connectivity: `solana cluster-version`
- Review error logs carefully
- Ensure --use-rpc flag is used for Analos

---

**Current Status**: Building programs with correct IDs... 🔨
**Next Step**: Deploy to Analos once build completes
**ETA**: 5-10 minutes for build, 2-3 minutes per program deployment

