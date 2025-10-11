# 🎨 DEPLOY METAPLEX TOKEN METADATA TO ANALOS

## 🎯 OVERVIEW

Metaplex Token Metadata is the standard for Solana NFTs. Deploying it to Analos will make your NFTs:
- ✅ Visible in Phantom, Solflare, and other wallets
- ✅ Compatible with marketplaces
- ✅ Tradeable with standard SPL token programs

---

## ⚠️ IMPORTANT DECISION POINT

Metaplex Token Metadata is **VERY LARGE** and has many dependencies. You have **3 options**:

### **OPTION 1: Use Solana's Deployed Metaplex (Recommended) 🌟**
**What:** Use the already-deployed Metaplex program from Solana mainnet
**Program ID:** `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`

**Pros:**
- ✅ Already deployed and tested
- ✅ Zero deployment cost
- ✅ Standard across all Solana chains
- ✅ Works immediately

**Cons:**
- ⚠️ Requires Analos to be compatible with Solana programs
- ⚠️ May need Analos team to enable it

**How to check if it works:**
```bash
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --url https://rpc.analos.io
```

---

### **OPTION 2: Deploy Custom Lightweight Metadata Program (Easiest) 🚀**
**What:** Deploy a simplified version that stores only essential metadata
**Size:** ~50-100 KB
**Cost:** ~2-3 LOS

**Pros:**
- ✅ Easy to deploy
- ✅ Works with your existing programs
- ✅ You control it completely
- ✅ Gas efficient

**Cons:**
- ⚠️ Not standard Metaplex format (but can convert)
- ⚠️ Need custom wallet integration

**This is what I recommend if Option 1 doesn't work!**

---

### **OPTION 3: Deploy Full Metaplex (Complex) ⚠️**
**What:** Deploy the complete Metaplex Token Metadata program
**Size:** ~800 KB
**Cost:** ~15-20 LOS

**Pros:**
- ✅ 100% compatible with everything

**Cons:**
- ⚠️ Very large program
- ⚠️ Complex dependencies
- ⚠️ High deployment cost
- ⚠️ May fail on Analos due to compute limits

---

## 🚀 LET'S START WITH OPTION 1

### **STEP 1: Check if Metaplex Works on Analos**

Run this command to see if Analos has the standard Metaplex program:

```bash
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --url https://rpc.analos.io
```

**If this works:** 🎉 You can use standard Metaplex immediately! Skip to "Integration" section below.

**If this fails:** 😔 We need to deploy a custom version. Continue to Step 2.

---

## 🔧 STEP 2: DEPLOY LIGHTWEIGHT METADATA PROGRAM

If Option 1 doesn't work, let's deploy a lightweight alternative that's compatible with your system.

### **2.1: Create Simplified Metadata Program**

I'll create a lightweight program that:
- Stores NFT name, symbol, URI
- Compatible with SPL tokens
- Works with your NFT Launchpad
- Much smaller than full Metaplex (~50 KB vs 800 KB)

**File:** `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\programs\analos-metadata\src\lib.rs`

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

declare_id!("META11111111111111111111111111111111111111");

#[program]
pub mod analos_metadata {
    use super::*;

    /// Create metadata for an NFT
    pub fn create_metadata(
        ctx: Context<CreateMetadata>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let metadata = &mut ctx.accounts.metadata;
        
        require!(name.len() <= 32, ErrorCode::NameTooLong);
        require!(symbol.len() <= 10, ErrorCode::SymbolTooLong);
        require!(uri.len() <= 200, ErrorCode::UriTooLong);
        
        metadata.mint = ctx.accounts.mint.key();
        metadata.update_authority = ctx.accounts.update_authority.key();
        metadata.name = name;
        metadata.symbol = symbol;
        metadata.uri = uri;
        metadata.is_mutable = true;
        
        msg!("NFT Metadata created for mint: {}", ctx.accounts.mint.key());
        
        Ok(())
    }

    /// Update metadata (only by update authority)
    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        name: Option<String>,
        symbol: Option<String>,
        uri: Option<String>,
    ) -> Result<()> {
        let metadata = &mut ctx.accounts.metadata;
        
        if let Some(new_name) = name {
            require!(new_name.len() <= 32, ErrorCode::NameTooLong);
            metadata.name = new_name;
        }
        
        if let Some(new_symbol) = symbol {
            require!(new_symbol.len() <= 10, ErrorCode::SymbolTooLong);
            metadata.symbol = new_symbol;
        }
        
        if let Some(new_uri) = uri {
            require!(new_uri.len() <= 200, ErrorCode::UriTooLong);
            metadata.uri = new_uri;
        }
        
        msg!("NFT Metadata updated for mint: {}", metadata.mint);
        
        Ok(())
    }

    /// Transfer update authority
    pub fn update_authority(
        ctx: Context<UpdateAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let metadata = &mut ctx.accounts.metadata;
        metadata.update_authority = new_authority;
        
        msg!("Update authority transferred to: {}", new_authority);
        
        Ok(())
    }
}

// ========== ACCOUNTS ==========

