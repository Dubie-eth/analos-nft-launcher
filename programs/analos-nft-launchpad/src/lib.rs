use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, program::invoke_signed, system_instruction};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3,
        mpl_token_metadata::types::{Collection, Creator, DataV2},
        CreateMetadataAccountsV3, Metadata as MetadataProgram,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("BJcthd8WgvkFbncnb6TyaoLUrMv4R1X3fpPCdzD9PaHS");

/// Royalty basis points (500 = 5%)
pub const ROYALTY_BASIS_POINTS: u16 = 500;

/// Fee system constants
pub const PLATFORM_FEE_BASIS_POINTS: u16 = 250; // 2.5%
pub const BUYBACK_FEE_BASIS_POINTS: u16 = 150; // 1.5%
pub const DEV_FEE_BASIS_POINTS: u16 = 100; // 1.0%
pub const TOTAL_FEE_BASIS_POINTS: u16 = 500; // 5.0% total

/// Fee recipient addresses
pub const PLATFORM_WALLET: &str = "7axzrUvuYZ32bKLS5eVZC6okfJNVvz33eQc4RLNRpQPi"; // Platform revenue wallet
pub const BUYBACK_WALLET: &str = "9ReqU29vEXtnQfMUp74CyfPwnKRUAKSDBzo8C62p2jo2"; // $LOL buyback wallet
pub const DEV_WALLET: &str = "GMYuGbRtSaPxviMXcnU8GLh6Yt6azxw1Y6JHNesU8MVr"; // Developer maintenance wallet

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    /// Initialize the collection
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        collection_name: String,
        collection_symbol: String,
        placeholder_uri: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.current_supply = 0;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_mint = ctx.accounts.collection_mint.key();
        config.collection_name = collection_name;
        config.collection_symbol = collection_symbol;
        config.placeholder_uri = placeholder_uri;

        // Generate global seed for randomization
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ]
            .concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();

        msg!(
            "Collection initialized: {} ({}) - Max: {}, Price: {} lamports",
            config.collection_name,
            config.collection_symbol,
            max_supply,
            price_lamports
        );

        Ok(())
    }

    /// Mint a placeholder NFT (mystery box)
    pub fn mint_placeholder(ctx: Context<MintPlaceholder>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        // Validations
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(
            config.current_supply < config.max_supply,
            ErrorCode::SoldOut
        );

        let mint_index = config.current_supply;

        // Calculate fee distribution
        let total_fee = config.price_lamports * TOTAL_FEE_BASIS_POINTS as u64 / 10000;
        let platform_fee = config.price_lamports * PLATFORM_FEE_BASIS_POINTS as u64 / 10000;
        let buyback_fee = config.price_lamports * BUYBACK_FEE_BASIS_POINTS as u64 / 10000;
        let dev_fee = config.price_lamports * DEV_FEE_BASIS_POINTS as u64 / 10000;
        let creator_payment = config.price_lamports - total_fee;

        // Transfer payment to collection creator (95%)
        let creator_transfer_ix =
            system_instruction::transfer(ctx.accounts.payer.key, &config.key(), creator_payment);
        invoke_signed(
            &creator_transfer_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                config.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Transfer platform fee (2.5%)
        if platform_fee > 0 {
            let platform_wallet: Pubkey = PLATFORM_WALLET.parse().unwrap();
            let platform_transfer_ix = system_instruction::transfer(
                ctx.accounts.payer.key,
                &platform_wallet,
                platform_fee,
            );
            invoke_signed(
                &platform_transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
        }

        // Transfer buyback fee (1.5%)
        if buyback_fee > 0 {
            let buyback_wallet: Pubkey = BUYBACK_WALLET.parse().unwrap();
            let buyback_transfer_ix =
                system_instruction::transfer(ctx.accounts.payer.key, &buyback_wallet, buyback_fee);
            invoke_signed(
                &buyback_transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
        }

        // Transfer dev fee (1.0%)
        if dev_fee > 0 {
            let dev_wallet: Pubkey = DEV_WALLET.parse().unwrap();
            let dev_transfer_ix =
                system_instruction::transfer(ctx.accounts.payer.key, &dev_wallet, dev_fee);
            invoke_signed(
                &dev_transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
        }

        // Mint NFT to user
        let cpi_accounts = MintTo {
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: config.to_account_info(),
        };
        let seeds = &[
            b"collection".as_ref(),
            config.authority.as_ref(),
            &[ctx.bumps.collection_config],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        mint_to(cpi_ctx, 1)?;

        // Create metadata
        let creators = vec![Creator {
            address: config.authority,
            verified: false,
            share: 100,
        }];

        let data_v2 = DataV2 {
            name: format!("Analos Mystery #{}", mint_index),
            symbol: config.collection_symbol.clone(),
            uri: config.placeholder_uri.clone(),
            seller_fee_basis_points: ROYALTY_BASIS_POINTS,
            creators: Some(creators),
            collection: Some(Collection {
                verified: false,
                key: config.collection_mint,
            }),
            uses: None,
        };

        let create_metadata_accounts = CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata.to_account_info(),
            mint: ctx.accounts.nft_mint.to_account_info(),
            mint_authority: config.to_account_info(),
            payer: ctx.accounts.payer.to_account_info(),
            update_authority: config.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            create_metadata_accounts,
            signer_seeds,
        );

        create_metadata_accounts_v3(cpi_ctx, data_v2, true, true, None)?;

        config.current_supply += 1;

        emit!(MintEvent {
            mint_index,
            minter: ctx.accounts.payer.key(),
            nft_mint: ctx.accounts.nft_mint.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        emit!(FeeCollectionEvent {
            mint_index,
            total_payment: config.price_lamports,
            creator_payment,
            platform_fee,
            buyback_fee,
            dev_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Minted NFT #{} for {} - Fees: Platform: {} lamports, Buyback: {} lamports, Dev: {} lamports", 
            mint_index, ctx.accounts.payer.key(), platform_fee, buyback_fee, dev_fee);

        Ok(())
    }

    /// Trigger reveal
    pub fn reveal_collection(
        ctx: Context<RevealCollection>,
        revealed_base_uri: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        require!(!config.is_revealed, ErrorCode::AlreadyRevealed);
        require!(
            config.current_supply >= config.reveal_threshold,
            ErrorCode::ThresholdNotMet
        );

        config.is_revealed = true;
        config.placeholder_uri = revealed_base_uri.clone();

        emit!(RevealEvent {
            timestamp: Clock::get()?.unix_timestamp,
            total_minted: config.current_supply,
            revealed_base_uri,
        });

        msg!("Collection revealed! Total: {}", config.current_supply);

        Ok(())
    }

    /// Withdraw funds (admin only)
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.collection_config;

        let config_lamports = config.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(config.to_account_info().data_len());

        require!(
            config_lamports.checked_sub(amount).unwrap() >= rent_exempt,
            ErrorCode::InsufficientFunds
        );

        **config.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        msg!("Withdrawn {} lamports", amount);

        Ok(())
    }

    /// Pause/unpause minting
    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
        ctx.accounts.collection_config.is_paused = paused;
        msg!("Collection paused: {}", paused);
        Ok(())
    }

    /// Update config
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_price: Option<u64>,
        new_reveal_threshold: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        if let Some(price) = new_price {
            config.price_lamports = price;
            msg!("Updated price: {}", price);
        }

        if let Some(threshold) = new_reveal_threshold {
            require!(threshold <= config.max_supply, ErrorCode::InvalidThreshold);
            config.reveal_threshold = threshold;
            msg!("Updated threshold: {}", threshold);
        }

        Ok(())
    }
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CollectionConfig::INIT_SPACE,
        seeds = [b"collection", authority.key().as_ref()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection_config,
        mint::freeze_authority = collection_config,
    )]
    pub collection_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintPlaceholder<'info> {
    #[account(
        mut,
        seeds = [b"collection", collection_config.authority.as_ref()],
        bump,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = collection_config,
        mint::freeze_authority = collection_config,
    )]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = nft_mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: Created by Metaplex
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub metadata_program: Program<'info, MetadataProgram>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RevealCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPause<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"collection", authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    pub authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub current_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    pub global_seed: [u8; 32],
    pub collection_mint: Pubkey,
    #[max_len(32)]
    pub collection_name: String,
    #[max_len(10)]
    pub collection_symbol: String,
    #[max_len(200)]
    pub placeholder_uri: String,
}

// ========== EVENTS ==========

#[event]
pub struct MintEvent {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub nft_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RevealEvent {
    pub timestamp: i64,
    pub total_minted: u64,
    pub revealed_base_uri: String,
}

#[event]
pub struct FeeCollectionEvent {
    pub mint_index: u64,
    pub total_payment: u64,
    pub creator_payment: u64,
    pub platform_fee: u64,
    pub buyback_fee: u64,
    pub dev_fee: u64,
    pub timestamp: i64,
}

// ========== ERRORS ==========

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
    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,
    #[msg("Invalid threshold value")]
    InvalidThreshold,
}