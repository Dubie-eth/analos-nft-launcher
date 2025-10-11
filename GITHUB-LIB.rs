use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    keccak,
    program::invoke_signed,
    system_instruction,
    pubkey,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, mint_to, MintTo, burn, Burn},
};

declare_id!("7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk");

/// Royalty basis points (500 = 5%)
pub const ROYALTY_BASIS_POINTS: u16 = 500;

/// Fee distribution constants (total 6% to LOL ecosystem)
pub const FEE_DEV_TEAM_BPS: u16 = 100;           // 1% to dev team
pub const FEE_POOL_CREATION_BPS: u16 = 200;      // 2% for pool creation after bond
pub const FEE_LOL_BUYBACK_BURN_BPS: u16 = 100;   // 1% for LOL buyback and burns
pub const FEE_PLATFORM_MAINT_BPS: u16 = 100;     // 1% for platform maintenance
pub const FEE_LOL_COMMUNITY_BPS: u16 = 100;      // 1% for LOL community rewards
pub const FEE_TOTAL_BPS: u16 = 600;              // 6% total to LOL ecosystem

/// Creator allocation (25% total, 10% immediate, 15% vested over 1 year)
pub const CREATOR_TOTAL_BPS: u16 = 2500;         // 25% total
pub const CREATOR_IMMEDIATE_BPS: u16 = 1000;     // 10% immediate after bonding
pub const CREATOR_VESTED_BPS: u16 = 1500;        // 15% vested over 1 year
pub const CREATOR_VESTING_MONTHS: u64 = 12;      // 12 months vesting

/// Pool allocation (69% to liquidity pool)
pub const POOL_ALLOCATION_BPS: u16 = 6900;       // 69% to pool

/// LOL ecosystem fee recipient wallets
pub const DEV_TEAM_WALLET: Pubkey = pubkey!("Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D");         // 1% dev team
pub const POOL_CREATION_WALLET: Pubkey = pubkey!("myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q");      // 2% pool creation
pub const LOL_BUYBACK_BURN_WALLET: Pubkey = pubkey!("7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721");   // 1% LOL buyback/burns
pub const PLATFORM_MAINT_WALLET: Pubkey = pubkey!("myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q");     // 1% platform maintenance
pub const LOL_COMMUNITY_WALLET: Pubkey = pubkey!("7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721");     // 1% LOL community rewards

/// Ticker system constants
pub const MAX_TICKER_LENGTH: usize = 10;
pub const MIN_TICKER_LENGTH: usize = 1;
pub const MAX_TICKERS_IN_REGISTRY: usize = 1000; // Increased from 100 to 1000 for scalability

/// Security constants
pub const DEFAULT_MINT_RATE_LIMIT_SECONDS: u64 = 60; // 1 minute
pub const DEFAULT_COMMITMENT_REVEAL_WINDOW: i64 = 24 * 60 * 60; // 24 hours
pub const MAX_MINTS_PER_USER_DEFAULT: u64 = u64::MAX;

/// Fee caps and platform fee constants
pub const MAX_TRADING_FEE_BPS: u16 = 690; // 6.9% maximum trading fee
pub const MAX_MINT_FEE_BPS: u16 = 690;    // 6.9% maximum mint fee

/// Platform fee structure for sustainability (within 6.9% cap)
pub const PLATFORM_FEE_EARLY_BPS: u16 = 414;   // 4.14% early platform fee (< 1000 SOL volume)
pub const PLATFORM_FEE_MID_BPS: u16 = 276;     // 2.76% mid platform fee (< 10,000 SOL volume)
pub const PLATFORM_FEE_LATE_BPS: u16 = 138;    // 1.38% late platform fee (10,000+ SOL volume)
pub const PLATFORM_FEE_MIN_BPS: u16 = 50;      // 0.5% minimum platform fee (100+ SOL)

/// Bonding curve fee structure for sustainability (within 6.9% cap)
pub const BONDING_CURVE_EARLY_PLATFORM_BPS: u16 = 552;  // 5.52% early bonding curve platform fee (< 1000 SOL volume)
pub const BONDING_CURVE_MID_PLATFORM_BPS: u16 = 414;    // 4.14% mid bonding curve platform fee (< 10,000 SOL volume)
pub const BONDING_CURVE_LATE_PLATFORM_BPS: u16 = 276;   // 2.76% late bonding curve platform fee (10,000+ SOL volume)

