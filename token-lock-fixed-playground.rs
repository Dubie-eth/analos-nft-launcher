use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("2uC6uKrog2umA59HVbKzDFjQvzGdyfkDtwm8Cq92euH7");

/// Enhanced Token Lock Program with Advanced Security Features
#[program]
pub mod analos_token_lock_enhanced {
    use super::*;

    /// Initialize the program state (call this first)
    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
        emergency_authority: Pubkey,
    ) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.is_paused = false;
        program_state.emergency_authority = emergency_authority;
        program_state.paused_at = 0;
        program_state.paused_by = Pubkey::default();
        program_state.resumed_at = 0;
        program_state.resumed_by = Pubkey::default();
        program_state.next_nonce = 0;

        msg!("✅ Program initialized with emergency authority: {}", emergency_authority);
        Ok(())
    }

    /// Create a token lock with enhanced security
    pub fn create_lock(
        ctx: Context<CreateLock>,
        amount: u64,
        unlock_time: i64,
        is_extendable: bool,
        label: String,
    ) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.program_state.is_paused, ErrorCode::ProgramPaused);
        
        // Rate limiting check
        check_rate_limit(&mut ctx.accounts.rate_limit, 10, 3600)?; // 10 locks per hour
        
        // Input validation
        let current_time = Clock::get()?.unix_timestamp;
        require!(unlock_time > current_time, ErrorCode::InvalidUnlockTime);
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(label.len() <= 64, ErrorCode::LabelTooLong);
        
        let lock = &mut ctx.accounts.lock_account;
        lock.owner = ctx.accounts.owner.key();
        lock.token_account = ctx.accounts.token_account.key();
        lock.token_mint = ctx.accounts.token_account.mint;
        lock.amount = amount;
        lock.unlock_time = unlock_time;
        lock.created_at = current_time;
        lock.is_extendable = is_extendable;
        lock.is_unlocked = false;
        lock.is_paused = false;
        lock.label = label.clone();
        lock.nonce = ctx.accounts.program_state.next_nonce;
        
        // Update program state
        ctx.accounts.program_state.next_nonce = ctx.accounts.program_state.next_nonce.saturating_add(1);
        
        // Transfer tokens to lock
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        emit!(LockCreatedEvent {
            lock_account: lock.key(),
            owner: lock.owner,
            amount,
            unlock_time,
            is_extendable,
            label: label.clone(),
            created_at: current_time,
            nonce: lock.nonce,
        });
        
        msg!("🔒 Locked {} tokens until {} ({})", amount, unlock_time, label);
        Ok(())
    }

    /// Extend lock period with enhanced security
    pub fn extend_lock(
        ctx: Context<ExtendLock>,
        new_unlock_time: i64,
    ) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.program_state.is_paused, ErrorCode::ProgramPaused);
        
        // Rate limiting check
        check_rate_limit(&mut ctx.accounts.rate_limit, 5, 3600)?; // 5 extensions per hour
        
        // Read all values BEFORE mutable borrow
        let is_extendable = ctx.accounts.lock_account.is_extendable;
        let is_unlocked = ctx.accounts.lock_account.is_unlocked;
        let unlock_time = ctx.accounts.lock_account.unlock_time;
        let owner = ctx.accounts.lock_account.owner;
        let nonce = ctx.accounts.lock_account.nonce;
        
        require!(is_extendable, ErrorCode::NotExtendable);
        require!(!is_unlocked, ErrorCode::AlreadyUnlocked);
        require!(new_unlock_time > unlock_time, ErrorCode::InvalidExtension);
        
        // Update state
        let lock = &mut ctx.accounts.lock_account;
        lock.unlock_time = new_unlock_time;
        
        emit!(LockExtendedEvent {
            lock_account: lock.key(),
            owner,
            old_unlock_time: unlock_time,
            new_unlock_time,
            extended_at: Clock::get()?.unix_timestamp,
            nonce,
        });
        
        msg!("⏰ Extended lock from {} to {}", unlock_time, new_unlock_time);
        Ok(())
    }

    /// Unlock tokens with enhanced security
    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.program_state.is_paused, ErrorCode::ProgramPaused);
        
        // Rate limiting check
        check_rate_limit(&mut ctx.accounts.rate_limit, 5, 3600)?; // 5 unlocks per hour
        
        let current_time = Clock::get()?.unix_timestamp;
        
        // Read all values BEFORE mutable borrow
        let is_unlocked = ctx.accounts.lock_account.is_unlocked;
        let unlock_time = ctx.accounts.lock_account.unlock_time;
        let amount = ctx.accounts.lock_account.amount;
        let owner = ctx.accounts.lock_account.owner;
        let nonce = ctx.accounts.lock_account.nonce;
        
        require!(current_time >= unlock_time, ErrorCode::StillLocked);
        require!(!is_unlocked, ErrorCode::AlreadyUnlocked);
        
        // Update state
        let lock = &mut ctx.accounts.lock_account;
        lock.is_unlocked = true;
        
        // Transfer tokens back to owner
        let seeds = &[
            b"lock",
            owner.as_ref(),
            lock.token_mint.as_ref(),
            &[ctx.bumps.lock_account],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: lock.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer
        );
        token::transfer(cpi_ctx, amount)?;
        
        emit!(TokensUnlockedEvent {
            lock_account: lock.key(),
            owner,
            amount,
            unlocked_at: current_time,
            nonce,
        });
        
        msg!("🔓 Unlocked {} tokens", amount);
        Ok(())
    }

    /// Emergency unlock with enhanced security
    pub fn emergency_unlock(
        ctx: Context<EmergencyUnlock>,
        penalty_bps: u16,
    ) -> Result<()> {
        // Check if program is paused
        require!(!ctx.accounts.program_state.is_paused, ErrorCode::ProgramPaused);
        
        // Read all values BEFORE mutable borrow
        let is_unlocked = ctx.accounts.lock_account.is_unlocked;
        let amount = ctx.accounts.lock_account.amount;
        let owner = ctx.accounts.lock_account.owner;
        let nonce = ctx.accounts.lock_account.nonce;
        
        require!(!is_unlocked, ErrorCode::AlreadyUnlocked);
        require!(penalty_bps <= 5000, ErrorCode::PenaltyTooHigh); // Max 50% penalty
        
        let penalty_amount = (amount as u128 * penalty_bps as u128 / 10000) as u64;
        let return_amount = amount - penalty_amount;
        
        // Update state
        let lock = &mut ctx.accounts.lock_account;
        lock.is_unlocked = true;
        
        // Transfer tokens back minus penalty
        let seeds = &[
            b"lock",
            owner.as_ref(),
            lock.token_mint.as_ref(),
            &[ctx.bumps.lock_account],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: lock.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer
        );
        token::transfer(cpi_ctx, return_amount)?;
        
        emit!(EmergencyUnlockEvent {
            lock_account: lock.key(),
            owner,
            returned_amount: return_amount,
            penalty_amount,
            penalty_bps,
            unlocked_at: Clock::get()?.unix_timestamp,
            nonce,
        });
        
        msg!("⚠️ Emergency unlock: {} returned, {} penalty", return_amount, penalty_amount);
        Ok(())
    }

    /// Emergency pause function
    pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
        require!(ctx.accounts.program_state.emergency_authority == ctx.accounts.emergency_authority.key(), ErrorCode::Unauthorized);
        require!(!ctx.accounts.program_state.is_paused, ErrorCode::AlreadyPaused);
        
        ctx.accounts.program_state.is_paused = true;
        ctx.accounts.program_state.paused_at = Clock::get()?.unix_timestamp;
        ctx.accounts.program_state.paused_by = ctx.accounts.emergency_authority.key();
        
        emit!(EmergencyPauseEvent {
            paused_by: ctx.accounts.emergency_authority.key(),
            paused_at: Clock::get()?.unix_timestamp,
            reason: "Emergency pause activated".to_string(),
        });
        
        msg!("🚨 EMERGENCY PAUSE ACTIVATED by {}", ctx.accounts.emergency_authority.key());
        Ok(())
    }

    /// Resume program operations
    pub fn emergency_resume(ctx: Context<EmergencyResume>) -> Result<()> {
        require!(ctx.accounts.program_state.emergency_authority == ctx.accounts.emergency_authority.key(), ErrorCode::Unauthorized);
        require!(ctx.accounts.program_state.is_paused, ErrorCode::NotPaused);
        
        ctx.accounts.program_state.is_paused = false;
        ctx.accounts.program_state.resumed_at = Clock::get()?.unix_timestamp;
        ctx.accounts.program_state.resumed_by = ctx.accounts.emergency_authority.key();
        
        emit!(EmergencyResumeEvent {
            resumed_by: ctx.accounts.emergency_authority.key(),
            resumed_at: Clock::get()?.unix_timestamp,
        });
        
        msg!("✅ PROGRAM RESUMED by {}", ctx.accounts.emergency_authority.key());
        Ok(())
    }
}

