# 🚀 **Token Launch Program - Complete Guide**

## **"Pump.fun for NFTs" - Phase 1 Complete!**

The Token Launch Program is the **core** of the NFT-to-Token ecosystem. It handles token minting, distribution, bonding, and buyback mechanics.

---

## 🎯 **What It Does**

### **Core Features:**

1. **Token Minting** - Creates 10,000 tokens (or custom amount) per NFT minted
2. **Rarity-Based Distribution** - Users get 1x to 1000x tokens based on rarity
3. **Bonding** - When collection sells out, triggers token launch
4. **DLMM Pool** - Creates liquidity pool with 80/20 split (configurable)
5. **Buyback** - Users can burn tokens to re-mint NFTs
6. **Creator Claims** - Creators withdraw their 20% token allocation

---

## 📦 **Program Structure**

### **Location:**
```
programs/analos-token-launch/
├── src/
│   └── lib.rs (Complete implementation)
└── Cargo.toml
```

### **Program ID:**
Will be generated on deployment

### **Dependencies:**
- anchor-lang: 0.28.0
- anchor-spl: 0.28.0
- mpl-token-metadata: 4.1.3
- spl-token: 3.5.0

---

## 🔧 **Instructions**

### **1. initialize_token_launch**
**Purpose:** Set up token launch for an NFT collection

**Parameters:**
- `tokens_per_nft` - How many tokens per NFT (default: 10,000)
- `pool_percentage_bps` - % to pool (default: 8000 = 80%)
- `token_name` - Name of token (e.g., "Analos Apes Token")
- `token_symbol` - Symbol (e.g., "AAT")

**Example:**
```typescript
await program.methods
    .initializeTokenLaunch(
        new BN(10000),        // 10,000 tokens per NFT
        8000,                 // 80% to pool
        "Analos Apes Token",
        "AAT"
    )
    .accounts({
        tokenLaunchConfig,
        nftCollectionConfig,
        tokenMint,
        tokenEscrow,
        authority,
        tokenProgram,
        systemProgram,
        rent,
    })
    .rpc();
```

### **2. mint_tokens_for_nft**
**Purpose:** Mint tokens when NFT is minted (CPI from NFT Launchpad)

**Parameters:**
- `nft_mint` - NFT mint address

**Flow:**
```
NFT Launchpad mints NFT
    ↓ CPI CALL
Token Launch mints 10,000 tokens → escrow
```

### **3. distribute_tokens_by_rarity**
**Purpose:** Give tokens to user based on NFT rarity after reveal

**Parameters:**
- `nft_mint` - NFT mint address
- `rarity_tier` - Tier (0-9)
- `token_multiplier` - Multiplier (1-1000)

**Example:**
```typescript
// User revealed a Mythic NFT (1000x multiplier)
await program.methods
    .distributeTokensByRarity(
        nftMint,
        5,      // Tier 5 (Mythic)
        1000    // 1000x multiplier
    )
    .accounts({
        tokenLaunchConfig,
        userTokenClaim,
        tokenEscrow,
        userTokenAccount,
        user,
        tokenProgram,
        systemProgram,
    })
    .rpc();

// User receives: 10,000 × 1,000 = 10,000,000 tokens!
```

### **4. trigger_bonding**
**Purpose:** Start bonding process when collection sells out

**Parameters:**
- `initial_sol_amount` - SOL to pair with tokens in pool

**Example:**
```typescript
await program.methods
    .triggerBonding(
        new BN(7448 * 1e9)  // 7,448 SOL for liquidity
    )
    .accounts({
        tokenLaunchConfig,
        tokenEscrow,
        authority,
    })
    .rpc();
```

**What Happens:**
- Calculates pool tokens (80%) and creator tokens (20%)
- Marks collection as bonded
- Enables buyback
- Ready for DLMM pool creation

### **5. set_dlmm_pool**
**Purpose:** Record DLMM pool address after external creation

**Parameters:**
- `dlmm_pool` - Meteora DLMM pool address
- `dlmm_position` - LP position address

**Example:**
```typescript
await program.methods
    .setDlmmPool(dlmmPoolAddress, dlmmPositionAddress)
    .accounts({
        tokenLaunchConfig,
        authority,
    })
    .rpc();
```

### **6. configure_buyback**
**Purpose:** Set buyback pricing

