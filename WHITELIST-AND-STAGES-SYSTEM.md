# 🎫 Whitelist Stages & Incremental Pricing

## 🎯 Multi-Stage Launch System

### Stage Types:

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MintStage {
    Closed,           // Not started yet
    Whitelist1,       // Tier 1 whitelist (VIPs, early supporters)
    Whitelist2,       // Tier 2 whitelist (community)
    Whitelist3,       // Tier 3 whitelist (general WL)
    Public,           // Open to everyone
    Ended,            // Minting finished
}

#[account]
#[derive(InitSpace)]
pub struct StageConfig {
    pub stage: MintStage,
    pub price_lamports: u64,              // Price for this stage
    pub max_per_wallet: u64,              // Max NFTs per wallet
    pub max_supply_for_stage: u64,        // Max for this stage
    pub current_minted_in_stage: u64,     // Track stage mints
    pub start_time: i64,                  // When stage starts
    pub end_time: i64,                    // When stage ends
    pub merkle_root: Option<[u8; 32]>,   // For merkle proof verification
}

#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    // ... existing fields ...
    
    // Whitelist & Stages (NEW!)
    pub stages_enabled: bool,
    pub current_stage: MintStage,
    pub whitelist1_config: StageConfig,
    pub whitelist2_config: StageConfig,
    pub whitelist3_config: StageConfig,
    pub public_config: StageConfig,
    
    // Per-wallet tracking
    pub enforce_max_per_wallet: bool,
    
    // ... rest of fields ...
}
```

---

## 📊 Incremental Pricing Example

### Scenario: 10,000 NFT Collection

```
┌────────────────┬──────────┬─────────┬─────────┬──────────┐
│ Stage          │ Supply   │ Price   │ Max/WL  │ Duration │
├────────────────┼──────────┼─────────┼─────────┼──────────┤
│ Whitelist 1    │ 1,000    │ 0.05 LOS│ 5 NFTs  │ 24 hours │
│ (VIP/Early)    │          │         │         │          │
├────────────────┼──────────┼─────────┼─────────┼──────────┤
│ Whitelist 2    │ 2,000    │ 0.08 LOS│ 3 NFTs  │ 24 hours │
│ (Community)    │          │         │         │          │
├────────────────┼──────────┼─────────┼─────────┼──────────┤
│ Whitelist 3    │ 2,000    │ 0.10 LOS│ 2 NFTs  │ 24 hours │
│ (General WL)   │          │         │         │          │
├────────────────┼──────────┼─────────┼─────────┼──────────┤
│ Public         │ 5,000    │ 0.15 LOS│ 1 NFT   │ Open     │
│ (Open Mint)    │          │         │         │          │
└────────────────┴──────────┴─────────┴─────────┴──────────┘

Total: 10,000 NFTs
Revenue: ~1,150 LOS (varies by stage participation)
```

---

## 🔐 Whitelist Verification

### Merkle Tree Proof System:

```rust
pub fn mint_whitelist(
    ctx: Context<MintWhitelist>,
    proof: Vec<[u8; 32]>,         // Merkle proof
    stage: MintStage,             // Which WL tier
) -> Result<()> {
    let config = &ctx.accounts.collection_config;
    let stage_config = get_stage_config(config, stage);
    
    // Verify correct stage is active
    require!(config.current_stage == stage, ErrorCode::InvalidStage);
    
    // Verify time window
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= stage_config.start_time,
        ErrorCode::StageNotStarted
    );
    require!(
        clock.unix_timestamp <= stage_config.end_time,
        ErrorCode::StageEnded
    );
    
    // Verify merkle proof
    let leaf = keccak::hash(ctx.accounts.minter.key().as_ref()).to_bytes();
    require!(
        verify_merkle_proof(proof, stage_config.merkle_root.unwrap(), leaf),
        ErrorCode::InvalidProof
    );
    
    // Check per-wallet limit
    let minter_record = &mut ctx.accounts.minter_record;
    require!(
        minter_record.minted_in_stage < stage_config.max_per_wallet,
        ErrorCode::MaxPerWalletReached
    );
    
    // Check stage supply limit
    require!(
        stage_config.current_minted_in_stage < stage_config.max_supply_for_stage,
        ErrorCode::StageSoldOut
    );
    
    // Transfer payment at STAGE PRICE
    let transfer_ix = system_instruction::transfer(
        ctx.accounts.minter.key,
        &config.key(),
        stage_config.price_lamports,  // Stage-specific price!
    );
    invoke_signed(&transfer_ix, &[...])?;
    
    // Update counters
    config.current_supply += 1;
    stage_config.current_minted_in_stage += 1;
    minter_record.minted_in_stage += 1;
    minter_record.total_minted += 1;
    
    msg!("Minted in {} stage at {} LOS", stage, stage_config.price_lamports);
    Ok(())
}
```

---

## 📅 Stage Management

### Set Up Stages:

```rust
pub fn configure_stages(
    ctx: Context<ConfigureStages>,
    whitelist1: StageConfig,
    whitelist2: StageConfig,
    whitelist3: StageConfig,
    public: StageConfig,
) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    
    // Validate total supply doesn't exceed max
    let total_stage_supply = 
        whitelist1.max_supply_for_stage +
        whitelist2.max_supply_for_stage +
        whitelist3.max_supply_for_stage +
        public.max_supply_for_stage;
    
    require!(
        total_stage_supply <= config.max_supply,
        ErrorCode::StageSupplyExceedsMax
    );
    
    // Validate price progression (each stage should be >= previous)
    require!(
        whitelist2.price_lamports >= whitelist1.price_lamports,
        ErrorCode::InvalidPriceProgression
    );
    
    config.stages_enabled = true;
    config.whitelist1_config = whitelist1;
    config.whitelist2_config = whitelist2;
    config.whitelist3_config = whitelist3;
    config.public_config = public;
    config.current_stage = MintStage::Closed;
    
    Ok(())
}

