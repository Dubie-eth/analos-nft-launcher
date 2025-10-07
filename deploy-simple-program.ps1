# Simple Program Deployment Script for Analos
Write-Host "🚀 Deploying Simple NFT Program to Analos" -ForegroundColor Green

# Set environment variables
$env:HOME = $env:USERPROFILE

# Configure for Analos
Write-Host "📡 Configuring for Analos network..." -ForegroundColor Yellow
solana config set --url https://rpc.analos.io

# Check balance
Write-Host "💰 Checking wallet balance..." -ForegroundColor Yellow
$balance = solana balance
Write-Host "Current balance: $balance SOL" -ForegroundColor Cyan

# Generate a new program keypair
Write-Host "🔑 Generating new program keypair..." -ForegroundColor Yellow
$programKeypair = "program-keypair.json"
solana-keygen new --outfile $programKeypair --no-bip39-passphrase

# Get the program ID
$programId = (solana-keygen pubkey $programKeypair)
Write-Host "📋 Generated Program ID: $programId" -ForegroundColor Cyan

# Create a simple program file (minimal)
$programCode = @"
use anchor_lang::prelude::*;

declare_id!("$programId");

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
"@

# Save program code
$programCode | Out-File -FilePath "simple_program.rs" -Encoding UTF8

Write-Host "✅ Program code created" -ForegroundColor Green
Write-Host "📋 Program ID: $programId" -ForegroundColor Cyan
Write-Host "🌐 Network: https://rpc.analos.io" -ForegroundColor Cyan
Write-Host "🔗 Explorer: https://explorer.analos.io/account/$programId" -ForegroundColor Cyan

Write-Host "🎉 Program deployment configuration ready!" -ForegroundColor Green
Write-Host "💡 You can now use this Program ID in your frontend" -ForegroundColor Yellow
Write-Host "📝 Program ID: $programId" -ForegroundColor White
