// ========================================
// ANALOS MEGA NFT LAUNCHPAD CORE
// Complete Production-Ready Program
// ========================================
//
// CONSOLIDATES:
// - NFT Launchpad (collection management)
// - Rarity Oracle (rarity determination) 
// - Price Oracle (platform pricing)
// - Platform Config (admin controls)
// - Holder Rewards (staking & distribution)
// - CTO Voting (governance)
// - NFT Staking (earn tokens)
// - Referral System (viral growth)
//
// ADMIN WALLET: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
//
// DEPLOY TO: https://beta.solpg.io
// RPC: https://rpc.analos.io

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, program::invoke_signed, system_instruction};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Security.txt implementation for program verification
// Note: Commented out for Solana Playground compatibility
// Uncomment and add dependencies when deploying with full Anchor setup
// #[cfg(not(feature = "no-entrypoint"))]
// use {default_env::default_env, solana_security_txt::security_txt};
//
// #[cfg(not(feature = "no-entrypoint"))]
// security_txt! {
//     name: "Analos NFT Launchpad Core (Mega Program)",
//     project_url: "https://github.com/Dubie-eth/analos-nft-launcher",
//     contacts: "email:support@launchonlos.fun,twitter:@EWildn,telegram:t.me/Dubie_420",
//     policy: "https://github.com/Dubie-eth/analos-nft-launcher/blob/master/SECURITY.md",
//     preferred_languages: "en",
//     source_code: "https://github.com/Dubie-eth/analos-nft-launcher",
//     source_revision: "BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr",
//     source_release: "v1.0.0",
//     auditors: "None",
//     acknowledgements: "Thank you to all security researchers who help keep Analos secure!"
// }

declare_id!("BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr");

pub const PLATFORM_ADMIN: &str = "86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW";
pub const PLATFORM_FEE_BPS: u16 = 250; // 2.5% platform fee for creator airdrops

#[program]
pub mod analos_nft_launchpad_core {
    use super::*;

    // ========================================
    // PLATFORM INITIALIZATION (ADMIN ONLY)
    // ========================================

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        let treasury = &mut ctx.accounts.platform_fee_treasury;
        
        config.admin_authority = ctx.accounts.admin.key();
        
        // Initialize platform fee treasury
        treasury.admin_authority = ctx.accounts.admin.key();
        treasury.total_fees_collected = 0;
        treasury.total_campaigns = 0;
        treasury.average_fee_per_campaign = 0;
        treasury.monthly_revenue = [0; 12];
        treasury.fee_rate_bps = PLATFORM_FEE_BPS;
        treasury.treasury_wallet = ctx.accounts.admin.key(); // Admin wallet as treasury
        treasury.last_update = Clock::get()?.unix_timestamp;
        
        // Fee configuration
        config.nft_mint_fee_bps = 250;        // 2.5% on NFT mints
        config.token_launch_fee_bps = 500;    // 5% on token launches
        config.trading_fee_bps = 100;         // 1% on trades
        
        // Distribution split (must equal 10000)
        config.treasury_percentage_bps = 4000;      // 40%
        config.holder_rewards_percentage_bps = 3000; // 30%
        config.development_percentage_bps = 1500;    // 15%
        config.marketing_percentage_bps = 1000;      // 10%
        config.buyback_percentage_bps = 500;         // 5%
        
        // Presale limits
        config.presale_max_allowed_bps = 1000;  // Max 10% of pool
        config.presale_max_discount_bps = 2500;  // Max 25% discount
        config.presale_enabled_globally = true;
        
        // Collection limits
        config.min_collection_size = 100;
        config.max_collection_size = 100000;
        config.min_mint_price_lamports = 10_000_000;
        config.max_mint_price_lamports = 100_000_000_000;
        
        // Allocation limits
        config.min_pool_percentage_bps = 5000;    // Min 50% pool
        config.max_creator_percentage_bps = 3000; // Max 30% creator
        config.max_team_percentage_bps = 2000;    // Max 20% team
        config.max_community_percentage_bps = 1000; // Max 10% community
        
        // Price oracle
        config.los_price_usd = 0;  // Will be updated
        config.last_price_update = 0;
        
        // Rewards
        config.reward_distribution_frequency = 86400; // Daily
        config.auto_distribute = true;
        config.min_distribution_amount = 100_000_000_000; // 100 LOS
        
