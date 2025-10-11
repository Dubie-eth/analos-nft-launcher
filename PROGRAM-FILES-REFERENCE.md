# 📁 **PROGRAM FILES REFERENCE**

## **Quick Access to All Program Source Files**

---

## 🎯 **PROGRAM 1: analos-nft-launchpad**

**File Location:**
```
programs/analos-nft-launchpad/src/lib.rs
```

**Size:** 4,772 lines

**What it does:**
- Main NFT launchpad with blind mint & reveal
- Whitelist phases & commitment schemes
- Escrow wallets & authority management
- Community takeover proposals
- Social verification
- Multi-tier bonding curves
- Gamified reveal fees
- Burn functionality
- Ticker collision prevention
- Fee management (6.9% cap)

**Dependencies for Playground Cargo.toml:**
```toml
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
mpl-token-metadata = "4.1.3"
```

---

## 🎯 **PROGRAM 2: analos-token-launch**

**File Location:**
```
programs/analos-token-launch/src/lib.rs
```

**What it does:**
- SPL token minting & distribution
- DLMM pool creation
- Bonding curve implementation
- Creator vesting (10% immediate, 15% over 12 months)
- Creator pre-buy option
- Trading fee claims
- Token buyback mechanics

**Dependencies for Playground Cargo.toml:**
```toml
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
```

---

## 🎯 **PROGRAM 3: analos-rarity-oracle**

**File Location:**
```
programs/analos-rarity-oracle/src/lib.rs
```

**What it does:**
- NFT rarity determination
- Token multiplier calculation (1x to 1000x)
- Rarity tier management (Common → Mythic)
- Creator-defined rarity rules
- Continuously addable rarity tiers

**Dependencies for Playground Cargo.toml:**
```toml
anchor-lang = "0.28.0"
```

---

## 🎯 **PROGRAM 4: analos-price-oracle**

**File Location:**
```
programs/analos-price-oracle/src/lib.rs
```

**What it does:**
- $LOS price feeds
- Multi-source aggregation (Jupiter, Birdeye, On-Chain, CoinGecko)
- USD-pegged pricing calculations
- Market cap tracking
- Median price calculation

**Dependencies for Playground Cargo.toml:**
```toml
anchor-lang = "0.28.0"
```

---

## 🔗 **PROGRAM RELATIONSHIPS**

```
analos-nft-launchpad (Main)
    ↓
    ├── Calls → analos-token-launch (for token creation)
    ├── Calls → analos-rarity-oracle (for rarity calculation)
    └── Reads → analos-price-oracle (for USD pricing)
```

---

## 📋 **DEPLOYMENT ORDER**

**Deploy in this order:**

1. **analos-price-oracle** (no dependencies)
2. **analos-rarity-oracle** (no dependencies)
3. **analos-token-launch** (no dependencies)
4. **analos-nft-launchpad** (references the others)

**Important:** After deploying programs 1-3, you may need to update the program IDs in `analos-nft-launchpad` if they're hardcoded.

---

## 🚀 **QUICK START CHECKLIST**

### **For Each Program:**
- [ ] Copy `lib.rs` from file location above
- [ ] Paste into Playground
- [ ] Update `Cargo.toml` with dependencies
- [ ] Run `build` command
- [ ] Run `deploy` command
- [ ] Copy Program ID
- [ ] Download .so file: `solana program dump [ID] [name].so --url https://api.devnet.solana.com`
- [ ] Deploy to Analos: `solana program deploy [name].so --use-rpc --url https://rpc.analos.io`

---

## 💾 **SAVE YOUR PROGRAM IDs**

After deploying to Analos, save these:

```bash
# Add to Railway environment variables
ANALOS_NFT_LAUNCHPAD_PROGRAM_ID=...
ANALOS_TOKEN_LAUNCH_PROGRAM_ID=...
ANALOS_RARITY_ORACLE_PROGRAM_ID=...
ANALOS_PRICE_ORACLE_PROGRAM_ID=...
```

---

## 🎯 **READY TO DEPLOY?**

**Option 1: Deploy All Programs Now**
- Start with Program 4 (Price Oracle)
- Work backwards to Program 1 (Main)
- Takes ~30 minutes total

**Option 2: Deploy Main Program Only**
- Just deploy `analos-nft-launchpad`
- Token/Rarity/Price features won't work yet
- Can add others later

**Which would you like to do?** 🚀
