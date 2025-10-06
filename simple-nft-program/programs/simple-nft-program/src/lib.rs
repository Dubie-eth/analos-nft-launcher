use anchor_lang::prelude::*;

declare_id!("Db5DnDBJbMDMd4vMgebjSfNCL8SEJZySWawKfxJd2rSw");

#[program]
pub mod simple_nft_program {
    use super::*;

    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        description: String,
        max_supply: u64,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        let clock = Clock::get()?;
        
        collection.authority = ctx.accounts.authority.key();
        collection.name = name;
        collection.symbol = symbol;
        collection.description = description;
        collection.max_supply = max_supply;
        collection.total_supply = 0;
        collection.created_at = clock.unix_timestamp;
        
        msg!("Collection created: {}", collection.name);
        Ok(())
    }

    pub fn mint_nft(ctx: Context<MintNft>) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        
        require!(
            collection.total_supply < collection.max_supply,
            ErrorCode::MaxSupplyReached
        );
        
        collection.total_supply += 1;
        
        msg!("NFT minted! Total supply: {}", collection.total_supply);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 10 + 200 + 8 + 8 + 8,
        seeds = [b"collection", authority.key().as_ref()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"collection", collection.authority.as_ref()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
pub struct Collection {
    pub authority: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub description: String,
    pub max_supply: u64,
    pub total_supply: u64,
    pub created_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Max supply reached")]
    MaxSupplyReached,
}
