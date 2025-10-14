// ========================================
// ANALOS NFT LAUNCHPAD - PLAYGROUND VERSION
// Optimized for Solana Playground
// ========================================

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, program::invoke_signed, system_instruction};

declare_id!("11111111111111111111111111111111"); // Update after first build!

#[program]
pub mod analos_nft_launchpad {
    use super::*;

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

        config.current_supply += 1;
        
        msg!("Minted #{} / {}", config.current_supply, config.max_supply);
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
        Ok(())
    }

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
}
