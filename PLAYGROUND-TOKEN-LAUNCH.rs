use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, MintTo, Burn, Transfer},
    associated_token::AssociatedToken,
};

declare_id!("11111111111111111111111111111111");

/// Platform fee constants
pub const FEE_DEV_TEAM_BPS: u16 = 100;           // 1% to dev team
pub const FEE_POOL_CREATION_BPS: u16 = 200;      // 2% for pool creation after bond
pub const FEE_LOL_BUYBACK_BURN_BPS: u16 = 100;   // 1% for LOL buyback and burns
pub const FEE_PLATFORM_MAINT_BPS: u16 = 100;     // 1% for platform maintenance
pub const FEE_LOL_COMMUNITY_BPS: u16 = 100;      // 1% for LOL community rewards
pub const FEE_TOTAL_BPS: u16 = 600;              // 6% total to LOL ecosystem

/// Allocation split (69% pool, 25% creator, 6% fees)
pub const POOL_ALLOCATION_BPS: u16 = 6900;       // 69% to pool
pub const CREATOR_TOTAL_BPS: u16 = 2500;         // 25% to creator

/// Default token configuration
pub const DEFAULT_TOKENS_PER_NFT: u64 = 10_000; // 10,000 tokens per NFT
pub const DEFAULT_DECIMALS: u8 = 6;              // Standard SPL token decimals
pub const MAX_RARITY_TIERS: usize = 10;          // Maximum 10 rarity tiers

#[program]
pub mod analos_token_launch {
    use super::*;

    /// Initialize a token launch with bonding curve
    pub fn initialize_token_launch(
        ctx: Context<InitializeTokenLaunch>,
        name: String,
        symbol: String,
        uri: String,
        total_supply: u64,
        creator_prebuy_amount: u64,
    ) -> Result<()> {
        let token_launch = &mut ctx.accounts.token_launch;
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Set token launch configuration
        token_launch.authority = ctx.accounts.authority.key();
        token_launch.token_mint = ctx.accounts.token_mint.key();
        token_launch.bonding_curve = bonding_curve.key();
        token_launch.name = name.clone();
        token_launch.symbol = symbol.clone();
        token_launch.uri = uri;
        token_launch.total_supply = total_supply;
        token_launch.tokens_per_nft = DEFAULT_TOKENS_PER_NFT;
        token_launch.decimals = DEFAULT_DECIMALS;
        token_launch.is_active = true;
        token_launch.created_at = Clock::get()?.unix_timestamp;
        
        // Set bonding curve configuration
        bonding_curve.token_launch = token_launch.key();
        bonding_curve.initial_price = 1000; // 0.001 SOL per token
        bonding_curve.price_increment = 100; // 0.0001 SOL increment per trade
        bonding_curve.total_tokens = total_supply;
        bonding_curve.tokens_sold = 0;
        bonding_curve.sol_raised = 0;
        bonding_curve.is_active = true;
        bonding_curve.created_at = Clock::get()?.unix_timestamp;
        
        emit!(TokenLaunchInitializedEvent {
            token_launch: token_launch.key(),
            authority: token_launch.authority,
            token_mint: token_launch.token_mint,
            name: name.clone(),
            symbol: symbol.clone(),
            total_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Token launch initialized: {} ({})", name, symbol);
        
        Ok(())
    }

    /// Mint collection NFTs
    pub fn mint_collection_nfts(
        ctx: Context<MintCollectionNFTs>,
        collection_size: u32,
    ) -> Result<()> {
        let token_launch = &mut ctx.accounts.token_launch;
        
        require!(token_launch.is_active, ErrorCode::LaunchInactive);
        require!(collection_size > 0 && collection_size <= 10000, ErrorCode::InvalidCollectionSize);
        
        // Calculate total tokens to mint
        let total_tokens = (collection_size as u64) * token_launch.tokens_per_nft;
        require!(total_tokens <= token_launch.total_supply, ErrorCode::InsufficientSupply);
        
        // Mint tokens to the token launch account
        let mint_to_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.token_launch_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        
        token::mint_to(mint_to_ctx, total_tokens)?;
        
        token_launch.tokens_minted = total_tokens;
        
        emit!(CollectionNFTsMintedEvent {
            token_launch: token_launch.key(),
            collection_size,
            total_tokens,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Minted {} NFTs with {} total tokens", collection_size, total_tokens);
        
        Ok(())
    }

    /// Creator prebuy tokens
    pub fn creator_prebuy(
        ctx: Context<CreatorPrebuy>,
        amount: u64,
    ) -> Result<()> {
        let token_launch = &mut ctx.accounts.token_launch;
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        require!(token_launch.is_active, ErrorCode::LaunchInactive);
        require!(bonding_curve.is_active, ErrorCode::BondingCurveInactive);
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        // Calculate price based on current bonding curve state
        let price_per_token = calculate_current_price(bonding_curve)?;
        let total_cost = (amount * price_per_token) / 1_000_000; // Adjust for decimals
        
        // Transfer SOL from creator to bonding curve
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: ctx.accounts.bonding_curve_sol_account.to_account_info(),
        };
        
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_instruction,
            ),
            total_cost,
        )?;
        
        // Transfer tokens from token launch to creator
        let transfer_tokens_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_launch_token_account.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        
        token::transfer(transfer_tokens_ctx, amount)?;
        
        // Update bonding curve state
        bonding_curve.tokens_sold += amount;
        bonding_curve.sol_raised += total_cost;
        
        emit!(CreatorPrebuyEvent {
            token_launch: token_launch.key(),
            creator: ctx.accounts.creator.key(),
            amount,
            total_cost,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Creator prebuy: {} tokens for {} SOL", amount, total_cost as f64 / 1e9);
        
        Ok(())
    }

    /// Buy tokens from bonding curve
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_launch = &mut ctx.accounts.token_launch;
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        require!(token_launch.is_active, ErrorCode::LaunchInactive);
        require!(bonding_curve.is_active, ErrorCode::BondingCurveInactive);
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        // Calculate price based on current bonding curve state
        let price_per_token = calculate_current_price(bonding_curve)?;
        let total_cost = (amount * price_per_token) / 1_000_000; // Adjust for decimals
        
        // Transfer SOL from buyer to bonding curve
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.bonding_curve_sol_account.to_account_info(),
        };
        
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_instruction,
            ),
            total_cost,
        )?;
        