**Parameters:**
- `enabled` - Enable/disable buyback
- `price_tokens` - Price in tokens to buyback NFT

**Example:**
```typescript
await program.methods
    .configureBuyback(
        true,
        new BN(112360)  // ~112k tokens = ~1 SOL worth
    )
    .accounts({
        tokenLaunchConfig,
        authority,
    })
    .rpc();
```

### **7. buyback_nft_with_tokens**
**Purpose:** User burns tokens to get new NFT

**Flow:**
```typescript
await program.methods
    .buybackNftWithTokens()
    .accounts({
        tokenLaunchConfig,
        tokenMint,
        userTokenAccount,
        user,
        tokenProgram,
    })
    .rpc();

// Tokens burned from user
// User receives new NFT (via CPI to NFT Launchpad)
// Can reveal again for new rarity
```

### **8. withdraw_creator_tokens**
**Purpose:** Creator withdraws their 20% token allocation

**Example:**
```typescript
await program.methods
    .withdrawCreatorTokens(
        new BN(209000000)  // 209M tokens
    )
    .accounts({
        tokenLaunchConfig,
        tokenEscrow,
        creatorTokenAccount,
        creator,
        authority,
        tokenProgram,
    })
    .rpc();
```

---

## 📊 **Data Structures**

### **TokenLaunchConfig:**
```rust
pub struct TokenLaunchConfig {
    pub nft_collection_config: Pubkey,     // Link to NFT collection
    pub token_mint: Pubkey,                // SPL Token mint
    pub token_escrow: Pubkey,              // Token escrow account
    pub authority: Pubkey,                 // Creator
    
    // Token Economics
    pub tokens_per_nft: u64,               // Base tokens per NFT
    pub total_tokens_minted: u64,          // Total minted
    pub total_tokens_distributed: u64,     // Total given to users
    
    // Pool Split
    pub pool_percentage_bps: u16,          // % to pool (8000 = 80%)
    pub creator_percentage_bps: u16,       // % to creator (2000 = 20%)
    pub pool_tokens: u64,                  // Tokens for pool
    pub creator_tokens: u64,               // Tokens for creator
    
    // DLMM
    pub dlmm_pool: Option<Pubkey>,         // Pool address
    pub dlmm_position: Option<Pubkey>,     // LP position
    pub is_bonded: bool,                   // Bonded?
    pub bond_time: Option<i64>,            // When bonded
    
    // Buyback
    pub buyback_enabled: bool,             // Allow buyback?
    pub buyback_price_tokens: u64,         // Price in tokens
    pub total_buybacks: u64,               // Count
    
    // Metadata
    pub token_name: String,                // Token name
    pub token_symbol: String,              // Token symbol
    pub created_at: i64,                   // Creation time
}
```

### **UserTokenClaim:**
```rust
pub struct UserTokenClaim {
    pub user: Pubkey,
    pub collection_config: Pubkey,
    pub nft_mint: Pubkey,
    pub rarity_tier: u8,               // 0-9
    pub tokens_claimed: u64,           // Amount received
    pub token_multiplier: u64,         // Multiplier applied
    pub claimed_at: i64,               // When claimed
}
```

---

## 💰 **Economics Example**

### **Collection: 10,000 NFTs @ 1 SOL**

#### **Phase 1: Minting**
```
Total Minted: 10,000 NFTs
Tokens Created: 100,000,000 (10k × 10,000)
Tokens in Escrow: 100,000,000 (waiting for reveals)
```

#### **Phase 2: Reveals (with multipliers)**
```
Common (70%, 1x): 7,000 × 10,000 = 70,000,000 tokens
Uncommon (15%, 5x): 1,500 × 50,000 = 75,000,000 tokens
Rare (10%, 10x): 1,000 × 100,000 = 100,000,000 tokens
Epic (3%, 50x): 300 × 500,000 = 150,000,000 tokens
Legendary (1.5%, 100x): 150 × 1,000,000 = 150,000,000 tokens
Mythic (0.5%, 1000x): 50 × 10,000,000 = 500,000,000 tokens

TOTAL DISTRIBUTED: 1,045,000,000 tokens (10.45x base!)
```

#### **Phase 3: Bonding**
```
Pool Tokens (80%): 836,000,000 tokens
Pool SOL (80%): 7,448 SOL
Initial Price: ~0.0000089 SOL/token

Creator Tokens (20%): 209,000,000 tokens
Creator SOL: 1,862 SOL (claimable)
```

