# 💱 **Price Oracle System - Dynamic USD-Pegged Pricing**

## **Problem: $LOS Price Volatility**

**Scenario:**
```
Today: $LOS Market Cap = $1,000,000
NFT Price: 0.5 SOL = $0.50 (if $LOS = $1)

Next Week: $LOS Market Cap = $10,000,000 (10x!)
NFT Price: 0.5 SOL = $5.00 (same LOS, different USD!)

Problem: NFT becomes 10x more expensive in USD!
```

**Solution:** Dynamic pricing based on $LOS USD value

---

## 🎯 **Price Oracle Program**

### **What It Does:**

1. **Tracks $LOS Market Cap** (updates regularly)
2. **Calculates $LOS Price in USD** (market cap / supply)
3. **Provides USD-Pegged Pricing** (for NFTs, tokens, etc.)
4. **Auto-Adjusts Prices** (maintains USD value targets)

---

## 💰 **Dynamic Pricing System**

### **Target: $100,000 Initial Pool Market Cap**

**Formula:**
```
Target Pool Value (USD): $100,000
Current $LOS Price (USD): Variable
Required LOS: $100,000 / $LOS_PRICE

Example Scenarios:

$LOS @ $0.000001 (Market Cap: $1M):
Required LOS: 100,000,000,000 LOS (100 billion)

$LOS @ $0.00001 (Market Cap: $10M):
Required LOS: 10,000,000,000 LOS (10 billion)

$LOS @ $0.0001 (Market Cap: $100M):
Required LOS: 1,000,000,000 LOS (1 billion)
```

---

## 🔄 **How It Works**

### **1. Oracle Initialization:**
```typescript
await priceOracle.methods
    .initializeOracle(
        new BN(20_000_000 * 1e6)  // $20M market cap (with 6 decimals)
    )
    .accounts({
        priceOracle: priceOraclePDA,
        authority: admin.publicKey,
        systemProgram,
    })
    .signers([admin])
    .rpc();
```

### **2. Regular Price Updates:**
```typescript
// Update every 5 minutes (or when price changes > 10%)
await priceOracle.methods
    .updateLosMarketCap(
        new BN(25_000_000 * 1e6),  // New market cap: $25M
        new BN(20_000_000_000 * 1e9) // Circulating supply: 20B LOS
    )
    .accounts({
        priceOracle: priceOraclePDA,
        updater: oracleBot.publicKey,
    })
    .signers([oracleBot])
    .rpc();

// Oracle calculates:
// $LOS Price = $25M / 20B = $0.00125
```

### **3. Dynamic NFT Pricing:**
```typescript
// Get current $LOS price from oracle
const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
const losPriceUSD = oracle.losPriceUsd; // e.g., 0.00125 (with 6 decimals: 1250)

// Target NFT price: $50 USD
const targetUSD = 50 * 1e6; // $50 with 6 decimals

// Calculate LOS amount
const losAmount = targetUSD * 1e9 / losPriceUSD;
// = 50,000,000 / 1,250 = 40,000 LOS (40 SOL)

// Set NFT price dynamically
await nftLaunchpad.methods
    .updateConfig(
        new BN(losAmount), // NFT price in lamports
        null
    )
    .rpc();
```

---

## 📊 **Pricing Scenarios**

### **Target: NFT Base Price = $50 USD**

| $LOS Market Cap | $LOS Price | Circulating Supply | LOS Amount | Human Readable |
|----------------|------------|-------------------|------------|----------------|
| $1M | $0.00005 | 20B | 1,000,000 LOS | 1M LOS |
| $5M | $0.00025 | 20B | 200,000 LOS | 200k LOS |
| $10M | $0.0005 | 20B | 100,000 LOS | 100k LOS |
| $20M | $0.001 | 20B | 50,000 LOS | 50k LOS |
| $50M | $0.0025 | 20B | 20,000 LOS | 20k LOS |
| $100M | $0.005 | 20B | 10,000 LOS | 10k LOS |

**Price in LOS adjusts automatically to maintain $50 USD!**

---

## 🎯 **Target: $100k Initial Pool Market Cap**

### **Pool Composition:**

