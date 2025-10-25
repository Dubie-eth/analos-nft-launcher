# 🎮 SOLANA PLAYGROUND - COPY & PASTE READY

## ✅ This code is tested and ready for Playground!

Based on your successfully deployed programs in: https://github.com/Dubie-eth/analos-programs

---

## 📋 STEP 1: Create New Project

1. Go to: **https://beta.solpg.io/**
2. Click "New Project"
3. Select "Anchor (Rust)"
4. Name: `analos-name-service`

---

## 📝 STEP 2: Replace `lib.rs`

**Delete everything in `src/lib.rs` and paste this:**

```rust
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_name_service {
    use super::*;

    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
        profile_nft_mint: Pubkey,
        los_bros_mint: Option<Pubkey>,
        tier: u8,
    ) -> Result<()> {
        require!(username.len() >= 3 && username.len() <= 20, ErrorCode::InvalidUsername);

        let username_lower = username.to_lowercase();
        let clock = Clock::get()?;

        let profile = &mut ctx.accounts.profile_registry;
        profile.version = 1;
        profile.wallet = ctx.accounts.user_wallet.key();
        profile.username = username_lower.clone();
        profile.profile_nft_mint = profile_nft_mint;
        profile.los_bros_mint = los_bros_mint;
        profile.tier = tier;
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.is_active = true;

        let username_reg = &mut ctx.accounts.username_registry;
        username_reg.version = 1;
        username_reg.username = username_lower.clone();
        username_reg.owner = ctx.accounts.user_wallet.key();
        username_reg.profile_registry = ctx.accounts.profile_registry.key();
        username_reg.registered_at = clock.unix_timestamp;
        username_reg.last_transferred_at = clock.unix_timestamp;
        username_reg.is_available = false;

        msg!("✅ ANS Profile: @{}", username_lower);
        Ok(())
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        los_bros_mint: Option<Pubkey>,
        new_tier: Option<u8>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        
        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::Unauthorized
        );

        if let Some(mint) = los_bros_mint {
            profile.los_bros_mint = Some(mint);
        }
        if let Some(tier) = new_tier {
            profile.tier = tier;
        }
        
        profile.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn burn_profile(ctx: Context<BurnProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        let username_reg = &mut ctx.accounts.username_registry;

        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::Unauthorized
        );

        profile.is_active = false;
        profile.updated_at = Clock::get()?.unix_timestamp;
        username_reg.is_available = true;

        msg!("✅ Username released: @{}", username_reg.username);
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
        space = 8 + 1 + 32 + 24 + 32 + 33 + 1 + 8 + 8 + 1,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + 1 + 24 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"username", username.to_lowercase().as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,
}

#[derive(Accounts)]
pub struct BurnProfile<'info> {
    #[account(mut)]
    pub user_wallet: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"username", profile_registry.username.as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,
}

#[account]
pub struct ProfileRegistry {
    pub version: u8,
    pub wallet: Pubkey,
    pub username: String,
    pub profile_nft_mint: Pubkey,
    pub los_bros_mint: Option<Pubkey>,
    pub tier: u8,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
}

#[account]
pub struct UsernameRegistry {
    pub version: u8,
    pub username: String,
    pub owner: Pubkey,
    pub profile_registry: Pubkey,
    pub registered_at: i64,
    pub last_transferred_at: i64,
    pub is_available: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Username already taken")]
    UsernameAlreadyTaken,
    #[msg("Invalid username (3-20 chars)")]
    InvalidUsername,
    #[msg("Not authorized")]
    Unauthorized,
}
```

---

## 🔨 STEP 3: Build in Playground

1. Click **"Build"** button (or Ctrl+B)
2. Wait ~30 seconds
3. Should see: **"✅ Build successful"**

---

## 🚀 STEP 4: Deploy to Devnet First

1. Click **"Deploy"**
2. Select **"Devnet"**
3. Approve wallet signature
4. **COPY THE PROGRAM ID** that appears!

---

## 📥 STEP 5: Download Files

1. **Download Binary:**
   - File explorer → `target/deploy/`
   - Right-click `analos_name_service.so`
   - Download

2. **Download IDL:**
   - Click "IDL" tab
   - Copy JSON or click download
   - Save as `analos_name_service.json`

3. **Download Keypair:**
   - `target/deploy/analos_name_service-keypair.json`
   - **KEEP THIS SECURE!**

---

## 🎯 STEP 6: Deploy to Analos

```bash
# Configure for Analos
solana config set --url https://rpc.analos.io

# Deploy with the Playground keypair
solana program deploy \
  --program-id ./analos_name_service-keypair.json \
  analos_name_service.so \
  --with-compute-unit-price 1000 \
  --max-sign-attempts 100 \
  --use-quic
```

---

## ✅ After Successful Deployment

Update these files with your **actual Program ID**:

### 1. `programs/analos-name-service/src/lib.rs`:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

### 2. `src/config/analos-programs.ts`:
```typescript
export const ANS_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
```

---

## 🎉 You're Done!

Your Analos Name Service program is now live on-chain! 🚀

**Just like your other programs:**
- Price Oracle: `9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym`
- Rarity Oracle: `H6sAs9Ewx6BNSF3NkPEEtwZo3kfFwSCfhSsLTGD3a4ym`
- NFT Launchpad: `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`

Your ANS will join them! ✨

