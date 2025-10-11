# 🎮 **Bonding Curve Tiers & Gamified Reveals - Complete Guide**

## **Overview**

The Analos NFT Launchpad now features **advanced bonding curve tiers** with custom rules and **gamified NFT reveals** with optional fees. Creators have full control over pricing, access, and reveal experiences.

---

## 🎯 **Key Features**

### **1. Dynamic Bonding Curve Pricing** ✅
- Creators set base price, increment, and max price
- Prices adjust automatically based on supply
- Platform fee ALWAYS 6.9% (constant regardless of price)

### **2. Multiple Tiers with Rules** ✅
- Up to 10 tiers per collection (0-9)
- Each tier has unique pricing and access rules
- Whitelist, token-gating, social verification

### **3. Gamified Reveal Experience** ✅
- Optional reveal fee for enhanced UX
- Platform fee ALWAYS 6.9% of reveal fee
- Tracks total reveals for analytics

### **4. Constant Platform Fees** ✅
- **ALWAYS 6.9%** regardless of mint/reveal price
- Fair for all price points
- Predictable revenue

---

## 💰 **Bonding Curve Pricing Configuration**

### **Basic Setup:**

```typescript
await program.methods
    .configureBondingCurvePricing(
        new BN(1 * 1e9),      // base_price: 1 SOL
        new BN(0.01 * 1e9),   // price_increment: 0.01 SOL per NFT
        new BN(10 * 1e9)      // max_price: 10 SOL cap (0 = no cap)
    )
    .accounts({
        collectionConfig: collectionConfigPDA,
        authority: creator.publicKey,
    })
    .signers([creator])
    .rpc();
```

### **Price Formula:**
```
Current Price = Base Price + (Current Supply × Price Increment)

Example:
Base: 1 SOL, Increment: 0.01 SOL
NFT #1: 1 SOL
NFT #50: 1.5 SOL  
NFT #100: 2 SOL
NFT #500: 6 SOL
NFT #900: 10 SOL (hits max cap)
```

---

## 🎭 **Bonding Curve Tiers**

### **Tier Structure:**

```rust
pub struct BondingCurveTier {
    pub tier_id: u8,                     // 0-9
    pub tier_name: String,               // "Whitelist", "Public", etc.
    pub base_price: u64,                 // Starting price
    pub price_increment: u64,            // Price increase per NFT
    pub max_price: u64,                  // Price cap
    pub max_supply: u64,                 // Max NFTs for this tier
    pub current_supply: u64,             // Minted in tier
    pub start_time: i64,                 // When active
    pub end_time: i64,                   // When ends (0 = forever)
    // Access Rules
    pub whitelist_required: bool,        // Whitelist check
    pub token_gate: Option<Pubkey>,      // Required token
    pub min_token_balance: u64,          // Min tokens
    pub social_verification: bool,       // Social check
    // Pricing
    pub discount_bps: u16,               // Discount %
}
```

### **Create Tier Example:**

