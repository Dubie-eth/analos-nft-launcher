# 💰 Adjustable Bonding Curve Parameters

## 🎯 Yes, Everything Should Be Adjustable!

Creators should be able to customize:
1. ✅ **Initial Price** - Starting token price
2. ✅ **Bonding Curve Type** - Linear, exponential, or custom
3. ✅ **Migration Threshold** - When to migrate to DLMM
4. ✅ **Pool Split** - How tokens are divided
5. ✅ **Creator Vesting** - Lock-up periods
6. ✅ **Fee Structure** - Platform vs creator fees

---

## 📊 Bonding Curve Configuration

### Add to TokenLaunchConfig:

```rust
#[account]
#[derive(InitSpace)]
pub struct TokenLaunchConfig {
    pub nft_collection_config: Pubkey,
    pub token_mint: Pubkey,
    pub token_escrow: Pubkey,
    pub authority: Pubkey,
    
    // Token distribution
    pub tokens_per_nft: u64,
    pub total_tokens_minted: u64,
    pub total_tokens_distributed: u64,
    
    // Pool split (adjustable!)
    pub pool_percentage_bps: u16,          // 🔧 ADJUSTABLE (e.g., 8000 = 80%)
    pub creator_percentage_bps: u16,       // 🔧 ADJUSTABLE (e.g., 2000 = 20%)
    pub pool_tokens: u64,
    pub creator_tokens: u64,
    
    // Bonding curve parameters (adjustable!)
    pub bonding_curve_type: BondingCurveType,  // 🔧 ADJUSTABLE
    pub initial_price_lamports: u64,           // 🔧 ADJUSTABLE - Starting price
    pub target_price_lamports: u64,            // 🔧 ADJUSTABLE - Migration price
    pub curve_steepness: u16,                  // 🔧 ADJUSTABLE - How fast price rises
    
    // Migration settings (adjustable!)
    pub migration_threshold_lamports: u64,     // 🔧 ADJUSTABLE - When to migrate
    pub auto_migrate: bool,                    // 🔧 ADJUSTABLE - Auto or manual
    
    // DLMM integration
    pub dlmm_pool: Option<Pubkey>,
    pub dlmm_position: Option<Pubkey>,
    pub is_bonded: bool,
    pub bond_time: Option<i64>,
    
    // Buyback (adjustable!)
    pub buyback_enabled: bool,                 // 🔧 ADJUSTABLE
    pub buyback_price_tokens: u64,             // 🔧 ADJUSTABLE
    pub total_buybacks: u64,
    
    // Creator vesting (adjustable!)
    pub creator_immediate_bps: u16,            // 🔧 ADJUSTABLE (e.g., 500 = 5%)
    pub creator_vested_bps: u16,               // 🔧 ADJUSTABLE (e.g., 1500 = 15%)
    pub vesting_duration_days: u64,            // 🔧 ADJUSTABLE (e.g., 180 days)
    pub vesting_cliff_days: u64,               // 🔧 ADJUSTABLE (e.g., 30 days)
    
    #[max_len(32)]
    pub token_name: String,
    #[max_len(10)]
    pub token_symbol: String,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BondingCurveType {
    Linear,         // Price increases linearly
    Exponential,    // Price increases exponentially (faster)
    Logarithmic,    // Price increases logarithmically (slower)
    SquareRoot,     // Price = sqrt(supply)
    Custom,         // Custom formula
}
```

---

## 🎚️ Adjustable Parameters

### 1. Initial Price (Starting Point)

```rust
pub initial_price_lamports: u64  // 🔧 ADJUSTABLE

// Examples:
// - 0.001 LOS = 1_000_000 lamports (cheap start)
// - 0.01 LOS  = 10_000_000 lamports (moderate)
// - 0.1 LOS   = 100_000_000 lamports (premium)

// Formula: P(0) = initial_price
```

**Creator Choice:**
- **Low Start** (0.001 LOS): Easy entry, builds momentum
- **High Start** (0.1 LOS): Premium positioning, filters buyers

---

### 2. Migration/Target Price (Exit Point)

```rust
pub target_price_lamports: u64           // 🔧 ADJUSTABLE
pub migration_threshold_lamports: u64    // 🔧 ADJUSTABLE

// Examples:
// Initial: 0.001 LOS → Target: 1.0 LOS (1000x growth)
// Initial: 0.01 LOS  → Target: 0.5 LOS (50x growth)
// Initial: 0.1 LOS   → Target: 2.0 LOS (20x growth)
```

**Migration Trigger:**
```rust
// Migrate when either:
// 1. Price reaches target
if current_price >= target_price_lamports {
    migrate_to_dlmm();
}

// 2. Total SOL collected reaches threshold
if total_sol_collected >= migration_threshold_lamports {
    migrate_to_dlmm();
}
```

**Creator Choice:**
- **High Threshold**: More bonding curve trading
- **Low Threshold**: Faster migration to DEX
- **Manual**: Creator decides when

