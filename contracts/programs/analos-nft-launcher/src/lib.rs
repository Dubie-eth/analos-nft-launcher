use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod analos_nft_launcher {
    use super::*;

    // Initialize a new NFT collection
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
        max_supply: u64,
        mint_price: u64,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        let clock = Clock::get()?;
        
        collection.authority = ctx.accounts.authority.key();
        collection.name = name;
        collection.symbol = symbol;
        collection.uri = uri;
        collection.max_supply = max_supply;
        collection.current_supply = 0;
        collection.mint_price = mint_price;
        collection.created_at = clock.unix_timestamp;
        collection.is_active = true;
        
        msg!("Collection initialized: {} ({})", collection.name, collection.symbol);
        Ok(())
    }

    // Mint a new NFT from the collection
    pub fn mint_nft(
        ctx: Context<MintNft>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        let nft = &mut ctx.accounts.nft;
        let clock = Clock::get()?;
        
        // Check if collection is active
        require!(collection.is_active, ErrorCode::CollectionInactive);
        
        // Check supply limit
        require!(
            collection.current_supply < collection.max_supply,
            ErrorCode::MaxSupplyReached
        );
        
        // Transfer mint price from user to collection authority
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.collection_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        
        token::transfer(cpi_ctx, collection.mint_price)?;
        
        // Initialize NFT
        nft.collection = collection.key();
        nft.mint = ctx.accounts.nft_mint.key();
        nft.name = name;
        nft.symbol = symbol;
        nft.uri = uri;
        nft.owner = ctx.accounts.user.key();
        nft.minted_at = clock.unix_timestamp;
        
        // Update collection supply
        collection.current_supply += 1;
        
        msg!("NFT minted: {} from collection {}", nft.name, collection.name);
        Ok(())
    }

    // Update collection settings (only authority)
    pub fn update_collection(
        ctx: Context<UpdateCollection>,
        name: Option<String>,
        symbol: Option<String>,
        uri: Option<String>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        
        if let Some(name) = name {
            collection.name = name;
        }
        if let Some(symbol) = symbol {
            collection.symbol = symbol;
        }
        if let Some(uri) = uri {
            collection.uri = uri;
        }
        if let Some(is_active) = is_active {
            collection.is_active = is_active;
        }
        
        msg!("Collection updated");
        Ok(())
    }

    // Get collection info
    pub fn get_collection_info(ctx: Context<GetCollectionInfo>) -> Result<CollectionInfo> {
        let collection = &ctx.accounts.collection;
        
        Ok(CollectionInfo {
            authority: collection.authority,
            name: collection.name.clone(),
            symbol: collection.symbol.clone(),
            uri: collection.uri.clone(),
            max_supply: collection.max_supply,
            current_supply: collection.current_supply,
            mint_price: collection.mint_price,
            created_at: collection.created_at,
            is_active: collection.is_active,
        })
    }
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String, max_supply: u64, mint_price: u64)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Collection::INIT_SPACE,
        seeds = [b"collection", name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"collection", collection.name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    
    #[account(
        init,
        payer = user,
        space = 8 + Nft::INIT_SPACE,
        seeds = [b"nft", collection.key().as_ref(), &collection.current_supply.to_le_bytes()],
        bump
    )]
    pub nft: Account<'info, Nft>,
    
    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = collection,
        mint::freeze_authority = collection,
    )]
    pub nft_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = user,
        associated_token::mint = nft_mint,
        associated_token::authority = user,
    )]
    pub nft_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub collection_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCollection<'info> {
    #[account(
        mut,
        seeds = [b"collection", collection.name.as_bytes()],
        bump,
        has_one = authority
    )]
    pub collection: Account<'info, Collection>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetCollectionInfo<'info> {
    #[account(
        seeds = [b"collection", collection.name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, Collection>,
}

#[account]
#[derive(InitSpace)]
pub struct Collection {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_supply: u64,
    pub current_supply: u64,
    pub mint_price: u64,
    pub created_at: i64,
    pub is_active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Nft {
    pub collection: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub owner: Pubkey,
    pub minted_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CollectionInfo {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub max_supply: u64,
    pub current_supply: u64,
    pub mint_price: u64,
    pub created_at: i64,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Collection is not active")]
    CollectionInactive,
    #[msg("Maximum supply reached")]
    MaxSupplyReached,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