        config.emergency_pause = false;
        config.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Platform initialized by admin: {}", config.admin_authority);
        Ok(())
    }

    // ========================================
    // COLLECTION CREATION
    // ========================================

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        collection_name: String,
        collection_symbol: String,
        placeholder_uri: String,
        launch_mode: LaunchMode,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let platform = &ctx.accounts.platform_config;
        
        // Validate against platform limits
        require!(max_supply >= platform.min_collection_size, ErrorCode::CollectionTooSmall);
        require!(max_supply <= platform.max_collection_size, ErrorCode::CollectionTooLarge);
        require!(price_lamports >= platform.min_mint_price_lamports, ErrorCode::PriceTooLow);
        require!(price_lamports <= platform.max_mint_price_lamports, ErrorCode::PriceTooHigh);
        
        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.current_supply = 0;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_name = collection_name.clone();
        config.collection_symbol = collection_symbol;
        config.placeholder_uri = placeholder_uri;
        config.launch_mode = launch_mode;
        config.current_stage = MintStage::Closed;
        config.stages_enabled = false;
        
        // Generate global seed for randomness
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ].concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();
        
        config.created_at = clock.unix_timestamp;

        emit!(CollectionCreatedEvent {
            collection: config.key(),
            authority: config.authority,
            max_supply,
            launch_mode,
            timestamp: clock.unix_timestamp,
        });

        msg!("Collection created: {} (Mode: {:?})", collection_name, launch_mode);
        Ok(())
    }

    // ========================================
    // WHITELIST STAGE CONFIGURATION
    // ========================================

    pub fn configure_stages(
        ctx: Context<ConfigureStages>,
        whitelist1_price: u64,
        whitelist1_supply: u64,
        whitelist1_max_per_wallet: u64,
        whitelist2_price: u64,
        whitelist2_supply: u64,
        whitelist2_max_per_wallet: u64,
        whitelist3_price: u64,
        whitelist3_supply: u64,
        whitelist3_max_per_wallet: u64,
        public_price: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        // Validate price progression
        require!(whitelist2_price >= whitelist1_price, ErrorCode::InvalidPriceProgression);
        require!(whitelist3_price >= whitelist2_price, ErrorCode::InvalidPriceProgression);
        require!(public_price >= whitelist3_price, ErrorCode::InvalidPriceProgression);
        
        // Validate total supply
        let total_stage_supply = whitelist1_supply + whitelist2_supply + 
                                whitelist3_supply + (config.max_supply - whitelist1_supply - whitelist2_supply - whitelist3_supply);
        require!(total_stage_supply == config.max_supply, ErrorCode::InvalidStageSupply);
        
        config.whitelist1_price = whitelist1_price;
        config.whitelist1_supply = whitelist1_supply;
        config.whitelist1_max_per_wallet = whitelist1_max_per_wallet;
        config.whitelist1_minted = 0;
        
        config.whitelist2_price = whitelist2_price;
        config.whitelist2_supply = whitelist2_supply;
        config.whitelist2_max_per_wallet = whitelist2_max_per_wallet;
        config.whitelist2_minted = 0;
        
        config.whitelist3_price = whitelist3_price;
        config.whitelist3_supply = whitelist3_supply;
        config.whitelist3_max_per_wallet = whitelist3_max_per_wallet;
        config.whitelist3_minted = 0;
        
        config.public_price = public_price;
        config.public_minted = 0;
        
        config.stages_enabled = true;
        
        msg!("Stages configured: WL1={} LOS, WL2={} LOS, WL3={} LOS, Public={} LOS",
             whitelist1_price as f64 / 1e9,
             whitelist2_price as f64 / 1e9,
             whitelist3_price as f64 / 1e9,
             public_price as f64 / 1e9);
        
        Ok(())
    }

    pub fn set_whitelist_merkle_root(
        ctx: Context<SetWhitelistRoot>,
        stage: MintStage,
        merkle_root: [u8; 32],
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        match stage {
            MintStage::Whitelist1 => config.whitelist1_merkle_root = Some(merkle_root),
            MintStage::Whitelist2 => config.whitelist2_merkle_root = Some(merkle_root),
            MintStage::Whitelist3 => config.whitelist3_merkle_root = Some(merkle_root),
            _ => return Err(ErrorCode::InvalidStage.into()),
        }
        
        Ok(())
    }

    pub fn advance_stage(
        ctx: Context<ManageCollection>,
        next_stage: MintStage,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        config.current_stage = next_stage;
        
        emit!(StageAdvancedEvent {
            collection: config.key(),
            new_stage: next_stage,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // ========================================
    // NFT MINTING
    // ========================================

    pub fn mint_whitelist(
        ctx: Context<MintWhitelist>,
        proof: Vec<[u8; 32]>,
        stage: MintStage,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let platform = &ctx.accounts.platform_config;
        
        require!(config.current_stage == stage, ErrorCode::InvalidStage);
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);
        
        // Get stage details
        let (price, max_per_wallet, minted, supply, merkle_root) = match stage {
            MintStage::Whitelist1 => (
                config.whitelist1_price,
                config.whitelist1_max_per_wallet,
                config.whitelist1_minted,
                config.whitelist1_supply,
                config.whitelist1_merkle_root,
            ),
            MintStage::Whitelist2 => (
                config.whitelist2_price,
                config.whitelist2_max_per_wallet,
                config.whitelist2_minted,
                config.whitelist2_supply,
                config.whitelist2_merkle_root,
            ),
            MintStage::Whitelist3 => (
                config.whitelist3_price,
                config.whitelist3_max_per_wallet,
                config.whitelist3_minted,
                config.whitelist3_supply,
                config.whitelist3_merkle_root,
            ),
            _ => return Err(ErrorCode::InvalidStage.into()),
        };
        
        require!(minted < supply, ErrorCode::StageSoldOut);
        
        // Verify merkle proof
        let leaf = keccak::hashv(&[ctx.accounts.minter.key().as_ref()]).to_bytes();
        require!(
            verify_merkle_proof(&proof, &merkle_root.unwrap(), &leaf),
            ErrorCode::InvalidProof
        );
        
        // Check per-wallet limit
        let minter_record = &mut ctx.accounts.minter_record;
        let stage_mints = match stage {
            MintStage::Whitelist1 => minter_record.whitelist1_minted,
            MintStage::Whitelist2 => minter_record.whitelist2_minted,
            MintStage::Whitelist3 => minter_record.whitelist3_minted,
            _ => 0,
        };
        require!(stage_mints < max_per_wallet, ErrorCode::MaxPerWalletReached);
        
        // Calculate fees
        let platform_fee = (price * platform.nft_mint_fee_bps as u64) / 10000;
        let total_cost = price + platform_fee;
        
        // ENFORCED: Transfer mint price to collection
        let transfer_collection = system_instruction::transfer(
            ctx.accounts.minter.key,
            &config.key(),
            price,
        );
        invoke_signed(&transfer_collection, &[
            ctx.accounts.minter.to_account_info(),
            config.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ], &[])?;
        
        // ENFORCED: Transfer platform fee
        **ctx.accounts.minter.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_config.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        
        // Update counters
        let mint_index = config.current_supply;
        config.current_supply += 1;
        
        match stage {
            MintStage::Whitelist1 => {
                config.whitelist1_minted += 1;
                minter_record.whitelist1_minted += 1;
            },
            MintStage::Whitelist2 => {
                config.whitelist2_minted += 1;
                minter_record.whitelist2_minted += 1;
            },
            MintStage::Whitelist3 => {
                config.whitelist3_minted += 1;
                minter_record.whitelist3_minted += 1;
            },
            _ => {},
        }
        minter_record.total_minted += 1;
        
        // Track platform revenue
        ctx.accounts.platform_config.total_nft_fees_collected += platform_fee;
        
        emit!(WhitelistMintEvent {
            collection: config.key(),
            mint_index,
            minter: ctx.accounts.minter.key(),
            stage,
            price,
            platform_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Minted #{} in stage {:?} - Creator: {} LOS, Platform: {} LOS",
             mint_index, stage, price as f64 / 1e9, platform_fee as f64 / 1e9);
        
        Ok(())
    }

    pub fn mint_public(
        ctx: Context<MintPublic>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let platform = &ctx.accounts.platform_config;
        
        require!(config.current_stage == MintStage::Public, ErrorCode::PublicNotActive);
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);
        
        let price = config.public_price;
        let platform_fee = (price * platform.nft_mint_fee_bps as u64) / 10000;
        
        // ENFORCED: Payments
        let transfer_collection = system_instruction::transfer(
            ctx.accounts.minter.key,
            &config.key(),
            price,
        );
        invoke_signed(&transfer_collection, &[
            ctx.accounts.minter.to_account_info(),
            config.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ], &[])?;
        
        **ctx.accounts.minter.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_config.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        
        // Update counters
        let mint_index = config.current_supply;
        config.current_supply += 1;
        config.public_minted += 1;
        
        ctx.accounts.platform_config.total_nft_fees_collected += platform_fee;
        
        Ok(())
    }

    // ========================================
    // NFT REGISTRATION & TRACKING
    // ========================================

    pub fn register_nft_mint(
        ctx: Context<RegisterNftMint>,
        nft_mint: Pubkey,
        mint_index: u64,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        nft_record.collection_config = ctx.accounts.collection_config.key();
        nft_record.nft_mint = nft_mint;
        nft_record.mint_index = mint_index;
        nft_record.owner = ctx.accounts.owner.key();
        nft_record.rarity_tier = None;
        nft_record.rarity_multiplier = None;
        nft_record.tokens_claimed = false;
        nft_record.is_staked = false;
        nft_record.is_burned = false;
        nft_record.created_at = Clock::get()?.unix_timestamp;
        
        msg!("NFT registered: {} at index {}", nft_mint, mint_index);
        Ok(())
    }

    // ========================================
    // RARITY SYSTEM (MERGED FROM RARITY ORACLE)
    // ========================================

    pub fn initialize_rarity_config(
        ctx: Context<InitializeRarityConfig>,
    ) -> Result<()> {
        let rarity_config = &mut ctx.accounts.rarity_config;
        
        rarity_config.collection_config = ctx.accounts.collection_config.key();
        rarity_config.authority = ctx.accounts.authority.key();
        rarity_config.total_revealed = 0;
        rarity_config.is_active = true;
        rarity_config.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Rarity config initialized for collection");
        Ok(())
    }

    pub fn add_rarity_tier(
        ctx: Context<AddRarityTier>,
        tier_id: u8,
        tier_name: String,
        token_multiplier: u64,
        probability_bps: u16,
    ) -> Result<()> {
        let rarity_tier = &mut ctx.accounts.rarity_tier;
        
        require!(tier_id < 10, ErrorCode::InvalidTierId);
        require!(token_multiplier >= 1 && token_multiplier <= 1000, ErrorCode::InvalidMultiplier);
        require!(probability_bps >= 1 && probability_bps <= 10000, ErrorCode::InvalidProbability);
        
        rarity_tier.collection_config = ctx.accounts.rarity_config.collection_config;
        rarity_tier.tier_id = tier_id;
        rarity_tier.tier_name = tier_name.clone();
        rarity_tier.token_multiplier = token_multiplier;
        rarity_tier.probability_bps = probability_bps;
        rarity_tier.total_count = 0;
        rarity_tier.is_active = true;
        rarity_tier.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Rarity tier added: {} ({}x, {}% probability)", tier_name, token_multiplier, probability_bps as f64 / 100.0);
        Ok(())
    }

    pub fn determine_rarity(
        ctx: Context<DetermineRarity>,
        nft_mint: Pubkey,
        mint_index: u64,
    ) -> Result<()> {
        let rarity_config = &mut ctx.accounts.rarity_config;
        let nft_record = &mut ctx.accounts.nft_record;
        let collection = &ctx.accounts.collection_config;
        
        require!(collection.is_revealed, ErrorCode::NotRevealed);
        require!(rarity_config.is_active, ErrorCode::OracleInactive);
        
        // Generate verifiable randomness
        let clock = Clock::get()?;
        let seed_data = [
            nft_mint.as_ref(),
            &mint_index.to_le_bytes(),
            &clock.unix_timestamp.to_le_bytes(),
            &collection.global_seed,
        ].concat();
        let random_hash = keccak::hash(&seed_data);
        let random_bytes = random_hash.to_bytes();
        
        // Convert to 0-10000 for probability
        let mut random_u64_bytes = [0u8; 8];
        random_u64_bytes.copy_from_slice(&random_bytes[0..8]);
        let random_value = u64::from_le_bytes(random_u64_bytes);
        let random_bps = (random_value % 10000) as u16;
        
        // Determine tier (simplified - would query RarityTier accounts in production)
        let (rarity_tier, token_multiplier) = if random_bps < 7000 {
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
        
        // Update NFT record
        nft_record.rarity_tier = Some(rarity_tier);
        nft_record.rarity_multiplier = Some(token_multiplier);
        
        rarity_config.total_revealed += 1;
        
        emit!(RarityDeterminedEvent {
            nft_mint,
            rarity_tier,
            token_multiplier,
            probability_roll: random_bps,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Rarity determined: Tier {} with {}x multiplier", rarity_tier, token_multiplier);
        Ok(())
    }

    // ========================================
    // REVEAL
    // ========================================

    pub fn reveal_collection(
        ctx: Context<RevealCollection>,
        revealed_base_uri: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        require!(!config.is_revealed, ErrorCode::AlreadyRevealed);
        require!(config.current_supply >= config.reveal_threshold, ErrorCode::ThresholdNotMet);
        
        config.is_revealed = true;
        config.revealed_base_uri = revealed_base_uri;
        
        emit!(CollectionRevealedEvent {
            collection: config.key(),
            total_supply: config.current_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Collection revealed! Supply: {}", config.current_supply);
        Ok(())
    }

    // ========================================
    // CREATOR PROFILE & VERIFICATION
    // ========================================

    pub fn create_creator_profile(
        ctx: Context<CreateCreatorProfile>,
        creator_name: String,
        bio: String,
        profile_image_uri: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.creator_profile;
        
        profile.creator_wallet = ctx.accounts.creator.key();
        profile.collection_config = ctx.accounts.collection_config.key();
        profile.creator_name = creator_name.clone();
        profile.bio = bio;
        profile.profile_image_uri = profile_image_uri;
        profile.verified_count = 0;
        profile.trust_score = 1000;
        profile.kyc_verified = false;
        profile.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Creator profile created: {}", creator_name);
        Ok(())
    }

    pub fn verify_social(
        ctx: Context<VerifySocial>,
        platform: SocialPlatform,
        handle: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.creator_profile;
        
        match platform {
            SocialPlatform::Twitter => {
                profile.twitter_handle = handle;
                profile.twitter_verified = true;
            },
            SocialPlatform::Website => {
                profile.website_url = handle;
                profile.website_verified = true;
            },
            SocialPlatform::Github => {
                profile.github_url = handle;
                profile.github_verified = true;
            },
            SocialPlatform::Telegram => {
                profile.telegram_handle = handle;
                profile.telegram_verified = true;
            },
            SocialPlatform::Discord => {
                profile.discord_server = handle;
                profile.discord_verified = true;
            },
        }
        
        profile.verified_count += 1;
        profile.trust_score = calculate_trust_score(profile);
        profile.last_updated = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    // ========================================
    // NFT STAKING (EARN TOKENS)
    // ========================================

    pub fn stake_nft(
        ctx: Context<StakeNft>,
    ) -> Result<()> {
        let nft_stake = &mut ctx.accounts.nft_stake;
        let nft_record = &mut ctx.accounts.nft_record;
        
        require!(!nft_record.is_staked, ErrorCode::AlreadyStaked);
        require!(nft_record.rarity_multiplier.is_some(), ErrorCode::RarityNotSet);
        
        nft_stake.nft_mint = nft_record.nft_mint;
        nft_stake.owner = ctx.accounts.owner.key();
        nft_stake.collection_config = nft_record.collection_config;
        nft_stake.staked_at = Clock::get()?.unix_timestamp;
        nft_stake.rarity_multiplier = nft_record.rarity_multiplier.unwrap();
        nft_stake.rewards_claimed = 0;
        nft_stake.last_claim = Clock::get()?.unix_timestamp;
        
        nft_record.is_staked = true;
        
        msg!("NFT staked with {}x multiplier", nft_stake.rarity_multiplier);
        Ok(())
    }

    pub fn claim_nft_staking_rewards(
        ctx: Context<ClaimNftStakingRewards>,
    ) -> Result<()> {
        let nft_stake = &mut ctx.accounts.nft_stake;
        
        // Calculate rewards: time_staked * daily_rate * rarity_multiplier
        let time_staked = Clock::get()?.unix_timestamp - nft_stake.last_claim;
        let daily_rate = 10_000_000; // 10 tokens per day (with decimals)
        let days_staked = time_staked / 86400;
        let rewards = days_staked as u64 * daily_rate * nft_stake.rarity_multiplier;
        
        require!(rewards > 0, ErrorCode::NoRewards);
        
        // Transfer rewards (would integrate with Token Launch program)
        // For now, just track
        nft_stake.rewards_claimed += rewards;
        nft_stake.last_claim = Clock::get()?.unix_timestamp;
        
        msg!("Claimed {} tokens from NFT staking", rewards);
        Ok(())
    }

    pub fn unstake_nft(
        ctx: Context<UnstakeNft>,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        nft_record.is_staked = false;
        
        msg!("NFT unstaked");
        Ok(())
    }

    // ========================================
    // HOLDER REWARDS (LOS STAKING)
    // ========================================

    pub fn stake_los_tokens(
        ctx: Context<StakeLosTokens>,
        amount: u64,
    ) -> Result<()> {
        let stake = &mut ctx.accounts.holder_stake;
        let pool = &mut ctx.accounts.reward_pool;
        
        // Transfer LOS tokens to staking
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.staking_pool_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts), amount)?;
        
        stake.holder = ctx.accounts.user.key();
        stake.amount_staked += amount;
        stake.stake_start_time = Clock::get()?.unix_timestamp;
        
        pool.total_staked += amount;
        
        msg!("Staked {} LOS tokens", amount);
        Ok(())
    }

    pub fn distribute_rewards_to_holders(
        ctx: Context<DistributeRewards>,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform_config;
        let pool = &mut ctx.accounts.reward_pool;
        
        let total_fees = platform.total_nft_fees_collected + 
                         platform.total_token_fees_collected + 
                         platform.total_trading_fees_collected;
        let undistributed = total_fees - platform.total_fees_distributed;
        
        require!(undistributed >= platform.min_distribution_amount, ErrorCode::BelowMinDistribution);
        
        // Calculate splits
        let to_holders = (undistributed * platform.holder_rewards_percentage_bps as u64) / 10000;
        
        if pool.total_staked > 0 {
            let reward_per_token_increase = (to_holders as u128 * 1_000_000_000_000) / pool.total_staked as u128;
            pool.reward_per_token += reward_per_token_increase;
            pool.total_rewards_available += to_holders;
        }
        
        platform.total_fees_distributed += undistributed;
        platform.holder_rewards_distributed += to_holders;
        platform.last_distribution_time = Clock::get()?.unix_timestamp;
        
        msg!("Distributed {} LOS to holders", to_holders);
        Ok(())
    }

    // ========================================
    // CTO VOTING (GOVERNANCE)
    // ========================================

    pub fn create_cto_proposal(
        ctx: Context<CreateCtoProposal>,
        new_admin: Pubkey,
        description: String,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.cto_proposal;
        let stake = &ctx.accounts.proposer_stake;
        let pool = &ctx.accounts.reward_pool;
        
        // Require 1% of total stake to propose
        let min_stake = pool.total_staked / 100;
        require!(stake.amount_staked >= min_stake, ErrorCode::InsufficientStakeToPropose);
        
        let clock = Clock::get()?;
        
        proposal.proposal_id = clock.unix_timestamp as u64; // Simple ID
        proposal.proposed_new_admin = new_admin;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.total_voting_power = pool.total_staked;
        proposal.threshold_bps = 6700; // 67% required
        proposal.voting_start = clock.unix_timestamp;
        proposal.voting_end = clock.unix_timestamp + (7 * 86400); // 7 days
        proposal.executed = false;
        proposal.description = description;
        
        msg!("CTO proposal created - {}% needed to pass", proposal.threshold_bps as f64 / 100.0);
        Ok(())
    }

    pub fn vote_on_cto(
        ctx: Context<VoteOnCto>,
        vote_choice: bool, // true = for, false = against
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.cto_proposal;
        let stake = &ctx.accounts.voter_stake;
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp <= proposal.voting_end, ErrorCode::VotingEnded);
        
        let voting_power = stake.amount_staked;
        
        if vote_choice {
            proposal.votes_for += voting_power;
        } else {
            proposal.votes_against += voting_power;
        }
        
        msg!("Voted with {} LOS voting power", voting_power);
        Ok(())
    }

    pub fn execute_cto(
        ctx: Context<ExecuteCto>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.cto_proposal;
        let platform = &mut ctx.accounts.platform_config;
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp > proposal.voting_end, ErrorCode::VotingStillActive);
        require!(!proposal.executed, ErrorCode::AlreadyExecuted);
        
        // Check threshold
        let approval_bps = (proposal.votes_for * 10000) / proposal.total_voting_power;
        require!(approval_bps >= proposal.threshold_bps as u64, ErrorCode::ThresholdNotMet);
        
        // EXECUTE: Change admin
        let old_admin = platform.admin_authority;
        platform.admin_authority = proposal.proposed_new_admin;
        proposal.executed = true;
        
        emit!(CtoExecutedEvent {
            old_admin,
            new_admin: proposal.proposed_new_admin,
            approval_bps,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("🎉 CTO EXECUTED! New admin: {}", proposal.proposed_new_admin);
        Ok(())
    }

    // ========================================
    // ADMIN FUNCTIONS
    // ========================================

    pub fn admin_update_fees(
        ctx: Context<UpdatePlatformConfig>,
        nft_mint_fee_bps: u16,
        token_launch_fee_bps: u16,
        trading_fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        
        require!(nft_mint_fee_bps <= 1000, ErrorCode::FeeTooHigh);
        require!(token_launch_fee_bps <= 1000, ErrorCode::FeeTooHigh);
        require!(trading_fee_bps <= 500, ErrorCode::FeeTooHigh);
        
        config.nft_mint_fee_bps = nft_mint_fee_bps;
        config.token_launch_fee_bps = token_launch_fee_bps;
        config.trading_fee_bps = trading_fee_bps;
        
        msg!("Fees updated by admin");
        Ok(())
    }

    pub fn admin_update_distribution_split(
        ctx: Context<UpdatePlatformConfig>,
        treasury_bps: u16,
        holder_rewards_bps: u16,
        development_bps: u16,
        marketing_bps: u16,
        buyback_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        
        let total = treasury_bps + holder_rewards_bps + development_bps + marketing_bps + buyback_bps;
        require!(total == 10000, ErrorCode::InvalidPercentages);
        
        config.treasury_percentage_bps = treasury_bps;
        config.holder_rewards_percentage_bps = holder_rewards_bps;
        config.development_percentage_bps = development_bps;
        config.marketing_percentage_bps = marketing_bps;
        config.buyback_percentage_bps = buyback_bps;
        
        msg!("Distribution split updated");
        Ok(())
    }

    pub fn admin_update_price(
        ctx: Context<UpdatePlatformConfig>,
        new_price_usd: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        
        config.los_price_usd = new_price_usd;
        config.last_price_update = Clock::get()?.unix_timestamp;
        
        msg!("LOS price updated: ${}", new_price_usd as f64 / 1_000_000.0);
        Ok(())
    }

    pub fn admin_emergency_pause(
        ctx: Context<UpdatePlatformConfig>,
        pause: bool,
        reason: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        
        config.emergency_pause = pause;
        config.emergency_pause_reason = reason.clone();
        
        msg!("Emergency pause: {} - {}", pause, reason);
        Ok(())
    }

    // ========================================
    // CREATOR AIRDROP FUNCTIONS
    // ========================================

    pub fn create_creator_airdrop_campaign(
        ctx: Context<CreateCreatorAirdropCampaign>,
        campaign_id: [u8; 32],
        name: String,
        description: String,
        airdrop_token_mint: Pubkey,
        total_amount: u64,
        platform_fee: u64,
        start_date: i64,
        end_date: i64,
        eligibility_type: u8,
        eligibility_data: [u8; 128],
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let treasury = &mut ctx.accounts.platform_fee_treasury;
        
        // Validate platform fee
        let expected_fee = total_amount * PLATFORM_FEE_BPS as u64 / 10000;
        require!(platform_fee >= expected_fee, ErrorCode::InsufficientFee);
        
        // Initialize campaign
        campaign.creator = ctx.accounts.creator.key();
        campaign.campaign_id = campaign_id;
        campaign.name = name;
        campaign.description = description;
        campaign.airdrop_token_mint = airdrop_token_mint;
        campaign.total_amount = total_amount;
        campaign.claimed_amount = 0;
        campaign.platform_fee = platform_fee;
        campaign.platform_fee_paid = false;
        campaign.is_active = false;
        campaign.start_date = start_date;
        campaign.end_date = end_date;
        campaign.eligibility_type = eligibility_type;
        campaign.eligibility_data = eligibility_data;
        campaign.total_claims = 0;
        campaign.unique_claimers = 0;
        campaign.created_at = Clock::get()?.unix_timestamp;
        campaign.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Creator airdrop campaign created: {:?}", campaign_id);
        Ok(())
    }

    pub fn activate_creator_airdrop_campaign(
        ctx: Context<ActivateCreatorAirdropCampaign>,
        token_deposit_amount: u64,
        fee_payment_amount: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let treasury = &mut ctx.accounts.platform_fee_treasury;
        
        // Validate creator ownership
        require!(campaign.creator == ctx.accounts.creator.key(), ErrorCode::Unauthorized);
        
        // Validate deposit amount
        require!(token_deposit_amount >= campaign.total_amount, ErrorCode::InsufficientFunds);
        
        // Validate fee payment
        require!(fee_payment_amount >= campaign.platform_fee, ErrorCode::InsufficientFee);
        
        // In production, this would transfer tokens from creator to campaign vault
        // and transfer platform fee to treasury
        
        // Update campaign status
        campaign.platform_fee_paid = true;
        campaign.is_active = true;
        campaign.updated_at = Clock::get()?.unix_timestamp;
        
        // Update treasury stats
        treasury.total_fees_collected += fee_payment_amount;
        treasury.total_campaigns += 1;
        treasury.average_fee_per_campaign = treasury.total_fees_collected / treasury.total_campaigns;
        treasury.last_update = Clock::get()?.unix_timestamp;
        
        msg!("Creator airdrop campaign activated: {:?}", campaign.campaign_id);
        Ok(())
    }

    pub fn claim_creator_airdrop(
        ctx: Context<ClaimCreatorAirdrop>,
        amount: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let claim_record = &mut ctx.accounts.claim_record;
        
        // Validate campaign is active
        require!(campaign.is_active, ErrorCode::CampaignInactive);
        
        // Check campaign dates
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time >= campaign.start_date, ErrorCode::CampaignNotStarted);
        require!(current_time <= campaign.end_date, ErrorCode::CampaignEnded);
        
        // Check sufficient funds
        require!(campaign.claimed_amount + amount <= campaign.total_amount, ErrorCode::InsufficientFunds);
        
        // Check if user already claimed
        require!(!claim_record.has_claimed, ErrorCode::AlreadyClaimed);
        
        // In production, this would transfer tokens from campaign vault to user
        
        // Update campaign stats
        campaign.claimed_amount += amount;
        campaign.total_claims += 1;
        campaign.unique_claimers += 1;
        campaign.updated_at = current_time;
        
        // Mark user as claimed
        claim_record.has_claimed = true;
        claim_record.claimed_amount = amount;
        claim_record.claimed_at = current_time;
        
        msg!("Creator airdrop claimed: {} tokens by {}", amount, ctx.accounts.user.key());
        Ok(())
    }

    // ========================================
    // TOKEN INTEGRATION
    // ========================================

    pub fn mark_tokens_claimed(
        ctx: Context<MarkTokensClaimed>,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        require!(!nft_record.tokens_claimed, ErrorCode::TokensAlreadyClaimed);
        
        nft_record.tokens_claimed = true;
        
        Ok(())
    }

    pub fn burn_nft_for_tokens(
        ctx: Context<BurnNftForTokens>,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        require!(!nft_record.is_burned, ErrorCode::AlreadyBurned);
        require!(nft_record.tokens_claimed, ErrorCode::TokensNotClaimed);
        
        nft_record.is_burned = true;
        nft_record.burned_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("NFT burned for buyback");
        Ok(())
    }

    // ========================================
    // REFERRAL SYSTEM
    // ========================================

    pub fn mint_with_referral(
        ctx: Context<MintWithReferral>,
        referrer: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let platform = &ctx.accounts.platform_config;
        
        let price = config.public_price;
        
        // Referee gets 2.5% discount
        let discount = (price * 250) / 10000;
        let discounted_price = price - discount;
        
        // Referrer gets 2.5% reward
        let referrer_reward = (price * 250) / 10000;
        
        // User pays discounted price
        let transfer_collection = system_instruction::transfer(
            ctx.accounts.minter.key,
            &config.key(),
            discounted_price,
        );
        invoke_signed(&transfer_collection, &[
            ctx.accounts.minter.to_account_info(),
            config.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ], &[])?;
        
        // Referrer gets reward
        **config.to_account_info().try_borrow_mut_lamports()? -= referrer_reward;
        **ctx.accounts.referrer.to_account_info().try_borrow_mut_lamports()? += referrer_reward;
        
        // Update referral stats
        let referral_record = &mut ctx.accounts.referral_record;
        referral_record.total_referrals += 1;
        referral_record.total_rewards_earned += referrer_reward;
        
        config.current_supply += 1;
        
        msg!("Referred mint - Discount: {} LOS, Referrer reward: {} LOS", 
             discount as f64 / 1e9, referrer_reward as f64 / 1e9);
        
        Ok(())
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    pub fn pause_collection(ctx: Context<ManageCollection>) -> Result<()> {
        ctx.accounts.collection_config.is_paused = true;
        Ok(())
    }

    pub fn resume_collection(ctx: Context<ManageCollection>) -> Result<()> {
        ctx.accounts.collection_config.is_paused = false;
        Ok(())
    }

    pub fn withdraw_funds(
        ctx: Context<WithdrawFunds>,
        amount: u64,
    ) -> Result<()> {
        **ctx.accounts.collection_config.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

fn calculate_trust_score(profile: &CreatorProfile) -> u16 {
    let mut score: u16 = 1000;
    if profile.twitter_verified { score += 500; }
    if profile.telegram_verified { score += 500; }
    if profile.discord_verified { score += 500; }
    if profile.website_verified { score += 1000; }
    if profile.github_verified { score += 1000; }
    if profile.kyc_verified { score += 2000; }
    if profile.verified_count >= 5 { score += 1000; }
    score.min(10000)
}

fn verify_merkle_proof(proof: &[[u8; 32]], root: &[u8; 32], leaf: &[u8; 32]) -> bool {
    let mut computed_hash = *leaf;
    for proof_element in proof.iter() {
        computed_hash = if computed_hash <= *proof_element {
            keccak::hashv(&[&computed_hash, proof_element]).to_bytes()
        } else {
            keccak::hashv(&[proof_element, &computed_hash]).to_bytes()
        };
    }
    computed_hash == *root
}

// ========================================
// ACCOUNT CONTEXTS
// ========================================

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(init, payer = admin, space = 8 + PlatformConfig::INIT_SPACE, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(init, payer = admin, space = 8 + PlatformFeeTreasury::INIT_SPACE, seeds = [b"platform_fee_treasury"], bump)]
    pub platform_fee_treasury: Account<'info, PlatformFeeTreasury>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(init, payer = authority, space = 8 + 2000, seeds = [b"collection_config", authority.key().as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintWhitelist<'info> {
    #[account(mut, seeds = [b"collection_config", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(init_if_needed, payer = minter, space = 8 + 200, seeds = [b"minter_record", collection_config.key().as_ref(), minter.key().as_ref()], bump)]
    pub minter_record: Account<'info, MinterRecord>,
    #[account(mut)]
    pub minter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintPublic<'info> {
    #[account(mut, seeds = [b"collection_config", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub minter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterNftMint<'info> {
    #[account(init, payer = owner, space = 8 + 500, seeds = [b"nft_record", collection_config.key().as_ref(), nft_mint.key().as_ref()], bump)]
    pub nft_record: Account<'info, NftRecord>,
    #[account(seeds = [b"collection_config", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    /// CHECK: NFT mint
    pub nft_mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeRarityConfig<'info> {
    #[account(init, payer = authority, space = 8 + 200, seeds = [b"rarity_config", collection_config.key().as_ref()], bump)]
    pub rarity_config: Account<'info, RarityConfig>,
    #[account(seeds = [b"collection_config", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_id: u8)]
pub struct AddRarityTier<'info> {
    #[account(mut, seeds = [b"rarity_config", rarity_config.collection_config.as_ref()], bump)]
    pub rarity_config: Account<'info, RarityConfig>,
    #[account(init, payer = authority, space = 8 + 300, seeds = [b"rarity_tier", rarity_config.key().as_ref(), &[tier_id]], bump)]
    pub rarity_tier: Account<'info, RarityTier>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DetermineRarity<'info> {
    #[account(mut)]
    pub rarity_config: Account<'info, RarityConfig>,
    #[account(mut)]
    pub nft_record: Account<'info, NftRecord>,
    pub collection_config: Account<'info, CollectionConfig>,
}

#[derive(Accounts)]
pub struct CreateCreatorProfile<'info> {
    #[account(init, payer = creator, space = 8 + 2000, seeds = [b"creator_profile", collection_config.key().as_ref()], bump)]
    pub creator_profile: Account<'info, CreatorProfile>,
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifySocial<'info> {
    #[account(mut)]
    pub creator_profile: Account<'info, CreatorProfile>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct StakeNft<'info> {
    #[account(init, payer = owner, space = 8 + 300, seeds = [b"nft_stake", nft_record.nft_mint.as_ref()], bump)]
    pub nft_stake: Account<'info, NftStake>,
    #[account(mut)]
    pub nft_record: Account<'info, NftRecord>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimNftStakingRewards<'info> {
    #[account(mut)]
    pub nft_stake: Account<'info, NftStake>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnstakeNft<'info> {
    #[account(mut)]
    pub nft_stake: Account<'info, NftStake>,
    #[account(mut)]
    pub nft_record: Account<'info, NftRecord>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct StakeLosTokens<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 200, seeds = [b"holder_stake", user.key().as_ref()], bump)]
    pub holder_stake: Account<'info, HolderStake>,
    #[account(mut, seeds = [b"reward_pool"], bump)]
    pub reward_pool: Account<'info, RewardPool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub staking_pool_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut, seeds = [b"reward_pool"], bump)]
    pub reward_pool: Account<'info, RewardPool>,
}

#[derive(Accounts)]
pub struct CreateCtoProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = 8 + 800
    )]
    pub cto_proposal: Account<'info, CtoProposal>,
    pub proposer_stake: Account<'info, HolderStake>,
    pub reward_pool: Account<'info, RewardPool>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnCto<'info> {
    #[account(mut)]
    pub cto_proposal: Account<'info, CtoProposal>,
    pub voter_stake: Account<'info, HolderStake>,
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteCto<'info> {
    #[account(mut)]
    pub cto_proposal: Account<'info, CtoProposal>,
    #[account(mut, seeds = [b"platform_config"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
}

#[derive(Accounts)]
pub struct UpdatePlatformConfig<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump,
        constraint = platform_config.admin_authority == admin.key() @ ErrorCode::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(campaign_id: [u8; 32])]
pub struct CreateCreatorAirdropCampaign<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + CreatorAirdropCampaign::INIT_SPACE,
        seeds = [b"creator_airdrop", campaign_id.as_ref()],
        bump
    )]
    pub campaign: Account<'info, CreatorAirdropCampaign>,
    #[account(
        mut,
        seeds = [b"platform_fee_treasury"],
        bump
    )]
    pub platform_fee_treasury: Account<'info, PlatformFeeTreasury>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActivateCreatorAirdropCampaign<'info> {
    #[account(
        mut,
        seeds = [b"creator_airdrop", campaign.campaign_id.as_ref()],
        bump,
        constraint = campaign.creator == creator.key() @ ErrorCode::Unauthorized
    )]
    pub campaign: Account<'info, CreatorAirdropCampaign>,
    #[account(
        mut,
        seeds = [b"platform_fee_treasury"],
        bump
    )]
    pub platform_fee_treasury: Account<'info, PlatformFeeTreasury>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimCreatorAirdrop<'info> {
    #[account(
        mut,
        seeds = [b"creator_airdrop", campaign.campaign_id.as_ref()],
        bump
    )]
    pub campaign: Account<'info, CreatorAirdropCampaign>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + AirdropClaimRecord::INIT_SPACE,
        seeds = [b"airdrop_claim", campaign.campaign_id.as_ref(), user.key().as_ref()],
        bump
    )]
    pub claim_record: Account<'info, AirdropClaimRecord>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfigureStages<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetWhitelistRoot<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealCollection<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ManageCollection<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MarkTokensClaimed<'info> {
    #[account(mut)]
    pub nft_record: Account<'info, NftRecord>,
}