**Scenario 1: $LOS @ $0.001 (Market Cap: $20M)**
```
Target Pool Value: $100,000
Required Components:

Option A (Token-Heavy):
├─> Tokens: 836M tokens
└─> LOS: 100,000,000 LOS (100k SOL)
    Initial Token Price: $0.00012

Option B (Balanced):
├─> Tokens: 836M tokens  
└─> LOS: 50,000,000 LOS (50k SOL)
    Initial Token Price: $0.00006

Option C (LOS-Heavy):
├─> Tokens: 836M tokens
└─> LOS: 150,000,000 LOS (150k SOL)
    Initial Token Price: $0.00018
```

### **Optimal Target Market Cap:**

**For $100k Initial Pool:**
```
Tokens: 836,000,000 (fixed from rarity distribution)
Target Pool Value: $100,000

LOS Needed (at different prices):
├─> $LOS @ $0.0005: 200,000,000 LOS (200k SOL)
├─> $LOS @ $0.001:  100,000,000 LOS (100k SOL)  ← RECOMMENDED
├─> $LOS @ $0.002:  50,000,000 LOS (50k SOL)
└─> $LOS @ $0.005:  20,000,000 LOS (20k SOL)

Initial Token Price (at $100k pool):
= $100,000 / 836,000,000 tokens
= $0.0001196 per token
```

---

## 🔧 **Implementation in NFT Launchpad**

### **Add Dynamic Pricing:**

```rust
// In initialize_collection instruction
pub fn initialize_collection_with_usd_target(
    ctx: Context<InitializeCollection>,
    target_price_usd: u64,  // e.g., 50 * 1e6 = $50
    // ... other params
) -> Result<()> {
    // Query price oracle
    let oracle = &ctx.accounts.price_oracle;
    let los_price_usd = oracle.los_price_usd;
    
    // Calculate LOS amount for target USD price
    let price_lamports = target_price_usd * 10u64.pow(9) / los_price_usd;
    
    config.price_lamports = price_lamports;
    config.target_price_usd = Some(target_price_usd);
    config.uses_usd_pegging = true;
    
    // Store for future adjustments
    Ok(())
}

// Add update function
pub fn update_price_to_usd_target(
    ctx: Context<UpdatePriceToUSD>,
) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let oracle = &ctx.accounts.price_oracle;
    
    if let Some(target_usd) = config.target_price_usd {
        let new_price_lamports = target_usd * 10u64.pow(9) / oracle.los_price_usd;
        config.price_lamports = new_price_lamports;
        
        msg!("Price updated to {} lamports (target: ${} USD)", 
            new_price_lamports, target_usd);
    }
    
    Ok(())
}
```

---

## 📱 **Automated Price Updates**

### **Backend Service (Node.js):**

```typescript
// price-updater.ts
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// Fetch $LOS market cap from CoinGecko/DEX
async function fetchLOSMarketCap() {
    // Option 1: CoinGecko API
    const response = await fetch("https://api.coingecko.com/api/v3/coins/analos");
    const data = await response.json();
    return data.market_data.market_cap.usd;
    
    // Option 2: Calculate from DEX data
    const price = await getTokenPriceFromDEX("LOS");
    const supply = await getCirculatingSupply();
    return price * supply;
}

// Update oracle every 5 minutes
setInterval(async () => {
    const marketCap = await fetchLOSMarketCap();
    const supply = await getCirculatingSupply();
    
    await priceOracle.methods
        .updateLosMarketCap(
            new anchor.BN(marketCap * 1e6),  // USD with 6 decimals
            new anchor.BN(supply * 1e9)      // LOS with 9 decimals
        )
        .accounts({
            priceOracle: priceOraclePDA,
            updater: oracleBot.publicKey,
        })
        .signers([oracleBot])
        .rpc();
    
    console.log(`Oracle updated: $LOS @ $${marketCap}`);
}, 5 * 60 * 1000); // Every 5 minutes
```

---

## 🎯 **Example: $100k Pool at Different $LOS Prices**

### **Calculations:**

**If $LOS = $0.001:**
```
NFT Collection (10k NFTs):
Target Total Raise (USD): $150,000
Price per NFT (USD): $15
Price per NFT (LOS): $15 / $0.001 = 15,000 LOS

Total Raised: 150,000,000 LOS (150k SOL)
Creator Gets (93.1%): 139,650,000 LOS
Pool (80%): 111,720,000 LOS (~$111,720)

Pool Composition:
├─> 836M tokens
├─> 111,720 LOS
└─> Initial Token Price: $0.0001336

✅ Achieves $100k+ pool target!
```

