# 🎯 **Complete Fee Structure - 6.9% Cap**

## **Updated Fee Distribution**

All fees have been adjusted to work within the **6.9% maximum cap** for fairness and sustainability.

---

## 💰 **Mint Fee Distribution (Total: 6.9%)**

### **Breakdown:**
- **Platform Fee:** 3.45% (345 basis points)
- **Buyback Fee:** 2.07% (207 basis points)
- **Dev Fee:** 1.38% (138 basis points)
- **Total Fees:** 6.9% (690 basis points)

### **Creator Receives:** 93.1% (9,310 basis points)

---

## 📊 **Example: 100 SOL Mint**

```
User Mints NFT (100 SOL)
    ↓
Fee Distribution (6.9 SOL):
    ├─ Platform: 3.45 SOL (3.45%)
    ├─ Buyback: 2.07 SOL (2.07%) → $LOL burns
    └─ Dev: 1.38 SOL (1.38%) → Maintenance
    ↓
Creator Payment: 93.1 SOL (93.1%)
    ↓
If Creator Sets 20% BC Allocation:
    ├─ BC Reserve: 18.62 SOL (for trading liquidity)
    └─ Creator Funds: 74.48 SOL (withdrawable)
```

---

## 📈 **Trading Fee Structure (Dynamic, Max 6.9%)**

### **Volume-Based Scaling:**

| Trading Volume | Platform Fee | Description |
|---------------|--------------|-------------|
| **< 1,000 SOL** | 4.14% | Early stage - Higher fees for sustainability |
| **1,000 - 10,000 SOL** | 2.76% | Mid stage - Balanced fees |
| **> 10,000 SOL** | 1.38% | Late stage - Lower fees at scale |

**Minimum Platform Fee:** 0.5% (always applies)

---

## 🔄 **Bonding Curve Fee Structure (Max 6.9%)**

### **Volume-Based Scaling:**

| Trading Volume | BC Platform Fee | Description |
|---------------|-----------------|-------------|
| **< 1,000 SOL** | 5.52% | Early stage - Higher fees |
| **1,000 - 10,000 SOL** | 4.14% | Mid stage - Medium fees |
| **> 10,000 SOL** | 2.76% | Late stage - Lower fees |

**Purpose:** Fees decrease as volume increases, encouraging growth while maintaining sustainability.

---

## 💡 **Fee Distribution Formula**

```rust
// Mint Fees (6.9% total)
let platform_fee = price * 345 / 10000;  // 3.45%
let buyback_fee = price * 207 / 10000;   // 2.07%
let dev_fee = price * 138 / 10000;       // 1.38%
let creator_payment = price - platform_fee - buyback_fee - dev_fee; // 93.1%

// Creator BC Allocation
let bc_allocation = creator_payment * creator_bc_allocation_bps / 10000; // 0-50%
let creator_withdrawable = creator_payment - bc_allocation;
```

---

## 🎯 **Fee Constants in Code**

```rust
/// Fee distribution constants (total 6.9%)
pub const FEE_PLATFORM_BPS: u16 = 345;   // 3.45%
pub const FEE_BUYBACK_BPS: u16 = 207;    // 2.07%
pub const FEE_DEV_BPS: u16 = 138;        // 1.38%
pub const FEE_TOTAL_BPS: u16 = 690;      // 6.9% total

/// Fee caps
pub const MAX_TRADING_FEE_BPS: u16 = 690; // 6.9% maximum
pub const MAX_MINT_FEE_BPS: u16 = 690;    // 6.9% maximum

/// Platform fee structure (within 6.9% cap)
pub const PLATFORM_FEE_EARLY_BPS: u16 = 414;   // 4.14%
pub const PLATFORM_FEE_MID_BPS: u16 = 276;     // 2.76%
pub const PLATFORM_FEE_LATE_BPS: u16 = 138;    // 1.38%
pub const PLATFORM_FEE_MIN_BPS: u16 = 50;      // 0.5%

/// Bonding curve fee structure (within 6.9% cap)
pub const BONDING_CURVE_EARLY_PLATFORM_BPS: u16 = 552;  // 5.52%
pub const BONDING_CURVE_MID_PLATFORM_BPS: u16 = 414;    // 4.14%
pub const BONDING_CURVE_LATE_PLATFORM_BPS: u16 = 276;   // 2.76%
```

---

## 📊 **Detailed Examples**

### **Example 1: Small Collection (10 SOL Mint Price)**

```
User Mints (10 SOL)
    ↓
Fees (0.69 SOL):
    ├─ Platform: 0.345 SOL
    ├─ Buyback: 0.207 SOL
    └─ Dev: 0.138 SOL
    ↓
Creator: 9.31 SOL
    ↓
20% BC Allocation:
    ├─ BC Reserve: 1.862 SOL
    └─ Creator: 7.448 SOL
```

### **Example 2: Large Collection (1000 SOL Mint Price)**

