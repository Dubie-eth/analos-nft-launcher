use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

/// Maximum rarity tiers
pub const MAX_RARITY_TIERS: usize = 10;

#[program]
pub mod analos_rarity_oracle {
    use super::*;

    /// Initialize rarity configuration for a collection
    pub fn initialize_rarity_config(
        ctx: Context<InitializeRarityConfig>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.rarity_config;
        
        config.collection_config = ctx.accounts.collection_config.key();
        config.authority = ctx.accounts.authority.key();
        config.total_revealed = 0;
        config.is_active = true;
        config.created_at = Clock::get()?.unix_timestamp;
        
        emit!(RarityConfigInitializedEvent {
            collection_config: config.collection_config,
            authority: config.authority,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Rarity config initialized for collection {}", config.collection_config);
        
        Ok(())
    }

    /// Add a rarity tier (Common, Rare, Mythic, etc.)
    pub fn add_rarity_tier(
        ctx: Context<AddRarityTier>,
        tier_id: u8,
        tier_name: String,
        token_multiplier: u64,
        probability_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.rarity_config;
        let tier = &mut ctx.accounts.rarity_tier;
        
        require!(tier_id < MAX_RARITY_TIERS as u8, ErrorCode::InvalidTierId);
        require!(token_multiplier > 0 && token_multiplier <= 1000, ErrorCode::InvalidMultiplier);
        require!(probability_bps > 0 && probability_bps <= 10000, ErrorCode::InvalidProbability);
        
        tier.collection_config = config.collection_config;
        tier.tier_id = tier_id;
        tier.tier_name = tier_name.clone();
        tier.token_multiplier = token_multiplier;
        tier.probability_bps = probability_bps;
        tier.total_count = 0;
        tier.is_active = true;
        tier.created_at = Clock::get()?.unix_timestamp;
        
        emit!(RarityTierAddedEvent {
            collection_config: config.collection_config,
            tier_id,
            tier_name,
            token_multiplier,
            probability_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Rarity tier {} '{}' added: {}x multiplier, {}% probability", 
            tier_id, tier.tier_name, token_multiplier, probability_bps / 100);
        
        Ok(())
    }

    /// Determine rarity for an NFT (called during reveal)
    pub fn determine_rarity(
        ctx: Context<DetermineRarity>,
        nft_mint: Pubkey,
        mint_index: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.rarity_config;
        let determination = &mut ctx.accounts.rarity_determination;
        
        require!(config.is_active, ErrorCode::OracleInactive);
        
        // Generate verifiable randomness
        let clock = Clock::get()?;
        let seed_data = [
            nft_mint.as_ref(),
            &mint_index.to_le_bytes(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
            config.collection_config.as_ref(),
        ].concat();
        
        // Simple hash-based randomness
        let hash = anchor_lang::solana_program::keccak::hash(&seed_data);
        let random_bytes = hash.to_bytes();
        
        // Convert first 8 bytes to u64 for randomness
        let mut random_u64_bytes = [0u8; 8];
        random_u64_bytes.copy_from_slice(&random_bytes[0..8]);
        let random_value = u64::from_le_bytes(random_u64_bytes);
        
        // Map to 0-10000 for probability
        let random_bps = (random_value % 10000) as u16;
        
        // Determine tier based on probability
        let (rarity_tier, token_multiplier) = determine_tier_from_probability(random_bps)?;
        
        determination.nft_mint = nft_mint;
        determination.collection_config = config.collection_config;
        determination.rarity_tier = rarity_tier;
        determination.token_multiplier = token_multiplier;
        determination.random_seed = hash.to_bytes();
        determination.probability_roll = random_bps;
        determination.determined_at = Clock::get()?.unix_timestamp;
        determination.determined_by = ctx.accounts.oracle_authority.key();
        
        config.total_revealed += 1;
        
        emit!(RarityDeterminedEvent {
            nft_mint,
            rarity_tier,
            token_multiplier,
            probability_roll: random_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("NFT {} rarity determined: Tier {} with {}x multiplier", 
            nft_mint, rarity_tier, token_multiplier);
        
        Ok(())
    }

    /// Update rarity tier configuration
    pub fn update_rarity_tier(
        ctx: Context<UpdateRarityTier>,
        tier_id: u8,
        new_probability_bps: Option<u16>,
        new_multiplier: Option<u64>,
    ) -> Result<()> {
        let tier = &mut ctx.accounts.rarity_tier;
        
        require!(tier.tier_id == tier_id, ErrorCode::InvalidTierId);
        
        if let Some(prob) = new_probability_bps {
            require!(prob > 0 && prob <= 10000, ErrorCode::InvalidProbability);
            tier.probability_bps = prob;
        }
        
        if let Some(mult) = new_multiplier {
            require!(mult > 0 && mult <= 1000, ErrorCode::InvalidMultiplier);
            tier.token_multiplier = mult;
        }
        
        emit!(RarityTierUpdatedEvent {
            collection_config: tier.collection_config,
            tier_id,
            new_probability_bps,
            new_multiplier,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Rarity tier {} updated", tier_id);
        
        Ok(())
    }
}

// ========== HELPER FUNCTIONS ==========

/// Determine tier from probability roll
fn determine_tier_from_probability(random_bps: u16) -> Result<(u8, u64)> {
    let (tier, multiplier) = if random_bps < 7000 {
        (0, 1)      // Common: 70%
    } else if random_bps < 8500 {
        (1, 5)      // Uncommon: 15%
    } else if random_bps < 9500 {
        (2, 10)     // Rare: 10%
    } else if random_bps < 9800 {
        (3, 50)     // Epic: 3%
    } else if random_bps < 9950 {
        (4, 100)    // Legendary: 1.5%
    } else {
        (5, 1000)   // Mythic: 0.5%
    };
    
    Ok((tier, multiplier))
}

// ========== ACCOUNT CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeRarityConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RarityConfig::INIT_SPACE,
        seeds = [b"rarity_config", collection_config.key().as_ref()],
        bump
    )]
    pub rarity_config: Account<'info, RarityConfig>,

    /// CHECK: NFT collection config
    pub collection_config: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_id: u8)]
pub struct AddRarityTier<'info> {
    #[account(
        mut,
        seeds = [b"rarity_config", rarity_config.collection_config.as_ref()],
        bump,
        has_one = authority,
    )]
    pub rarity_config: Account<'info, RarityConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + RarityTier::INIT_SPACE,
        seeds = [b"rarity_tier", rarity_config.key().as_ref(), &[tier_id]],
        bump
    )]
    pub rarity_tier: Account<'info, RarityTier>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DetermineRarity<'info> {
    #[account(
        mut,
        seeds = [b"rarity_config", rarity_config.collection_config.as_ref()],
        bump,
    )]
    pub rarity_config: Account<'info, RarityConfig>,

    #[account(
        init,
        payer = oracle_authority,
        space = 8 + RarityDetermination::INIT_SPACE,
        seeds = [b"rarity_determination", rarity_config.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub rarity_determination: Account<'info, RarityDetermination>,

    /// CHECK: NFT mint account
    pub nft_mint: UncheckedAccount<'info>,

    #[account(mut)]
    pub oracle_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_id: u8)]