// ========== HELPER FUNCTIONS ==========

fn check_rate_limit(rate_limit: &mut RateLimit, max_actions: u64, window_seconds: i64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;
    
    // Reset window if needed
    if current_time - rate_limit.window_start > window_seconds {
        rate_limit.window_start = current_time;
        rate_limit.action_count = 0;
    }
    
    require!(rate_limit.action_count < max_actions, ErrorCode::RateLimitExceeded);
    
    rate_limit.action_count = rate_limit.action_count.saturating_add(1);
    rate_limit.last_action = current_time;
    
    Ok(())
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_mint: Pubkey)]
pub struct CreateLock<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + LockAccount::SPACE,
        seeds = [b"lock", owner.key().as_ref(), token_mint.as_ref()],
        bump
    )]
    pub lock_account: Account<'info, LockAccount>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + RateLimit::SPACE,
        seeds = [b"rate_limit", owner.key().as_ref()],
        bump
    )]
    pub rate_limit: Account<'info, RateLimit>,
    
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExtendLock<'info> {
    #[account(
        mut,
        seeds = [b"lock", lock_account.owner.as_ref(), lock_account.token_mint.as_ref()],
        bump,
        has_one = owner,
    )]
    pub lock_account: Account<'info, LockAccount>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        mut,
        seeds = [b"rate_limit", owner.key().as_ref()],
        bump
    )]
    pub rate_limit: Account<'info, RateLimit>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(
        mut,
        seeds = [b"lock", lock_account.owner.as_ref(), lock_account.token_mint.as_ref()],
        bump,
        has_one = owner,
    )]
    pub lock_account: Account<'info, LockAccount>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(
        mut,
        seeds = [b"rate_limit", owner.key().as_ref()],
        bump
    )]
    pub rate_limit: Account<'info, RateLimit>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyUnlock<'info> {
    #[account(
        mut,
        seeds = [b"lock", lock_account.owner.as_ref(), lock_account.token_mint.as_ref()],
        bump,
        has_one = owner,
    )]
    pub lock_account: Account<'info, LockAccount>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    pub emergency_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyResume<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    pub emergency_authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
