use anchor_lang::prelude::*;

declare_id!("9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym");

#[program]
pub mod analos_nft_launcher_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        collection_account.creator = ctx.accounts.creator.key();
        collection_account.created_at = Clock::get()?.unix_timestamp;
        collection_account.is_deployed = false;
        msg!("Collection initialized by: {}", ctx.accounts.creator.key());
        Ok(())
    }

    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        description: String,
        max_supply: u32,
        mint_price: u64,
    ) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        
        collection_account.name = name;
        collection_account.symbol = symbol;
        collection_account.description = description;
        collection_account.max_supply = max_supply;
        collection_account.mint_price = mint_price;
        collection_account.creator = ctx.accounts.creator.key();
        collection_account.created_at = Clock::get()?.unix_timestamp;
        collection_account.is_deployed = false;
        
        msg!("Collection created: {} by {}", collection_account.name, ctx.accounts.creator.key());
        Ok(())
    }

    pub fn deploy_collection(ctx: Context<DeployCollection>) -> Result<()> {
        let collection_account = &mut ctx.accounts.collection_account;
        collection_account.is_deployed = true;
        collection_account.deployed_at = Clock::get()?.unix_timestamp;
        msg!("Collection deployed: {}", collection_account.name);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + CollectionAccount::INIT_SPACE,
        seeds = [b"collection", creator.key().as_ref()],
        bump
    )]
    pub collection_account: Account<'info, CollectionAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String)]
pub struct CreateCollection<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + CollectionAccount::INIT_SPACE,
        seeds = [b"collection", name.as_bytes(), symbol.as_bytes()],
        bump
    )]
    pub collection_account: Account<'info, CollectionAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeployCollection<'info> {
    #[account(
        mut,
        constraint = collection_account.creator == deployer.key(),
        constraint = !collection_account.is_deployed
    )]
    pub collection_account: Account<'info, CollectionAccount>,
    pub deployer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct CollectionAccount {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub max_supply: u32,
    pub mint_price: u64,
    pub creator: Pubkey,
    pub created_at: i64,
    pub deployed_at: i64,
    pub is_deployed: bool,
}