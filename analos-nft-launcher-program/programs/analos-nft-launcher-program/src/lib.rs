use anchor_lang::prelude::*;

declare_id!("YourProgramIDHere");

#[program]
pub mod nft_launcher {
    use super::*;

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        description: String,
        max_supply: u32,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        collection.name = name.clone();
        collection.symbol = symbol;
        collection.description = description;
        collection.max_supply = max_supply;
        collection.minted_count = 0;
        collection.creator = ctx.accounts.creator.key();
        collection.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Collection initialized: {} by {}", name, ctx.accounts.creator.key());
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, description: String, max_supply: u32)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 10 + 200 + 4 + 4 + 32 + 8,
        seeds = [b"collection", name.as_bytes()],
        bump
    )]
    pub collection: Account<'info, Collection>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Collection {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub max_supply: u32,
    pub minted_count: u32,
    pub creator: Pubkey,
    pub created_at: i64,
}