#### **Phase 4: Trading**
```
Users trade on losscreener.com
Price discovery begins
Liquidity from 80% allocation
```

#### **Phase 5: Buyback**
```
Token Price: 0.0000089 SOL/token
Buyback Cost: 1 SOL = ~112,360 tokens
User burns tokens → gets new NFT → reveal again
```

---

## 🔗 **Integration with NFT Launchpad**

### **Minting Flow:**
```rust
// In NFT Launchpad (lib.rs):
pub fn mint_placeholder(...) -> Result<()> {
    // ... existing mint logic ...
    
    // CPI to Token Launch
    let cpi_accounts = MintTokensForNFT {
        token_launch_config,
        token_mint,
        token_escrow,
        token_program,
    };
    let cpi_ctx = CpiContext::new(token_launch_program, cpi_accounts);
    analos_token_launch::cpi::mint_tokens_for_nft(cpi_ctx, nft_mint)?;
    
    Ok(())
}
```

### **Reveal Flow:**
```rust
// In NFT Launchpad (lib.rs):
pub fn reveal_nft_with_fee(...) -> Result<()> {
    // ... existing reveal logic ...
    
    // Determine rarity (from metadata or oracle)
    let rarity_tier = determine_rarity(&nft_metadata)?;
    let token_multiplier = get_multiplier(rarity_tier)?;
    
    // CPI to Token Launch
    let cpi_accounts = DistributeTokens {
        token_launch_config,
        user_token_claim,
        token_escrow,
        user_token_account,
        user,
        token_program,
        system_program,
    };
    let cpi_ctx = CpiContext::new(token_launch_program, cpi_accounts);
    analos_token_launch::cpi::distribute_tokens_by_rarity(
        cpi_ctx, 
        nft_mint, 
        rarity_tier, 
        token_multiplier
    )?;
    
    Ok(())
}
```

---

## 🎮 **Frontend Integration**

### **Initialize Token Launch:**
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnalosTokenLaunch } from "./types/analos_token_launch";

const program = anchor.workspace.AnalosTokenLaunch as Program<AnalosTokenLaunch>;

// Initialize
await program.methods
    .initializeTokenLaunch(
        new anchor.BN(10000),  // tokens per NFT
        8000,                   // 80% to pool
        "My Collection Token",
        "MCT"
    )
    .accounts({...})
    .rpc();
```

### **Check Token Balance:**
```typescript
const userClaim = await program.account.userTokenClaim.fetch(userClaimPDA);
console.log("Tokens claimed:", userClaim.tokensClaimed.toString());
console.log("Rarity tier:", userClaim.rarityTier);
console.log("Multiplier:", userClaim.tokenMultiplier);
```

### **Trigger Bonding:**
```typescript
// When collection sells out
await program.methods
    .triggerBonding(new anchor.BN(solAmount))
    .accounts({...})
    .rpc();

console.log("Collection bonded! Token launch initiated!");
```

---

## 🚀 **Next Steps**

### **To Complete System:**

1. **Rarity Oracle Program** (Next)
   - Determines NFT rarity
   - Calculates multipliers
   - Verifies metadata

2. **DLMM Integration** (After Oracle)
   - Meteora pool creation
   - Liquidity provision
   - Trading enablement

3. **Frontend** (Final)
   - Minting interface
   - Reveal experience
   - Trading dashboard
   - Buyback interface

---

## ✅ **Status**

**Token Launch Program: COMPLETE! ✅**

**Features Implemented:**
- ✅ Token minting per NFT
- ✅ Rarity-based distribution
- ✅ Bonding trigger
- ✅ DLMM pool management
- ✅ Buyback mechanism
- ✅ Creator withdrawals
- ✅ Full event tracking
- ✅ Error handling

**Lines of Code:** ~700

**Ready for:** Devnet testing & Rarity Oracle integration

---

## 🎯 **Summary**

The Token Launch Program is the **foundation** of the "Pump.fun for NFTs" ecosystem:

1. ✅ Mints tokens automatically with NFTs
2. ✅ Distributes based on rarity (1x-1000x)
3. ✅ Creates liquidity pools (80/20 split)
4. ✅ Enables buyback mechanism
5. ✅ Manages creator allocations
6. ✅ Integrates with NFT Launchpad via CPI

**Next:** Build the Rarity Oracle Program! 🚀