#[derive(Accounts)]
pub struct CreateMetadata<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Metadata::SPACE,
        seeds = [b"metadata", mint.key().as_ref()],
        bump
    )]
    pub metadata: Account<'info, Metadata>,
    
    pub mint: Account<'info, Mint>,
    
    /// CHECK: This is the update authority
    pub update_authority: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        seeds = [b"metadata", metadata.mint.as_ref()],
        bump,
        has_one = update_authority,
    )]
    pub metadata: Account<'info, Metadata>,
    
    pub update_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(
        mut,
        seeds = [b"metadata", metadata.mint.as_ref()],
        bump,
        has_one = update_authority,
    )]
    pub metadata: Account<'info, Metadata>,
    
    pub update_authority: Signer<'info>,
}

// ========== STATE ==========

#[account]
pub struct Metadata {
    pub mint: Pubkey,                // 32 bytes
    pub update_authority: Pubkey,    // 32 bytes
    pub name: String,                // 4 + 32 bytes
    pub symbol: String,              // 4 + 10 bytes
    pub uri: String,                 // 4 + 200 bytes
    pub is_mutable: bool,            // 1 byte
}

impl Metadata {
    pub const SPACE: usize = 32 + 32 + 4 + 32 + 4 + 10 + 4 + 200 + 1;
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Name too long (max 32 characters)")]
    NameTooLong,
    #[msg("Symbol too long (max 10 characters)")]
    SymbolTooLong,
    #[msg("URI too long (max 200 characters)")]
    UriTooLong,
}
```

---

### **2.2: Create Cargo.toml for Metadata Program**

```toml
[package]
name = "analos-metadata"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_metadata"

[features]
no-entrypoint = []
no-idl = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
```

---

### **2.3: Deploy Lightweight Metadata Program**

```bash
# 1. Navigate to programs directory
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad

# 2. Create new metadata program directory
mkdir programs\analos-metadata
mkdir programs\analos-metadata\src

# 3. Copy the lib.rs and Cargo.toml we created above

# 4. Update Anchor.toml to include new program
```

**Update Anchor.toml:**
```toml
[programs.mainnet]
analos_nft_launchpad = "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"
analos_token_launch = "HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx"
analos_rarity_oracle = "H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6"
analos_price_oracle = "ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn"
analos_metadata = "META11111111111111111111111111111111111111"  # Will be updated after deployment
```

---

## 🎯 STEP 3: DEPLOYMENT METHOD

Since we can't build locally (BPF SDK issue), let's use **Solana Playground**:

### **3.1: Go to Solana Playground**
https://beta.solpg.io

### **3.2: Create New Project**
1. Click "Create new project"
2. Select "Anchor" framework
3. Name it "analos-metadata"

### **3.3: Copy Program Files**
1. Replace `lib.rs` with the lightweight program above
2. Replace `Cargo.toml` with the config above

### **3.4: Configure Analos Network**
1. Click settings (gear icon)
2. Set endpoint to: `https://rpc.analos.io`
3. Connect your wallet (make sure it has ~5 LOS)

### **3.5: Build**
```bash
build
```

### **3.6: Deploy**
```bash
deploy
```

**Save the Program ID!** Example: `META4g8x7Z9YqKN3kR2pD5J8mH3vW1nL7xC9tS6uA2`

---

## 🔌 STEP 4: INTEGRATION WITH YOUR NFT LAUNCHPAD

Once deployed, update your backend to create metadata when NFTs are revealed:

**File:** `backend/src/services/nft-metadata-service.ts`

```typescript
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

const METADATA_PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_METADATA_PROGRAM_ID');

export async function createNFTMetadata(
  connection: Connection,
  mintAddress: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  updateAuthority: PublicKey,
  payer: any
) {
  // Derive metadata PDA
  const [metadataPda] = await PublicKey.findProgramAddress(
    [Buffer.from('metadata'), mintAddress.toBuffer()],
    METADATA_PROGRAM_ID
  );

  // Create metadata instruction
  const program = new Program(METADATA_IDL, METADATA_PROGRAM_ID, provider);
  
  const tx = await program.methods
    .createMetadata(name, symbol, uri)
    .accounts({
      metadata: metadataPda,
      mint: mintAddress,
      updateAuthority: updateAuthority,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return {
    signature: tx,
    metadataAddress: metadataPda,
  };
}
```

---

## 📊 SUMMARY

### **If Solana's Metaplex Works on Analos:**
- Use Program ID: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- No deployment needed
- Standard compatibility

### **If We Deploy Lightweight Version:**
- Custom Program ID (you'll get after deployment)
- Smaller and faster
- Compatible with your existing programs
- Easy integration

---

## 🚦 CURRENT STATUS

```
✅ 4 Core Programs Deployed
  - NFT Launchpad
  - Price Oracle
  - Rarity Oracle
  - Token Launch

⏳ Metadata Program (Next Step)
  Option 1: Check if Solana's Metaplex works ← START HERE
  Option 2: Deploy lightweight version (if needed)
```

---

## 🎯 NEXT ACTIONS

1. **Test Option 1 first:**
   ```bash
   solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --url https://rpc.analos.io
   ```

2. **If that fails, I'll create the lightweight program files for you**

3. **Then we'll deploy via Solana Playground**

4. **Finally, integrate with your NFT Launchpad**

---

**Ready to test Option 1? Let's check if Metaplex already works on Analos!** 🚀

