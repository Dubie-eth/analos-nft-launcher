// ============================================================================
// ANALOS NAME SERVICE (ANS) - SOLANA PLAYGROUND VERSION
// ============================================================================
// Copy this entire file into Solana Playground's lib.rs
// This version is optimized for Playground compatibility
// ============================================================================

use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_name_service {
    use super::*;

    /// Register a new profile with username
    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
        profile_nft_mint: Pubkey,
        los_bros_mint: Option<Pubkey>,
        tier: u8,
    ) -> Result<()> {
        // Validate username
        require!(username.len() >= 3 && username.len() <= 20, ErrorCode::InvalidUsernameFormat);
        
        let username_lower = username.to_lowercase();
        let clock = Clock::get()?;

        // Check if username is already taken
        require!(
            ctx.accounts.username_registry.is_available,
            ErrorCode::UsernameAlreadyTaken
        );

        // Initialize Profile Registry
        let profile = &mut ctx.accounts.profile_registry;
        profile.version = 1;
        profile.wallet = ctx.accounts.user_wallet.key();
        profile.username = username_lower.clone();
        profile.profile_nft_mint = profile_nft_mint;
        profile.los_bros_mint = los_bros_mint;
        profile.tier = tier;
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.is_active = true;

        // Initialize Username Registry
        let username_reg = &mut ctx.accounts.username_registry;
        username_reg.version = 1;
        username_reg.username = username_lower.clone();
        username_reg.owner = ctx.accounts.user_wallet.key();
        username_reg.profile_registry = ctx.accounts.profile_registry.key();
        username_reg.registered_at = clock.unix_timestamp;
        username_reg.last_transferred_at = clock.unix_timestamp;
        username_reg.is_available = false;

        msg!("✅ ANS Profile registered: @{}", username_lower);

        Ok(())
    }

    /// Update profile (change Los Bros or tier)
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        los_bros_mint: Option<Pubkey>,
        new_tier: Option<u8>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        let clock = Clock::get()?;

        // Verify ownership
        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::UnauthorizedOwner
        );

        // Update fields
        if let Some(mint) = los_bros_mint {
            profile.los_bros_mint = Some(mint);
        }

        if let Some(tier) = new_tier {
            profile.tier = tier;
        }

        profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    /// Burn profile and release username
    pub fn burn_profile(ctx: Context<BurnProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        let username_reg = &mut ctx.accounts.username_registry;
        let clock = Clock::get()?;

        // Verify ownership
        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::UnauthorizedOwner
        );

        // Mark profile as inactive
        profile.is_active = false;
        profile.updated_at = clock.unix_timestamp;

        // Release username
        username_reg.is_available = true;

        msg!("✅ ANS Username released: @{}", username_reg.username);

        Ok(())
    }
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterProfile<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + 1 + 32 + 24 + 32 + 33 + 1 + 8 + 8 + 1,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + 1 + 24 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"username", username.to_lowercase().as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    pub user_wallet: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,
}

#[derive(Accounts)]
pub struct BurnProfile<'info> {
    pub user_wallet: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"username", profile_registry.username.as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
pub struct ProfileRegistry {
    pub version: u8,                    // 1
    pub wallet: Pubkey,                 // 32
    pub username: String,               // 4 + 20 = 24
    pub profile_nft_mint: Pubkey,       // 32
    pub los_bros_mint: Option<Pubkey>,  // 1 + 32 = 33
    pub tier: u8,                       // 1
    pub created_at: i64,                // 8
    pub updated_at: i64,                // 8
    pub is_active: bool,                // 1
}

#[account]
pub struct UsernameRegistry {
    pub version: u8,                    // 1
    pub username: String,               // 4 + 20 = 24
    pub owner: Pubkey,                  // 32
    pub profile_registry: Pubkey,       // 32
    pub registered_at: i64,             // 8
    pub last_transferred_at: i64,       // 8
    pub is_available: bool,             // 1
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Username is already taken")]
    UsernameAlreadyTaken,
    
    #[msg("Invalid username format (3-20 chars)")]
    InvalidUsernameFormat,
    
    #[msg("Not the profile owner")]
    UnauthorizedOwner,
}