/// Volume thresholds for fee scaling
pub const VOLUME_THRESHOLD_EARLY: u64 = 10000000000;  // 10 SOL - early stage
pub const VOLUME_THRESHOLD_MID: u64 = 50000000000;    // 50 SOL - mid stage  
pub const VOLUME_THRESHOLD_LATE: u64 = 100000000000;  // 100 SOL - late stage

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    /// Initialize the collection (Enhanced with new features)
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        collection_name: String,
        collection_symbol: String,
        placeholder_uri: String,
        
        // New optional parameters for enhanced features
        max_mints_per_user: Option<u64>,
        mint_rate_limit_seconds: Option<u64>,
        social_verification_required: Option<bool>,
        bonding_curve_enabled: Option<bool>,
    ) -> Result<()> {
        // Get the key before any mutable borrows
        let collection_config_key = ctx.accounts.collection_config.key();
        
        let config = &mut ctx.accounts.collection_config;
        
        // Validate ticker
        let ticker_upper = collection_symbol.to_uppercase();
        require!(
            ticker_upper.len() >= MIN_TICKER_LENGTH && ticker_upper.len() <= MAX_TICKER_LENGTH,
            ErrorCode::InvalidTickerLength
        );

        // Check ticker availability
        let ticker_bytes = ticker_upper.as_bytes();
        let mut ticker_array = [0u8; MAX_TICKER_LENGTH];
        ticker_array[..ticker_bytes.len()].copy_from_slice(ticker_bytes);

        // Register ticker
        let registry = &mut ctx.accounts.ticker_registry;
        require!(
            !registry.tickers.contains(&ticker_array),
            ErrorCode::TickerAlreadyExists
        );
        require!(
            registry.tickers.len() < MAX_TICKERS_IN_REGISTRY,
            ErrorCode::TickerRegistryFull
        );
        registry.tickers.push(ticker_array);

        // Initialize collection config
        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.current_supply = 0;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_mint = ctx.accounts.collection_mint.key();
        config.collection_name = collection_name;
        config.collection_symbol = ticker_upper.clone();
        config.placeholder_uri = placeholder_uri;

        // Set enhanced features
        config.max_mints_per_user = max_mints_per_user.unwrap_or(MAX_MINTS_PER_USER_DEFAULT);
        config.mint_rate_limit_seconds = mint_rate_limit_seconds.unwrap_or(DEFAULT_MINT_RATE_LIMIT_SECONDS);
        config.social_verification_required = social_verification_required.unwrap_or(false);
        config.bonding_curve_enabled = bonding_curve_enabled.unwrap_or(false);

        // Initialize platform fee tracking
        config.total_volume = 0;
        config.current_platform_fee_bps = PLATFORM_FEE_EARLY_BPS;
        config.current_bonding_curve_platform_fee_bps = BONDING_CURVE_EARLY_PLATFORM_BPS;

        // Bonding curve pricing
        config.bonding_curve_base_price = price_lamports;
        config.bonding_curve_price_increment_bps = 100; // 1% increment
        config.bonding_curve_max_price = price_lamports * 10; // 10x max

        // Reveal fee
        config.reveal_fee_enabled = false;
        config.reveal_fee_lamports = 0;
        config.total_reveals = 0;
        
        // Additional fields for advanced features
        config.trading_fee_bps = 0;
        config.mint_fee_bps = 0;
        config.fee_caps_disabled = false;

        // Initialize escrow wallet
        let escrow = &mut ctx.accounts.escrow_wallet;
        escrow.collection_config = collection_config_key;
        escrow.authority = ctx.accounts.authority.key();
        escrow.balance = 0;
        escrow.creator_share_percentage = CREATOR_TOTAL_BPS; // 25% default
        escrow.bonding_curve_reserve = 0;
        escrow.creator_bc_allocation_bps = 0; // 0% default, creator can adjust
        escrow.locked_funds = 0; // No funds locked initially

        // Generate global seed for randomization
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ].concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();

        msg!("Collection initialized: {} ({}) - Max: {}, Price: {} lamports",
            config.collection_name, config.collection_symbol, max_supply, price_lamports);

        emit!(CollectionInitializedEvent {
            collection_config: ctx.accounts.collection_config.key(),
            authority: ctx.accounts.authority.key(),
            max_supply,
            price_lamports,
            collection_symbol: ticker_upper,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Mint a placeholder NFT (mystery box)
    pub fn mint_placeholder(
        ctx: Context<MintPlaceholder>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let escrow = &mut ctx.accounts.escrow_wallet;

        // Validations
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);

        let mint_index = config.current_supply;
        let mint_price = config.price_lamports;

        // Calculate fee distribution (6% to LOL ecosystem)
        let dev_fee = mint_price.checked_mul(FEE_DEV_TEAM_BPS as u64).unwrap().checked_div(10000).unwrap();
        let pool_creation_fee = mint_price.checked_mul(FEE_POOL_CREATION_BPS as u64).unwrap().checked_div(10000).unwrap();
        let buyback_fee = mint_price.checked_mul(FEE_LOL_BUYBACK_BURN_BPS as u64).unwrap().checked_div(10000).unwrap();
        let maint_fee = mint_price.checked_mul(FEE_PLATFORM_MAINT_BPS as u64).unwrap().checked_div(10000).unwrap();
        let community_fee = mint_price.checked_mul(FEE_LOL_COMMUNITY_BPS as u64).unwrap().checked_div(10000).unwrap();
        
        let total_fees = dev_fee + pool_creation_fee + buyback_fee + maint_fee + community_fee;
        let remaining_amount = mint_price.checked_sub(total_fees).unwrap();

        // Transfer payment to escrow wallet
        let transfer_ix = system_instruction::transfer(
            ctx.accounts.payer.key,
            &escrow.key(),
            mint_price,
        );
        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Distribute fees to LOL ecosystem wallets
        let dev_transfer = system_instruction::transfer(
            &escrow.key(),
            &DEV_TEAM_WALLET,
            dev_fee,
        );
        invoke_signed(
            &dev_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        let pool_transfer = system_instruction::transfer(
            &escrow.key(),
            &POOL_CREATION_WALLET,
            pool_creation_fee,
        );
        invoke_signed(
            &pool_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        let buyback_transfer = system_instruction::transfer(
            &escrow.key(),
            &LOL_BUYBACK_BURN_WALLET,
            buyback_fee,
        );
        invoke_signed(
            &buyback_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        let maint_transfer = system_instruction::transfer(
            &escrow.key(),
            &PLATFORM_MAINT_WALLET,
            maint_fee,
        );
        invoke_signed(
            &maint_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        let community_transfer = system_instruction::transfer(
            &escrow.key(),
            &LOL_COMMUNITY_WALLET,
            community_fee,
        );
        invoke_signed(
            &community_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Calculate creator and bonding curve allocation
        let creator_allocation = remaining_amount.checked_mul(escrow.creator_share_percentage as u64).unwrap().checked_div(10000).unwrap();
        let bonding_curve_allocation = remaining_amount.checked_mul(escrow.creator_bc_allocation_bps as u64).unwrap().checked_div(10000).unwrap();
        let pool_allocation = remaining_amount.checked_sub(creator_allocation).unwrap().checked_sub(bonding_curve_allocation).unwrap();

        // Update escrow balance and reserves
        escrow.balance = escrow.balance.checked_add(creator_allocation).unwrap();
        escrow.bonding_curve_reserve = escrow.bonding_curve_reserve.checked_add(bonding_curve_allocation).unwrap();

        // Update volume tracking for dynamic fees
        config.total_volume = config.total_volume.checked_add(mint_price).unwrap();

        // Create mint record
        let mint_record = &mut ctx.accounts.mint_record;
        mint_record.collection_config = config.key();
        mint_record.mint_index = mint_index;
        mint_record.mint_address = ctx.accounts.mint.key();
        mint_record.owner = ctx.accounts.payer.key();
        mint_record.is_revealed = false;

        // Mint NFT to user
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        mint_to(cpi_ctx, 1)?;

        // Update supply
        config.current_supply = config.current_supply.checked_add(1).unwrap();

        msg!("Minted placeholder NFT #{} to {} for {} lamports", 
            mint_index, ctx.accounts.payer.key(), mint_price);

        emit!(PlaceholderMintedEvent {
            collection_config: config.key(),
            mint_index,
            owner: ctx.accounts.payer.key(),
            mint_address: ctx.accounts.mint.key(),
            price_lamports: mint_price,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Reveal the collection
    pub fn reveal_collection(
        ctx: Context<RevealCollection>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        require!(!config.is_revealed, ErrorCode::AlreadyRevealed);
        require!(
            config.current_supply >= config.reveal_threshold,
            ErrorCode::RevealThresholdNotMet
        );

        config.is_revealed = true;

        msg!("Collection revealed! {} NFTs minted", config.current_supply);

        emit!(CollectionRevealedEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            revealed_supply: config.current_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw funds from escrow
    pub fn withdraw_from_escrow(
        ctx: Context<WithdrawFromEscrow>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        
        require!(escrow.balance >= amount, ErrorCode::InsufficientFunds);
        
        escrow.balance = escrow.balance.checked_sub(amount).unwrap();

        let transfer_ix = system_instruction::transfer(
            &escrow.key(),
            ctx.accounts.recipient.key,
            amount,
        );
        invoke_signed(
            &transfer_ix,
            &[
                escrow.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        msg!("Withdrew {} lamports from escrow to {}", amount, ctx.accounts.recipient.key());

        emit!(EscrowWithdrawalEvent {
            escrow_wallet: escrow.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set pause state
    pub fn set_pause(
        ctx: Context<SetPause>,
        is_paused: bool,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.is_paused = is_paused;

        msg!("Collection pause state set to: {}", is_paused);

        emit!(CollectionPauseToggledEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            is_paused,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Burn NFT (user can burn their own)
    pub fn burn_nft(
        ctx: Context<BurnNft>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let mint_record = &ctx.accounts.mint_record;

        // Validate ownership
        require!(mint_record.owner == ctx.accounts.owner.key(), ErrorCode::NotAuthorized);
        require!(mint_record.collection_config == config.key(), ErrorCode::InvalidMintRecord);

        // Burn the NFT
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        burn(cpi_ctx, 1)?;

        msg!("NFT #{} burned by owner {}", mint_record.mint_index, ctx.accounts.owner.key());

        emit!(NftBurnedEvent {
            collection_config: config.key(),
            mint_index: mint_record.mint_index,
            owner: ctx.accounts.owner.key(),
            mint_address: ctx.accounts.mint.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Admin burn NFT (admin can burn any NFT)
    pub fn admin_burn_nft(
        ctx: Context<AdminBurnNft>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let mint_record = &ctx.accounts.mint_record;

        // Validate admin authority
        require!(ctx.accounts.admin.key() == config.authority, ErrorCode::NotAuthorized);
        require!(mint_record.collection_config == config.key(), ErrorCode::InvalidMintRecord);

        // Burn the NFT
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        burn(cpi_ctx, 1)?;

        msg!("NFT #{} burned by admin {}", mint_record.mint_index, ctx.accounts.admin.key());

        emit!(NftBurnedEvent {
            collection_config: config.key(),
            mint_index: mint_record.mint_index,
            owner: ctx.accounts.owner.key(),
            mint_address: ctx.accounts.mint.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set creator share percentage
    pub fn set_creator_share_percentage(
        ctx: Context<SetCreatorSharePercentage>,
        percentage_bps: u16,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        
        require!(percentage_bps <= CREATOR_TOTAL_BPS, ErrorCode::InvalidPercentage);
        
        escrow.creator_share_percentage = percentage_bps;

        msg!("Creator share percentage set to {} bps", percentage_bps);

        emit!(CreatorSharePercentageUpdatedEvent {
            escrow_wallet: escrow.key(),
            authority: ctx.accounts.authority.key(),
            percentage_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set creator bonding curve allocation
    pub fn set_creator_bonding_curve_allocation(
        ctx: Context<SetCreatorBondingCurveAllocation>,
        allocation_bps: u16,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        
        require!(allocation_bps <= 5000, ErrorCode::InvalidPercentage); // Max 50%
        
        escrow.creator_bc_allocation_bps = allocation_bps;

        msg!("Creator bonding curve allocation set to {} bps", allocation_bps);

        emit!(CreatorBondingCurveAllocationUpdatedEvent {
            escrow_wallet: escrow.key(),
            authority: ctx.accounts.authority.key(),
            allocation_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Transfer escrow authority
    pub fn transfer_escrow_authority(
        ctx: Context<TransferEscrowAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        
        require!(ctx.accounts.authority.key() == escrow.authority, ErrorCode::NotAuthorized);
        
        escrow.authority = new_authority;

        msg!("Escrow authority transferred from {} to {}", 
            ctx.accounts.authority.key(), new_authority);

        emit!(EscrowAuthorityTransferredEvent {
            escrow_wallet: escrow.key(),
            old_authority: ctx.accounts.authority.key(),
            new_authority,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Transfer collection authority
    pub fn transfer_collection_authority(
        ctx: Context<TransferCollectionAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        
        config.authority = new_authority;

        msg!("Collection authority transferred from {} to {}", 
            ctx.accounts.authority.key(), new_authority);

        emit!(CollectionAuthorityTransferredEvent {
            collection_config: config.key(),
            old_authority: ctx.accounts.authority.key(),
            new_authority,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create takeover proposal
    pub fn create_takeover_proposal(
        ctx: Context<CreateTakeoverProposal>,
        proposal_type: u8, // 0 = collection, 1 = escrow
        new_authority: Pubkey,
        description: String,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.takeover_proposal;
        
        proposal.collection_config = ctx.accounts.collection_config.key();
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.proposal_type = proposal_type;
        proposal.new_authority = new_authority;
        proposal.description = description.clone();
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.is_active = true;
        proposal.created_at = Clock::get()?.unix_timestamp;

        msg!("Takeover proposal created: {} -> {}", 
            ctx.accounts.proposer.key(), new_authority);

        emit!(TakeoverProposalCreatedEvent {
            takeover_proposal: proposal.key(),
            collection_config: ctx.accounts.collection_config.key(),
            proposer: ctx.accounts.proposer.key(),
            proposal_type,
            new_authority,
            description,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Vote on takeover proposal
    pub fn vote_on_takeover_proposal(
        ctx: Context<VoteOnTakeoverProposal>,
        vote: bool, // true = for, false = against
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.takeover_proposal;
        
        require!(proposal.is_active, ErrorCode::ProposalNotActive);
        
        // Add vote
        if vote {
            proposal.votes_for = proposal.votes_for.checked_add(1).unwrap();
        } else {
            proposal.votes_against = proposal.votes_against.checked_add(1).unwrap();
        }

        // Vote recorded (simplified voter tracking)

        msg!("Vote cast: {} voted {} on proposal {}", 
            ctx.accounts.voter.key(), if vote { "FOR" } else { "AGAINST" }, proposal.key());

        emit!(TakeoverProposalVotedEvent {
            takeover_proposal: proposal.key(),
            voter: ctx.accounts.voter.key(),
            vote,
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Configure bonding curve pricing
    pub fn configure_bonding_curve_pricing(
        ctx: Context<ConfigureBondingCurvePricing>,
        base_price_lamports: u64,
        price_increment_bps: u16,
        max_price_lamports: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        require!(config.bonding_curve_enabled, ErrorCode::BondingCurveNotEnabled);
        
        config.bonding_curve_base_price = base_price_lamports;
        config.bonding_curve_price_increment_bps = price_increment_bps;
        config.bonding_curve_max_price = max_price_lamports;

        msg!("Bonding curve pricing configured: base={}, increment={} bps, max={}", 
            base_price_lamports, price_increment_bps, max_price_lamports);

        emit!(BondingCurvePricingConfiguredEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            base_price_lamports,
            price_increment_bps,
            max_price_lamports,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create bonding curve tier
    pub fn create_bonding_curve_tier(
        ctx: Context<CreateBondingCurveTier>,
        tier_name: String,
        supply_limit: u64,
        price_multiplier_bps: u16,
        time_limit_seconds: Option<u64>,
        access_rules: u8, // 0 = public, 1 = whitelist, 2 = token-gate, 3 = social verification
    ) -> Result<()> {
        let tier = &mut ctx.accounts.bonding_curve_tier;
        let config = &ctx.accounts.collection_config;
        
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        require!(config.bonding_curve_enabled, ErrorCode::BondingCurveNotEnabled);
        
        tier.collection_config = config.key();
        tier.tier_name = tier_name;
        tier.supply_limit = supply_limit;
        tier.price_multiplier_bps = price_multiplier_bps;
        tier.time_limit_seconds = time_limit_seconds;
        tier.access_rules = access_rules;
        tier.current_supply = 0;
        tier.is_active = true;

        msg!("Bonding curve tier created: {} (limit: {}, multiplier: {} bps)", 
            tier.tier_name, supply_limit, price_multiplier_bps);

        emit!(BondingCurveTierCreatedEvent {
            bonding_curve_tier: tier.key(),
            collection_config: config.key(),
            tier_name: tier.tier_name.clone(),
            supply_limit,
            price_multiplier_bps,
            access_rules,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Configure reveal fee
    pub fn configure_reveal_fee(
        ctx: Context<ConfigureRevealFee>,
        fee_enabled: bool,
        fee_lamports: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        
        config.reveal_fee_enabled = fee_enabled;
        config.reveal_fee_lamports = fee_lamports.unwrap_or(0);
        config.total_reveals = 0;

        msg!("Reveal fee configured: enabled={}, amount={} lamports", 
            fee_enabled, config.reveal_fee_lamports);

        emit!(RevealFeeConfiguredEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            fee_enabled,
            fee_lamports: config.reveal_fee_lamports,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Reveal NFT with fee
    pub fn reveal_nft_with_fee(
        ctx: Context<RevealNftWithFee>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let escrow = &mut ctx.accounts.escrow_wallet;
        let mint_record = &mut ctx.accounts.mint_record;
        
        require!(config.reveal_fee_enabled, ErrorCode::RevealFeeNotEnabled);
        require!(!mint_record.is_revealed, ErrorCode::AlreadyRevealed);
        require!(mint_record.owner == ctx.accounts.payer.key(), ErrorCode::NotAuthorized);
        
        let reveal_fee = config.reveal_fee_lamports;

        // Transfer reveal fee
        let transfer_ix = system_instruction::transfer(
            ctx.accounts.payer.key,
            &escrow.key(),
            reveal_fee,
        );
        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Distribute reveal fee (6.9% platform fee)
        let platform_fee = reveal_fee.checked_mul(690).unwrap().checked_div(10000).unwrap();
        let creator_fee = reveal_fee.checked_sub(platform_fee).unwrap();

        let platform_transfer = system_instruction::transfer(
            &escrow.key(),
            &PLATFORM_MAINT_WALLET,
            platform_fee,
        );
        invoke_signed(
            &platform_transfer,
            &[
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        escrow.balance = escrow.balance.checked_add(creator_fee).unwrap();
        config.total_reveals = config.total_reveals.checked_add(1).unwrap();
        mint_record.is_revealed = true;

        msg!("NFT #{} revealed with fee {} lamports", mint_record.mint_index, reveal_fee);

        emit!(NftRevealedWithFeeEvent {
            collection_config: config.key(),
            mint_index: mint_record.mint_index,
            owner: ctx.accounts.payer.key(),
            reveal_fee,
            platform_fee,
            creator_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Upgrade ticker registry capacity
    pub fn upgrade_ticker_registry_capacity(
        ctx: Context<UpgradeTickerRegistryCapacity>,
        new_capacity: usize,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.ticker_registry;
        
        require!(ctx.accounts.authority.key() == registry.authority, ErrorCode::NotAuthorized);
        require!(new_capacity <= 10000, ErrorCode::CapacityTooLarge); // Max 10k
        require!(new_capacity > registry.tickers.len(), ErrorCode::CapacityTooSmall);
        
        registry.max_capacity = new_capacity;

        msg!("Ticker registry capacity upgraded to {}", new_capacity);

        emit!(TickerRegistryCapacityUpgradedEvent {
            ticker_registry: registry.key(),
            authority: ctx.accounts.authority.key(),
            new_capacity,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // === ADMIN FUNCTIONS ===
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        max_supply: Option<u64>,
        price_lamports: Option<u64>,
        reveal_threshold: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        if let Some(supply) = max_supply {
            config.max_supply = supply;
        }
        if let Some(price) = price_lamports {
            config.price_lamports = price;
        }
        if let Some(threshold) = reveal_threshold {
            config.reveal_threshold = threshold;
        }

        msg!("Collection config updated");
        Ok(())
    }

    pub fn initialize_ticker_registry(
        ctx: Context<InitializeTickerRegistry>,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.ticker_registry;
        registry.authority = ctx.accounts.authority.key();
        registry.tickers = Vec::new();
        registry.max_capacity = MAX_TICKERS_IN_REGISTRY;

        msg!("Ticker registry initialized");
        Ok(())
    }

    pub fn admin_remove_ticker(
        ctx: Context<AdminRemoveTicker>,
        ticker: String,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.ticker_registry;
        let ticker_upper = ticker.to_uppercase();
        
        let ticker_bytes = ticker_upper.as_bytes();
        let mut ticker_array = [0u8; MAX_TICKER_LENGTH];
        ticker_array[..ticker_bytes.len()].copy_from_slice(ticker_bytes);
        
        registry.tickers.retain(|&t| t != ticker_array);

        msg!("Ticker {} removed by admin", ticker_upper);
        Ok(())
    }

    // === WHITELIST & PHASES ===
    pub fn create_mint_phase(
        ctx: Context<CreateMintPhase>,
        phase_name: String,
        start_time: i64,
        end_time: Option<i64>,
        max_mints_per_user: u64,
        price_lamports: u64,
    ) -> Result<()> {
        let phase = &mut ctx.accounts.mint_phase_config;
        let config = &ctx.accounts.collection_config;
        
        phase.collection_config = config.key();
        phase.phase_name = phase_name;
        phase.start_time = start_time;
        phase.end_time = end_time;
        phase.max_mints_per_user = max_mints_per_user;
        phase.price_lamports = price_lamports;
        phase.is_active = false;

        msg!("Mint phase created");
        Ok(())
    }

    pub fn activate_phase(
        ctx: Context<ActivatePhase>,
        phase_id: u8,
    ) -> Result<()> {
        let phase = &mut ctx.accounts.mint_phase_config;
        phase.is_active = true;

        msg!("Phase {} activated", phase_id);
        Ok(())
    }

    pub fn deactivate_phase(
        ctx: Context<DeactivatePhase>,
        phase_id: u8,
    ) -> Result<()> {
        let phase = &mut ctx.accounts.mint_phase_config;
        phase.is_active = false;

        msg!("Phase {} deactivated", phase_id);
        Ok(())
    }

    // === SOCIAL VERIFICATION ===
    pub fn configure_social_verification(
        ctx: Context<ConfigureSocialVerification>,
        platform: u8, // 0 = Twitter, 1 = Discord, etc.
        min_followers: u64,
        verification_code: String,
    ) -> Result<()> {
        let social_config = &mut ctx.accounts.social_verification_config;
        let config = &ctx.accounts.collection_config;
        
        social_config.collection_config = config.key();
        social_config.platform = platform;
        social_config.min_followers = min_followers;
        social_config.verification_code = verification_code;
        social_config.is_active = true;

        msg!("Social verification configured for platform {}", platform);
        Ok(())
    }

    pub fn verify_social_account(
        ctx: Context<VerifySocialAccount>,
        platform: u8,
        follower_count: u64,
        verification_proof: String,
    ) -> Result<()> {
        let social_config = &ctx.accounts.social_verification_config;
        let user_verification = &mut ctx.accounts.user_social_verification;
        
        require!(social_config.platform == platform, ErrorCode::InvalidVerificationMethod);
        require!(follower_count >= social_config.min_followers, ErrorCode::InsufficientFollowers);
        require!(verification_proof == social_config.verification_code, ErrorCode::InvalidVerificationProof);

        user_verification.user = ctx.accounts.user.key();
        user_verification.platform = platform;
        user_verification.follower_count = follower_count;
        user_verification.verified_at = Clock::get()?.unix_timestamp;
        user_verification.is_verified = true;

        msg!("Social account verified for user {}", ctx.accounts.user.key());
        Ok(())
    }

    // === CREATOR FUNDS ===
    pub fn withdraw_creator_funds(
        ctx: Context<WithdrawCreatorFunds>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        require!(escrow.balance >= amount, ErrorCode::InsufficientFunds);
        
        escrow.balance = escrow.balance.checked_sub(amount).unwrap();

        let transfer_ix = system_instruction::transfer(
            &escrow.key(),
            ctx.accounts.creator.key,
            amount,
        );
        invoke_signed(
            &transfer_ix,
            &[
                escrow.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        msg!("Creator funds withdrawn: {} lamports", amount);
        Ok(())
    }

    pub fn lock_creator_funds(
        ctx: Context<LockCreatorFunds>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        require!(escrow.balance >= amount, ErrorCode::InsufficientFunds);
        
        escrow.balance = escrow.balance.checked_sub(amount).unwrap();
        escrow.locked_funds = escrow.locked_funds.checked_add(amount).unwrap();

        msg!("Creator funds locked: {} lamports", amount);
        Ok(())
    }

    pub fn unlock_creator_funds(
        ctx: Context<UnlockCreatorFunds>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        require!(escrow.locked_funds >= amount, ErrorCode::InsufficientFunds);
        
        escrow.locked_funds = escrow.locked_funds.checked_sub(amount).unwrap();
        escrow.balance = escrow.balance.checked_add(amount).unwrap();

        msg!("Creator funds unlocked: {} lamports", amount);
        Ok(())
    }

    // === TRADING FEES ===
    pub fn set_trading_fee(
        ctx: Context<SetTradingFee>,
        fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(fee_bps <= MAX_TRADING_FEE_BPS, ErrorCode::FeeTooHigh);
        
        config.trading_fee_bps = fee_bps;

        msg!("Trading fee set to {} bps", fee_bps);
        Ok(())
    }

    pub fn set_mint_fee(
        ctx: Context<SetMintFee>,
        fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(fee_bps <= MAX_MINT_FEE_BPS, ErrorCode::FeeTooHigh);
        
        config.mint_fee_bps = fee_bps;

        msg!("Mint fee set to {} bps", fee_bps);
        Ok(())
    }

    // === EMERGENCY CONTROLS ===
    pub fn set_emergency_pause(
        ctx: Context<SetEmergencyPause>,
        reason: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.is_paused = true;

        msg!("Emergency pause activated: {}", reason);
        Ok(())
    }

    pub fn emergency_disable_fee_caps(
        ctx: Context<EmergencyDisableFeeCaps>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.fee_caps_disabled = true;

        msg!("Fee caps disabled by emergency authority");
        Ok(())
    }

    pub fn enable_fee_caps(
        ctx: Context<EnableFeeCaps>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.fee_caps_disabled = false;

        msg!("Fee caps re-enabled");
        Ok(())
    }

    // === COMMITMENT/REVEAL SYSTEM ===
    pub fn commit_reveal_data(
        ctx: Context<CommitRevealData>,
        commitment_hash: [u8; 32],
    ) -> Result<()> {
        let commitment = &mut ctx.accounts.commitment_config;
        let config = &ctx.accounts.collection_config;
        
        commitment.collection_config = config.key();
        commitment.commitment_hash = commitment_hash;
        commitment.committed_at = Clock::get()?.unix_timestamp;
        commitment.is_revealed = false;

        msg!("Reveal data committed");
        Ok(())
    }

    pub fn reveal_data(
        ctx: Context<RevealData>,
        reveal_data: String,
    ) -> Result<()> {
        let commitment = &mut ctx.accounts.commitment_config;
        
        // Verify the reveal matches the commitment
        let reveal_hash = keccak::hash(reveal_data.as_bytes()).to_bytes();
        require!(commitment.commitment_hash == reveal_hash, ErrorCode::InvalidRevealData);
        
        commitment.is_revealed = true;
        commitment.revealed_at = Some(Clock::get()?.unix_timestamp);

        msg!("Reveal data verified and revealed");
        Ok(())
    }
}

// Helper functions for fee calculations (outside program module)
pub fn calculate_platform_fee_bps(volume: u64) -> u16 {
    if volume < 10000000000 {  // 10 SOL
        414  // 4.14%
    } else if volume < 50000000000 {  // 50 SOL
        276  // 2.76%
    } else if volume < 100000000000 {  // 100 SOL
        138  // 1.38%
    } else {
        50   // 0.5%
    }
}

pub fn calculate_bonding_curve_platform_fee_bps(volume: u64) -> u16 {
    if volume < 10000000000 {  // 10 SOL
        552  // 5.52%
    } else if volume < 50000000000 {  // 50 SOL
        414  // 4.14%
    } else {
        276  // 2.76%
    }
}

// Account structures
#[derive(Accounts)]
#[instruction(max_supply: u64, price_lamports: u64, reveal_threshold: u64, collection_name: String, collection_symbol: String, placeholder_uri: String)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 32 + 300 + 300 + 300 + 32 + 8 + 8 + 1 + 1 + 8 + 2 + 2 + 8 + 2 + 8 + 1 + 8 + 8 + 8 + 2 + 2 + 1,
        seeds = [b"collection_config", collection_symbol.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 2 + 8 + 2 + 8,
        seeds = [b"escrow_wallet", collection_symbol.as_bytes()],
        bump
    )]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + (4 + 1000 * MAX_TICKER_LENGTH) + 8,
        seeds = [b"ticker_registry"],
        bump
    )]
    pub ticker_registry: Account<'info, TickerRegistry>,

    #[account(mint::decimals = 0)]
    pub collection_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintPlaceholder<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 8 + 32 + 32 + 1,
        seeds = [b"mint_record", collection_config.key().as_ref(), &collection_config.current_supply.to_le_bytes()],
        bump
    )]
    pub mint_record: Account<'info, MintRecord>,

    #[account(mint::decimals = 0)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealCollection<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFromEscrow<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,

    /// CHECK: This is the recipient of the withdrawal
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPause<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BurnNft<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub mint_record: Account<'info, MintRecord>,

    #[account(mint::decimals = 0)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct AdminBurnNft<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub mint_record: Account<'info, MintRecord>,

    #[account(mint::decimals = 0)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the owner of the NFT
    pub owner: UncheckedAccount<'info>,

    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct SetCreatorSharePercentage<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetCreatorBondingCurveAllocation<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferEscrowAuthority<'info> {
    #[account(mut, has_one = authority @ ErrorCode::NotAuthorized)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferCollectionAuthority<'info> {
    #[account(mut, has_one = authority @ ErrorCode::NotAuthorized)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateTakeoverProposal<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = proposer,
        space = 8 + 32 + 32 + 1 + 32 + 500 + 8 + 8 + 1 + 8,
        seeds = [b"takeover_proposal", collection_config.key().as_ref()],
        bump
    )]
    pub takeover_proposal: Account<'info, TakeoverProposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnTakeoverProposal<'info> {
    #[account(mut)]
    pub takeover_proposal: Account<'info, TakeoverProposal>,

    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfigureBondingCurvePricing<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateBondingCurveTier<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 100 + 8 + 2 + 9 + 1 + 8 + 1,
        seeds = [b"bonding_curve_tier", collection_config.key().as_ref()],
        bump
    )]
    pub bonding_curve_tier: Account<'info, BondingCurveTier>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfigureRevealFee<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealNftWithFee<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    #[account(mut)]
    pub mint_record: Account<'info, MintRecord>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpgradeTickerRegistryCapacity<'info> {
    #[account(mut, has_one = authority)]
    pub ticker_registry: Account<'info, TickerRegistry>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeTickerRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + (4 + 1000 * MAX_TICKER_LENGTH) + 8,
        seeds = [b"ticker_registry"],
        bump
    )]
    pub ticker_registry: Account<'info, TickerRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminRemoveTicker<'info> {
    #[account(mut, has_one = authority)]
    pub ticker_registry: Account<'info, TickerRegistry>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateMintPhase<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 100 + 8 + 9 + 8 + 8 + 1,
        seeds = [b"mint_phase", collection_config.key().as_ref()],
        bump
    )]
    pub mint_phase_config: Account<'info, MintPhaseConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(phase_id: u8)]
pub struct ActivatePhase<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut, has_one = authority)]
    pub mint_phase_config: Account<'info, MintPhaseConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(phase_id: u8)]
pub struct DeactivatePhase<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut, has_one = authority)]
    pub mint_phase_config: Account<'info, MintPhaseConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfigureSocialVerification<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8 + 200 + 1,
        seeds = [b"social_verification", collection_config.key().as_ref()],
        bump
    )]
    pub social_verification_config: Account<'info, SocialVerificationConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifySocialAccount<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub social_verification_config: Account<'info, SocialVerificationConfig>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 1 + 8 + 8 + 1,
        seeds = [b"user_social_verification", user.key().as_ref()],
        bump
    )]
    pub user_social_verification: Account<'info, UserSocialVerification>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawCreatorFunds<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockCreatorFunds<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnlockCreatorFunds<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetTradingFee<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetMintFee<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetEmergencyPause<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyDisableFeeCaps<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EnableFeeCaps<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CommitRevealData<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 9 + 1,
        seeds = [b"commitment", collection_config.key().as_ref()],
        bump
    )]
    pub commitment_config: Account<'info, CommitmentConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealData<'info> {
    #[account(mut)]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub commitment_config: Account<'info, CommitmentConfig>,

    pub authority: Signer<'info>,
}

// Account data structures
#[account]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub current_supply: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    pub collection_mint: Pubkey,
    pub collection_name: String,
    pub collection_symbol: String,
    pub placeholder_uri: String,
    pub global_seed: [u8; 32],
    
    // Enhanced features
    pub max_mints_per_user: u64,
    pub mint_rate_limit_seconds: u64,
    pub social_verification_required: bool,
    pub bonding_curve_enabled: bool,
    
    // Fee tracking
    pub total_volume: u64,
    pub current_platform_fee_bps: u16,
    pub current_bonding_curve_platform_fee_bps: u16,
    
    // Bonding curve pricing
    pub bonding_curve_base_price: u64,
    pub bonding_curve_price_increment_bps: u16,
    pub bonding_curve_max_price: u64,
    
    // Reveal fee
    pub reveal_fee_enabled: bool,
    pub reveal_fee_lamports: u64,
    pub total_reveals: u64,
    
    // Additional fields for advanced features
    pub trading_fee_bps: u16,
    pub mint_fee_bps: u16,
    pub fee_caps_disabled: bool,
}

#[account]
pub struct EscrowWallet {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub balance: u64,
    pub creator_share_percentage: u16, // Basis points (2500 = 25%)
    pub bonding_curve_reserve: u64,
    pub creator_bc_allocation_bps: u16,
    pub locked_funds: u64, // Percentage of creator funds to bonding curve (0-5000 = 0-50%)
}

#[account]
#[derive(InitSpace)]
pub struct MintRecord {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub mint_address: Pubkey,
    pub owner: Pubkey,
    pub is_revealed: bool,
}

#[account]
pub struct TickerRegistry {
    pub authority: Pubkey,
    pub tickers: Vec<[u8; MAX_TICKER_LENGTH]>,
    pub max_capacity: usize,
}

#[account]
pub struct MintPhaseConfig {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub phase_name: String,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub max_mints_per_user: u64,
    pub price_lamports: u64,
    pub is_active: bool,
}

#[account]
pub struct SocialVerificationConfig {
    pub collection_config: Pubkey,
    pub platform: u8, // 0 = Twitter, 1 = Discord, etc.
    pub min_followers: u64,
    pub verification_code: String,
    pub is_active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct UserSocialVerification {
    pub user: Pubkey,
    pub platform: u8,
    pub follower_count: u64,
    pub verified_at: i64,
    pub is_verified: bool,
}

#[account]
pub struct CommitmentConfig {
    pub collection_config: Pubkey,
    pub commitment_hash: [u8; 32],
    pub committed_at: i64,
    pub revealed_at: Option<i64>,
    pub is_revealed: bool,
}

#[account]
pub struct TakeoverProposal {
    pub collection_config: Pubkey,
    pub proposer: Pubkey,
    pub proposal_type: u8, // 0 = collection, 1 = escrow
    pub new_authority: Pubkey,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
pub struct BondingCurveTier {
    pub collection_config: Pubkey,
    pub tier_name: String,
    pub supply_limit: u64,
    pub price_multiplier_bps: u16,
    pub time_limit_seconds: Option<u64>,
    pub access_rules: u8, // 0 = public, 1 = whitelist, 2 = token-gate, 3 = social verification
    pub current_supply: u64,
    pub is_active: bool,
}

// Events
#[event]
pub struct CollectionInitializedEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub max_supply: u64,
    pub price_lamports: u64,
    pub collection_symbol: String,
    pub timestamp: i64,
}

#[event]
pub struct PlaceholderMintedEvent {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub owner: Pubkey,
    pub mint_address: Pubkey,
    pub price_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct CollectionRevealedEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub revealed_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowWithdrawalEvent {
    pub escrow_wallet: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CollectionPauseToggledEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub is_paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct NftBurnedEvent {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub owner: Pubkey,
    pub mint_address: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CreatorSharePercentageUpdatedEvent {
    pub escrow_wallet: Pubkey,
    pub authority: Pubkey,
    pub percentage_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct CreatorBondingCurveAllocationUpdatedEvent {
    pub escrow_wallet: Pubkey,
    pub authority: Pubkey,
    pub allocation_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct EscrowAuthorityTransferredEvent {
    pub escrow_wallet: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CollectionAuthorityTransferredEvent {
    pub collection_config: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TakeoverProposalCreatedEvent {
    pub takeover_proposal: Pubkey,
    pub collection_config: Pubkey,
    pub proposer: Pubkey,
    pub proposal_type: u8,
    pub new_authority: Pubkey,
    pub description: String,
    pub timestamp: i64,
}

#[event]
pub struct TakeoverProposalVotedEvent {
    pub takeover_proposal: Pubkey,
    pub voter: Pubkey,
    pub vote: bool,
    pub votes_for: u64,
    pub votes_against: u64,
    pub timestamp: i64,
}

#[event]
pub struct BondingCurvePricingConfiguredEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub base_price_lamports: u64,
    pub price_increment_bps: u16,
    pub max_price_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct BondingCurveTierCreatedEvent {
    pub bonding_curve_tier: Pubkey,
    pub collection_config: Pubkey,
    pub tier_name: String,
    pub supply_limit: u64,
    pub price_multiplier_bps: u16,
    pub access_rules: u8,
    pub timestamp: i64,
}

#[event]
pub struct RevealFeeConfiguredEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub fee_enabled: bool,
    pub fee_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct NftRevealedWithFeeEvent {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub owner: Pubkey,
    pub reveal_fee: u64,
    pub platform_fee: u64,
    pub creator_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct TickerRegistryCapacityUpgradedEvent {
    pub ticker_registry: Pubkey,
    pub authority: Pubkey,
    pub new_capacity: usize,
    pub timestamp: i64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Collection is paused")]
    CollectionPaused,
    
    #[msg("Collection is sold out")]
    SoldOut,
    
    #[msg("Collection is already revealed")]
    AlreadyRevealed,
    
    #[msg("Reveal threshold not met")]
    RevealThresholdNotMet,
    
    #[msg("Invalid ticker length")]
    InvalidTickerLength,
    
    #[msg("Ticker already exists")]
    TickerAlreadyExists,
    
    #[msg("Ticker registry is full")]
    TickerRegistryFull,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Not authorized")]
    NotAuthorized,
    
    #[msg("Invalid mint record")]
    InvalidMintRecord,
    
    #[msg("Invalid percentage")]
    InvalidPercentage,
    
    #[msg("Proposal not active")]
    ProposalNotActive,
    
    #[msg("Too many voters")]
    TooManyVoters,
    
    #[msg("Bonding curve not enabled")]
    BondingCurveNotEnabled,
    
    #[msg("Reveal fee not enabled")]
    RevealFeeNotEnabled,
    
    #[msg("Capacity too large")]
    CapacityTooLarge,
    
    #[msg("Capacity too small")]
    CapacityTooSmall,
    
    #[msg("Invalid verification method")]
    InvalidVerificationMethod,
    
    #[msg("Social verification required")]
    SocialVerificationRequired,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Max mints per user exceeded")]
    MaxMintsPerUserExceeded,
    
    #[msg("Fee too high")]
    FeeTooHigh,
    
    #[msg("Insufficient followers")]
    InsufficientFollowers,
    
    #[msg("Invalid verification proof")]
    InvalidVerificationProof,
    
    #[msg("Invalid reveal data")]
    InvalidRevealData,
}
