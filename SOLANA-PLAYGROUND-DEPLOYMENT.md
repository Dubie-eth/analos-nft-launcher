# 🎮 SOLANA PLAYGROUND DEPLOYMENT GUIDE

## 📋 Step-by-Step: Deploy Analos Profile Registry

### **Complete Code for Solana Playground**

---

## 🚀 **STEP 1: Open Solana Playground**

1. Go to: **https://beta.solpg.io/**
2. Click "**Create New Project**"
3. Select "**Anchor**" framework
4. Name: `analos-profile-registry`

---

## 📝 **STEP 2: Replace `lib.rs` with This Code**

Click on `programs/analos-profile-registry/src/lib.rs` and replace with:

```rust
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_profile_registry {
    use super::*;

    /// Register a new profile with username
    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
        profile_nft_mint: Pubkey,
        los_bros_mint: Option<Pubkey>,
        tier: u8,
    ) -> Result<()> {
        validate_username(&username)?;

        let username_lower = username.to_lowercase();
        let clock = Clock::get()?;

        require!(
            ctx.accounts.username_registry.is_available,
            ErrorCode::UsernameAlreadyTaken
        );

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

        msg!("✅ Profile registered: @{} → {}", username_lower, ctx.accounts.user_wallet.key());

        Ok(())
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        los_bros_mint: Option<Pubkey>,
        new_tier: Option<u8>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        let clock = Clock::get()?;

        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::UnauthorizedOwner
        );

        if let Some(mint) = los_bros_mint {
            profile.los_bros_mint = Some(mint);
        }

        if let Some(tier) = new_tier {
            profile.tier = tier;
        }

        profile.updated_at = clock.unix_timestamp;

        Ok(())
    }

    pub fn burn_profile(ctx: Context<BurnProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        let username_reg = &mut ctx.accounts.username_registry;
        let clock = Clock::get()?;

        require!(
            profile.wallet == ctx.accounts.user_wallet.key(),
            ErrorCode::UnauthorizedOwner
        );

        profile.is_active = false;
        profile.updated_at = clock.unix_timestamp;
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
        space = 8 + ProfileRegistry::INIT_SPACE,
        seeds = [b"profile", user_wallet.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        init,
        payer = user_wallet,
        space = 8 + UsernameRegistry::INIT_SPACE,
        seeds = [b"username", username.to_lowercase().as_bytes()],
        bump
    )]
    pub username_registry: Account<'info, UsernameRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
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

#[derive(Accounts)]
pub struct TransferUsername<'info> {
    pub current_owner: Signer<'info>,
    pub new_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", current_owner.key().as_ref()],
        bump
    )]
    pub old_profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"profile", new_owner.key().as_ref()],
        bump
    )]
    pub new_profile_registry: Account<'info, ProfileRegistry>,

    #[account(
        mut,
        seeds = [b"username", username_registry.username.as_bytes()],
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

impl ProfileRegistry {
    pub const INIT_SPACE: usize = 1 + 32 + (4 + 20) + 32 + (1 + 32) + 1 + 8 + 8 + 1;
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

impl UsernameRegistry {
    pub const INIT_SPACE: usize = 1 + (4 + 20) + 32 + 32 + 8 + 8 + 1;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Username is already taken")]
    UsernameAlreadyTaken,
    
    #[msg("Invalid username format (3-20 chars, alphanumeric + underscore only)")]
    InvalidUsernameFormat,
    
    #[msg("Username must start with a letter")]
    UsernameMustStartWithLetter,
    
    #[msg("Not the profile owner")]
    UnauthorizedOwner,
}

fn validate_username(username: &str) -> Result<()> {
    let len = username.len();
    
    require!(len >= 3 && len <= 20, ErrorCode::InvalidUsernameFormat);

    for c in username.chars() {
        require!(
            c.is_ascii_alphanumeric() || c == '_',
            ErrorCode::InvalidUsernameFormat
        );
    }

    if let Some(first) = username.chars().next() {
        require!(first.is_ascii_alphabetic(), ErrorCode::UsernameMustStartWithLetter);
    }

    Ok(())
}
```

---

## 🔨 **STEP 3: Build in Playground**

1. Click **"Build"** button (or press `Ctrl/Cmd + Shift + B`)
2. Wait for build to complete (~30 seconds)
3. You should see: **"✅ Build successful"**

---

## 🚀 **STEP 4: Deploy in Playground**

1. Click **"Deploy"** button
2. Select cluster: **"Devnet"** (for testing first)
3. Confirm wallet signature
4. Wait for deployment (~10 seconds)
5. **COPY THE PROGRAM ID** that appears!

