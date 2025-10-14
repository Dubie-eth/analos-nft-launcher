# 💰 Complete Token Allocation & Flow

## 🎯 Total Token Distribution (10M Example)

```
┌─────────────────────────────────────────────────────────┐
│  TOTAL SUPPLY: 10,000,000 TOKENS (100%)                │
│  (10,000 NFTs × 1,000 tokens each)                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
          ┌───────────────┴───────────────┐
          │                               │
          ↓                               ↓
┌─────────────────────┐       ┌─────────────────────┐
│  POOL (60%)         │       │  ALLOCATIONS (40%)  │
│  6,000,000 tokens   │       │  4,000,000 tokens   │
└─────────────────────┘       └─────────────────────┘
          │                               │
          │                               │
          ↓                               ↓
    [Bonding Curve]            [Split 4 Ways]
          │                               │
          │                   ┌───────────┼───────────┬────────────┐
          │                   │           │           │            │
          │                   ↓           ↓           ↓            ↓
          │         ┌─────────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐
          │         │  Creator    │ │  Team   │ │Community │ │Platform │
          │         │  (20%)      │ │  (10%)  │ │  (5%)    │ │  (5%)   │
          │         │  2M tokens  │ │  1M tok │ │  500k tok│ │ 500k tok│
          │         └─────────────┘ └─────────┘ └──────────┘ └─────────┘
          │                │             │            │            │
          │                │             │            │            │
          │                ↓             ↓            ↓            ↓
          │         [6mo vesting] [12mo vest]  [Immediate]  [Immediate]
          │                                                        │
          ↓                                                        ↓
┌─────────────────────┐                              ┌─────────────────────┐
│  Trading Flow       │                              │  Platform Revenue   │
│                     │                              │                     │
│  1. Bonding Curve   │                              │  Your Wallet:       │
│  2. Migration →     │                              │  86oK...MhpW        │
│  3. DLMM Trading    │                              │                     │
└─────────────────────┘                              └─────────────────────┘
```

---

## 📊 Token Distribution Breakdown

### Pool (6,000,000 tokens - 60%)

**Purpose:** Trading liquidity

**Split:**
```
5,400,000 tokens → Bonding Curve (90% of pool)
  600,000 tokens → Creator Pre-Buy (10% max, optional)
```

**Flow:**
1. **Phase 1:** Bonding curve trading
   - Users buy from curve
   - Price increases with demand
   - SOL collected for migration

2. **Phase 2:** Migration to DLMM
   - Trigger: Threshold met
   - Creates liquidity pool
   - Enables open trading

3. **Phase 3:** DEX Trading
   - Full liquidity on DLMM
   - Creator pre-buy tokens unlocked
   - Ongoing trading

---

### Creator (2,000,000 tokens - 20%)

**Vesting:** 6 months (adjustable)

**Breakdown:**
```
100,000 tokens (5%) → Immediate unlock
1,900,000 tokens (15%) → Vested over 6 months
```

**Schedule:**
```
Day 0:   100,000 tokens (5%)
Day 30:  190,000 tokens (cumulative: 290k)
Day 60:  380,000 tokens (cumulative: 480k)
Day 90:  570,000 tokens (cumulative: 670k)
Day 120: 760,000 tokens (cumulative: 860k)
Day 150: 950,000 tokens (cumulative: 1.05M)
Day 180: 2,000,000 tokens FULLY VESTED
```

**Creator Can:**
- Claim vested tokens monthly
- Sell on market after unlock
- Use for marketing/partnerships

---

### Team (1,000,000 tokens - 10%)

**Vesting:** 12 months (adjustable)

**Team Wallet:** Set by creator during setup

**Breakdown:**
```
50,000 tokens (5%) → Immediate
950,000 tokens (95%) → Vested over 12 months
```

**Use Cases:**
- Developer compensation
- Advisor payments
- Team retention
- Operational expenses

