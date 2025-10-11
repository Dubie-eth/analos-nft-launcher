# ⚙️ **Adjustable Parameters - Complete Flexibility**

## **Everything is Configurable by Creator!**

---

## 🎯 **FULLY ADJUSTABLE PARAMETERS**

### **1. Collection Size** ✅
```rust
// Creator sets during initialization
pub fn initialize_collection(
    max_supply: u64,  // Can be: 100, 1000, 5000, 10000, or ANY number
    ...
)
```

**Examples:**
- Launch 1: `max_supply: 1000`
- Launch 2: `max_supply: 2500`
- Launch 3: `max_supply: 5000`
- Launch 4: `max_supply: 10000`

---

### **2. NFT Pricing** ✅
```rust
// Creator sets base price and bonding curve
pub fn configure_bonding_curve_pricing(
    base_price: u64,        // In USD (with 6 decimals)
    price_increment: u64,   // In USD per NFT
    max_price: u64,         // Max price cap
)
```

**Examples:**
- Launch 1: `base: $5, increment: $0.01, max: $50`
- Launch 2: `base: $8, increment: $0.015, max: $75`
- Launch 3: `base: $10, increment: $0.02, max: $100`
- Launch 4: `base: $15, increment: $0.03, max: $150`

---

### **3. Token Amount per NFT** ✅
```rust
// Creator sets during token launch initialization
pub fn initialize_token_launch(
    tokens_per_nft: u64,  // Can be: 1000, 10000, 100000, ANY number
    ...
)
```

**Examples:**
- Small collection: `10,000 tokens/NFT`
- Large collection: `1,000 tokens/NFT`
- Premium collection: `100,000 tokens/NFT`

---

### **4. Pool vs Creator Split** ✅
```rust
// Creator sets pool percentage
pub fn initialize_token_launch(
    tokens_per_nft: u64,
    pool_percentage_bps: u16,  // Adjustable! Default: 6900 (69%)
    ...
)
```

**Examples:**
- Conservative: `pool_percentage_bps: 8000` (80% pool, 20% creator)
- Balanced: `pool_percentage_bps: 6900` (69% pool, 25% creator) ← Recommended
- Creator-heavy: `pool_percentage_bps: 6000` (60% pool, 34% creator)

**Note:** 6% always goes to LOL ecosystem (hardcoded for sustainability)

---

### **5. Vesting Schedule** ⚠️ **Currently Fixed**
```rust
// Currently hardcoded:
pub const CREATOR_IMMEDIATE_CLAIM_BPS: u16 = 1000;  // 10%
pub const CREATOR_VESTED_CLAIM_BPS: u16 = 1500;     // 15%
pub const CREATOR_VESTING_MONTHS: u64 = 12;         // 12 months
```

**Can be made adjustable if needed!**

---

### **6. Rarity Distribution** ✅
```rust
// Creator adds custom rarity tiers
pub fn add_rarity_tier(
    tier_id: u8,              // 0-9
    tier_name: String,        // "Common", "Ultra Rare", etc.
    token_multiplier: u64,    // 1x to 1000x
    probability_bps: u16,     // % chance
    ...
)
```

**Examples:**

**Conservative (Less Variance):**
```
Common (80%): 1x
Rare (15%): 5x
Epic (4%): 10x
Legendary (1%): 50x
```

**Aggressive (High Variance):**
```
Common (95%): 1x
Rare (4%): 10x
Ultra (0.9%): 100x
God (0.1%): 1000x
```

**Flat (Everyone Equal):**
```
All (100%): 1x
```

---

### **7. Bonding Curve Tiers** ✅
```rust
// Creator creates multiple pricing tiers
pub fn create_bonding_curve_tier(
    tier_id: u8,
    tier_name: String,
    base_price: u64,          // Adjustable per tier
    price_increment: u64,     // Adjustable per tier
    max_price: u64,           // Adjustable per tier
    max_supply: u64,          // Adjustable per tier
    ...
)
```

**Example: 3-Tier System**
```
Tier 0 (Whitelist - 100 NFTs):
├─ Base: $4 USD (20% off)
├─ Max: $40 USD
└─ Supply: 100

Tier 1 (Holders - 200 NFTs):
├─ Base: $4.50 USD (10% off)
├─ Max: $45 USD
└─ Supply: 200

Tier 2 (Public - 700 NFTs):
├─ Base: $5 USD
├─ Max: $50 USD
└─ Supply: 700
```

---

### **8. Reveal Fee** ✅
```rust
// Creator configures reveal fee
pub fn configure_reveal_fee(
    enabled: bool,
    fee_lamports: u64,  // Adjustable amount
)
```

**Examples:**
- Free reveals: `enabled: false`
- Small fee: `fee_lamports: $0.10 USD`
- Premium: `fee_lamports: $1 USD`

---

### **9. Creator Pre-Buy** ✅
```rust
// Creator can buy tokens before bonding
pub fn creator_prebuy_tokens(
    amount_tokens: u64,      // Adjustable up to 5% of supply
    payment_sol: u64,        // Based on 10% discount
)
```