---

### 3. Bonding Curve Type (Price Formula)

```rust
pub bonding_curve_type: BondingCurveType  // 🔧 ADJUSTABLE
pub curve_steepness: u16                  // 🔧 ADJUSTABLE (100-1000)
```

**Formulas:**

#### Linear:
```
Price = initial_price + (tokens_sold * steepness)

Example: steepness = 100
- Token 1: 0.001 LOS
- Token 1000: 0.101 LOS (gradual increase)
```

#### Exponential:
```
Price = initial_price * (1 + steepness/10000) ^ tokens_sold

Example: steepness = 200 (2%)
- Token 1: 0.001 LOS
- Token 1000: 7.24 LOS (rapid increase)
```

#### Square Root:
```
Price = initial_price * sqrt(tokens_sold)

Example:
- Token 1: 0.001 LOS
- Token 10000: 0.1 LOS (moderate increase)
```

**Creator Choice:**
- **Linear**: Steady, predictable growth
- **Exponential**: Rewards early buyers heavily
- **Square Root**: Balanced, sustainable
- **Custom**: Advanced (provide formula)

---

### 4. Pool Split (Token Distribution)

```rust
pub pool_percentage_bps: u16      // 🔧 ADJUSTABLE (0-10000)
pub creator_percentage_bps: u16   // 🔧 ADJUSTABLE (0-10000)

// Must add up to 10000 (100%)
```

**Common Splits:**

| Split | Pool | Creator | Use Case |
|-------|------|---------|----------|
| 90/10 | 90% | 10% | Community-focused |
| 80/20 | 80% | 20% | **Balanced (recommended)** |
| 70/30 | 70% | 30% | Creator-heavy |
| 95/5  | 95% | 5% | Max liquidity |

**Creator Choice:**
- **High Pool %**: More liquidity, stable price
- **High Creator %**: More rewards, less liquidity

---

### 5. Creator Vesting (Lock-up Period)

```rust
pub creator_immediate_bps: u16      // 🔧 ADJUSTABLE (0-10000)
pub creator_vested_bps: u16         // 🔧 ADJUSTABLE (0-10000)
pub vesting_duration_days: u64      // 🔧 ADJUSTABLE (e.g., 180)
pub vesting_cliff_days: u64         // 🔧 ADJUSTABLE (e.g., 30)

// Example: 20% creator share
// - 5% immediate (2500 bps)
// - 15% vested over 6 months (7500 bps)
```

**Vesting Schedule:**
```
Day 0: 5% unlocked (immediate)
Day 30: Cliff ends, vesting starts
Day 60: 7.5% unlocked (5% + 2.5% vested)
Day 90: 10% unlocked (5% + 5% vested)
Day 180: 20% unlocked (5% + 15% vested) - FULLY VESTED
```

**Creator Choice:**
- **No Vesting**: All tokens immediately (risky for buyers)
- **Short Vesting**: 1-3 months (moderate)
- **Long Vesting**: 6-12 months (builds trust)

---

### 6. Buyback Configuration

```rust
pub buyback_enabled: bool           // 🔧 ADJUSTABLE
pub buyback_price_tokens: u64       // 🔧 ADJUSTABLE

// Example:
// User burns Epic NFT (10x multiplier)
// Base buyback: 500 tokens
// With multiplier: 500 * 10 = 5,000 tokens
```

**Creator Choice:**
- **High Buyback**: Encourages burns, reduces supply
- **Low Buyback**: Keeps NFTs valuable
- **Disabled**: No buyback option

---

## 🎨 UI Configuration

### Launch Wizard - Bonding Curve Setup:

```typescript
interface BondingCurveConfig {
  // Basic
  curveType: 'linear' | 'exponential' | 'squareRoot' | 'custom';
  initialPrice: number;        // In LOS
  targetPrice: number;         // In LOS
  
  // Advanced
  steepness: number;           // 100-1000 (curve aggressiveness)
  migrationThreshold: number;  // In LOS
  autoMigrate: boolean;
  
  // Token Split
  poolPercentage: number;      // 50-95%
  creatorPercentage: number;   // 5-50%
  
  // Vesting
  immediateUnlock: number;     // 0-100%
  vestingPeriodDays: number;   // 30-365 days
  cliffPeriodDays: number;     // 0-90 days
  
  // Buyback
  enableBuyback: boolean;
  buybackPrice: number;        // Tokens per NFT
}
```

### UI Examples:

#### Simple Mode (Recommended Defaults):
```
┌─────────────────────────────────┐
│  Use Recommended Settings       │
│                                 │
│  ● Standard Bonding Curve      │
│    Initial: 0.001 LOS          │
│    Target: 1.0 LOS             │
│    Type: Square Root           │
│                                 │
│  ● 80/20 Pool Split            │
│    Pool: 80% | Creator: 20%    │
│                                 │
│  ● 6-Month Vesting             │
│    5% immediate, 15% vested    │
└─────────────────────────────────┘
```