**Claim Process:**
```rust
// Team wallet claims monthly
pub fn claim_team_tokens(
    ctx: Context<ClaimTeamTokens>,
) -> Result<()> {
    let config = &mut ctx.accounts.token_launch_config;
    let clock = Clock::get()?;
    
    // Calculate vested amount
    let months_elapsed = (clock.unix_timestamp - config.bond_time.unwrap()) / (30 * 24 * 60 * 60);
    let vested_amount = calculate_vested_tokens(
        config.team_tokens,
        months_elapsed,
        12, // 12-month vesting
    );
    
    let claimable = vested_amount - config.team_tokens_claimed;
    
    // Transfer tokens
    token::transfer(escrow → team_wallet, claimable)?;
    
    config.team_tokens_claimed += claimable;
    
    Ok(())
}
```

---

### Community (500,000 tokens - 5%)

**Vesting:** Immediate (no lock)

**Community Wallet:** Set by creator during setup

**Use Cases:**
- Airdrops to holders
- Community rewards
- Marketing campaigns
- Giveaways
- Partnership incentives

**Examples:**
```
Airdrop #1: 100,000 tokens → Top 100 NFT holders
Airdrop #2: 50,000 tokens → Twitter engagement
Marketing: 200,000 tokens → Influencer partnerships
Reserve: 150,000 tokens → Future campaigns
```

**Creator Control:**
- Decides how to distribute
- Can do multiple airdrops
- Immediate access (no vesting)
- Full flexibility

---

### Platform (500,000 tokens - 5%)

**Vesting:** Immediate

**Platform Wallet:** Your admin wallet `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

**Purpose:**
- Protocol revenue
- Development fund
- Security audits
- Platform growth

**Automatic Collection:**
```rust
// Platform tokens automatically sent on bonding
pub fn trigger_bonding(
    ctx: Context<TriggerBonding>,
    initial_sol_amount: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.token_launch_config;
    
    // Calculate distributions
    let platform_tokens = (total_tokens * config.platform_percentage_bps) / 10000;
    
    // Transfer platform fee immediately
    let platform_config = &ctx.accounts.platform_config;
    token::transfer(
        escrow → platform_treasury,
        platform_tokens
    )?;
    
    config.platform_tokens_claimed = platform_tokens;
    platform_config.platform_revenue_collected += platform_tokens;
    
    // Continue with bonding...
    Ok(())
}
```

---

## 🏪 Creator Pre-Sale Example

### Scenario:
```
Pool: 6,000,000 tokens
Admin max pre-buy: 10% of pool
Admin max discount: 25%

Creator Settings:
- Pre-buy: 600,000 tokens (10% max)
- Discount: 20%
- Bonding curve start: 0.01 LOS/token
```

### Calculation:
```
Normal bonding curve price: 0.01 LOS/token
Pre-sale price: 0.008 LOS/token (20% discount)

Tokens to buy: 600,000
Cost: 600,000 × 0.008 = 4,800 LOS

Savings vs buying on curve: 1,200 LOS (20%)
```

### Lockup:
```
Pre-bought tokens locked until migration
Migration triggers at: 1,000 LOS collected OR target price

After migration:
- Tokens unlock
- Creator can sell or hold
- Same as pool tokens
```

### Flow:
```
1. Before Launch
   ├─> Creator sends 4,800 LOS
   └─> Receives 600,000 tokens (locked)

2. Public Launch
   ├─> Users buy from bonding curve
   ├─> Pool now effectively: 5,400,000 tokens
   └─> Price starts at 0.01 LOS

3. Migration Trigger
   ├─> 1,000 LOS collected
   └─> All tokens migrate to DLMM

4. After Migration
   ├─> Creator's 600k tokens unlock
   ├─> Can sell on DEX
   └─> Same liquidity as pool tokens
```

---

## 🎛️ Admin Controls for Each Allocation

### Platform Fee Control:
```
Default: 5%
Min creators can set: 3%
Max creators can set: 10%