```typescript
// Tier 0: Whitelist (20% discount)
await program.methods
    .createBondingCurveTier(
        0,                              // tier_id
        "Whitelist",                    // tier_name
        new BN(0.8 * 1e9),             // base_price (20% off)
        new BN(0.01 * 1e9),            // price_increment
        new BN(5 * 1e9),               // max_price
        new BN(100),                    // max_supply
        Math.floor(Date.now() / 1000), // start_time (now)
        Math.floor(Date.now() / 1000) + 86400, // end_time (24h)
        true,                           // whitelist_required
        null,                           // token_gate
        0,                              // min_token_balance
        false,                          // social_verification
        2000                            // discount_bps (20%)
    )
    .accounts({
        collectionConfig: collectionConfigPDA,
        bondingCurveTier: tierPDA,
        authority: creator.publicKey,
        systemProgram: SystemProgram.programId,
    })
    .signers([creator])
    .rpc();

// Tier 1: Token Holders (10% discount)
await program.methods
    .createBondingCurveTier(
        1,                              // tier_id
        "Token Holders",                // tier_name
        new BN(0.9 * 1e9),             // base_price (10% off)
        new BN(0.01 * 1e9),            // price_increment
        new BN(8 * 1e9),               // max_price
        new BN(500),                    // max_supply
        Math.floor(Date.now() / 1000), // start_time
        0,                              // end_time (no end)
        false,                          // whitelist_required
        tokenMintAddress,               // token_gate (e.g., $LOL token)
        new BN(100 * 1e6),             // min_token_balance (100 tokens)
        false,                          // social_verification
        1000                            // discount_bps (10%)
    )
    .accounts({...})
    .rpc();

// Tier 2: Public (no discount)
await program.methods
    .createBondingCurveTier(
        2,                              // tier_id
        "Public",                       // tier_name
        new BN(1 * 1e9),               // base_price (full price)
        new BN(0.01 * 1e9),            // price_increment
        new BN(10 * 1e9),              // max_price
        new BN(9400),                   // max_supply (rest of collection)
        Math.floor(Date.now() / 1000), // start_time
        0,                              // end_time
        false,                          // whitelist_required
        null,                           // token_gate
        0,                              // min_token_balance
        false,                          // social_verification
        0                               // discount_bps (no discount)
    )
    .accounts({...})
    .rpc();
```

---

## 🎮 **Gamified Reveal System**

### **Configure Reveal Fee:**

```typescript
await program.methods
    .configureRevealFee(
        true,                      // enabled
        new BN(0.1 * 1e9)         // fee_lamports (0.1 SOL per reveal)
    )
    .accounts({
        collectionConfig: collectionConfigPDA,
        authority: creator.publicKey,
    })
    .signers([creator])
    .rpc();
```

### **User Reveals NFT:**

```typescript
await program.methods
    .revealNftWithFee()
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        nftMint: nftMintAddress,
        payer: user.publicKey,
        platformFeeWallet: PLATFORM_FEE_WALLET,
        buybackFeeWallet: BUYBACK_FEE_WALLET,
        devFeeWallet: DEV_FEE_WALLET,
    })
    .signers([user])
    .rpc();
```

### **Reveal Fee Distribution:**

```
User Pays Reveal Fee (0.1 SOL)
    ↓
Platform Fee (3.45%): 0.00345 SOL → Platform
Buyback Fee (2.07%): 0.00207 SOL → Buyback  
Dev Fee (1.38%): 0.00138 SOL → Dev
    ↓
Creator Payment (93.1%): 0.0931 SOL → Escrow
    ↓
Total: 0.1 SOL (100%)
```

**Platform fee is ALWAYS 6.9% regardless of reveal fee amount!**

---

## 📊 **Pricing Examples by Tier**

### **Example Collection: 10,000 NFTs**

| Tier | Name | Supply | Base Price | Discount | Access Rule |
|------|------|--------|------------|----------|-------------|
| 0 | Whitelist | 100 | 0.8 SOL | 20% | Whitelist only |
| 1 | Token Holders | 500 | 0.9 SOL | 10% | Hold 100+ $LOL |
| 2 | Social Verified | 400 | 0.95 SOL | 5% | Twitter verified |
| 3 | Public | 9,000 | 1.0 SOL | 0% | Anyone |

### **Tier 0 (Whitelist) Pricing:**
```
Supply 0: 0.8 SOL
Supply 25: 1.05 SOL
Supply 50: 1.3 SOL
Supply 100: 1.8 SOL (sold out, moves to Tier 1)
```

### **Tier 1 (Token Holders) Pricing:**
```
Supply 0: 0.9 SOL
Supply 100: 1.9 SOL
Supply 250: 3.4 SOL
Supply 500: 5.9 SOL (sold out, moves to Tier 2)
```

---

## 🔒 **Access Rules**

### **1. Whitelist Required:**
```typescript
tier.whitelist_required = true
// User must be on whitelist to mint from this tier
```

### **2. Token Gating:**
```typescript
tier.token_gate = $LOL_TOKEN_MINT
tier.min_token_balance = 100 * 1e6
// User must hold 100+ $LOL tokens to mint
```

