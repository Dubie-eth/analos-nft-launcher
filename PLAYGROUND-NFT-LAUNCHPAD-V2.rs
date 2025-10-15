// ========================================
// ANALOS NFT LAUNCHPAD V2 - PLAYGROUND VERSION
// Phase 1: Core Blind Mint & Reveal (Upgradeable to Bubblegum later)
// ========================================
//
// DEPLOYMENT PLAN:
// Phase 1: Deploy this version (works in Playground, no external deps)
// Phase 2: Build full Bubblegum version locally
// Phase 3: Upgrade program to add compression
//
// INSTRUCTIONS:
// 1. Go to https://beta.solpg.io
// 2. Create new Anchor Rust project: "analos-nft-launchpad"
// 3. Replace lib.rs with this file
// 4. Click "Build" - Get Program ID
// 5. Update declare_id!() with your Program ID
// 6. Build again
// 7. Deploy to devnet
// 8. Export all 4 files (ID, Keypair, .so, IDL)

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    keccak,
    program::invoke_signed,
    system_instruction,
};

declare_id!("11111111111111111111111111111111"); // ⚠️ REPLACE AFTER FIRST BUILD

/// Fee system constants (6.9% total)
pub const PLATFORM_FEE_BPS: u16 = 250; // 2.5%
pub const BUYBACK_FEE_BPS: u16 = 150; // 1.5%
pub const DEV_FEE_BPS: u16 = 100; // 1.0%
pub const CREATOR_PREBUY_FEE_BPS: u16 = 200; // 2.0%
pub const POOL_CREATION_FEE_BPS: u16 = 190; // 1.9%
pub const TOTAL_FEE_BPS: u16 = 890; // 8.9% total
pub const ROYALTY_BPS: u16 = 500; // 5% royalties

