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
use mpl_token_metadata::{
    instructions::{CreateMetadataAccountV3, create_metadata_account_v3},
    types::{DataV2, Creator, Collection},
};

declare_id!("7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk");

/// Fee distribution constants (6% to LOL ecosystem)
pub const FEE_DEV_TEAM_BPS: u16 = 100;           // 1% to dev team
pub const FEE_POOL_CREATION_BPS: u16 = 200;      // 2% for pool creation
pub const FEE_LOL_BUYBACK_BURN_BPS: u16 = 100;   // 1% for LOL buyback and burns
pub const FEE_PLATFORM_MAINT_BPS: u16 = 100;     // 1% for platform maintenance
pub const FEE_LOL_COMMUNITY_BPS: u16 = 100;      // 1% for LOL community rewards
pub const FEE_TOTAL_BPS: u16 = 600;              // 6% total to LOL ecosystem

/// Creator allocation (25% total)
pub const CREATOR_TOTAL_BPS: u16 = 2500;         // 25% total
pub const CREATOR_IMMEDIATE_BPS: u16 = 1000;     // 10% immediate
pub const CREATOR_VESTED_BPS: u16 = 1500;        // 15% vested over 1 year

/// Pool allocation (69% to liquidity pool)
pub const POOL_ALLOCATION_BPS: u16 = 6900;       // 69% to pool

/// Fee recipient wallets
pub const DEV_TEAM_WALLET: Pubkey = pubkey!("Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D");
pub const POOL_CREATION_WALLET: Pubkey = pubkey!("myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q");
pub const LOL_BUYBACK_BURN_WALLET: Pubkey = pubkey!("7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721");
pub const PLATFORM_MAINT_WALLET: Pubkey = pubkey!("myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q");
pub const LOL_COMMUNITY_WALLET: Pubkey = pubkey!("7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721");

/// Ticker system constants
pub const MAX_TICKER_LENGTH: usize = 10;
pub const MAX_TICKERS_IN_REGISTRY: usize = 1000;

