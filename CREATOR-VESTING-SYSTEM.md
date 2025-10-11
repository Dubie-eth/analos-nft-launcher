# 🔒 **Creator Token Vesting System - Anti-Dump Protection**

## **Preventing Massive Token Dumps**

The vesting system ensures creators can't dump 20% of tokens immediately, protecting token price and community trust.

---

## 🎯 **Vesting Schedule**

### **Upon Bonding Completion:**

| Allocation | Percentage | Vesting | Description |
|------------|------------|---------|-------------|
| **Immediate** | 5% | None | Claimable right away |
| **Vested** | 15% | 6 months | Linear unlock |
| **Total** | 20% | Mixed | Anti-dump protection |

**Pool Still Gets:** 80% (no vesting, goes to DLMM)

---

## 📊 **Vesting Timeline**

### **Example: 1 Billion Total Tokens**

```
Upon Bonding (Month 0):
├─> Pool (80%): 800M tokens → DLMM pool ✅
└─> Creator (20%): 200M tokens
    ├─> Immediate (5%): 50M tokens (claimable now) ✅
    └─> Vested (15%): 150M tokens (locked) 🔒
        ├─> Month 1: 25M tokens unlocked
        ├─> Month 2: 25M tokens unlocked
        ├─> Month 3: 25M tokens unlocked
        ├─> Month 4: 25M tokens unlocked
        ├─> Month 5: 25M tokens unlocked
        └─> Month 6: 25M tokens unlocked ✅ Fully vested
```

---

## 💰 **Creator Revenue Streams**

### **1. Immediate Token Claim (5%)**
```typescript
// Right after bonding
await tokenLaunch.methods
    .withdrawCreatorTokens(new BN(50_000_000)) // 50M tokens
    .accounts({...})
    .rpc();

// Available immediately upon bonding
```

### **2. Monthly Vested Tokens (15% over 6 months)**
```typescript
// Month 1
await tokenLaunch.methods
    .withdrawCreatorTokens(new BN(25_000_000)) // 25M tokens
    .accounts({...})
    .rpc();

// Month 2
await tokenLaunch.methods
    .withdrawCreatorTokens(new BN(25_000_000)) // Another 25M
    .accounts({...})
    .rpc();

// ... continues for 6 months
```

### **3. Trading Fees (Available Anytime!)**
```typescript
// Claim during bonding or after
await tokenLaunch.methods
    .claimTradingFees(new BN(feeAmount))
    .accounts({...})
    .rpc();

// Can claim anytime there are fees collected
```

### **4. Creator Pre-Buy (Before Bonding)**
```typescript
// Buy up to 5% at 10% discount
await tokenLaunch.methods
    .creatorPrebuyTokens(
        new BN(50_000_000),  // 5% of supply
        new BN(400 * 1e9)    // Pay ~400 SOL (10% discount)
    )
    .accounts({...})
    .rpc();

// Immediate ownership, no vesting
```

---

## 🎮 **Creator Pre-Buy Feature**

### **Configuration:**
- **Max Pre-Buy:** 5% of total token supply
- **Discount:** 10% off first bonding curve tier price
- **Timing:** Only before bonding completes
- **Payment:** SOL goes to liquidity pool

### **Example:**
```
Total Tokens: 1 Billion
Max Pre-Buy: 50M tokens (5%)

First BC Tier Price: 0.00001 SOL/token
Creator Pre-Buy Price: 0.000009 SOL/token (10% off)

Cost for 50M tokens:
Regular: 500 SOL
Pre-Buy: 450 SOL
Savings: 50 SOL! 💰
```

