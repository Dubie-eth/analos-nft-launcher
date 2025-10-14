# 🎛️ Admin Controls & Token Allocations

## 🔑 Admin Authority

**Your Deployer Wallet:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`

This wallet will have:
- ✅ Platform-wide admin controls
- ✅ Update global parameters
- ✅ Set platform fees
- ✅ Configure limits and restrictions
- ✅ Emergency controls
- ✅ Revenue collection

---

## 💼 Token Allocation System

### Complete Token Distribution:

```rust
#[account]
#[derive(InitSpace)]
pub struct TokenLaunchConfig {
    // ... existing fields ...
    
    // NEW: Token Allocation Breakdown
    pub total_supply: u64,                      // 100% of tokens
    
    // Pool (For Trading)
    pub pool_percentage_bps: u16,               // e.g., 6000 = 60%
    pub pool_tokens: u64,
    
    // Creator Allocation
    pub creator_percentage_bps: u16,            // e.g., 2000 = 20%
    pub creator_tokens: u64,
    pub creator_vesting_active: bool,
    
    // Team Allocation (NEW!)
    pub team_percentage_bps: u16,               // 🆕 e.g., 1000 = 10%
    pub team_tokens: u64,
    pub team_wallet: Option<Pubkey>,            // 🆕 Team wallet address
    pub team_vesting_duration: u64,             // 🆕 Team vesting (days)
    pub team_tokens_claimed: u64,               // 🆕 Track claims
    
    // Community/Marketing (NEW!)
    pub community_percentage_bps: u16,          // 🆕 e.g., 500 = 5%
    pub community_tokens: u64,
    pub community_wallet: Option<Pubkey>,       // 🆕 Community wallet
    pub community_tokens_claimed: u64,          // 🆕 Track claims
    
    // Platform Fee (NEW!)
    pub platform_percentage_bps: u16,           // 🆕 e.g., 500 = 5%
    pub platform_tokens: u64,
    pub platform_tokens_claimed: u64,           // 🆕 Track claims
    
    // Creator Pre-Sale (NEW!)
    pub presale_enabled: bool,                  // 🆕 Allow pre-buy?
    pub presale_max_bps: u16,                   // 🆕 Max % (e.g., 1000 = 10%)
    pub presale_discount_bps: u16,              // 🆕 Discount (e.g., 2000 = 20% off)
    pub presale_amount_bought: u64,             // 🆕 Track pre-buys
    pub presale_sol_spent: u64,                 // 🆕 Track spending
    
    // ... rest of fields ...
}
```

---

## 📊 Token Distribution Examples

### Example 1: Balanced (10,000 NFTs × 1,000 tokens = 10M tokens)

```
Total Supply: 10,000,000 tokens (100%)

Pool (Trading):     6,000,000 tokens (60%)  - For bonding curve + DLMM
Creator:            2,000,000 tokens (20%)  - Vested over 6 months
Team:               1,000,000 tokens (10%)  - Vested over 12 months
Community:            500,000 tokens (5%)   - For airdrops/rewards
Platform:             500,000 tokens (5%)   - Analos protocol fee

Total: 10,000,000 tokens (100%) ✓
```

### Example 2: Community-Focused

```
Pool:        7,000,000 tokens (70%)
Creator:     1,500,000 tokens (15%)
Team:          500,000 tokens (5%)
Community:     500,000 tokens (5%)
Platform:      500,000 tokens (5%)
```

### Example 3: Team-Heavy (larger project)

```
Pool:        5,500,000 tokens (55%)
Creator:     2,000,000 tokens (20%)
Team:        1,500,000 tokens (15%)
Community:     500,000 tokens (5%)
Platform:      500,000 tokens (5%)
```

---

## 🏪 Creator Pre-Sale System

### How It Works:

1. **Before Public Launch**, creator can buy tokens at discount
2. **Limited by Admin-Set Percentage** (e.g., max 10% of pool)
3. **Price Discount** set by admin (e.g., 20% off bonding curve price)
4. **Uses SOL/LOS** from creator's wallet
5. **Locked with Pool** until migration

### Configuration:

```rust
pub struct PresaleConfig {
    pub enabled: bool,                    // Admin toggle
    pub max_percentage_bps: u16,          // 🎛️ Admin set (e.g., 1000 = 10%)
    pub discount_percentage_bps: u16,     // 🎛️ Admin set (e.g., 2000 = 20%)
    pub min_purchase_lamports: u64,       // 🎛️ Admin set (e.g., 1 LOS min)
    pub max_purchase_lamports: u64,       // 🎛️ Admin set (e.g., 100 LOS max)
}
```

### Example:

```
Pool has 6M tokens allocated
Admin sets: max_percentage_bps = 1000 (10%)