/// Fee caps
pub const MAX_TRADING_FEE_BPS: u16 = 690; // 6.9% maximum
pub const MAX_MINT_FEE_BPS: u16 = 690;    // 6.9% maximum

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    /// Initialize the collection with ALL features
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        collection_name: String,
        collection_symbol: String,
        placeholder_uri: String,
        max_mints_per_user: Option<u64>,
        mint_rate_limit_seconds: Option<u64>,
        social_verification_required: Option<bool>,
        bonding_curve_enabled: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        
        // Validate ticker
        let ticker_upper = collection_symbol.to_uppercase();
        require!(
            ticker_upper.len() >= 1 && ticker_upper.len() <= MAX_TICKER_LENGTH,
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

        // Initialize collection config with ALL features
        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.current_supply = 0;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_mint = ctx.accounts.collection_mint.key();
        config.collection_name = collection_name;
        config.collection_symbol = ticker_upper;
        config.placeholder_uri = placeholder_uri;

        // Enhanced features
        config.max_mints_per_user = max_mints_per_user.unwrap_or(u64::MAX);
        config.mint_rate_limit_seconds = mint_rate_limit_seconds.unwrap_or(60);
        config.social_verification_required = social_verification_required.unwrap_or(false);
        config.bonding_curve_enabled = bonding_curve_enabled.unwrap_or(false);

        // Fee tracking
        config.total_volume = 0;
        config.current_platform_fee_bps = 414; // 4.14% early
        config.current_bonding_curve_platform_fee_bps = 552; // 5.52% early

        // Bonding curve pricing
        config.bonding_curve_base_price = price_lamports;
        config.bonding_curve_price_increment_bps = 100; // 1% increment
        config.bonding_curve_max_price = price_lamports * 10; // 10x max

        // Reveal fee
        config.reveal_fee_enabled = false;
        config.reveal_fee_lamports = 0;
        config.total_reveals = 0;

        // Initialize escrow wallet
        let escrow = &mut ctx.accounts.escrow_wallet;
        escrow.collection_config = ctx.accounts.collection_config.key();
        escrow.authority = ctx.accounts.authority.key();
        escrow.balance = 0;
        escrow.creator_share_percentage = CREATOR_TOTAL_BPS; // 25% default
        escrow.bonding_curve_reserve = 0;
        escrow.creator_bc_allocation_bps = 0; // 0% default

        // Generate global seed for randomization
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ].concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();

        msg!("Collection initialized with ALL features: {} ({})", 
            config.collection_name, config.collection_symbol);

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

    /// Mint placeholder NFT with fee distribution
    pub fn mint_placeholder(ctx: Context<MintPlaceholder>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let escrow = &mut ctx.accounts.escrow_wallet;

        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);

        let mint_index = config.current_supply;
        let mint_price = config.price_lamports;

        // Calculate and distribute fees (6% to LOL ecosystem)
        let dev_fee = mint_price.checked_mul(FEE_DEV_TEAM_BPS as u64).unwrap().checked_div(10000).unwrap();
        let pool_creation_fee = mint_price.checked_mul(FEE_POOL_CREATION_BPS as u64).unwrap().checked_div(10000).unwrap();
        let buyback_fee = mint_price.checked_mul(FEE_LOL_BUYBACK_BURN_BPS as u64).unwrap().checked_div(10000).unwrap();
        let maint_fee = mint_price.checked_mul(FEE_PLATFORM_MAINT_BPS as u64).unwrap().checked_div(10000).unwrap();
        let community_fee = mint_price.checked_mul(FEE_LOL_COMMUNITY_BPS as u64).unwrap().checked_div(10000).unwrap();
        
        let total_fees = dev_fee + pool_creation_fee + buyback_fee + maint_fee + community_fee;
        let remaining_amount = mint_price.checked_sub(total_fees).unwrap();

        // Transfer payment to escrow
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
        Self::distribute_fees(
            &escrow.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            dev_fee,
            pool_creation_fee,
            buyback_fee,
            maint_fee,
            community_fee,
        )?;

        // Calculate creator and bonding curve allocation
        let creator_allocation = remaining_amount.checked_mul(escrow.creator_share_percentage as u64).unwrap().checked_div(10000).unwrap();
        let bonding_curve_allocation = remaining_amount.checked_mul(escrow.creator_bc_allocation_bps as u64).unwrap().checked_div(10000).unwrap();
        let pool_allocation = remaining_amount.checked_sub(creator_allocation).unwrap().checked_sub(bonding_curve_allocation).unwrap();

        // Update escrow balance and reserves
        escrow.balance = escrow.balance.checked_add(creator_allocation).unwrap();
        escrow.bonding_curve_reserve = escrow.bonding_curve_reserve.checked_add(bonding_curve_allocation).unwrap();

        // Update volume tracking
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

        config.current_supply = config.current_supply.checked_add(1).unwrap();

        msg!("Minted NFT #{} with ALL features enabled", mint_index);

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

    /// Reveal collection
    pub fn reveal_collection(ctx: Context<RevealCollection>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(!config.is_revealed, ErrorCode::AlreadyRevealed);
        require!(config.current_supply >= config.reveal_threshold, ErrorCode::RevealThresholdNotMet);

        config.is_revealed = true;
        msg!("Collection revealed! {} NFTs", config.current_supply);

        emit!(CollectionRevealedEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            revealed_supply: config.current_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Burn NFT (user can burn their own)
    pub fn burn_nft(ctx: Context<BurnNft>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        let mint_record = &ctx.accounts.mint_record;

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

        msg!("NFT #{} burned", mint_record.mint_index);

        emit!(NftBurnedEvent {
            collection_config: config.key(),
            mint_index: mint_record.mint_index,
            owner: ctx.accounts.owner.key(),
            mint_address: ctx.accounts.mint.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw from escrow
    pub fn withdraw_from_escrow(ctx: Context<WithdrawFromEscrow>, amount: u64) -> Result<()> {
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

        msg!("Withdrew {} lamports from escrow", amount);

        emit!(EscrowWithdrawalEvent {
            escrow_wallet: escrow.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set pause state
    pub fn set_pause(ctx: Context<SetPause>, is_paused: bool) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.is_paused = is_paused;

        msg!("Collection pause set to: {}", is_paused);

        emit!(CollectionPauseToggledEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            is_paused,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set creator share percentage
    pub fn set_creator_share_percentage(ctx: Context<SetCreatorSharePercentage>, percentage_bps: u16) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        require!(percentage_bps <= CREATOR_TOTAL_BPS, ErrorCode::InvalidPercentage);
        
        escrow.creator_share_percentage = percentage_bps;

        msg!("Creator share set to {} bps", percentage_bps);

        emit!(CreatorSharePercentageUpdatedEvent {
            escrow_wallet: escrow.key(),
            authority: ctx.accounts.authority.key(),
            percentage_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Set creator bonding curve allocation
    pub fn set_creator_bonding_curve_allocation(ctx: Context<SetCreatorBondingCurveAllocation>, allocation_bps: u16) -> Result<()> {
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
    pub fn transfer_escrow_authority(ctx: Context<TransferEscrowAuthority>, new_authority: Pubkey) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_wallet;
        require!(ctx.accounts.authority.key() == escrow.authority, ErrorCode::NotAuthorized);
        
        escrow.authority = new_authority;

        msg!("Escrow authority transferred to {}", new_authority);

        emit!(EscrowAuthorityTransferredEvent {
            escrow_wallet: escrow.key(),
            old_authority: ctx.accounts.authority.key(),
            new_authority,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Transfer collection authority
    pub fn transfer_collection_authority(ctx: Context<TransferCollectionAuthority>, new_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        
        config.authority = new_authority;

        msg!("Collection authority transferred to {}", new_authority);

        emit!(CollectionAuthorityTransferredEvent {
            collection_config: config.key(),
            old_authority: ctx.accounts.authority.key(),
            new_authority,
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

        msg!("Bonding curve pricing configured");

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

    /// Configure reveal fee
    pub fn configure_reveal_fee(ctx: Context<ConfigureRevealFee>, fee_enabled: bool, fee_lamports: Option<u64>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(ctx.accounts.authority.key() == config.authority, ErrorCode::NotAuthorized);
        
        config.reveal_fee_enabled = fee_enabled;
        config.reveal_fee_lamports = fee_lamports.unwrap_or(0);
        config.total_reveals = 0;

        msg!("Reveal fee configured: enabled={}, amount={}", fee_enabled, config.reveal_fee_lamports);

        emit!(RevealFeeConfiguredEvent {
            collection_config: config.key(),
            authority: ctx.accounts.authority.key(),
            fee_enabled,
            fee_lamports: config.reveal_fee_lamports,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Upgrade ticker registry capacity
    pub fn upgrade_ticker_registry_capacity(ctx: Context<UpgradeTickerRegistryCapacity>, new_capacity: usize) -> Result<()> {
        let registry = &mut ctx.accounts.ticker_registry;
        require!(ctx.accounts.authority.key() == registry.authority, ErrorCode::NotAuthorized);
        require!(new_capacity <= 10000, ErrorCode::CapacityTooLarge);
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

    // Helper function to distribute fees
    fn distribute_fees(
        escrow: &AccountInfo,
        system_program: AccountInfo,
        dev_fee: u64,
        pool_creation_fee: u64,
        buyback_fee: u64,
        maint_fee: u64,
        community_fee: u64,
    ) -> Result<()> {
        // Distribute to dev team
        let dev_transfer = system_instruction::transfer(&escrow.key(), &DEV_TEAM_WALLET, dev_fee);
        invoke_signed(&dev_transfer, &[escrow.clone(), system_program.clone()], &[])?;

        // Distribute to pool creation
        let pool_transfer = system_instruction::transfer(&escrow.key(), &POOL_CREATION_WALLET, pool_creation_fee);
        invoke_signed(&pool_transfer, &[escrow.clone(), system_program.clone()], &[])?;

        // Distribute to buyback
        let buyback_transfer = system_instruction::transfer(&escrow.key(), &LOL_BUYBACK_BURN_WALLET, buyback_fee);
        invoke_signed(&buyback_transfer, &[escrow.clone(), system_program.clone()], &[])?;

        // Distribute to maintenance
        let maint_transfer = system_instruction::transfer(&escrow.key(), &PLATFORM_MAINT_WALLET, maint_fee);
        invoke_signed(&maint_transfer, &[escrow.clone(), system_program.clone()], &[])?;

        // Distribute to community
        let community_transfer = system_instruction::transfer(&escrow.key(), &LOL_COMMUNITY_WALLET, community_fee);
        invoke_signed(&community_transfer, &[escrow.clone(), system_program.clone()], &[])?;

        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
#[instruction(max_supply: u64, price_lamports: u64, reveal_threshold: u64, collection_name: String, collection_symbol: String, placeholder_uri: String)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CollectionConfig::INIT_SPACE,
        seeds = [b"collection_config", collection_symbol.as_bytes()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + EscrowWallet::INIT_SPACE,
        seeds = [b"escrow_wallet", collection_symbol.as_bytes()],
        bump
    )]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + TickerRegistry::INIT_SPACE,
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
        space = 8 + MintRecord::INIT_SPACE,
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
pub struct WithdrawFromEscrow<'info> {
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,

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
    #[account(mut, has_one = authority)]
    pub escrow_wallet: Account<'info, EscrowWallet>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferCollectionAuthority<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfigureBondingCurvePricing<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConfigureRevealFee<'info> {
    #[account(mut, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpgradeTickerRegistryCapacity<'info> {
    #[account(mut, has_one = authority)]
    pub ticker_registry: Account<'info, TickerRegistry>,

    pub authority: Signer<'info>,
}

// Account data structures
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
    pub collection_mint: Pubkey,
    #[max_len(100)]
    pub collection_name: String,
    #[max_len(20)]
    pub collection_symbol: String,
    #[max_len(200)]
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
}

#[account]
#[derive(InitSpace)]
pub struct EscrowWallet {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub balance: u64,
    pub creator_share_percentage: u16,
    pub bonding_curve_reserve: u64,
    pub creator_bc_allocation_bps: u16,
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
#[derive(InitSpace)]
pub struct TickerRegistry {
    pub authority: Pubkey,
    pub tickers: Vec<[u8; MAX_TICKER_LENGTH]>,
    pub max_capacity: usize,
}

// Events
#[event]
pub struct CollectionInitializedEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub max_supply: u64,
    pub price_lamports: u64,
    #[max_len(20)]
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
pub struct NftBurnedEvent {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub owner: Pubkey,
    pub mint_address: Pubkey,
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
pub struct BondingCurvePricingConfiguredEvent {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub base_price_lamports: u64,
    pub price_increment_bps: u16,
    pub max_price_lamports: u64,
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
    
    #[msg("Bonding curve not enabled")]
    BondingCurveNotEnabled,
    
    #[msg("Capacity too large")]
    CapacityTooLarge,
    
    #[msg("Capacity too small")]
    CapacityTooSmall,
}