/// Fee recipient wallets
pub const PLATFORM_WALLET: &str = "7axzrUvuYZ32bKLS5eVZC6okfJNVvz33eQc4RLNRpQPi";
pub const BUYBACK_WALLET: &str = "9ReqU29vEXtnQfMUp74CyfPwnKRUAKSDBzo8C62p2jo2";
pub const DEV_WALLET: &str = "GMYuGbRtSaPxviMXcnU8GLh6Yt6azxw1Y6JHNesU8MVr";

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    /// Initialize NFT collection with blind mint parameters
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        collection_name: String,
        collection_symbol: String,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        placeholder_uri: String,
    ) -> Result<()> {
        require!(max_supply <= 16384, ErrorCode::InvalidMaxSupply);
        require!(
            reveal_threshold <= max_supply && reveal_threshold > 0,
            ErrorCode::InvalidThreshold
        );

        let config = &mut ctx.accounts.collection_config;
        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.current_supply = 0;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_name = collection_name.clone();
        config.collection_symbol = collection_symbol.clone();
        config.placeholder_uri = placeholder_uri.clone();

        // Generate global randomness seed
        let clock = Clock::get()?;
        let seed_data = [
            &clock.unix_timestamp.to_le_bytes()[..],
            &clock.slot.to_le_bytes()[..],
            ctx.accounts.authority.key().as_ref(),
        ]
        .concat();
        config.global_seed = keccak::hash(&seed_data).to_bytes();

        // Initialize fee accumulation
        config.total_fees_collected = 0;
        config.creator_revenue = 0;

        emit!(CollectionInitializedEvent {
            collection: config.key(),
            authority: config.authority,
            name: collection_name,
            symbol: collection_symbol,
            max_supply,
            price_lamports,
            reveal_threshold,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "✅ Collection initialized: {} ({}) - Max: {}, Price: {} LOS",
            config.collection_name,
            config.collection_symbol,
            max_supply,
            price_lamports
        );

        Ok(())
    }

    /// Mint placeholder NFT (mystery box) - Blind mint phase
    pub fn mint_placeholder(ctx: Context<MintPlaceholder>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        // Validations
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);

        let mint_index = config.current_supply;
        let price = config.price_lamports;

        // Calculate fee distribution (8.9% total fees)
        let platform_fee = price * PLATFORM_FEE_BPS as u64 / 10000;
        let buyback_fee = price * BUYBACK_FEE_BPS as u64 / 10000;
        let dev_fee = price * DEV_FEE_BPS as u64 / 10000;
        let prebuy_fee = price * CREATOR_PREBUY_FEE_BPS as u64 / 10000;
        let pool_fee = price * POOL_CREATION_FEE_BPS as u64 / 10000;
        let total_fees = platform_fee + buyback_fee + dev_fee + prebuy_fee + pool_fee;
        let creator_amount = price - total_fees;

        // Transfer fees to respective wallets
        if platform_fee > 0 {
            transfer_lamports(
                &ctx.accounts.payer,
                &PLATFORM_WALLET.parse().unwrap(),
                platform_fee,
                &ctx.accounts.system_program,
            )?;
        }

        if buyback_fee > 0 {
            transfer_lamports(
                &ctx.accounts.payer,
                &BUYBACK_WALLET.parse().unwrap(),
                buyback_fee,
                &ctx.accounts.system_program,
            )?;
        }

        if dev_fee > 0 {
            transfer_lamports(
                &ctx.accounts.payer,
                &DEV_WALLET.parse().unwrap(),
                dev_fee,
                &ctx.accounts.system_program,
            )?;
        }

        // Transfer creator prebuy + pool creation fees to config PDA (held for later)
        let escrow_amount = prebuy_fee + pool_fee;
        if escrow_amount > 0 {
            let transfer_ix =
                system_instruction::transfer(ctx.accounts.payer.key, &config.key(), escrow_amount);
            invoke_signed(
                &transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    config.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
        }

        // Transfer creator revenue to config PDA
        if creator_amount > 0 {
            let transfer_ix =
                system_instruction::transfer(ctx.accounts.payer.key, &config.key(), creator_amount);
            invoke_signed(
                &transfer_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    config.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[],
            )?;
        }

        // Generate deterministic rarity score
        let rng_seed = [&config.global_seed[..], &mint_index.to_le_bytes()[..]].concat();
        let trait_hash = keccak::hash(&rng_seed);
        let rarity_score = u64::from_le_bytes(trait_hash.to_bytes()[0..8].try_into().unwrap()) % 100;

        // Store mint record
        let mint_record = &mut ctx.accounts.mint_record;
        mint_record.mint_index = mint_index;
        mint_record.minter = ctx.accounts.payer.key();
        mint_record.is_revealed = false;
        mint_record.rarity_score = rarity_score;
        mint_record.mint_timestamp = Clock::get()?.unix_timestamp;

        // Update config state
        config.current_supply += 1;
        config.total_fees_collected += total_fees;
        config.creator_revenue += creator_amount;

        emit!(MintEvent {
            mint_index,
            minter: ctx.accounts.payer.key(),
            price_paid: price,
            rarity_score,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "🎁 Minted Mystery Box #{} for {} - Hidden Rarity: {}",
            mint_index,
            ctx.accounts.payer.key(),
            rarity_score
        );

        Ok(())
    }

    /// Reveal the entire collection (admin only)
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
            collection: config.key(),
            total_minted: config.current_supply,
            revealed_uri: revealed_base_uri,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "🎉 Collection REVEALED! {} NFTs minted",
            config.current_supply
        );

        Ok(())
    }

    /// Reveal individual NFT (after collection reveal)
    pub fn reveal_nft(ctx: Context<RevealNft>) -> Result<()> {
        let config = &ctx.accounts.collection_config;
        require!(config.is_revealed, ErrorCode::NotRevealed);

        let mint_record = &mut ctx.accounts.mint_record;
        require!(!mint_record.is_revealed, ErrorCode::AlreadyRevealed);

        mint_record.is_revealed = true;

        // Determine rarity tier
        let rarity_tier = match mint_record.rarity_score {
            0..=4 => "Legendary", // 5% chance
            5..=19 => "Epic",     // 15% chance
            20..=49 => "Rare",    // 30% chance
            _ => "Common",        // 50% chance
        };

        emit!(NftRevealedEvent {
            mint_index: mint_record.mint_index,
            minter: mint_record.minter,
            rarity_tier: rarity_tier.to_string(),
            rarity_score: mint_record.rarity_score,
        });

        msg!(
            "✨ NFT #{} revealed: {} (score: {})",
            mint_record.mint_index,
            rarity_tier,
            mint_record.rarity_score
        );

        Ok(())
    }

    /// Withdraw creator funds (admin only)
    pub fn withdraw_creator_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.collection_config;

        let available = config.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(config.to_account_info().data_len());

        require!(
            available.checked_sub(amount).unwrap() >= rent_exempt,
            ErrorCode::InsufficientFunds
        );

        **config.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("💰 Withdrawn {} lamports to creator", amount);

        Ok(())
    }

    /// Pause/unpause minting (admin only)
    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
        ctx.accounts.collection_config.is_paused = paused;
        msg!("⏸️ Collection paused: {}", paused);
        Ok(())
    }

    /// Update collection config (admin only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_price: Option<u64>,
        new_reveal_threshold: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        if let Some(price) = new_price {
            config.price_lamports = price;
            msg!("💵 Updated price to {} lamports", price);
        }

        if let Some(threshold) = new_reveal_threshold {
            require!(threshold <= config.max_supply, ErrorCode::InvalidThreshold);
            config.reveal_threshold = threshold;
            msg!("🎯 Updated reveal threshold to {}", threshold);
        }

        Ok(())
    }
}