pub struct LockAccount {
    pub owner: Pubkey,                    // 32
    pub token_account: Pubkey,             // 32
    pub token_mint: Pubkey,                // 32
    pub amount: u64,                       // 8
    pub unlock_time: i64,                  // 8
    pub created_at: i64,                   // 8
    pub is_extendable: bool,               // 1
    pub is_unlocked: bool,                 // 1
    pub is_paused: bool,                   // 1
    pub label: String,                     // 4 + 64
    pub nonce: u64,                        // 8
}

impl LockAccount {
    pub const SPACE: usize = 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 1 + 4 + 64 + 8; // 199 bytes
}

#[account]
pub struct ProgramState {
    pub is_paused: bool,                  // 1
    pub emergency_authority: Pubkey,      // 32
    pub paused_at: i64,                   // 8
    pub paused_by: Pubkey,                // 32
    pub resumed_at: i64,                  // 8
    pub resumed_by: Pubkey,               // 32
    pub next_nonce: u64,                  // 8
}

impl ProgramState {
    pub const SPACE: usize = 1 + 32 + 8 + 32 + 8 + 32 + 8; // 121 bytes
}

#[account]
pub struct RateLimit {
    pub last_action: i64,                 // 8
    pub action_count: u64,                // 8
    pub window_start: i64,                // 8
}

impl RateLimit {
    pub const SPACE: usize = 8 + 8 + 8; // 24 bytes
}

// ========== EVENTS ==========

#[event]
pub struct LockCreatedEvent {
    pub lock_account: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub unlock_time: i64,
    pub is_extendable: bool,
    pub label: String,
    pub created_at: i64,
    pub nonce: u64,
}

#[event]
pub struct LockExtendedEvent {
    pub lock_account: Pubkey,
    pub owner: Pubkey,
    pub old_unlock_time: i64,
    pub new_unlock_time: i64,
    pub extended_at: i64,
    pub nonce: u64,
}

#[event]
pub struct TokensUnlockedEvent {
    pub lock_account: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub unlocked_at: i64,
    pub nonce: u64,
}

#[event]
pub struct EmergencyUnlockEvent {
    pub lock_account: Pubkey,
    pub owner: Pubkey,
    pub returned_amount: u64,
    pub penalty_amount: u64,
    pub penalty_bps: u16,
    pub unlocked_at: i64,
    pub nonce: u64,
}

#[event]
pub struct EmergencyPauseEvent {
    pub paused_by: Pubkey,
    pub paused_at: i64,
    pub reason: String,
}

#[event]
pub struct EmergencyResumeEvent {
    pub resumed_by: Pubkey,
    pub resumed_at: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Program is paused")]
    ProgramPaused,
    #[msg("Unlock time must be in the future")]
    InvalidUnlockTime,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Label too long (max 64 characters)")]
    LabelTooLong,
    #[msg("Lock is not extendable")]
    NotExtendable,
    #[msg("Tokens already unlocked")]
    AlreadyUnlocked,
    #[msg("New unlock time must be later than current")]
    InvalidExtension,
    #[msg("Tokens still locked")]
    StillLocked,
    #[msg("Penalty too high (max 50%)")]
    PenaltyTooHigh,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Already paused")]
    AlreadyPaused,
    #[msg("Not paused")]
    NotPaused,
}
