// ========================================
// ANALOS NFT LAUNCHPAD - COMPLETE VERSION
// With Full Integration: NFTs → Rarity → Tokens
// ========================================

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, program::invoke_signed, system_instruction};
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo};

declare_id!("AoWUv3isoKUFbcoBCSWPoTEJhUVP1TPyXgmYuMUxkA7h");

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    // ========== CORE COLLECTION MANAGEMENT ==========

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
        config.collection_name = collection_name;
        config.collection_symbol = collection_symbol;
        config.placeholder_uri = placeholder_uri;
        
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ].concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();

        msg!("Collection initialized: {}", config.collection_name);
        Ok(())
    }

    pub fn mint_placeholder(ctx: Context<MintPlaceholder>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;

        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);

        let transfer_ix = system_instruction::transfer(
            ctx.accounts.payer.key,
            &config.key(),
            config.price_lamports,
        );
        invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                config.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        let mint_index = config.current_supply;
        config.current_supply += 1;
        
        msg!("Minted #{} / {}", config.current_supply, config.max_supply);
        
        // Emit event with mint index for tracking
        emit!(NftMintedEvent {
            collection_config: config.key(),
            mint_index,
            minter: ctx.accounts.payer.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

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
        config.revealed_base_uri = revealed_base_uri;

        msg!("Collection revealed! Supply: {}", config.current_supply);
        
        emit!(CollectionRevealedEvent {
            collection_config: config.key(),
            total_supply: config.current_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // ========== NFT METADATA & TRACKING ==========

    /// Register an NFT mint with its metadata
    /// Called after user receives their NFT
    pub fn register_nft_mint(
        ctx: Context<RegisterNftMint>,
        nft_mint: Pubkey,
        mint_index: u64,
        metadata_uri: String,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        let config = &ctx.accounts.collection_config;
        
        require!(mint_index < config.current_supply, ErrorCode::InvalidMintIndex);
        
        nft_record.collection_config = config.key();
        nft_record.nft_mint = nft_mint;
        nft_record.mint_index = mint_index;
        nft_record.metadata_uri = metadata_uri;
        nft_record.owner = ctx.accounts.owner.key();
        nft_record.rarity_tier = None;
        nft_record.rarity_multiplier = None;
        nft_record.tokens_claimed = false;
        nft_record.is_burned = false;
        nft_record.created_at = Clock::get()?.unix_timestamp;
        
        msg!("NFT registered: {} at index {}", nft_mint, mint_index);
        Ok(())
    }

    // ========== RARITY INTEGRATION ==========

    /// Set rarity for an NFT (called by Rarity Oracle)
    pub fn set_nft_rarity(
        ctx: Context<SetNftRarity>,
        rarity_tier: u8,
        rarity_multiplier: u64,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        let config = &ctx.accounts.collection_config;
        
        require!(config.is_revealed, ErrorCode::NotRevealed);
        require!(nft_record.rarity_tier.is_none(), ErrorCode::RarityAlreadySet);
        
        nft_record.rarity_tier = Some(rarity_tier);
        nft_record.rarity_multiplier = Some(rarity_multiplier);
        
        emit!(RaritySetEvent {
            nft_mint: nft_record.nft_mint,
            rarity_tier,
            rarity_multiplier,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Rarity set: Tier {} with {}x multiplier", rarity_tier, rarity_multiplier);
        Ok(())
    }

    // ========== TOKEN DISTRIBUTION INTEGRATION ==========

    /// Mark tokens as claimed for an NFT
    /// Called by Token Launch program after distribution
    pub fn mark_tokens_claimed(
        ctx: Context<MarkTokensClaimed>,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        require!(!nft_record.tokens_claimed, ErrorCode::TokensAlreadyClaimed);
        require!(nft_record.rarity_multiplier.is_some(), ErrorCode::RarityNotSet);
        
        nft_record.tokens_claimed = true;
        
        emit!(TokensClaimedEvent {
            nft_mint: nft_record.nft_mint,
            rarity_multiplier: nft_record.rarity_multiplier.unwrap(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // ========== NFT BURNING / BUYBACK ==========

    /// Burn/buyback an NFT
    /// User burns NFT to get tokens back based on buyback price
    pub fn burn_nft_for_tokens(
        ctx: Context<BurnNftForTokens>,
    ) -> Result<()> {
        let nft_record = &mut ctx.accounts.nft_record;
        
        require!(!nft_record.is_burned, ErrorCode::AlreadyBurned);
        require!(nft_record.tokens_claimed, ErrorCode::TokensNotClaimed);
        require!(nft_record.rarity_multiplier.is_some(), ErrorCode::RarityNotSet);
        
        nft_record.is_burned = true;
        nft_record.burned_at = Some(Clock::get()?.unix_timestamp);
        
        emit!(NftBurnedEvent {
            nft_mint: nft_record.nft_mint,
            owner: ctx.accounts.owner.key(),
            rarity_multiplier: nft_record.rarity_multiplier.unwrap(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("NFT burned: {}", nft_record.nft_mint);
        Ok(())
    }

    // ========== QUERY FUNCTIONS ==========

    /// Get NFT details for token distribution calculations
    pub fn get_nft_details(
        ctx: Context<GetNftDetails>,
    ) -> Result<()> {
        let nft_record = &ctx.accounts.nft_record;
        
        msg!("NFT Details:");
        msg!("  Mint: {}", nft_record.nft_mint);
        msg!("  Index: {}", nft_record.mint_index);
        msg!("  Rarity Tier: {:?}", nft_record.rarity_tier);
        msg!("  Multiplier: {:?}", nft_record.rarity_multiplier);
        msg!("  Tokens Claimed: {}", nft_record.tokens_claimed);
        msg!("  Is Burned: {}", nft_record.is_burned);
        
        Ok(())
    }

    // ========== ADMIN FUNCTIONS ==========

    pub fn pause_collection(ctx: Context<ManageCollection>) -> Result<()> {
        ctx.accounts.collection_config.is_paused = true;
        msg!("Collection paused");
        Ok(())
    }

    pub fn resume_collection(ctx: Context<ManageCollection>) -> Result<()> {
        ctx.accounts.collection_config.is_paused = false;
        msg!("Collection resumed");
        Ok(())
    }

    pub fn withdraw_funds(
        ctx: Context<WithdrawFunds>,
        amount: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.collection_config;
        let config_lamports = config.to_account_info().lamports();
        
        require!(config_lamports >= amount, ErrorCode::InsufficientFunds);

        **ctx.accounts.collection_config.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Withdrawn: {} lamports", amount);
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
        seeds = [b"collection_config", authority.key().as_ref()],
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
        seeds = [b"collection_config", collection_config.authority.as_ref()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection_config", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterNftMint<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + NftRecord::INIT_SPACE,
        seeds = [b"nft_record", collection_config.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub nft_record: Account<'info, NftRecord>,
    
    #[account(
        seeds = [b"collection_config", collection_config.authority.as_ref()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    /// CHECK: The NFT mint account
    pub nft_mint: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetNftRarity<'info> {
    #[account(
        mut,
        seeds = [b"nft_record", nft_record.collection_config.as_ref(), nft_record.nft_mint.as_ref()],
        bump
    )]
    pub nft_record: Account<'info, NftRecord>,
    
    #[account(
        seeds = [b"collection_config", collection_config.authority.as_ref()],
        bump
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    /// CHECK: Rarity Oracle authority (CPI from Rarity Oracle program)
    pub rarity_oracle_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MarkTokensClaimed<'info> {
    #[account(
        mut,
        seeds = [b"nft_record", nft_record.collection_config.as_ref(), nft_record.nft_mint.as_ref()],
        bump
    )]
    pub nft_record: Account<'info, NftRecord>,
    
    /// CHECK: Token Launch authority (CPI from Token Launch program)
    pub token_launch_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BurnNftForTokens<'info> {
    #[account(
        mut,
        seeds = [b"nft_record", nft_record.collection_config.as_ref(), nft_record.nft_mint.as_ref()],
        bump,
        has_one = owner
    )]
    pub nft_record: Account<'info, NftRecord>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetNftDetails<'info> {
    #[account(
        seeds = [b"nft_record", nft_record.collection_config.as_ref(), nft_record.nft_mint.as_ref()],
        bump
    )]
    pub nft_record: Account<'info, NftRecord>,
}

#[derive(Accounts)]
pub struct ManageCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection_config", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        seeds = [b"collection_config", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub collection_config: Account<'info, CollectionConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    pub authority: Pubkey,           // 32
    pub max_supply: u64,             // 8
    pub price_lamports: u64,         // 8
    pub reveal_threshold: u64,       // 8
    pub current_supply: u64,         // 8
    pub is_revealed: bool,           // 1
    pub is_paused: bool,             // 1
    #[max_len(50)]
    pub collection_name: String,     // 4 + 50
    #[max_len(10)]
    pub collection_symbol: String,   // 4 + 10
    #[max_len(200)]
    pub placeholder_uri: String,     // 4 + 200
    #[max_len(200)]
    pub revealed_base_uri: String,   // 4 + 200
    pub global_seed: [u8; 32],       // 32
}

#[account]
#[derive(InitSpace)]
pub struct NftRecord {
    pub collection_config: Pubkey,   // 32
    pub nft_mint: Pubkey,            // 32
    pub mint_index: u64,             // 8
    #[max_len(200)]
    pub metadata_uri: String,        // 4 + 200
    pub owner: Pubkey,               // 32
    pub rarity_tier: Option<u8>,    // 2 (1 + 1)
    pub rarity_multiplier: Option<u64>, // 9 (1 + 8)
    pub tokens_claimed: bool,        // 1
    pub is_burned: bool,             // 1
    pub created_at: i64,             // 8
    pub burned_at: Option<i64>,      // 9 (1 + 8)
}

// ========== EVENTS ==========

#[event]
pub struct NftMintedEvent {
    pub collection_config: Pubkey,
    pub mint_index: u64,
    pub minter: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CollectionRevealedEvent {
    pub collection_config: Pubkey,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct RaritySetEvent {
    pub nft_mint: Pubkey,
    pub rarity_tier: u8,
    pub rarity_multiplier: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensClaimedEvent {
    pub nft_mint: Pubkey,
    pub rarity_multiplier: u64,
    pub timestamp: i64,
}

#[event]
pub struct NftBurnedEvent {
    pub nft_mint: Pubkey,
    pub owner: Pubkey,
    pub rarity_multiplier: u64,
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
    #[msg("Collection has not been revealed yet")]
    NotRevealed,
    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,
    #[msg("Invalid mint index")]
    InvalidMintIndex,
    #[msg("Rarity has already been set")]
    RarityAlreadySet,
    #[msg("Rarity has not been set yet")]
    RarityNotSet,
    #[msg("Tokens have already been claimed")]
    TokensAlreadyClaimed,
    #[msg("Tokens have not been claimed yet")]
    TokensNotClaimed,
    #[msg("NFT has already been burned")]
    AlreadyBurned,
}