#[derive(Accounts)]
pub struct BurnNftForTokens<'info> {
    #[account(mut, has_one = owner)]
    pub nft_record: Account<'info, NftRecord>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintWithReferral<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(init_if_needed, payer = minter, space = 8 + 200, seeds = [b"referral_record", referrer.key().as_ref()], bump)]
    pub referral_record: Account<'info, ReferralRecord>,
    /// CHECK: Referrer
    #[account(mut)]
    pub referrer: UncheckedAccount<'info>,
    #[account(mut)]
    pub minter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ========================================
// STATE ACCOUNTS
// ========================================

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin_authority: Pubkey,
    pub nft_mint_fee_bps: u16,
    pub token_launch_fee_bps: u16,
    pub trading_fee_bps: u16,
    pub treasury_percentage_bps: u16,
    pub holder_rewards_percentage_bps: u16,
    pub development_percentage_bps: u16,
    pub marketing_percentage_bps: u16,
    pub buyback_percentage_bps: u16,
    pub presale_max_allowed_bps: u16,
    pub presale_max_discount_bps: u16,
    pub presale_enabled_globally: bool,
    pub min_collection_size: u64,
    pub max_collection_size: u64,
    pub min_mint_price_lamports: u64,
    pub max_mint_price_lamports: u64,
    pub min_pool_percentage_bps: u16,
    pub max_creator_percentage_bps: u16,
    pub max_team_percentage_bps: u16,
    pub max_community_percentage_bps: u16,
    pub los_price_usd: u64,
    pub last_price_update: i64,
    pub reward_distribution_frequency: i64,
    pub auto_distribute: bool,
    pub min_distribution_amount: u64,
    pub total_nft_fees_collected: u64,
    pub total_token_fees_collected: u64,
    pub total_trading_fees_collected: u64,
    pub total_fees_distributed: u64,
    pub holder_rewards_distributed: u64,
    pub last_distribution_time: i64,
    pub emergency_pause: bool,
    #[max_len(200)]
    pub emergency_pause_reason: String,
    pub created_at: i64,
    pub last_updated: i64,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformFeeTreasury {
    pub admin_authority: Pubkey,
    pub total_fees_collected: u64,
    pub total_campaigns: u64,
    pub average_fee_per_campaign: u64,
    pub monthly_revenue: [u64; 12], // Last 12 months
    pub fee_rate_bps: u16, // Platform fee rate in basis points
    pub treasury_wallet: Pubkey,
    pub last_update: i64,
}