**If $LOS = $0.00005 (20x cheaper):**
```
Same $15 USD target:
Price per NFT (LOS): $15 / $0.00005 = 300,000 LOS

Total Raised: 3,000,000,000 LOS (3B SOL)
Pool (80%): 2,234,400,000 LOS (~$111,720)

✅ Same USD value, different LOS amount!
```

---

## 💡 **Recommended Configuration**

### **For $100k Initial Pool Target:**

**NFT Pricing:**
```
Target NFT Base Price: $15 USD
Target NFT Max Price: $50 USD

At $LOS = $0.001:
Base: 15,000 LOS (15k SOL)
Max: 50,000 LOS (50k SOL)

At $LOS = $0.005:
Base: 3,000 LOS (3k SOL)
Max: 10,000 LOS (10k SOL)

Price adjusts automatically! ✅
```

**Pool Target:**
```
Target Market Cap: $100,000
Required Raise: ~$150,000 (to achieve $100k in pool after fees)

Collection Size: 10,000 NFTs
Avg NFT Price: $15 USD
Total Raise: $150,000 ✅

Pool Gets (80%): $111,720 (~$100k) ✅
Creator (20%): $27,930
```

---

## 🛡️ **Security Features**

### **1. Price Change Limits:**
- Max 10% change per update
- Prevents oracle manipulation
- Requires authority for big changes

### **2. Staleness Checks:**
- Max 5 minutes old
- Prevents using old prices
- Forces regular updates

### **3. Pause Mechanism:**
- Emergency pause
- Security incidents
- Oracle issues

---

## 📈 **Oracle Update Strategy**

### **Update Frequency:**
```
Normal: Every 5 minutes
Volatile: Every 1 minute
Stable: Every 15 minutes
```

### **Update Sources:**

**Option 1: DEX Price (Most Accurate)**
```
Query Jupiter/Raydium for $LOS/$USDC pair
Calculate market cap from price × supply
Update oracle
```

**Option 2: CoinGecko API**
```
Fetch $LOS data from CoinGecko
Use market cap directly
Update oracle
```

**Option 3: Multiple Sources (Best)**
```
Fetch from 3+ sources
Calculate median
Update with consensus price
```

---

## 🎯 **Integration with NFT Launchpad**

### **Add to CollectionConfig:**
```rust
pub struct CollectionConfig {
    // ... existing fields ...
    
    // NEW: USD-pegged pricing
    pub uses_usd_pegging: bool,         // Enable USD pegging?
    pub target_price_usd: Option<u64>,  // Target price in USD (6 decimals)
    pub last_price_update: Option<i64>, // Last oracle sync
}
```

### **Auto-Update Prices:**
```rust
pub fn sync_price_with_oracle(
    ctx: Context<SyncPriceWithOracle>,
) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    let oracle = &ctx.accounts.price_oracle;
    
    if config.uses_usd_pegging {
        if let Some(target_usd) = config.target_price_usd {
            // Calculate new LOS price
            let new_price_lamports = target_usd * 10u64.pow(9) / oracle.los_price_usd;
            config.price_lamports = new_price_lamports;
            config.last_price_update = Some(Clock::get()?.unix_timestamp);
            
            msg!("Price synced: {} lamports (target: ${} USD at ${} per LOS)", 
                new_price_lamports, target_usd, oracle.los_price_usd);
        }
    }
    
    Ok(())
}
```

---

## 📊 **Example: Complete Dynamic Pricing**

### **Collection Setup:**

```typescript
// 1. Initialize with USD target
await nftLaunchpad.methods
    .initializeCollectionWithUsdTarget(
        10000,                    // max_supply
        50 * 1e6,                // target_price_usd ($50)
        // ... other params
    )
    .accounts({
        collectionConfig,
        priceOracle: priceOraclePDA,
        // ... other accounts
    })
    .rpc();

// Initial calculation:
// If $LOS = $0.001, NFT price = 50,000 LOS (50k SOL)
```

### **Price Adjustment (1 week later):**

```typescript
// $LOS pumped to $0.005 (5x!)

// Update oracle
await priceOracle.methods
    .updateLosMarketCap(
        new BN(100_000_000 * 1e6), // $100M market cap
        new BN(20_000_000_000 * 1e9) // 20B supply
    )
    .rpc();

// Sync NFT prices
await nftLaunchpad.methods
    .syncPriceWithOracle()
    .accounts({
        collectionConfig,
        priceOracle: priceOraclePDA,
    })
    .rpc();

// New calculation:
// If $LOS = $0.005, NFT price = 10,000 LOS (10k SOL)
// Still $50 USD! ✅
```

