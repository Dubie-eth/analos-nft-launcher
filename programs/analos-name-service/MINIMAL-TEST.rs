// ============================================================================
// TEST VERSION - Build this first to verify Playground is working
// ============================================================================
// If this builds successfully, then we know the issue is in the full version
// ============================================================================

use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_name_service {
    use super::*;

    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        profile.wallet = ctx.accounts.user_wallet.key();
        profile.username = username.to_lowercase();
        
        msg!("✅ Registered: @{}", profile.username);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterProfile<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + 32 + 24,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProfileRegistry {
    pub wallet: Pubkey,
    pub username: String,
}