Admin can update via panel:
- Change default percentage
- Adjust min/max range
- Disable/enable temporarily
```

### Pre-Sale Control:
```
Default max: 10% of pool
Default max discount: 25%

Admin can update:
- Max percentage (0-20%)
- Max discount (0-50%)
- Enable/disable globally
- Set min/max buy amounts
```

### Allocation Limits:
```
Pool: Min 50% (prevent low liquidity)
Creator: Max 30% (prevent dump risk)
Team: Max 20% (reasonable compensation)
Community: Max 10% (controlled distribution)

Admin can adjust all limits
Must ensure total = 100%
```

---

## 💡 Validation Rules

### On Collection Creation:
```rust
// Check percentages add up
require!(
    pool_bps + creator_bps + team_bps + community_bps + platform_bps == 10000,
    ErrorCode::InvalidAllocation
);

// Check against platform limits
require!(
    pool_bps >= platform_config.min_pool_percentage_bps,
    ErrorCode::PoolTooLow
);

require!(
    creator_bps <= platform_config.max_creator_percentage_bps,
    ErrorCode::CreatorAllocationTooHigh
);

// Validate pre-sale settings
if presale_enabled {
    require!(
        presale_max_bps <= platform_config.presale_max_allowed_bps,
        ErrorCode::PresaleExceedsLimit
    );
    
    require!(
        presale_discount_bps <= platform_config.presale_max_discount_bps,
        ErrorCode::DiscountTooHigh
    );
}

// Validate vesting
require!(
    vesting_days >= platform_config.min_vesting_days,
    ErrorCode::VestingTooShort
);
```

---

## 📊 Real Example: 10K Collection

```
Collection: "Analos Genesis"
Supply: 10,000 NFTs
Mint Price: 0.1 LOS
Tokens per NFT: 1,000
Total Tokens: 10,000,000

Creator Choices:
┌──────────────┬─────────┬──────────────┬────────────┐
│ Allocation   │ BPS     │ Tokens       │ Vesting    │
├──────────────┼─────────┼──────────────┼────────────┤
│ Pool         │ 6000    │ 6,000,000    │ -          │
│ Creator      │ 2000    │ 2,000,000    │ 6 months   │
│ Team         │ 1000    │ 1,000,000    │ 12 months  │
│ Community    │ 500     │   500,000    │ Immediate  │
│ Platform     │ 500     │   500,000    │ Immediate  │
├──────────────┼─────────┼──────────────┼────────────┤
│ TOTAL        │ 10000   │ 10,000,000   │            │
└──────────────┴─────────┴──────────────┴────────────┘

Pre-Sale:
- Amount: 600,000 tokens (10% of pool)
- Discount: 20%
- Cost: 4,800 LOS

Revenue:
- NFT Sales: 1,000 LOS (10k × 0.1)
- Bonding Curve: ~5,000 LOS (estimated)
- Platform Fee: 500,000 tokens (5%)

Total Creator Gets:
- 2M tokens (vested)
- 600k tokens (pre-buy, locked until migration)
- 1,000 LOS (NFT sales)
```

---

## ✅ Summary

**Token Allocations:**
- ✅ Pool: 60% (trading liquidity)
- ✅ Creator: 20% (vested)
- ✅ Team: 10% (vested, separate wallet)
- ✅ Community: 5% (immediate, airdrops/marketing)
- ✅ Platform: 5% (protocol fee)

**Creator Pre-Sale:**
- ✅ Optional up to admin limit (default 10%)
- ✅ Discount up to admin limit (default 25%)
- ✅ Locked until migration
- ✅ Uses creator's LOS

**Admin Controls:**
- ✅ Update all percentages/limits
- ✅ Control pre-sale parameters
- ✅ Set vesting requirements
- ✅ Emergency pause
- ✅ Withdraw platform revenue

**Your Admin Wallet:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

**Complete control over the entire platform!** 🎛️