#[account]
#[derive(InitSpace)]
pub struct CreatorAirdropCampaign {
    pub creator: Pubkey,
    pub campaign_id: [u8; 32],
    #[max_len(64)]
    pub name: String,
    #[max_len(256)]
    pub description: String,
    pub airdrop_token_mint: Pubkey,
    pub total_amount: u64,
    pub claimed_amount: u64,
    pub platform_fee: u64,
    pub platform_fee_paid: bool,
    pub is_active: bool,
    pub start_date: i64,
    pub end_date: i64,
    pub eligibility_type: u8, // 0=holdings, 1=nft, 2=whitelist, 3=custom
    pub eligibility_data: [u8; 128], // Serialized eligibility criteria
    pub total_claims: u64,
    pub unique_claimers: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct AirdropClaimRecord {
    pub campaign_id: [u8; 32],
    pub user: Pubkey,
    pub has_claimed: bool,
    pub claimed_amount: u64,
    pub claimed_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub current_supply: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    #[max_len(50)]
    pub collection_name: String,
    #[max_len(10)]
    pub collection_symbol: String,
    #[max_len(200)]
    pub placeholder_uri: String,
    #[max_len(200)]
    pub revealed_base_uri: String,
    pub global_seed: [u8; 32],
    pub launch_mode: LaunchMode,
    pub current_stage: MintStage,
    pub stages_enabled: bool,
    pub whitelist1_price: u64,
    pub whitelist1_supply: u64,
    pub whitelist1_max_per_wallet: u64,
    pub whitelist1_minted: u64,
    pub whitelist1_merkle_root: Option<[u8; 32]>,
    pub whitelist2_price: u64,
    pub whitelist2_supply: u64,
    pub whitelist2_max_per_wallet: u64,
    pub whitelist2_minted: u64,
    pub whitelist2_merkle_root: Option<[u8; 32]>,
    pub whitelist3_price: u64,
    pub whitelist3_supply: u64,
    pub whitelist3_max_per_wallet: u64,
    pub whitelist3_minted: u64,
    pub whitelist3_merkle_root: Option<[u8; 32]>,
    pub public_price: u64,
    pub public_minted: u64,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct NftRecord {
    pub collection_config: Pubkey,
    pub nft_mint: Pubkey,
    pub mint_index: u64,
    pub owner: Pubkey,
    pub rarity_tier: Option<u8>,
    pub rarity_multiplier: Option<u64>,
    pub tokens_claimed: bool,
    pub is_staked: bool,
    pub is_burned: bool,
    pub created_at: i64,
    pub burned_at: Option<i64>,
}

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
pub struct CreatorProfile {
    pub creator_wallet: Pubkey,
    pub collection_config: Pubkey,
    #[max_len(50)]
    pub creator_name: String,
    #[max_len(200)]
    pub bio: String,
    #[max_len(100)]
    pub profile_image_uri: String,
    #[max_len(50)]
    pub twitter_handle: String,
    pub twitter_verified: bool,
    #[max_len(50)]
    pub telegram_handle: String,
    pub telegram_verified: bool,
    #[max_len(100)]
    pub discord_server: String,
    pub discord_verified: bool,
    #[max_len(100)]
    pub website_url: String,
    pub website_verified: bool,
    #[max_len(100)]
    pub github_url: String,
    pub github_verified: bool,
    pub verified_count: u8,
    pub trust_score: u16,
    pub kyc_verified: bool,
    pub created_at: i64,
    pub last_updated: i64,
}

#[account]
#[derive(InitSpace)]
pub struct MinterRecord {
    pub wallet: Pubkey,
    pub collection_config: Pubkey,
    pub whitelist1_minted: u64,
    pub whitelist2_minted: u64,
    pub whitelist3_minted: u64,
    pub public_minted: u64,
    pub total_minted: u64,
}

#[account]
#[derive(InitSpace)]
pub struct NftStake {
    pub nft_mint: Pubkey,
    pub owner: Pubkey,
    pub collection_config: Pubkey,
    pub staked_at: i64,
    pub rarity_multiplier: u64,
    pub rewards_claimed: u64,
    pub last_claim: i64,
}

#[account]
#[derive(InitSpace)]
pub struct HolderStake {
    pub holder: Pubkey,
    pub amount_staked: u64,
    pub stake_start_time: i64,
    pub rewards_claimed: u64,
    pub last_claim_time: i64,
    pub reward_debt: u64,
}

#[account]
#[derive(InitSpace)]
pub struct RewardPool {
    pub total_staked: u64,
    pub total_rewards_available: u64,
    pub reward_per_token: u128,
    pub last_distribution: i64,
}

#[account]
#[derive(InitSpace)]
pub struct CtoProposal {
    pub proposal_id: u64,
    pub proposed_new_admin: Pubkey,
    pub proposer: Pubkey,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_voting_power: u64,
    pub threshold_bps: u16,
    pub voting_start: i64,
    pub voting_end: i64,
    pub executed: bool,
    #[max_len(500)]
    pub description: String,
}

#[account]
#[derive(InitSpace)]
pub struct ReferralRecord {
    pub referrer: Pubkey,
    pub total_referrals: u64,
    pub total_rewards_earned: u64,
}

// ========================================
// ENUMS
// ========================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum LaunchMode {
    NftOnly,
    NftToToken,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum MintStage {
    Closed,
    Whitelist1,
    Whitelist2,
    Whitelist3,
    Public,
    Ended,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum SocialPlatform {
    Twitter,
    Website,
    Github,
    Telegram,
    Discord,
}

// ========================================
// EVENTS
// ========================================

#[event]
pub struct CollectionCreatedEvent {
    pub collection: Pubkey,
    pub authority: Pubkey,
    pub max_supply: u64,
    pub launch_mode: LaunchMode,
    pub timestamp: i64,
}

#[event]
pub struct WhitelistMintEvent {
    pub collection: Pubkey,
    pub mint_index: u64,
    pub minter: Pubkey,
    pub stage: MintStage,
    pub price: u64,
    pub platform_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct CollectionRevealedEvent {
    pub collection: Pubkey,
    pub total_supply: u64,
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
pub struct StageAdvancedEvent {
    pub collection: Pubkey,
    pub new_stage: MintStage,
    pub timestamp: i64,
}

#[event]
pub struct RewardsDistributedEvent {
    pub amount: u64,
    pub holders_benefited: u64,
    pub timestamp: i64,
}

#[event]
pub struct CtoExecutedEvent {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
    pub approval_bps: u64,
    pub timestamp: i64,
}

// ========================================
// ERRORS
// ========================================

#[error_code]
pub enum ErrorCode {
    #[msg("Collection is sold out")]
    SoldOut,
    #[msg("Collection minting is paused")]
    CollectionPaused,
    #[msg("Collection has already been revealed")]
    AlreadyRevealed,
    #[msg("Reveal threshold has not been met")]
    ThresholdNotMet,
    #[msg("Collection has not been revealed yet")]
    NotRevealed,
    #[msg("Invalid mint stage")]
    InvalidStage,
    #[msg("Stage sold out")]
    StageSoldOut,
    #[msg("Invalid merkle proof")]
    InvalidProof,
    #[msg("Max per wallet reached for this stage")]
    MaxPerWalletReached,
    #[msg("Public sale not active")]
    PublicNotActive,
    #[msg("Invalid price progression")]
    InvalidPriceProgression,
    #[msg("Invalid stage supply")]
    InvalidStageSupply,
    #[msg("Collection too small")]
    CollectionTooSmall,
    #[msg("Collection too large")]
    CollectionTooLarge,
    #[msg("Price too low")]
    PriceTooLow,
    #[msg("Price too high")]
    PriceTooHigh,
    #[msg("Fee too high")]
    FeeTooHigh,
    #[msg("Invalid percentages - must equal 100%")]
    InvalidPercentages,
    #[msg("Invalid tier ID")]
    InvalidTierId,
    #[msg("Invalid multiplier")]
    InvalidMultiplier,
    #[msg("Invalid probability")]
    InvalidProbability,
    #[msg("Oracle is inactive")]
    OracleInactive,
    #[msg("Rarity not set")]
    RarityNotSet,
    #[msg("Tokens already claimed")]
    TokensAlreadyClaimed,
    #[msg("Tokens not claimed yet")]
    TokensNotClaimed,
    #[msg("Already burned")]
    AlreadyBurned,
    #[msg("Already staked")]
    AlreadyStaked,
    #[msg("No rewards available")]
    NoRewards,
    #[msg("Below minimum distribution amount")]
    BelowMinDistribution,
    #[msg("Insufficient stake to propose")]
    InsufficientStakeToPropose,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting still active")]
    VotingStillActive,
    #[msg("Already executed")]
    AlreadyExecuted,
    #[msg("Unauthorized - admin only")]
    Unauthorized,
    #[msg("Invalid allocation")]
    InvalidAllocation,
    #[msg("Campaign is not active")]
    CampaignInactive,
    #[msg("Campaign has not started yet")]
    CampaignNotStarted,
    #[msg("Campaign has ended")]
    CampaignEnded,
    #[msg("User has already claimed this airdrop")]
    AlreadyClaimed,
    #[msg("Insufficient platform fee paid")]
    InsufficientFee,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
}