pub fn advance_stage(
    ctx: Context<ManageStages>,
    next_stage: MintStage,
) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    
    // Only authority can advance stages
    require!(
        ctx.accounts.authority.key() == config.authority,
        ErrorCode::Unauthorized
    );
    
    config.current_stage = next_stage;
    
    emit!(StageAdvancedEvent {
        collection: config.key(),
        new_stage: next_stage,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

---

## 🎨 Creator Launch Wizard UI

### Stage Configuration:

```
┌─────────────────────────────────────────────────────┐
│  Configure Mint Stages                              │
│                                                     │
│  ☑ Enable Staged Launch                            │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  Whitelist 1 (VIP/Early Supporters)       │     │
│  │  Supply: [1000] NFTs                      │     │
│  │  Price: [0.05] LOS                        │     │
│  │  Max per Wallet: [5]                      │     │
│  │  Duration: [24] hours                     │     │
│  │  Upload WL: [whitelist1.csv] 📁          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  Whitelist 2 (Community)                  │     │
│  │  Supply: [2000] NFTs                      │     │
│  │  Price: [0.08] LOS                        │     │
│  │  Max per Wallet: [3]                      │     │
│  │  Duration: [24] hours                     │     │
│  │  Upload WL: [whitelist2.csv] 📁          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  Whitelist 3 (General Whitelist)          │     │
│  │  Supply: [2000] NFTs                      │     │
│  │  Price: [0.10] LOS                        │     │
│  │  Max per Wallet: [2]                      │     │
│  │  Duration: [24] hours                     │     │
│  │  Upload WL: [whitelist3.csv] 📁          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │  Public Sale                               │     │
│  │  Supply: [5000] NFTs (remaining)          │     │
│  │  Price: [0.15] LOS                        │     │
│  │  Max per Wallet: [1]                      │     │
│  │  Duration: Until sold out                 │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [BACK]  [CREATE COLLECTION]                       │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Per-Wallet Tracking

```rust
#[account]
#[derive(InitSpace)]
pub struct MinterRecord {
    pub wallet: Pubkey,
    pub collection_config: Pubkey,
    
    // Per-stage tracking
    pub whitelist1_minted: u64,
    pub whitelist2_minted: u64,
    pub whitelist3_minted: u64,
    pub public_minted: u64,
    pub total_minted: u64,
    
    // Seeds: ["minter_record", collection_config, wallet]
}
```

---

## 🎛️ Admin Can Update Everything

### Via Admin Panel:

```typescript
// Admin updates stage pricing
await adminUpdateStagePrice(
  stage: 'whitelist1',
  newPrice: 0.06  // Increase WL1 price
);

// Admin updates max per wallet
await adminUpdateStageLimit(
  stage: 'public',
  maxPerWallet: 2  // Increase public limit
);

// Admin advances stage manually
await adminAdvanceStage(
  nextStage: 'whitelist2'
);

// Admin pauses current stage
await adminPauseStage(
  reason: "Technical issue, resuming in 1 hour"
);
```

**All controlled by:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW` 🔑

---

## ✅ Summary

**Whitelist Stages:**
- ✅ Up to 3 whitelist tiers + public
- ✅ Each tier has own price
- ✅ Per-wallet limits per stage
- ✅ Time-based activation
- ✅ Merkle proof verification
- ✅ Admin can update all settings

**Incremental Pricing:**
- ✅ Different price per stage
- ✅ Price progression validation
- ✅ Admin can adjust anytime
- ✅ Early supporters get discount

**Admin Controls:**
- ✅ Update prices on the fly
- ✅ Change max per wallet
- ✅ Advance stages manually
- ✅ Pause/resume stages
- ✅ Complete control via admin panel

**Your admin wallet has complete control!** 🎛️