        // Update bonding curve state first
        bonding_curve.tokens_sold += amount;
        bonding_curve.sol_raised += total_cost;
        
        // Transfer tokens from bonding curve to buyer
        let transfer_tokens_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bonding_curve_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.bonding_curve.to_account_info(),
            },
        );
        
        token::transfer(transfer_tokens_ctx, amount)?;
        
        emit!(TokensBoughtEvent {
            token_launch: token_launch.key(),
            buyer: ctx.accounts.buyer.key(),
            amount,
            total_cost,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Bought {} tokens for {} SOL", amount, total_cost as f64 / 1e9);
        
        Ok(())
    }

    /// Collect trading fees
    pub fn collect_trading_fees(
        ctx: Context<CollectTradingFees>,
    ) -> Result<()> {
        let token_launch = &mut ctx.accounts.token_launch;
        let bonding_curve = &ctx.accounts.bonding_curve;
        
        require!(token_launch.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        
        // Calculate fee amount (6% of SOL raised)
        let fee_amount = (bonding_curve.sol_raised * FEE_TOTAL_BPS as u64) / 10000;
        
        if fee_amount > 0 {
            // Transfer fees to platform account
            let transfer_instruction = anchor_lang::system_program::Transfer {
                from: ctx.accounts.bonding_curve_sol_account.to_account_info(),
                to: ctx.accounts.platform_fee_account.to_account_info(),
            };
            
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    transfer_instruction,
                ),
                fee_amount,
            )?;
            
            emit!(TradingFeesCollectedEvent {
                token_launch: token_launch.key(),
                fee_amount,
                timestamp: Clock::get()?.unix_timestamp,
            });
            
            msg!("Collected {} SOL in trading fees", fee_amount as f64 / 1e9);
        }
        
        Ok(())
    }
}