// Helper function for lamport transfers
fn transfer_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &Pubkey,
    amount: u64,
    system_program: &AccountInfo<'info>,
) -> Result<()> {
    let ix = system_instruction::transfer(from.key, to, amount);
    invoke_signed(&ix, &[from.clone(), system_program.clone()], &[])?;
    Ok(())
}

// ========== ACCOUNT STRUCTS ==========

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

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
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
        space = 8 + MintRecord::INIT_SPACE,
        seeds = [
            b"mint",
            collection_config.key().as_ref(),
            collection_config.current_supply.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub mint_record: Account<'info, MintRecord>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
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
pub struct RevealNft<'info> {
    #[account(
        seeds = [b"collection", collection_config.authority.as_ref()],
        bump,
    )]
    pub collection_config: Account<'info, CollectionConfig>,

    #[account(
        mut,
        seeds = [
            b"mint",
            collection_config.key().as_ref(),
            mint_record.mint_index.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub mint_record: Account<'info, MintRecord>,
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

// ========== STATE STRUCTS ==========

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
    pub total_fees_collected: u64,
    pub creator_revenue: u64,
    #[max_len(32)]
    pub collection_name: String,
    #[max_len(10)]
    pub collection_symbol: String,
    #[max_len(200)]
    pub placeholder_uri: String,
}

#[account]
#[derive(InitSpace)]
pub struct MintRecord {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub is_revealed: bool,
    pub rarity_score: u64,
    pub mint_timestamp: i64,
}

// ========== EVENTS ==========

#[event]
pub struct CollectionInitializedEvent {
    pub collection: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub max_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub timestamp: i64,
}

#[event]
pub struct MintEvent {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub price_paid: u64,
    pub rarity_score: u64,
    pub timestamp: i64,
}

#[event]
pub struct RevealEvent {
    pub collection: Pubkey,
    pub total_minted: u64,
    pub revealed_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct NftRevealedEvent {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub rarity_tier: String,
    pub rarity_score: u64,
}

// ========== ERROR CODES ==========

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
    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,
    #[msg("Invalid threshold value")]
    InvalidThreshold,
    #[msg("Invalid max supply (max 16,384)")]
    InvalidMaxSupply,
}