### **3. Social Verification:**
```typescript
tier.social_verification = true
// User must have verified Twitter/Discord to mint
```

### **4. Multiple Rules (AND logic):**
```typescript
// All conditions must be met
tier.whitelist_required = true
tier.token_gate = $LOL_TOKEN_MINT
tier.min_token_balance = 50 * 1e6
tier.social_verification = true
```

---

## 💡 **Platform Fee Guarantee**

### **ALWAYS 6.9% Regardless of Price:**

```rust
// In all functions:
let platform_fee = price * FEE_TOTAL_BPS as u64 / 10000; // 6.9%
let buyback_fee = price * FEE_BUYBACK_BPS as u64 / 10000; // 2.07%
let dev_fee = price * FEE_DEV_BPS as u64 / 10000; // 1.38%
let creator_payment = price - platform_fee - buyback_fee - dev_fee; // 93.1%
```

### **Examples:**

| Mint Price | Platform Fee (6.9%) | Creator Gets (93.1%) |
|------------|---------------------|----------------------|
| 0.1 SOL | 0.0069 SOL | 0.0931 SOL |
| 1 SOL | 0.069 SOL | 0.931 SOL |
| 10 SOL | 0.69 SOL | 9.31 SOL |
| 100 SOL | 6.9 SOL | 93.1 SOL |
| 1000 SOL | 69 SOL | 931 SOL |

**Fee percentage is CONSTANT!**

---

## 🎯 **Use Cases**

### **1. Exclusive Launch:**
- Tier 0: Whitelist (50 NFTs @ 0.5 SOL, 50% off)
- Tier 1: Token Holders (200 NFTs @ 0.75 SOL, 25% off)
- Tier 2: Public (9,750 NFTs @ 1 SOL, no discount)

### **2. Community First:**
- Tier 0: Social Verified (1,000 NFTs @ 0.8 SOL)
- Tier 1: Anyone (9,000 NFTs @ 1 SOL)

### **3. Dutch Auction Style:**
- Tier 0: Early Birds (100 NFTs @ 2 SOL)
- Tier 1: Mid Stage (400 NFTs @ 1.5 SOL)
- Tier 2: Late Stage (500 NFTs @ 1 SOL)
- Tier 3: Final Sale (9,000 NFTs @ 0.5 SOL)

---

## 🎮 **Gamified Reveal Ideas**

### **1. Mystery Box Experience:**
- Charge 0.1 SOL reveal fee
- Frontend shows animated opening
- Traits revealed one by one
- Rarity displayed with effects

### **2. Free Reveals:**
- No reveal fee
- Simple instant reveal
- Good for low-cost collections

### **3. Tiered Reveals:**
- First 1000 reveals: Free
- Next 4000 reveals: 0.05 SOL
- Final 5000 reveals: 0.1 SOL

---

## 📊 **Calculate Tier Price:**

```typescript
// Get current price for tier
await program.methods
    .calculateTierPrice(tierId)
    .accounts({
        collectionConfig: collectionConfigPDA,
        bondingCurveTier: tierPDA,
    })
    .rpc();

// Returns in logs:
// "Tier 1 current price: 2500000000 lamports (platform fee: 172500000 lamports)"
```

---

## ✅ **Summary**

### **Bonding Curve Tiers:**
- ✅ Up to 10 tiers per collection
- ✅ Custom pricing per tier
- ✅ Access rules (whitelist, tokens, social)
- ✅ Time-based activation
- ✅ Supply limits per tier
- ✅ Discount percentages

### **Gamified Reveals:**
- ✅ Optional reveal fee
- ✅ Platform fee ALWAYS 6.9%
- ✅ Tracks total reveals
- ✅ Frontend integration ready

### **Platform Fees:**
- ✅ ALWAYS 6.9% (constant)
- ✅ Works for ANY price point
- ✅ Fair and predictable
- ✅ Automatic distribution

**The system is COMPLETE and ready for creative launches!** 🚀