pub struct UpdateRarityTier<'info> {
    #[account(
        mut,
        seeds = [b"rarity_config", rarity_config.collection_config.as_ref()],
        bump,
        has_one = authority,
    )]
    pub rarity_config: Account<'info, RarityConfig>,

    #[account(
        mut,
        seeds = [b"rarity_tier", rarity_config.key().as_ref(), &[tier_id]],
        bump,
    )]
    pub rarity_tier: Account<'info, RarityTier>,

    pub authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
#[derive(InitSpace)]
pub struct RarityConfig {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub total_revealed: u64,
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RarityTier {
    pub collection_config: Pubkey,
    pub tier_id: u8,
    #[max_len(50)]
    pub tier_name: String,
    pub token_multiplier: u64,
    pub probability_bps: u16,
    pub total_count: u64,
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RarityDetermination {
    pub nft_mint: Pubkey,
    pub collection_config: Pubkey,
    pub rarity_tier: u8,
    pub token_multiplier: u64,
    pub random_seed: [u8; 32],
    pub probability_roll: u16,
    pub determined_at: i64,
    pub determined_by: Pubkey,
}

// ========== EVENTS ==========

#[event]
pub struct RarityConfigInitializedEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RarityTierAddedEvent {
    pub collection_config: Pubkey,
    pub tier_id: u8,
    pub tier_name: String,
    pub token_multiplier: u64,
    pub probability_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct RarityDeterminedEvent {
    pub nft_mint: Pubkey,
    pub rarity_tier: u8,
    pub token_multiplier: u64,
    pub probability_roll: u16,
    pub timestamp: i64,
}

#[event]
pub struct RarityTierUpdatedEvent {
    pub collection_config: Pubkey,
    pub tier_id: u8,
    pub new_probability_bps: Option<u16>,
    pub new_multiplier: Option<u64>,
    pub timestamp: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid tier ID (must be 0-9)")]
    InvalidTierId,
    #[msg("Invalid token multiplier (must be 1-1000)")]
    InvalidMultiplier,
    #[msg("Invalid probability (must be 1-10000)")]
    InvalidProbability,
    #[msg("Oracle is inactive")]
    OracleInactive,
}