### **Benefits:**
- ✅ Creator gets early position
- ✅ 10% discount incentive
- ✅ Payment adds to pool liquidity
- ✅ Limited to 5% (can't dump)
- ✅ Transparent on-chain

---

## 📈 **Vesting Math**

### **Linear Vesting Formula:**
```rust
let elapsed_months = (current_time - vesting_start) / SECONDS_PER_MONTH;
let vesting_months = 6;

let vested_tokens = if elapsed_months >= vesting_months {
    creator_vested_tokens  // Fully vested
} else {
    creator_vested_tokens * elapsed_months / vesting_months  // Partial
};

let available_to_claim = immediate_tokens + vested_tokens - already_claimed;
```

### **Example Timeline:**

| Time | Immediate | Vested | Total Available | Cumulative % |
|------|-----------|--------|-----------------|--------------|
| Day 0 (Bonding) | 50M | 0M | 50M | 5% |
| Month 1 | 50M | 25M | 75M | 7.5% |
| Month 2 | 50M | 50M | 100M | 10% |
| Month 3 | 50M | 75M | 125M | 12.5% |
| Month 4 | 50M | 100M | 150M | 15% |
| Month 5 | 50M | 125M | 175M | 17.5% |
| Month 6+ | 50M | 150M | 200M | 20% (Full) |

---

## 🛡️ **Anti-Dump Protection**

### **Without Vesting:**
```
Creator Gets 20% Immediately
    ↓
Sells 200M tokens at launch
    ↓
Price crashes 📉
    ↓
Community loses trust
    ↓
Project dies ☠️
```

### **With Vesting:**
```
Creator Gets 5% Immediately
    ↓
Can sell 50M tokens (manageable)
    ↓
Price remains stable
    ↓
Monthly unlocks over 6 months
    ↓
Gradual selling pressure
    ↓
Sustainable growth! 📈
```

---

## 💡 **Trading Fee Revenue**

### **Revenue During Bonding Curve:**
```
Users trade NFTs on bonding curve
    ↓
Trading fees collected (up to 6.9%)
    ↓
Fees accumulate in escrow
    ↓
Creator can claim ANYTIME! 💰
```

### **Example:**
```
100 trades @ 1 SOL each
Trading fee (5%): 5 SOL
    ↓
Creator claims: 5 SOL ✅
    ↓
Immediate revenue while vesting!
```

---

## 🎯 **Complete Creator Revenue Model**

### **From NFT Collection (10k NFTs @ 1 SOL):**

**Immediate (Upon Bonding):**
1. ✅ **5% of tokens** - 50M tokens (~$450 value initially)
2. ✅ **Trading fees** - Varies, claimable anytime
3. ✅ **20% of SOL** - 1,862 SOL from NFT sales

**Vested (6 Months):**
1. 🔒 **15% of tokens** - 150M tokens (~$1,350 value)
2. 🔒 **Unlocks linearly** - ~25M/month

**Optional Pre-Buy:**
1. 💰 **5% at 10% discount** - Before bonding
2. 💰 **Immediate ownership** - No vesting on pre-buy

---

## 📊 **Pricing Structure (RECOMMENDATION)**

### **NFT Pricing:**

**Option 1: Low Entry, High Ceiling**
```
Base Price: 0.1 SOL
Increment: 0.001 SOL per NFT
Max Price: 2 SOL

NFT #1: 0.1 SOL
NFT #1000: 1.1 SOL
NFT #10000: 2 SOL (capped)

Average: ~1 SOL
Total Raised: ~10,000 SOL
```

**Option 2: Standard Pricing**
```
Base Price: 0.5 SOL
Increment: 0.0005 SOL per NFT
Max Price: 5 SOL

NFT #1: 0.5 SOL
NFT #5000: 3 SOL
NFT #10000: 5 SOL (capped)

Average: ~2.5 SOL
Total Raised: ~25,000 SOL
```

**Option 3: Premium Pricing**
```
Base Price: 1 SOL
Increment: 0.001 SOL per NFT
Max Price: 10 SOL

NFT #1: 1 SOL
NFT #5000: 6 SOL
NFT #9000: 10 SOL (capped)

Average: ~5 SOL
Total Raised: ~50,000 SOL
```

### **Token Pricing:**

**After Bonding:**
```
DLMM Pool: 80% of tokens + 80% of creator SOL

Example (Option 1 - Low Entry):
Pool: 800M tokens + 7,448 SOL
Initial Price: ~0.0000093 SOL/token
Market Cap: ~$8,370 initially

Example (Option 2 - Standard):
Pool: 800M tokens + 18,620 SOL
Initial Price: ~0.0000233 SOL/token
Market Cap: ~$20,925 initially

Example (Option 3 - Premium):
Pool: 800M tokens + 37,240 SOL  
Initial Price: ~0.0000466 SOL/token
Market Cap: ~$41,850 initially
```

---

## ✅ **Recommended Pricing**

### **For Most Collections:**
**NFT Bonding Curve:**
- Base: 0.5 SOL
- Increment: 0.0005 SOL
- Max: 3 SOL
- Average mint: ~1.5 SOL

**Rationale:**
- ✅ Accessible entry (0.5 SOL)
- ✅ Reasonable ceiling (3 SOL)
- ✅ Good liquidity (~15k SOL raised)
- ✅ Healthy market cap (~$12k-15k)

---

## 🎯 **Summary**

### **Creator Allocation (20% of tokens):**
- **Immediate (5%):** ~$450-900 (claimable at bonding)
- **Vested (15%):** ~$1,350-2,700 (6-month linear)
- **Trading Fees:** Ongoing, claimable anytime
- **Pre-Buy (Optional):** Up to 5% at 10% discount

### **Anti-Dump Features:**
- ✅ **Only 5% immediate** (prevents dumps)
- ✅ **6-month vesting** (aligns with project)
- ✅ **Trading fees** (immediate revenue)
- ✅ **Pre-buy limited** (max 5%)
- ✅ **Transparent** (all on-chain)

### **Revenue Timeline:**
```
Day 0 (Bonding):
├─> 5% tokens (~$450-900)
├─> 20% SOL (~1,862 SOL)
└─> Trading fees (ongoing)

Month 1-6:
├─> 2.5% tokens/month (~$225-450/month)
└─> Trading fees (ongoing)

Total After 6 Months:
├─> 20% tokens (~$1,800-3,600)
├─> 20% SOL (~1,862 SOL)
└─> All trading fees
```

**Sustainable, fair, and anti-dump! 🚀**