```
User Mints (1000 SOL)
    ↓
Fees (69 SOL):
    ├─ Platform: 34.5 SOL
    ├─ Buyback: 20.7 SOL
    └─ Dev: 13.8 SOL
    ↓
Creator: 931 SOL
    ↓
30% BC Allocation:
    ├─ BC Reserve: 279.3 SOL
    └─ Creator: 651.7 SOL
```

### **Example 3: Trading (Early Stage, < 1000 SOL Volume)**

```
NFT Sold for 100 SOL
    ↓
Platform Fee (4.14%): 4.14 SOL
    ↓
Seller Receives: 95.86 SOL
```

### **Example 4: Trading (Late Stage, > 10,000 SOL Volume)**

```
NFT Sold for 100 SOL
    ↓
Platform Fee (1.38%): 1.38 SOL
    ↓
Seller Receives: 98.62 SOL
```

### **Example 5: Bonding Curve Buy (Early Stage)**

```
User Buys from BC for 50 SOL
    ↓
BC Platform Fee (5.52%): 2.76 SOL
    ↓
To BC Reserve: 47.24 SOL
    ↓
User Receives: NFT
```

---

## 🎯 **Fee Distribution Wallets**

| Wallet Type | Address | Purpose |
|------------|---------|---------|
| **Platform** | `myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q` | Operations & infrastructure |
| **Buyback** | `7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721` | $LOL token buybacks & burns |
| **Dev** | `Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D` | Development & maintenance |

---

## 💰 **Revenue Projections**

### **Scenario: 1,000 NFTs @ 1 SOL each**

```
Total Mint Volume: 1,000 SOL
    ↓
Platform Revenue: 34.5 SOL (3.45%)
Buyback Fund: 20.7 SOL (2.07%)
Dev Fund: 13.8 SOL (1.38%)
Total Platform: 69 SOL (6.9%)
    ↓
Creator Revenue: 931 SOL (93.1%)
```

### **With 20% BC Allocation:**
```
Creator Withdrawable: 744.8 SOL (74.48%)
BC Reserve: 186.2 SOL (18.62%)
Total Creator: 931 SOL (93.1%)
```

---

## 📈 **Sustainability Model**

### **Early Stage (High Fees):**
- **Purpose:** Fund initial infrastructure
- **Platform Fee:** 4.14% on trading
- **BC Fee:** 5.52% on curve trades
- **Justification:** Cover development, marketing, support costs

### **Mid Stage (Balanced Fees):**
- **Purpose:** Maintain operations
- **Platform Fee:** 2.76% on trading
- **BC Fee:** 4.14% on curve trades
- **Justification:** Scale operations, reduce reliance on fees

### **Late Stage (Low Fees):**
- **Purpose:** Maximize community value
- **Platform Fee:** 1.38% on trading
- **BC Fee:** 2.76% on curve trades
- **Justification:** Platform is profitable at scale

---

## 🛡️ **Fee Cap Protection**

### **Hard Caps:**
- **Trading Fee:** 6.9% maximum (enforced on-chain)
- **Mint Fee:** 6.9% maximum (enforced on-chain)
- **BC Fee:** 6.9% maximum (enforced on-chain)

### **Prevention:**
```rust
require!(fee_bps <= MAX_TRADING_FEE_BPS, ErrorCode::TradingFeeExceedsCap);
require!(fee_bps <= MAX_MINT_FEE_BPS, ErrorCode::MintFeeExceedsCap);
```

### **Benefits:**
- ✅ Prevents rug pulls
- ✅ Protects creators and minters
- ✅ Transparent fee structure
- ✅ Enforceable on-chain

---

## 🔍 **Transparency**

### **All Fees Are:**
- ✅ **On-chain** - Verifiable by anyone
- ✅ **Automated** - No manual intervention
- ✅ **Tracked** - Events emitted for every fee
- ✅ **Capped** - Maximum 6.9% enforced
- ✅ **Dynamic** - Lower fees at scale
- ✅ **Fair** - Same rules for everyone

### **View Fees:**
```typescript
const config = await program.account.collectionConfig.fetch(configPDA);
console.log("Trading Fee:", config.tradingFeeBps / 100, "%");
console.log("Mint Fee:", config.mintFeeBps / 100, "%");
console.log("Platform Fee:", config.platformFeeBps / 100, "%");
```

---

## ✅ **Summary**

### **Mint Fees (6.9% total):**
- Platform: 3.45%
- Buyback: 2.07%
- Dev: 1.38%
- Creator: 93.1%

### **Trading Fees (Dynamic, Max 6.9%):**
- Early: 4.14%
- Mid: 2.76%
- Late: 1.38%

### **Bonding Curve Fees (Dynamic, Max 6.9%):**
- Early: 5.52%
- Mid: 4.14%
- Late: 2.76%

### **Creator BC Allocation:**
- 0% - 50% configurable
- Transparent tracking
- Separate from withdrawable funds

**The fee structure is fair, transparent, and sustainable!** 🚀