Creator can pre-buy:
- Max tokens: 600,000 (10% of 6M)
- Discount: 20% off bonding curve price

If bonding curve price is 0.01 LOS/token:
- Normal price: 0.01 LOS
- Pre-sale price: 0.008 LOS (20% discount)
- Cost for 600k tokens: 4,800 LOS (instead of 6,000 LOS)

Tokens locked until migration to DLMM
```

---

## 🎛️ Admin Panel Controls

### Global Platform Settings (Admin Only)

```rust
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin_authority: Pubkey,              // 🔑 YOUR WALLET
    
    // Platform Fees
    pub platform_fee_bps: u16,                // 🎛️ Default: 500 (5%)
    pub platform_fee_min_bps: u16,            // 🎛️ Min creators can set: 300 (3%)
    pub platform_fee_max_bps: u16,            // 🎛️ Max creators can set: 1000 (10%)
    
    // Pre-Sale Limits
    pub presale_max_allowed_bps: u16,         // 🎛️ Default: 1000 (10%)
    pub presale_max_discount_bps: u16,        // 🎛️ Default: 2500 (25%)
    pub presale_enabled_globally: bool,       // 🎛️ Emergency disable
    
    // Collection Limits
    pub min_collection_size: u64,             // 🎛️ e.g., 100 NFTs
    pub max_collection_size: u64,             // 🎛️ e.g., 100,000 NFTs
    pub min_mint_price_lamports: u64,         // 🎛️ e.g., 0.01 LOS
    pub max_mint_price_lamports: u64,         // 🎛️ e.g., 100 LOS
    
    // Bonding Curve Limits
    pub min_initial_price_lamports: u64,      // 🎛️ e.g., 0.0001 LOS
    pub max_initial_price_lamports: u64,      // 🎛️ e.g., 10 LOS
    pub min_migration_threshold: u64,         // 🎛️ e.g., 100 LOS
    pub max_migration_threshold: u64,         // 🎛️ e.g., 1,000,000 LOS
    
    // Allocation Limits
    pub min_pool_percentage_bps: u16,         // 🎛️ e.g., 5000 (50%)
    pub max_creator_percentage_bps: u16,      // 🎛️ e.g., 3000 (30%)
    pub max_team_percentage_bps: u16,         // 🎛️ e.g., 2000 (20%)
    pub max_community_percentage_bps: u16,    // 🎛️ e.g., 1000 (10%)
    
    // Vesting Limits
    pub min_vesting_days: u64,                // 🎛️ e.g., 30 days
    pub max_vesting_days: u64,                // 🎛️ e.g., 730 days (2 years)
    pub require_creator_vesting: bool,        // 🎛️ Force vesting?
    
    // Revenue
    pub platform_revenue_collected: u64,      // Track earnings
    pub platform_treasury: Pubkey,            // Where fees go
    
    // Emergency
    pub emergency_pause: bool,                // 🎛️ Stop all launches
    pub emergency_pause_reason: String,       // 🎛️ Message to users
    
    pub created_at: i64,
    pub last_updated: i64,
}

