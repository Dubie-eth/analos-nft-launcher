# 📋 SIMPLE COPY-PASTE DEPLOYMENT GUIDE

## 🎯 Your Mission: Deploy in 10 Minutes!

Follow these exact steps - no technical knowledge needed!

---

## ✅ **STEP 1: Open Solana Playground**

1. Open your browser
2. Go to: **https://beta.solpg.io**
3. You'll see "Create a new project" - **Click it**

---

## ✅ **STEP 2: Create Project**

A popup will appear asking for:

1. **Project name**: Type `analos-nft-launchpad`
2. **Framework**: Click on **"Anchor(Rust)"** 
3. Click **"Create"**

Wait 3 seconds - your project opens!

---

## ✅ **STEP 3: Replace the Code**

You'll see a code editor with some default code.

### **Do this:**

1. **Select All**: Press `Ctrl+A` (Windows) or `Cmd+A` (Mac)
2. **Delete**: Press `Delete`
3. **Copy the code below**
4. **Paste**: `Ctrl+V` or `Cmd+V`

### **THE CODE TO COPY** 👇

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, program::invoke_signed, system_instruction};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_nft_launchpad {
    use super::*;

    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        max_supply: u64,
        price_lamports: u64,
        reveal_threshold: u64,
        collection_name: String,
        collection_symbol: String,
        placeholder_uri: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        config.authority = ctx.accounts.authority.key();
        config.max_supply = max_supply;
        config.price_lamports = price_lamports;
        config.reveal_threshold = reveal_threshold;
        config.current_supply = 0;
        config.is_revealed = false;
        config.is_paused = false;
        config.collection_name = collection_name;
        config.collection_symbol = collection_symbol;
        config.placeholder_uri = placeholder_uri;
        let clock = Clock::get()?;
        let seed_data = [
            ctx.accounts.authority.key().as_ref(),
            &clock.unix_timestamp.to_le_bytes(),
            &clock.slot.to_le_bytes(),
        ].concat();
        let seed_hash = keccak::hash(&seed_data);
        config.global_seed = seed_hash.to_bytes();
        msg!("Collection initialized");
        Ok(())
    }

    pub fn mint_placeholder(ctx: Context<MintPlaceholder>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(!config.is_paused, ErrorCode::CollectionPaused);
        require!(config.current_supply < config.max_supply, ErrorCode::SoldOut);
        let mint_index = config.current_supply;
        let transfer_ix = system_instruction::transfer(
            ctx.accounts.payer.key,
            &config.key(),
            config.price_lamports,
        );
        invoke_signed(&transfer_ix, &[
            ctx.accounts.payer.to_account_info(),
            config.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ], &[])?;
        let rng_seed = [&config.global_seed[..], &mint_index.to_le_bytes()].concat();
        let trait_hash = keccak::hash(&rng_seed);
        let rarity_score = u64::from_le_bytes(trait_hash.to_bytes()[0..8].try_into().unwrap()) % 100;
        let mint_record = &mut ctx.accounts.mint_record;
        mint_record.mint_index = mint_index;
        mint_record.minter = ctx.accounts.payer.key();
        mint_record.is_revealed = false;
        mint_record.rarity_score = rarity_score;
        config.current_supply += 1;
        emit!(MintEvent { mint_index, minter: ctx.accounts.payer.key(), rarity_score, timestamp: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn reveal_collection(ctx: Context<RevealCollection>, revealed_base_uri: String) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        require!(!config.is_revealed, ErrorCode::AlreadyRevealed);
        require!(config.current_supply >= config.reveal_threshold, ErrorCode::ThresholdNotMet);
        config.is_revealed = true;
        config.placeholder_uri = revealed_base_uri.clone();
        emit!(RevealEvent { timestamp: Clock::get()?.unix_timestamp, total_minted: config.current_supply, revealed_base_uri });
        Ok(())
    }

    pub fn reveal_nft(ctx: Context<RevealNft>) -> Result<()> {
        let config = &ctx.accounts.collection_config;
        require!(config.is_revealed, ErrorCode::NotRevealed);
        let mint_record = &mut ctx.accounts.mint_record;
        require!(!mint_record.is_revealed, ErrorCode::AlreadyRevealed);
        mint_record.is_revealed = true;
        let rarity_tier = match mint_record.rarity_score {
            0..=4 => "Legendary", 5..=19 => "Epic", 20..=49 => "Rare", _ => "Common",
        };
        emit!(NftRevealedEvent { mint_index: mint_record.mint_index, rarity_tier: rarity_tier.to_string(), rarity_score: mint_record.rarity_score });
        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.collection_config;
        let config_lamports = config.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(config.to_account_info().data_len());
        require!(config_lamports.checked_sub(amount).unwrap() >= rent_exempt, ErrorCode::InsufficientFunds);
        **config.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }

    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
        ctx.accounts.collection_config.is_paused = paused;
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>, new_price: Option<u64>, new_reveal_threshold: Option<u64>) -> Result<()> {
        let config = &mut ctx.accounts.collection_config;
        if let Some(price) = new_price { config.price_lamports = price; }
        if let Some(threshold) = new_reveal_threshold {
            require!(threshold <= config.max_supply, ErrorCode::InvalidThreshold);
            config.reveal_threshold = threshold;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(init, payer = authority, space = 8 + CollectionConfig::INIT_SPACE, seeds = [b"collection", authority.key().as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct MintPlaceholder<'info> {
    #[account(mut, seeds = [b"collection", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(init, payer = payer, space = 8 + MintRecord::INIT_SPACE, seeds = [b"mint", collection_config.key().as_ref(), collection_config.current_supply.to_le_bytes().as_ref()], bump)]
    pub mint_record: Account<'info, MintRecord>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealCollection<'info> {
    #[account(mut, seeds = [b"collection", authority.key().as_ref()], bump, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealNft<'info> {
    #[account(seeds = [b"collection", collection_config.authority.as_ref()], bump)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut, seeds = [b"mint", collection_config.key().as_ref(), mint_record.mint_index.to_le_bytes().as_ref()], bump)]
    pub mint_record: Account<'info, MintRecord>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, seeds = [b"collection", authority.key().as_ref()], bump, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPause<'info> {
    #[account(mut, seeds = [b"collection", authority.key().as_ref()], bump, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"collection", authority.key().as_ref()], bump, has_one = authority)]
    pub collection_config: Account<'info, CollectionConfig>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub current_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    pub global_seed: [u8; 32],
    #[max_len(32)]
    pub collection_name: String,
    #[max_len(10)]
    pub collection_symbol: String,
    #[max_len(200)]
    pub placeholder_uri: String,
}

#[account]
#[derive(InitSpace)]
pub struct MintRecord {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub is_revealed: bool,
    pub rarity_score: u64,
}

#[event]
pub struct MintEvent {
    pub mint_index: u64,
    pub minter: Pubkey,
    pub rarity_score: u64,
    pub timestamp: i64,
}

#[event]
pub struct RevealEvent {
    pub timestamp: i64,
    pub total_minted: u64,
    pub revealed_base_uri: String,
}

#[event]
pub struct NftRevealedEvent {
    pub mint_index: u64,
    pub rarity_tier: String,
    pub rarity_score: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Collection is sold out")]
    SoldOut,
    #[msg("Collection minting is paused")]
    CollectionPaused,
    #[msg("Collection has already been revealed")]
    AlreadyRevealed,
    #[msg("Reveal threshold has not been met")]
    ThresholdNotMet,
    #[msg("Collection has not been revealed yet")]
    NotRevealed,
    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,
    #[msg("Invalid threshold value")]
    InvalidThreshold,
}
```

---

## ✅ **STEP 4: Build (First Time)**

Look for the hammer 🔨 icon or "Build" button on the left sidebar.

1. **Click "Build"**
2. Wait ~30 seconds
3. You'll see output in the terminal at the bottom
4. Look for a message like: `Program Id: ABC123...xyz`
5. **COPY that Program ID** (click on it to copy)

---

## ✅ **STEP 5: Update Program ID**

1. Find line 8 in the code: `declare_id!("11111111111111111111111111111111");`
2. Replace the `11111...` with your copied Program ID
3. Should look like: `declare_id!("ABC123yourProgramIDxyz");`

---

## ✅ **STEP 6: Build Again**

1. **Click "Build"** again  
2. Wait ~30 seconds
3. You should see: ✅ **Build successful**

---

## ✅ **STEP 7: Connect Wallet**

Look for "Not connected" in the top right.

1. Click **"Not connected"**
2. Choose your wallet (Phantom, Solflare, etc.)
3. **Approve** the connection

---

## ✅ **STEP 8: Switch to Analos Network**

⚠️ **IMPORTANT!**

1. Find the network dropdown (probably says "Devnet")
2. Click it
3. Select **"Custom"** or **"Custom RPC"**
4. Enter: `https://rpc.analos.io`
5. Click **"Save"** or **"Connect"**

---

## ✅ **STEP 9: DEPLOY!** 🚀

1. Look for the rocket 🚀 icon or "Deploy" button
2. **Click "Deploy"**
3. Your wallet will pop up asking to approve
4. **Approve the transaction**
5. Wait ~30 seconds
6. You'll see: ✅ **"Deployment successful"**

---

## ✅ **STEP 10: Verify** 🎉

Copy your Program ID and visit:
```
https://explorer.analos.io/address/YOUR_PROGRAM_ID
```

**YOU DID IT!** 🎊

---

## 🆘 Troubleshooting

**Build fails?**
- Make sure you copied ALL the code
- Check line 8 has your actual program ID (after first build)

**Deploy fails?**
- Check you're connected to Analos RPC: `https://rpc.analos.io`
- Make sure your wallet has SOL/LOS

**Can't paste code?**
- Try clicking in the editor first
- Press `Ctrl+A` then `Delete` then `Ctrl+V`

---

## 📞 Need Help?

Just let me know which step you're on and what you see!

