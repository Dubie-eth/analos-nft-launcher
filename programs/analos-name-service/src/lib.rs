use anchor_lang::prelude::*;

// This will be replaced with your actual program ID after deployment on Analos
declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_name_service {
    use super::*;

    /// Register a new profile with username
    /// This atomically reserves the username and creates the profile registry
    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
        profile_nft_mint: Pubkey,
        los_bros_mint: Option<Pubkey>,
        tier: u8,
    ) -> Result<()> {
        // Validate username
        validate_username(&username)?;

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

        msg!("✅ ANS Profile registered: @{} → {}", username_lower, ctx.accounts.user_wallet.key());
        msg!("📍 Profile PDA: {}", ctx.accounts.profile_registry.key());
        msg!("📍 Username PDA: {}", ctx.accounts.username_registry.key());

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
            msg!("Updated Los Bros mint: {}", mint);
        }

        if let Some(tier) = new_tier {
            profile.tier = tier;
            msg!("Updated tier: {}", tier);
        }

        profile.updated_at = clock.unix_timestamp;

        msg!("✅ ANS Profile updated: @{}", profile.username);

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

        msg!("✅ ANS Profile burned, username released: @{}", username_reg.username);

        Ok(())
    }

    /// Transfer username to new wallet (requires both signatures)
    pub fn transfer_username(ctx: Context<TransferUsername>) -> Result<()> {
        let old_profile = &mut ctx.accounts.old_profile_registry;
        let new_profile = &mut ctx.accounts.new_profile_registry;
        let username_reg = &mut ctx.accounts.username_registry;
        let clock = Clock::get()?;

        // Verify current owner
        require!(
            old_profile.wallet == ctx.accounts.current_owner.key(),
            ErrorCode::UnauthorizedOwner
        );

        // Mark old profile as inactive
        old_profile.is_active = false;
        old_profile.updated_at = clock.unix_timestamp;

        // Update username registry
        username_reg.owner = ctx.accounts.new_owner.key();
        username_reg.profile_registry = new_profile.key();
        username_reg.last_transferred_at = clock.unix_timestamp;

        msg!("✅ ANS Username transferred: @{} → {}", username_reg.username, ctx.accounts.new_owner.key());

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
        space = 8 + 1 + 32 + 4 + 20 + 32 + 1 + 32 + 1 + 8 + 8 + 1,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + 1 + 4 + 20 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"username", username.to_lowercase().as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
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
    #[account(mut)]
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

#[derive(Accounts)]
pub struct TransferUsername<'info> {
    pub current_owner: Signer<'info>,
    pub new_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", current_owner.key().as_ref()],
        bump
    )]
    pub old_profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"profile", new_owner.key().as_ref()],
        bump
    )]
    pub new_profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"username", username_registry.username.as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

/// Profile Registry Account
/// PDA: seeds = [b"profile", wallet_pubkey]
#[account]
pub struct ProfileRegistry {
    /// Version for upgradability
    pub version: u8,
    
    /// Owner wallet address
    pub wallet: Pubkey,
    
    /// Username (lowercase, 3-20 chars)
    pub username: String,
    
    /// Profile NFT mint address
    pub profile_nft_mint: Pubkey,
    
    /// Los Bros NFT mint (optional)
    pub los_bros_mint: Option<Pubkey>,
    
    /// Tier (0=basic, 1=common, 2=rare, 3=epic, 4=legendary)
    pub tier: u8,
    
    /// Mint timestamp
    pub created_at: i64,
    
    /// Last update timestamp
    pub updated_at: i64,
    
    /// Is active (false if burned)
    pub is_active: bool,
}

/// Username Registry Account
/// PDA: seeds = [b"username", username_bytes]
#[account]
pub struct UsernameRegistry {
    /// Version for upgradability
    pub version: u8,
    
    /// Username (lowercase)
    pub username: String,
    
    /// Current owner wallet
    pub owner: Pubkey,
    
    /// Profile registry PDA
    pub profile_registry: Pubkey,
    
    /// Registration timestamp
    pub registered_at: i64,
    
    /// Last transfer timestamp
    pub last_transferred_at: i64,
    
    /// Is available (false if reserved)
    pub is_available: bool,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Username is already taken")]
    UsernameAlreadyTaken,
    
    #[msg("Invalid username format (3-20 chars, alphanumeric + underscore only)")]
    InvalidUsernameFormat,
    
    #[msg("Username must start with a letter")]
    UsernameMustStartWithLetter,
    
    #[msg("Not the profile owner")]
    UnauthorizedOwner,
    
    #[msg("Profile is not active")]
    ProfileNotActive,
}

// ============================================================================
// HELPERS
// ============================================================================

/// Validate username format
fn validate_username(username: &str) -> Result<()> {
    let len = username.len();
    
    // Length check
    require!(
        len >= 3 && len <= 20,
        ErrorCode::InvalidUsernameFormat
    );

    // Character check (alphanumeric + underscore only)
    for c in username.chars() {
        require!(
            c.is_ascii_alphanumeric() || c == '_',
            ErrorCode::InvalidUsernameFormat
        );
    }

    // Must start with letter
    if let Some(first) = username.chars().next() {
        require!(
            first.is_ascii_alphabetic(),
            ErrorCode::UsernameMustStartWithLetter
        );
    }

    Ok(())
}