// ========== HELPER FUNCTIONS ==========

/// Calculate current price based on bonding curve state
fn calculate_current_price(bonding_curve: &BondingCurve) -> Result<u64> {
    // Simple linear bonding curve: price = initial_price + (tokens_sold * price_increment)
    let current_price = bonding_curve.initial_price + 
        ((bonding_curve.tokens_sold * bonding_curve.price_increment) / 1000);
    
    Ok(current_price)
}

// ========== ACCOUNT CONTEXTS ==========

#[derive(Accounts)]
pub struct InitializeTokenLaunch<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TokenLaunch::INIT_SPACE,
        seeds = [b"token_launch", token_mint.key().as_ref()],
        bump
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        init,
        payer = authority,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"bonding_curve", token_launch.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        init,
        payer = authority,
        mint::decimals = DEFAULT_DECIMALS,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintCollectionNFTs<'info> {
    #[account(
        mut,
        seeds = [b"token_launch", token_launch.token_mint.as_ref()],
        bump,
        has_one = authority,
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority,
    )]
    pub token_launch_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreatorPrebuy<'info> {
    #[account(
        mut,
        seeds = [b"token_launch", token_launch.token_mint.as_ref()],
        bump,
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        mut,
        seeds = [b"bonding_curve", token_launch.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_launch.token_mint,
        associated_token::authority = authority,
    )]
    pub token_launch_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_launch.token_mint,
        associated_token::authority = creator,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Bonding curve SOL account
    #[account(mut)]
    pub bonding_curve_sol_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(
        mut,
        seeds = [b"token_launch", token_launch.token_mint.as_ref()],
        bump,
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        mut,
        seeds = [b"bonding_curve", token_launch.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_launch.token_mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_launch.token_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// CHECK: Bonding curve SOL account
    #[account(mut)]
    pub bonding_curve_sol_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectTradingFees<'info> {
    #[account(
        mut,
        seeds = [b"token_launch", token_launch.token_mint.as_ref()],
        bump,
        has_one = authority,
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        seeds = [b"bonding_curve", token_launch.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Bonding curve SOL account
    #[account(mut)]
    pub bonding_curve_sol_account: UncheckedAccount<'info>,

    /// CHECK: Platform fee account
    #[account(mut)]
    pub platform_fee_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ========== STATE ==========

#[account]
#[derive(InitSpace)]
pub struct TokenLaunch {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub bonding_curve: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
    pub total_supply: u64,
    pub tokens_per_nft: u64,
    pub tokens_minted: u64,
    pub decimals: u8,
    pub is_active: bool,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub token_launch: Pubkey,
    pub initial_price: u64,
    pub price_increment: u64,
    pub total_tokens: u64,
    pub tokens_sold: u64,
    pub sol_raised: u64,
    pub is_active: bool,
    pub created_at: i64,
}

// ========== EVENTS ==========

#[event]
pub struct TokenLaunchInitializedEvent {
    pub token_launch: Pubkey,
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct CollectionNFTsMintedEvent {
    pub token_launch: Pubkey,
    pub collection_size: u32,
    pub total_tokens: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorPrebuyEvent {
    pub token_launch: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensBoughtEvent {
    pub token_launch: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
    pub timestamp: i64,
}

#[event]
pub struct TradingFeesCollectedEvent {
    pub token_launch: Pubkey,
    pub fee_amount: u64,
    pub timestamp: i64,
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Token launch is inactive")]
    LaunchInactive,
    #[msg("Bonding curve is inactive")]
    BondingCurveInactive,
    #[msg("Invalid collection size")]
    InvalidCollectionSize,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient token supply")]
    InsufficientSupply,
    #[msg("Unauthorized")]
    Unauthorized,
}