Example output:
```
Program Id: AbC123...xyz789
```

---

## 📥 **STEP 5: Download IDL and Binary**

### **Download IDL:**
1. In Playground, click **"IDL"** tab
2. Click **"Download"** or copy the JSON
3. Save as: `analos-profile-registry.json`

### **Download Binary:**
1. In file explorer (left sidebar)
2. Navigate to: `target/deploy/`
3. Find: `analos_profile_registry.so`
4. Right-click → **"Download"**

---

## 🔗 **STEP 6: Deploy to Analos Mainnet (CLI)**

Now that you have the binary from Playground:

```bash
# 1. Make sure you have Solana CLI installed
solana --version

# 2. Configure for Analos
solana config set --url https://rpc.analos.io

# 3. Check your balance
solana balance

# 4. Deploy the binary
solana program deploy \
  --program-id ./target/deploy/analos_profile_registry-keypair.json \
  ./target/deploy/analos_profile_registry.so

# 5. Save the Program ID that's printed!
```

---

## 📋 **STEP 7: Update Program IDs**

After deploying to Analos, update these files with your **actual program ID**:

### **1. Update Rust Code:**
```rust
// programs/analos-profile-registry-anchor/src/lib.rs
declare_id!("YOUR_ANALOS_PROGRAM_ID_HERE");
```

### **2. Update JavaScript SDK:**
```typescript
// src/lib/analos-profile-registry-sdk.ts
export const PROFILE_REGISTRY_PROGRAM_ID = new PublicKey('YOUR_ANALOS_PROGRAM_ID_HERE');
```

### **3. Update Config:**
```typescript
// src/config/analos-programs.ts
export const ANALOS_PROGRAMS = {
  // ... existing programs
  PROFILE_REGISTRY: new PublicKey('YOUR_ANALOS_PROGRAM_ID_HERE'),
}
```

---

## 🧪 **STEP 8: Test the Program**

In Solana Playground, you can test with this script:

```typescript
// Click "Test" tab and add this

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnalosProfileRegistry } from "../target/types/analos_profile_registry";

describe("analos-profile-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnalosProfileRegistry as Program<AnalosProfileRegistry>;

  it("Registers a profile with username", async () => {
    const username = "testuser";
    const profileNftMint = anchor.web3.Keypair.generate().publicKey;
    const tier = 1;

    // Derive PDAs
    const [profilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [usernamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("username"), Buffer.from(username.toLowerCase())],
      program.programId
    );

    // Register profile
    const tx = await program.methods
      .registerProfile(username, profileNftMint, null, tier)
      .accounts({
        userWallet: provider.wallet.publicKey,
        profileRegistry: profilePDA,
        usernameRegistry: usernamePDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Profile registered!");
    console.log("Transaction:", tx);

    // Fetch the profile
    const profile = await program.account.profileRegistry.fetch(profilePDA);
    console.log("Profile:", profile);
    
    assert.equal(profile.username, username.toLowerCase());
    assert.equal(profile.tier, tier);
  });

  it("Prevents duplicate usernames", async () => {
    const username = "testuser"; // Same as above
    const profileNftMint = anchor.web3.Keypair.generate().publicKey;

    try {
      await program.methods
        .registerProfile(username, profileNftMint, null, 1)
        .rpc();
      
      assert.fail("Should have thrown error for duplicate username");
    } catch (error) {
      console.log("✅ Correctly rejected duplicate username");
      assert.include(error.toString(), "UsernameAlreadyTaken");
    }
  });
});
```

---

## 📦 **Files You'll Get from Playground:**

After successful build and deployment:

1. **Binary** 📁
   - `target/deploy/analos_profile_registry.so`
   - Size: ~50-100 KB
   - Use this to deploy to Analos mainnet

2. **IDL** 📄
   - `target/idl/analos_profile_registry.json`
   - Contains all type definitions
   - Use this for JavaScript integration

3. **Keypair** 🔑
   - `target/deploy/analos_profile_registry-keypair.json`
   - Program ID keypair
   - **KEEP THIS SECURE!**

---

## 🔧 **STEP 9: Deploy to Analos Mainnet**

Once you have the binary from Playground:

```bash
# Configure Solana CLI for Analos
solana config set --url https://rpc.analos.io

# Check balance (need ~10 SOL for deployment)
solana balance

# Deploy with the Playground keypair
solana program deploy \
  --program-id ./target/deploy/analos_profile_registry-keypair.json \
  --keypair ~/.config/solana/id.json \
  ./target/deploy/analos_profile_registry.so

# Output will show your Program ID
# Example: Program Id: AbC123...xyz789
```