#### Advanced Mode (Full Control):
```
┌─────────────────────────────────┐
│  Custom Bonding Curve           │
│                                 │
│  Type: [Exponential ▼]         │
│  Initial Price: [0.005] LOS    │
│  Target Price: [2.0] LOS       │
│  Steepness: [200] (1-1000)     │
│                                 │
│  Migration Threshold:           │
│    ○ Price-based: 2.0 LOS      │
│    ● SOL-based: 5000 LOS       │
│    ☑ Auto-migrate               │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  Token Distribution             │
│                                 │
│  Pool: [75]%  [■■■■■■■□□□]     │
│  Creator: [25]%  [■■■□□□□□□□]   │
│                                 │
│  Must add up to 100%            │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  Creator Vesting                │
│                                 │
│  Immediate: [10]% unlocked     │
│  Vested: [15]% over time       │
│  Duration: [180] days          │
│  Cliff: [30] days              │
│                                 │
│  Timeline:                      │
│  Day 0:   10% ┃                │
│  Day 30:  10% ┃ Cliff          │
│  Day 180: 25% ┃━━━━━━━━━━━━━┫  │
└─────────────────────────────────┘
```

---

## 📊 Presets for Different Scenarios

### Preset 1: "Community First" 🤝
```rust
BondingCurveConfig {
    curve_type: SquareRoot,
    initial_price: 0.001 LOS,
    target_price: 0.5 LOS,
    steepness: 150,
    
    pool_percentage: 9000,      // 90%
    creator_percentage: 1000,   // 10%
    
    creator_immediate: 500,     // 5%
    vesting_duration: 180,      // 6 months
    
    buyback_enabled: true,
    buyback_price: 1000,
}
```
**Best for**: Building community trust

---

### Preset 2: "Balanced Growth" ⚖️
```rust
BondingCurveConfig {
    curve_type: SquareRoot,
    initial_price: 0.01 LOS,
    target_price: 1.0 LOS,
    steepness: 200,
    
    pool_percentage: 8000,      // 80%
    creator_percentage: 2000,   // 20%
    
    creator_immediate: 500,     // 5%
    vesting_duration: 180,      // 6 months
    
    buyback_enabled: true,
    buyback_price: 500,
}
```
**Best for**: Most projects (recommended)

---

### Preset 3: "Premium Launch" 💎
```rust
BondingCurveConfig {
    curve_type: Exponential,
    initial_price: 0.1 LOS,
    target_price: 5.0 LOS,
    steepness: 300,
    
    pool_percentage: 7000,      // 70%
    creator_percentage: 3000,   // 30%
    
    creator_immediate: 1000,    // 10%
    vesting_duration: 90,       // 3 months
    
    buyback_enabled: false,
}
```
**Best for**: High-quality, premium projects

---

### Preset 4: "Small Drop" 🎯
```rust
BondingCurveConfig {
    curve_type: Linear,
    initial_price: 0.005 LOS,
    target_price: 0.2 LOS,
    steepness: 100,
    
    pool_percentage: 9500,      // 95%
    creator_percentage: 500,    // 5%
    
    creator_immediate: 500,     // 5% (all immediate)
    vesting_duration: 0,        // No vesting
    
    buyback_enabled: true,
    buyback_price: 2000,
}
```
**Best for**: Small collections (100-500 NFTs)

---

## 🎯 Recommendations

### For Your Platform:

1. **Offer Presets**: Most creators want simple
2. **Allow Customization**: Advanced users want control
3. **Show Simulations**: Preview price curves
4. **Validate Ranges**: Prevent absurd values
5. **Warn on Risky Settings**: E.g., "No vesting may reduce trust"

### Parameter Limits:

```rust
// Enforce reasonable limits
require!(initial_price >= 100_000, "Min price: 0.0001 LOS");
require!(initial_price <= 1_000_000_000, "Max price: 1 LOS");
require!(target_price > initial_price, "Target must be > initial");
require!(pool_percentage >= 5000, "Pool must be >= 50%");
require!(creator_percentage <= 5000, "Creator must be <= 50%");
require!(vesting_duration >= 30, "Min vesting: 30 days");
require!(vesting_duration <= 730, "Max vesting: 2 years");
```

---

## ✅ Complete Flexibility

**Yes, everything should be adjustable:**
- ✅ Initial price
- ✅ Target/migration price
- ✅ Curve type and steepness
- ✅ Pool split
- ✅ Vesting schedule
- ✅ Buyback settings
- ✅ Migration threshold
- ✅ Auto-migrate vs manual

**This gives creators:**
- 🎨 **Creative freedom** - Match their vision
- 🎯 **Strategic control** - Optimize tokenomics
- 🛡️ **Risk management** - Choose safe parameters
- 🚀 **Growth potential** - Scale with success

**Your platform becomes the most flexible NFT launchpad!** 💪

