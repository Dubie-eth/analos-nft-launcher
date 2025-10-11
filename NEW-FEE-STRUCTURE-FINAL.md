# 🎯 **NEW FEE STRUCTURE - Final Configuration**

## **69% Pool / 25% Creator / 6% LOL Ecosystem**

---

## 💰 **Complete Fee Breakdown**

### **From Every NFT Mint:**

```
User Pays: 100 SOL (example)
    ↓
LOL Ecosystem Fees (6% total):
    ├─ Dev Team (1%): 1 SOL
    ├─ Pool Creation (2%): 2 SOL
    ├─ LOL Buyback/Burn (1%): 1 SOL
    ├─ Platform Maintenance (1%): 1 SOL
    └─ LOL Community Rewards (1%): 1 SOL
    ↓
Remaining (94%): 94 SOL
    ↓
Pool (69% of total): 69 SOL
Creator (25% of total): 25 SOL
    ├─ Immediate (10% of total): 10 SOL ✅
    └─ Vested (15% of total): 15 SOL 🔒
        └─> Over 12 months: 1.25 SOL/month
```

---

## 📊 **Allocation Summary**

| Category | Percentage | Amount (100 SOL) | When Available |
|----------|-----------|------------------|----------------|
| **LOL Ecosystem** | **6%** | **6 SOL** | **Immediate** |
| ├─ Dev Team | 1% | 1 SOL | Immediate |
| ├─ Pool Creation | 2% | 2 SOL | After bonding |
| ├─ LOL Buyback/Burn | 1% | 1 SOL | Immediate |
| ├─ Platform Maint | 1% | 1 SOL | Immediate |
| └─ LOL Community | 1% | 1 SOL | Immediate |
| **Pool** | **69%** | **69 SOL** | **After bonding** |
| **Creator Total** | **25%** | **25 SOL** | **Mixed** |
| ├─ Immediate | 10% | 10 SOL | After bonding |
| └─ Vested | 15% | 15 SOL | 12 months |

---

## 💎 **Example: 10,000 NFTs @ avg $15 USD**

### **Total Raised: $150,000 USD**

**LOL Ecosystem (6%):** $9,000
```
├─ Dev Team (1%): $1,500
├─ Pool Creation (2%): $3,000
├─ LOL Buyback/Burn (1%): $1,500
├─ Platform Maint (1%): $1,500
└─ LOL Community (1%): $1,500
```

**Pool (69%):** $103,500 ✅ **Exceeds $100k target!**

**Creator (25%):** $37,500
```
├─ Immediate (10%): $15,000 (after bonding)
└─ Vested (15%): $22,500 (over 12 months)
    └─> $1,875/month
```

---

## 🔒 **Creator Vesting Timeline**

### **12-Month Linear Vesting:**

```
Month 0 (Bonding):
Creator: 10% [██████████░░░░░░░░░░░░░░░░░░░░] 10%

Month 1:
Creator: 11.25% [███████████░░░░░░░░░░░░░░░░░░] 11.25%

Month 2:
Creator: 12.5% [████████████░░░░░░░░░░░░░░░░░] 12.5%

Month 3:
Creator: 13.75% [█████████████░░░░░░░░░░░░░░░] 13.75%

...

Month 12 (Fully Vested):
Creator: 25% [█████████████████████████░░░░░] 25%
Pool: 69% [███████████████████████████████] 69%
LOL: 6% [██████░░░░░░░░░░░░░░░░░░░░░░░░░] 6%
```

---

## 📈 **Token Distribution**

### **Base Tokens:**
```
10,000 NFTs × 10,000 tokens = 100,000,000 tokens
```

### **After Rarity (with multipliers):**
```
Total Distributed: 1,045,000,000 tokens
```

### **Allocation:**
```
Pool (69%): 721,050,000 tokens
Creator (25%): 261,250,000 tokens
  ├─ Immediate (10%): 104,500,000 tokens
  └─ Vested (15%): 156,750,000 tokens
      └─> 13,062,500 tokens/month

Remaining (6%): 62,700,000 tokens (user distributions from rarity)
```

---

## 🎯 **LOL Ecosystem Fee Distribution**

### **Fee Wallets:**