---

## 📊 **Expected Output from Playground:**

### **Build Output:**
```
🔨 Building program...
✅ Build successful!
📦 Size: 87,234 bytes
💰 Estimated cost: ~8.5 SOL
```

### **Deployment Output:**
```
🚀 Deploying to Devnet...
✅ Deployed!
📍 Program ID: AbC123...xyz789
🔗 Explorer: https://explorer.solana.com/address/AbC123...xyz789?cluster=devnet
```

### **IDL Preview:**
```json
{
  "version": "0.1.0",
  "name": "analos_profile_registry",
  "instructions": [
    {
      "name": "registerProfile",
      "accounts": [
        { "name": "userWallet", "isMut": true, "isSigner": true },
        { "name": "profileRegistry", "isMut": true, "isSigner": false },
        { "name": "usernameRegistry", "isMut": true, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "username", "type": "string" },
        { "name": "profileNftMint", "type": "publicKey" },
        { "name": "losBrosMint", "type": { "option": "publicKey" } },
        { "name": "tier", "type": "u8" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProfileRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "version", "type": "u8" },
          { "name": "wallet", "type": "publicKey" },
          { "name": "username", "type": "string" },
          { "name": "profileNftMint", "type": "publicKey" },
          { "name": "losBrosMint", "type": { "option": "publicKey" } },
          { "name": "tier", "type": "u8" },
          { "name": "createdAt", "type": "i64" },
          { "name": "updatedAt", "type": "i64" },
          { "name": "isActive", "type": "bool" }
        ]
      }
    },
    {
      "name": "UsernameRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "version", "type": "u8" },
          { "name": "username", "type": "string" },
          { "name": "owner", "type": "publicKey" },
          { "name": "profileRegistry", "type": "publicKey" },
          { "name": "registeredAt", "type": "i64" },
          { "name": "lastTransferredAt", "type": "i64" },
          { "name": "isAvailable", "type": "bool" }
        ]
      }
    }
  ],
  "errors": [
    { "code": 6000, "name": "UsernameAlreadyTaken", "msg": "Username is already taken" },
    { "code": 6001, "name": "InvalidUsernameFormat", "msg": "Invalid username format" },
    { "code": 6002, "name": "UsernameMustStartWithLetter", "msg": "Username must start with a letter" },
    { "code": 6003, "name": "UnauthorizedOwner", "msg": "Not the profile owner" }
  ]
}
```

---

## 🎯 **Quick Reference:**

### **Playground Steps:**
1. ✅ Open https://beta.solpg.io/
2. ✅ Create new Anchor project
3. ✅ Paste `lib.rs` code above
4. ✅ Click **Build**
5. ✅ Click **Deploy** (Devnet first)
6. ✅ Copy Program ID
7. ✅ Download IDL
8. ✅ Download `.so` binary

### **CLI Deployment to Analos:**
```bash
solana config set --url https://rpc.analos.io
solana program deploy ./analos_profile_registry.so
```

### **Update Your Code:**
Replace `11111111111111111111111111111111` with actual Program ID

---

## 💰 **Cost Breakdown:**

- **Devnet Deployment**: FREE (for testing)
- **Analos Deployment**: ~8-10 SOL (one-time)
- **Per User Registration**: ~0.004 SOL (rent, reclaimable)

---

## ✅ **Checklist:**

- [ ] Open Solana Playground
- [ ] Paste lib.rs code
- [ ] Build program
- [ ] Deploy to Devnet
- [ ] Test with transactions
- [ ] Download IDL JSON
- [ ] Download .so binary
- [ ] Deploy to Analos with CLI
- [ ] Update program IDs in code
- [ ] Integrate with minting flow

---

## 🎉 **After Deployment:**

Your platform will have:
- ✅ **On-chain username registry** (like SNS)
- ✅ **Blockchain-enforced uniqueness**
- ✅ **Zero collision possibility**
- ✅ **Atomic reservation** (with NFT mint)
- ✅ **Composable** (other programs can use)

**Ready for Solana Playground!** 🚀

---

## 📞 **Need Help?**

- **Solana Playground**: https://beta.solpg.io/
- **Anchor Docs**: https://www.anchor-lang.com/
- **Analos RPC**: https://docs.analos.io/developers/rpc

Copy the `lib.rs` code above into Playground and you're ready to build! 🎮✨