// Seeds: ["platform_config"]
```

---

## 🎛️ Admin Instructions

### 1. Update Platform Fees

```rust
pub fn update_platform_fees(
    ctx: Context<UpdatePlatformConfig>,
    new_platform_fee_bps: u16,
    new_min_fee_bps: u16,
    new_max_fee_bps: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    require!(new_platform_fee_bps <= 2000, ErrorCode::FeeTooHigh); // Max 20%
    
    config.platform_fee_bps = new_platform_fee_bps;
    config.platform_fee_min_bps = new_min_fee_bps;
    config.platform_fee_max_bps = new_max_fee_bps;
    config.last_updated = Clock::get()?.unix_timestamp;
    
    emit!(PlatformFeesUpdatedEvent {
        new_fee_bps: new_platform_fee_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

### 2. Update Pre-Sale Limits

```rust
pub fn update_presale_limits(
    ctx: Context<UpdatePlatformConfig>,
    max_presale_bps: u16,          // Max % of pool
    max_discount_bps: u16,          // Max discount
    enabled: bool,                  // Global enable/disable
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    require!(max_presale_bps <= 2000, ErrorCode::PresaleTooHigh); // Max 20%
    require!(max_discount_bps <= 5000, ErrorCode::DiscountTooHigh); // Max 50%
    
    config.presale_max_allowed_bps = max_presale_bps;
    config.presale_max_discount_bps = max_discount_bps;
    config.presale_enabled_globally = enabled;
    config.last_updated = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

### 3. Update Collection Limits

```rust
pub fn update_collection_limits(
    ctx: Context<UpdatePlatformConfig>,
    min_size: u64,
    max_size: u64,
    min_price: u64,
    max_price: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    require!(min_size <= max_size, ErrorCode::InvalidRange);
    require!(min_price <= max_price, ErrorCode::InvalidRange);
    
    config.min_collection_size = min_size;
    config.max_collection_size = max_size;
    config.min_mint_price_lamports = min_price;
    config.max_mint_price_lamports = max_price;
    config.last_updated = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

### 4. Update Allocation Limits

```rust
pub fn update_allocation_limits(
    ctx: Context<UpdatePlatformConfig>,
    min_pool_bps: u16,
    max_creator_bps: u16,
    max_team_bps: u16,
    max_community_bps: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    // Validate percentages
    require!(min_pool_bps >= 3000, ErrorCode::PoolTooLow); // Min 30%
    require!(
        max_creator_bps + max_team_bps + max_community_bps + config.platform_fee_bps <= 7000,
        ErrorCode::AllocationExceedsLimit
    );
    
    config.min_pool_percentage_bps = min_pool_bps;
    config.max_creator_percentage_bps = max_creator_bps;
    config.max_team_percentage_bps = max_team_bps;
    config.max_community_percentage_bps = max_community_bps;
    config.last_updated = Clock::get()?.unix_timestamp;
    
    Ok(())
}
```

### 5. Emergency Pause

```rust
pub fn emergency_pause(
    ctx: Context<UpdatePlatformConfig>,
    pause: bool,
    reason: String,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    config.emergency_pause = pause;
    config.emergency_pause_reason = reason.clone();
    config.last_updated = Clock::get()?.unix_timestamp;
    
    emit!(EmergencyPauseEvent {
        paused: pause,
        reason,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

### 6. Withdraw Platform Fees

```rust
pub fn withdraw_platform_fees(
    ctx: Context<WithdrawPlatformFees>,
    amount: u64,
) -> Result<()> {
    let config = &ctx.accounts.platform_config;
    
    require!(
        ctx.accounts.admin.key() == config.admin_authority,
        ErrorCode::Unauthorized
    );
    
    require!(
        config.platform_revenue_collected >= amount,
        ErrorCode::InsufficientFees
    );
    
    // Transfer tokens to platform treasury
    let cpi_accounts = Transfer {
        from: ctx.accounts.platform_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: config.to_account_info(),
    };
    
    let seeds = &[b"platform_config".as_ref(), &[ctx.bumps.platform_config]];
    let signer_seeds = &[&seeds[..]];
    
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    token::transfer(cpi_ctx, amount)?;
    
    emit!(PlatformFeesWithdrawnEvent {
        amount,
        treasury: config.platform_treasury,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

---

## 🎨 Admin Panel UI

### Dashboard Overview:

```
┌─────────────────────────────────────────────────────┐
│  ANALOS ADMIN PANEL                                 │
│  Admin: 86oK...MhpW                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Platform Statistics                                │
│  Total Collections: 47                              │
│  Total Volume: 15,432 LOS                          │
│  Platform Fees Collected: 771.6 LOS (5%)          │
│  Active Launches: 3                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Fee Configuration                       [EDIT]     │
│  Platform Fee: 5% (default)                        │
│  Min Creator Can Set: 3%                           │
│  Max Creator Can Set: 10%                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Pre-Sale Settings                       [EDIT]     │
│  ☑ Enabled Globally                                │
│  Max Pre-Buy: 10% of pool                          │
│  Max Discount: 25%                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Collection Limits                       [EDIT]     │
│  Size: 100 - 100,000 NFTs                          │
│  Price: 0.01 - 100 LOS                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Allocation Limits                       [EDIT]     │
│  Min Pool: 50%                                      │
│  Max Creator: 30%                                   │
│  Max Team: 20%                                      │
│  Max Community: 10%                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Emergency Controls                                 │
│  Status: ● OPERATIONAL                             │
│  [PAUSE ALL LAUNCHES]                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Revenue                                            │
│  Available: 771.6 LOS                              │
│  [WITHDRAW TO TREASURY]                             │
└─────────────────────────────────────────────────────┘
```

### Edit Fee Modal:

```
┌───────────────────────────────────┐
│  Edit Platform Fees               │
│                                   │
│  Default Platform Fee:            │
│  [5]% (current: 5%)              │
│                                   │
│  Creator Range:                   │
│  Min: [3]%  Max: [10]%           │
│                                   │
│  [CANCEL]  [UPDATE FEES]          │
└───────────────────────────────────┘
```

### Edit Pre-Sale Modal:

```
┌───────────────────────────────────┐
│  Edit Pre-Sale Settings           │
│                                   │
│  ☑ Enable Pre-Sale Globally       │
│                                   │
│  Max Pre-Buy Percentage:          │
│  [10]% of pool                    │
│                                   │
│  Max Discount:                    │
│  [25]%                            │
│                                   │
│  [CANCEL]  [UPDATE SETTINGS]      │
└───────────────────────────────────┘
```

---

## 🔒 Security & Access Control

### Admin-Only Functions:

```rust
#[derive(Accounts)]
pub struct UpdatePlatformConfig<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// CHECK: Must be admin authority
    #[account(
        constraint = admin.key() == platform_config.admin_authority @ ErrorCode::Unauthorized
    )]
    pub admin: Signer<'info>,
}
```

### Multi-Sig Option (Future):

```rust
// For extra security, can require 2-of-3 signatures
pub struct AdminMultiSig {
    pub admin1: Pubkey,  // Your deployer wallet
    pub admin2: Pubkey,  // Backup admin
    pub admin3: Pubkey,  // Emergency admin
    pub threshold: u8,   // e.g., 2 required
}
```

---

## 📊 Complete Token Distribution Example

### Creator Sets Up Launch:

```
Collection: 10,000 NFTs
Tokens per NFT: 1,000
Total Supply: 10,000,000 tokens

Creator Chooses:
- Pool: 60% (6,000,000 tokens)
- Creator: 20% (2,000,000 tokens) - vested 6 months
- Team: 10% (1,000,000 tokens) - vested 12 months
- Community: 5% (500,000 tokens) - immediate
- Platform: 5% (500,000 tokens) - immediate

✓ Validated against admin limits
✓ Total = 100%
```

### Creator Pre-Sale:

```
Admin Settings:
- Max pre-buy: 10% of pool
- Max discount: 25%

Creator chooses:
- Pre-buy: 600,000 tokens (10% of 6M)
- Discount: 20%
- Bonding curve starts: 0.01 LOS/token
- Pre-sale price: 0.008 LOS/token (20% off)

Cost: 4,800 LOS (saves 1,200 LOS)
Locked until migration
```

---

## ✅ Complete Feature Set

### For Creators:
- ✅ Set team allocation (0-20% admin limit)
- ✅ Set community allocation (0-10% admin limit)
- ✅ Pre-buy tokens at discount (up to admin limit)
- ✅ Choose vesting schedules
- ✅ Set team wallet address

### For Admin (YOU):
- ✅ Update all platform fees
- ✅ Set pre-sale limits
- ✅ Control max allocations
- ✅ Set price ranges
- ✅ Emergency pause
- ✅ Withdraw platform revenue
- ✅ Update all parameters anytime

### Validation:
- ✅ All percentages must add to 100%
- ✅ All values within admin-set ranges
- ✅ Creator pre-buy limited by admin
- ✅ Platform fee always collected
- ✅ Emergency controls available

**Your admin wallet (`86oK...MhpW`) has complete control over the platform!** 🎛️