| Purpose | Wallet | % | Description |
|---------|--------|---|-------------|
| Dev Team | `Em26Wav...` | 1% | Development & maintenance |
| Pool Creation | `myHsak...` | 2% | DLMM pool creation costs |
| LOL Buyback/Burn | `7V2Ygsf...` | 1% | Buy & burn $LOL tokens |
| Platform Maint | `myHsak...` | 1% | Infrastructure & ops |
| LOL Community | `7V2Ygsf...` | 1% | Community rewards |

---

## 💰 **Creator Revenue Breakdown**

### **Example: $150k Total Raise**

**Immediate (After Bonding):**
```
Creator Allocation (25%): $37,500
Immediate (10%): $15,000 ✅

Plus:
Trading Fees: Variable (claimable anytime)
Pre-Buy: Up to 5% at 10% discount (optional)

IMMEDIATE TOTAL: $15k+ USD
```

**Vested (12 Months):**
```
Total Vested (15%): $22,500
Per Month: $1,875

Month 1: $1,875
Month 2: $1,875
...
Month 12: $1,875

VESTED TOTAL: $22,500 USD
```

**Total After 1 Year:**
```
Immediate: $15,000
Vested: $22,500
Trading Fees: $XXX (variable)
Pre-Buy Profit: $XXX (optional)

TOTAL: $37,500+ USD
```

---

## 🎮 **Dynamic Pricing for Tiers**

### **Whitelist Tier Override:**

```typescript
// Create tier with custom pricing
await nftLaunchpad.methods
    .createBondingCurveTier(
        0,                          // tier_id (Whitelist)
        "Whitelist",                // tier_name
        new BN(8 * 1e6),           // base_price ($8 USD, 20% discount)
        new BN(4 * 1e3),           // price_increment ($0.004 USD)
        new BN(24 * 1e6),          // max_price ($24 USD)
        new BN(100),                // max_supply (100 NFTs)
        Math.floor(Date.now() / 1000), // start_time
        Math.floor(Date.now() / 1000) + 86400, // end_time (24h)
        true,                       // whitelist_required
        null,                       // token_gate
        0,                          // min_token_balance
        false,                      // social_verification
        2000                        // discount_bps (20%)
    )
    .rpc();
```

**Tier prices are USD-pegged and adjust automatically!** ✅

---

## 🔄 **Price Oracle Integration**

### **USD-Pegged Pricing:**

```
Target NFT Price: $10 USD

If $LOS = $0.001:
├─> NFT Price: 10,000 LOS
└─> Total Raise (10k NFTs): 150,000,000 LOS = $150,000 ✅

If $LOS = $0.01 (10x pump!):
├─> NFT Price: 1,000 LOS (auto-adjusted!)
└─> Total Raise: 15,000,000 LOS = $150,000 ✅

Same USD value! 🎯
```

---

## ✅ **New Fee Structure Summary**

### **Distribution:**
- **Pool:** 69% → DLMM liquidity
- **Creator:** 25% → Vested (10% + 15%)
- **LOL Ecosystem:** 6% → 5 different allocations

### **Creator Vesting:**
- **10% Immediate** → After bonding
- **15% Vested** → 12 months linear
- **Trading Fees** → Claimable anytime
- **Pre-Buy** → Up to 5% at 10% discount

### **LOL Ecosystem (6%):**
1. **1% Dev Team** → Development
2. **2% Pool Creation** → DLMM setup
3. **1% LOL Buyback/Burn** → $LOL tokenomics
4. **1% Platform Maint** → Infrastructure
5. **1% LOL Community** → Rewards

---

## 🎯 **Achieving $100k Pool Target**

**Calculation:**
```
Target Pool: $103,500 (69% of raise)
Required Total Raise: $103,500 / 0.69 = $150,000

Collection: 10,000 NFTs
Average Price: $15 USD
Total Raised: $150,000 ✅

Pool Gets: $103,500 ✅ Exceeds target!
Creator Gets: $37,500 (vested)
LOL Ecosystem: $9,000 (distributed)
```

---

## 🚀 **Ready for Deployment**

**All programs updated:**
- ✅ NFT Launchpad (new 69/25/6 split)
- ✅ Token Launch (new vesting: 10% + 15%)
- ✅ Rarity Oracle (unchanged)
- ✅ Price Oracle (USD-pegged)

**No compilation errors!** ✅

**The system is COMPLETE with the new fee structure!** 🎉