**Flexibility:**
- Can buy 0% to 5% of supply
- 10% discount is fixed (for fairness)
- Can choose not to pre-buy at all

---

### **10. Buyback Pricing** ✅
```rust
// Creator sets buyback cost
pub fn configure_buyback(
    enabled: bool,
    price_tokens: u64,  // Fully adjustable
)
```

**Examples:**
- Cheap buyback: `100,000 tokens` (~$14)
- Standard: `500,000 tokens` (~$72)
- Premium: `1,000,000 tokens` (~$144)

---

## 🔧 **WHAT'S FIXED (For Fairness)**

### **Platform Fees (6% to LOL Ecosystem):**
```rust
// HARDCODED for sustainability:
pub const FEE_DEV_TEAM_BPS: u16 = 100;           // 1%
pub const FEE_POOL_CREATION_BPS: u16 = 200;      // 2%
pub const FEE_LOL_BUYBACK_BURN_BPS: u16 = 100;   // 1%
pub const FEE_PLATFORM_MAINT_BPS: u16 = 100;     // 1%
pub const FEE_LOL_COMMUNITY_BPS: u16 = 100;      // 1%
```

**Why Fixed:**
- ✅ Platform sustainability
- ✅ Fair for everyone
- ✅ Predictable costs
- ✅ No manipulation

### **Fee Cap (6.9%):**
```rust
pub const MAX_TRADING_FEE_BPS: u16 = 690;  // 6.9%
pub const MAX_MINT_FEE_BPS: u16 = 690;     // 6.9%
```

**Why Fixed:**
- ✅ Prevents rug pulls
- ✅ Protects users
- ✅ Industry standard

### **Vesting Schedule:**
```rust
pub const CREATOR_IMMEDIATE_CLAIM_BPS: u16 = 1000;  // 10%
pub const CREATOR_VESTING_MONTHS: u64 = 12;         // 12 months
```

**Why Fixed:**
- ✅ Anti-dump protection
- ✅ Fair for all projects
- ✅ Community trust

---

## 📊 **CONFIGURATION EXAMPLES**

### **Launch 1: Small & Affordable**
```typescript
await nftLaunchpad.methods
    .initializeCollection(
        1000,                    // max_supply: 1k NFTs
        5 * 1e6,                // target_price_usd: $5
        500,                     // reveal_threshold: 50%
        "Analos Pioneers",
        "PION",
        "ipfs://placeholder"
    )
    .rpc();

await tokenLaunch.methods
    .initializeTokenLaunch(
        10000,                   // tokens_per_nft: 10k
        6900,                    // pool_percentage_bps: 69%
        "Pioneer Token",
        "PION"
    )
    .rpc();

// Expected: ~$20k pool, $30k total raise
```

### **Launch 2: Medium Scale**
```typescript
await nftLaunchpad.methods
    .initializeCollection(
        2500,                    // max_supply: 2.5k NFTs
        8 * 1e6,                // target_price_usd: $8
        1000,                    // reveal_threshold: 1k
        "Analos Warriors",
        "WARR",
        "ipfs://placeholder"
    )
    .rpc();

await tokenLaunch.methods
    .initializeTokenLaunch(
        10000,
        6900,
        "Warrior Token",
        "WARR"
    )
    .rpc();

// Expected: ~$50k pool, ~$75k total raise
```

### **Launch 3: Large Collection**
```typescript
await nftLaunchpad.methods
    .initializeCollection(
        5000,                    // max_supply: 5k NFTs
        10 * 1e6,               // target_price_usd: $10
        2500,                    // reveal_threshold: 2.5k
        "Analos Legends",
        "LGND",
        "ipfs://placeholder"
    )
    .rpc();

await tokenLaunch.methods
    .initializeTokenLaunch(
        10000,
        6900,
        "Legend Token",
        "LGND"
    )
    .rpc();

// Expected: ~$100k pool, ~$150k total raise
```

---

## ✅ **SUMMARY**

### **Adjustable by Creator:**
- ✅ Collection size (100 to 1,000,000)
- ✅ NFT pricing ($1 to $1000+ USD)
- ✅ Token amount per NFT (any amount)
- ✅ Pool percentage (60%-90%)
- ✅ Rarity distribution (custom tiers)
- ✅ Bonding curve tiers (up to 10)
- ✅ Reveal fees (optional)
- ✅ Buyback pricing (any amount)

### **Fixed for Fairness:**
- 🔒 Platform fees (6% total)
- 🔒 Fee cap (6.9% max)
- 🔒 Vesting schedule (10% + 15% over 12mo)
- 🔒 Pre-buy limit (5% max)
- 🔒 Pre-buy discount (10%)

### **Recommended for Analos:**
- 🎯 1,000 NFTs @ $5-$50 USD
- 🎯 ~$30k total raise
- 🎯 ~$20k pool (close to $25k target)
- 🎯 $7,500 to creator (vested)

**Everything is configurable except platform fees and security features!** ✅

**The system scales from $25k to $250k+ as Analos grows!** 🚀📈