---

## 💰 **Achieving $100k Pool Target**

### **Calculation:**

```
Target Pool Market Cap: $100,000
Pool Gets: 80% of creator funds
Therefore, need to raise: $100,000 / 0.80 / 0.931 = $134,408

Required from NFT sales: $134,408
Collection Size: 10,000 NFTs
Average Price per NFT: $13.44 USD

At different $LOS prices:

$LOS @ $0.0001:
NFT Price: 134,400 LOS per NFT
Total Raise: 1,344,000,000 LOS

$LOS @ $0.001:
NFT Price: 13,440 LOS per NFT
Total Raise: 134,400,000 LOS

$LOS @ $0.01:
NFT Price: 1,344 LOS per NFT
Total Raise: 13,440,000 LOS
```

**All achieve the same $100k pool! ✅**

---

## 🎮 **User Experience**

### **Frontend Display:**

```
╔════════════════════════════════════════╗
║  ANALOS APES NFT COLLECTION            ║
║                                        ║
║  Current Price: $15 USD                ║
║  (50,000 LOS @ $0.0003/LOS)            ║
║                                        ║
║  [Mint NFT]                            ║
║                                        ║
║  Price updates automatically           ║
║  based on $LOS market price ⚡         ║
╚════════════════════════════════════════╝
```

**Benefits:**
- ✅ Users see USD price (familiar)
- ✅ LOS amount adjusts automatically
- ✅ Fair pricing regardless of volatility
- ✅ Transparent calculations

---

## 🔄 **Auto-Update System**

### **Backend Service:**

```typescript
// Oracle updater bot
class PriceOracleUpdater {
    async start() {
        setInterval(async () => {
            // 1. Fetch $LOS market data
            const marketCap = await this.fetchLOSMarketCap();
            const supply = await this.fetchCirculatingSupply();
            
            // 2. Update oracle
            await this.updateOracle(marketCap, supply);
            
            // 3. Update all active collections
            await this.updateAllCollectionPrices();
            
            console.log(`✅ Prices updated: $LOS @ $${marketCap}`);
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    async updateAllCollectionPrices() {
        const collections = await this.getActiveCollections();
        
        for (const collection of collections) {
            if (collection.usesUsdPegging) {
                await nftLaunchpad.methods
                    .syncPriceWithOracle()
                    .accounts({
                        collectionConfig: collection.publicKey,
                        priceOracle: priceOraclePDA,
                    })
                    .rpc();
            }
        }
    }
}
```

---

## ✅ **FINAL RECOMMENDATION**

### **For $100k Initial Pool Market Cap:**

**NFT Pricing (USD-Pegged):**
```
Base Price: $10 USD
Price Increment: $0.005 USD per NFT
Max Price: $30 USD
Collection Size: 10,000 NFTs

Total Raised (USD): ~$150,000
Creator Gets (93.1%): ~$139,650
Pool (80%): ~$111,720 ✅ Exceeds $100k target!
Creator (20%): ~$27,930
```

**At Current $LOS Price ($0.001):**
```
Base Price: 10,000 LOS
Max Price: 30,000 LOS
Total Raised: 150,000,000 LOS
```

**If $LOS Pumps to $0.01:**
```
Base Price: 1,000 LOS (auto-adjusted!)
Max Price: 3,000 LOS (auto-adjusted!)
Total Raised: 15,000,000 LOS

Still raises $150k USD! ✅
```

---

## 🎯 **Summary**

### **Price Oracle:**
- ✅ Tracks $LOS market cap
- ✅ Calculates $LOS USD price
- ✅ Updates every 5 minutes
- ✅ 10% change tolerance
- ✅ Emergency pause

### **Dynamic Pricing:**
- ✅ USD-pegged NFT prices
- ✅ Auto-adjusts for $LOS volatility
- ✅ Maintains target pool size
- ✅ Fair for all users

### **Target Achievement:**
- ✅ $100k initial pool market cap
- ✅ Regardless of $LOS price
- ✅ Transparent calculations
- ✅ Automated updates

**The system now handles $LOS price volatility perfectly!** 🎯⚡

**Next:** Deploy Price Oracle to Devnet! 🚀
