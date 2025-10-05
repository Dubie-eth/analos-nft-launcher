use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use mpl_token_metadata::{
    instruction as mpl_instruction,
    state as mpl_state,
};

use crate::state::*;

#[derive(Accounts)]
pub struct CreateCollection<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + CollectionAccount::INIT_SPACE,
        seeds = [b"collection", creator.key().as_ref()],
        bump
    )]
    pub collection_account: Account<'info, CollectionAccount>,
    
    /// CHECK: This account is validated in the instruction
    #[account(mut)]
    pub collection_mint: UncheckedAccount<'info>,
    
    /// CHECK: This account is validated in the instruction
    pub collection_metadata: UncheckedAccount<'info>,
    
    /// CHECK: This account is validated in the instruction
    pub collection_master_edition: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub collection_mint_account: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> CreateCollection<'info> {
    pub fn handler(
        ctx: Context<CreateCollection>,
        collection_config: CollectionConfig,
        whitelist_phases: Vec<WhitelistPhase>,
        payment_tokens: Vec<PaymentToken>,
        delayed_reveal: DelayedReveal,
        max_mints_per_wallet: u8,
    ) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        
        // Store collection configuration
        collection_account.collection_config = collection_config;
        collection_account.whitelist_phases = whitelist_phases;
        collection_account.payment_tokens = payment_tokens;
        collection_account.delayed_reveal = delayed_reveal;
        collection_account.max_mints_per_wallet = max_mints_per_wallet;
        collection_account.is_deployed = false;
        collection_account.bump = ctx.bumps.collection_account;
        
        msg!("Collection account created successfully");
        msg!("Collection name: {}", collection_account.collection_config.name);
        msg!("Max supply: {}", collection_account.collection_config.max_supply);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DeployCollection<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"collection", creator.key().as_ref()],
        bump = collection_account.bump,
        constraint = !collection_account.is_deployed @ ErrorCode::AlreadyDeployed
    )]
    pub collection_account: Account<'info, CollectionAccount>,
    
    /// CHECK: This account is validated in the instruction
    #[account(mut)]
    pub collection_mint: UncheckedAccount<'info>,
    
    /// CHECK: This account is validated in the instruction
    pub collection_metadata: UncheckedAccount<'info>,
    
    /// CHECK: This account is validated in the instruction
    pub collection_master_edition: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> DeployCollection<'info> {
    pub fn handler(ctx: Context<DeployCollection>) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        
        // Mark as deployed
        collection_account.is_deployed = true;
        
        msg!("Collection deployed successfully");
        msg!("Collection mint: {}", ctx.accounts.collection_mint.key());
        msg!("Metadata account: {}", ctx.accounts.collection_metadata.key());
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateCollection<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"collection", creator.key().as_ref()],
        bump = collection_account.bump,
        constraint = collection_account.collection_config.creator == creator.key() @ ErrorCode::Unauthorized
    )]
    pub collection_account: Account<'info, CollectionAccount>,
}

impl<'info> UpdateCollection<'info> {
    pub fn handler(
        ctx: Context<UpdateCollection>,
        collection_config: Option<CollectionConfig>,
        whitelist_phases: Option<Vec<WhitelistPhase>>,
        payment_tokens: Option<Vec<PaymentToken>>,
        delayed_reveal: Option<DelayedReveal>,
        max_mints_per_wallet: Option<u8>,
    ) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        
        // Update fields if provided
        if let Some(config) = collection_config {
            collection_account.collection_config = config;
        }
        
        if let Some(phases) = whitelist_phases {
            collection_account.whitelist_phases = phases;
        }
        
        if let Some(tokens) = payment_tokens {
            collection_account.payment_tokens = tokens;
        }
        
        if let Some(reveal) = delayed_reveal {
            collection_account.delayed_reveal = reveal;
        }
        
        if let Some(max_mints) = max_mints_per_wallet {
            collection_account.max_mints_per_wallet = max_mints;
        }
        
        msg!("Collection updated successfully");
        
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Collection is already deployed")]
    AlreadyDeployed,
    #[msg("Unauthorized to perform this action")]
    Unauthorized,
    #[msg("Invalid collection configuration")]
    InvalidConfig,
    #[msg("Whitelist phase validation failed")]
    InvalidWhitelistPhase,
    #[msg("Payment token validation failed")]
    InvalidPaymentToken,
}
