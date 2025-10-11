# 🏗️ **NFT-to-Token Launch System - Complete Architecture**

## **Vision: "Pump.fun for NFTs" on Analos**

Build a complete ecosystem where NFT collections automatically launch tokens with liquidity, rarity-based rewards, and buyback mechanisms.

---

## 🎯 **System Overview**

```
NFT Mint → Token Mint → DLMM Pool → Trading → Buyback NFTs
    ↓           ↓           ↓          ↓          ↓
 Bonding    10,000x    80% to Pool  Revenue  Re-reveal
  Curve     Tokens    20% Creator   Split    Mechanism
```

---

## 📦 **Program Architecture**

### **Program 1: NFT Launchpad** (CURRENT - COMPLETE ✅)
**Program ID:** `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

**Responsibilities:**
- NFT minting with bonding curves
- Multi-tier access control
- Reveal mechanism
- Fee distribution (6.9%)
- Escrow management

**Status:** ✅ COMPLETE

---

### **Program 2: Token Launch & Bonding** (NEW)
**Purpose:** Mint tokens per NFT, create liquidity pools, manage bonding completion

**Key Features:**
1. **Token Minting**
   - 10,000 tokens per NFT minted
   - Configurable ratio (creator choice)
   - SPL Token standard

2. **Rarity-Based Distribution**
   - Common: 1x tokens (10,000)
   - Uncommon: 5x tokens (50,000)
   - Rare: 10x tokens (100,000)
   - Epic: 50x tokens (500,000)
   - Legendary: 100x tokens (1,000,000)
   - Mythic: 1000x tokens (10,000,000)

3. **DLMM Pool Creation**
   - Integration with Meteora DLMM
   - 80/20 split (configurable)
   - 80% → Liquidity Pool
   - 20% → Creator Claim

4. **Bonding Completion**
   - Triggered when collection sold out
   - Or after time period
   - Launches token to DEX
   - Opens trading

5. **Buyback Mechanism**
   - Use tokens to buy NFTs back
   - Re-reveal mechanism
   - Burn original, mint new

---

### **Program 3: Rarity Oracle** (NEW)
**Purpose:** Determine and verify NFT rarity on-chain

**Key Features:**
1. **Rarity Assignment**
   - Creator defines rarity tiers
   - Metadata-based verification
   - On-chain proof

2. **Reveal → Rarity → Tokens**
   - User reveals NFT
   - Oracle determines rarity
   - Tokens distributed based on rarity

3. **Dynamic Rarity Updates**
   - Creator can add new art
   - Update rarity distributions
   - Real-time oracle updates

---

## 🔗 **Integration Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER MINTS NFT                           │
│                         ↓                                   │
│              NFT Launchpad Program                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Mint NFT (bonding curve pricing)              │      │
│  │ 2. Collect fees (6.9%)                           │      │
│  │ 3. Send to escrow                                │      │
│  └──────────────────────────────────────────────────┘      │
│                         ↓ CPI CALL                          │
│              Token Launch Program                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Mint 10,000 tokens (or ratio)                 │      │
│  │ 2. Hold in token escrow                          │      │
│  │ 3. Track total tokens minted                     │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│                    USER REVEALS NFT                         │
│                         ↓                                   │
│              NFT Launchpad Program                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. User pays reveal fee (if enabled)             │      │
│  │ 2. Reveal NFT metadata                           │      │
│  └──────────────────────────────────────────────────┘      │
│                         ↓ CPI CALL                          │
│              Rarity Oracle Program                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Read NFT metadata                             │      │
│  │ 2. Determine rarity tier                         │      │
│  │ 3. Calculate token multiplier                    │      │
│  └──────────────────────────────────────────────────┘      │
│                         ↓ CPI CALL                          │
│              Token Launch Program                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Release tokens to user                        │      │
│  │ 2. Apply rarity multiplier                       │      │
│  │ 3. Update token distribution tracking            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│                 COLLECTION BONDS (Sold Out)                 │
│                         ↓                                   │
│              Token Launch Program                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Create DLMM pool on Meteora                   │      │
│  │ 2. Add liquidity (80% of tokens)                 │      │
│  │ 3. Reserve creator tokens (20%)                  │      │
│  │ 4. Enable trading                                │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│                    USER TRADES TOKENS                       │
│                         ↓                                   │
│                    Meteora DLMM                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Token ↔ SOL trading                           │      │
│  │ 2. Liquidity provision                           │      │
│  │ 3. Fee collection                                │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│                USER BUYS BACK NFT WITH TOKENS               │
│                         ↓                                   │
│              Token Launch Program                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. User burns tokens                             │      │
│  │ 2. Calculate NFT price in tokens                 │      │
│  │ 3. Transfer tokens to pool                       │      │
│  └──────────────────────────────────────────────────┘      │
│                         ↓ CPI CALL                          │
│              NFT Launchpad Program                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Burn old NFT (if owned)                       │      │
│  │ 2. Mint new NFT                                  │      │
│  │ 3. User can re-reveal                            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **Data Structures**

### **Token Launch Program:**

```rust
#[account]
pub struct TokenLaunchConfig {
    pub nft_collection_config: Pubkey,      // Link to NFT collection
    pub token_mint: Pubkey,                 // SPL Token mint
    pub token_escrow: Pubkey,               // Token escrow account
    pub authority: Pubkey,                  // Creator authority
    
    // Token Economics
    pub tokens_per_nft: u64,                // Base tokens per NFT (10,000)
    pub total_tokens_minted: u64,           // Total tokens created
    pub total_tokens_distributed: u64,      // Total tokens given to users
    
    // Pool Configuration
    pub pool_percentage_bps: u16,           // % to pool (8000 = 80%)
    pub creator_percentage_bps: u16,        // % to creator (2000 = 20%)
    pub pool_tokens: u64,                   // Tokens allocated to pool
    pub creator_tokens: u64,                // Tokens for creator
    
    // DLMM Pool
    pub dlmm_pool: Option<Pubkey>,          // Meteora DLMM pool
    pub dlmm_position: Option<Pubkey>,      // LP position
    pub is_bonded: bool,                    // Collection bonded?
    pub bond_time: Option<i64>,             // When bonded
    
    // Buyback
    pub buyback_enabled: bool,              // Allow token → NFT
    pub buyback_price_tokens: u64,          // Price in tokens
    pub total_buybacks: u64,                // Track buybacks
    
    pub created_at: i64,
}

#[account]
pub struct RarityConfig {
    pub collection_config: Pubkey,
    pub rarity_tiers: Vec<RarityTier>,      // Up to 10 tiers
    pub total_revealed: u64,
    pub rarity_distribution: Vec<u64>,      // Count per tier
    pub oracle_authority: Pubkey,           // Who can update
    pub is_active: bool,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RarityTier {
    pub tier_id: u8,                        // 0-9
    pub tier_name: String,                  // "Common", "Mythic", etc.
    pub token_multiplier: u64,              // 1x, 10x, 1000x
    pub probability_bps: u16,               // Chance (10000 = 100%)
    pub metadata_attributes: Vec<String>,   // Traits for this tier
    pub total_count: u64,                   // How many revealed
}

#[account]
pub struct UserTokenClaim {
    pub user: Pubkey,
    pub collection_config: Pubkey,
    pub nft_mint: Pubkey,
    pub rarity_tier: u8,
    pub tokens_claimed: u64,
    pub tokens_multiplier: u64,
    pub claimed_at: i64,
}
```

---

## 🎮 **User Journey**

### **Phase 1: Minting (Before Bond)**
```
1. User connects wallet
2. Selects tier (if multi-tier)
3. Pays mint price (bonding curve)
4. Receives NFT (placeholder)
5. 10,000 tokens minted (held in escrow)
6. Platform fee (6.9%) distributed
```

### **Phase 2: Revealing**
```
1. User clicks "Reveal NFT"
2. Pays reveal fee (if enabled)
3. NFT metadata revealed
4. Rarity oracle determines tier
5. Token multiplier applied
6. User receives tokens:
   - Common: 10,000 tokens (1x)
   - Rare: 100,000 tokens (10x)
   - Mythic: 10,000,000 tokens (1000x)
```

### **Phase 3: Bonding (Collection Sold Out)**
```
1. All NFTs minted
2. Token Launch Program:
   - Creates Meteora DLMM pool
   - Adds 80% of tokens as liquidity
   - Pairs with SOL from escrow
   - Reserves 20% for creator
3. Trading opens on DEX
4. Price discovery begins
```

### **Phase 4: Trading**
```
1. Users trade tokens on losscreener.com
2. Buy/sell tokens for SOL
3. Provide liquidity for fees
4. Token price fluctuates
```

### **Phase 5: Buyback (Optional)**
```
1. User unhappy with reveal
2. Uses tokens to buy new NFT
3. Burns X tokens
4. Receives new NFT
5. Can reveal again for new rarity
```

---

## 💰 **Economics Example**

### **Collection: 10,000 NFTs @ 1 SOL each**

**Minting Phase:**
```
Total Raised: 10,000 SOL
Platform Fees (6.9%): 690 SOL
Creator Gets (93.1%): 9,310 SOL
  ├─ To Pool (80%): 7,448 SOL
  └─ Claimable (20%): 1,862 SOL

Total Tokens Minted: 100,000,000 tokens
(10,000 NFTs × 10,000 tokens each)
```

**Rarity Distribution (Example):**
```
Common (70%): 7,000 NFTs × 10,000 tokens = 70,000,000 tokens
Uncommon (15%): 1,500 NFTs × 50,000 tokens = 75,000,000 tokens
Rare (10%): 1,000 NFTs × 100,000 tokens = 100,000,000 tokens
Epic (3%): 300 NFTs × 500,000 tokens = 150,000,000 tokens
Legendary (1.5%): 150 NFTs × 1,000,000 tokens = 150,000,000 tokens
Mythic (0.5%): 50 NFTs × 10,000,000 tokens = 500,000,000 tokens

TOTAL DISTRIBUTED: 1,045,000,000 tokens
(10.45x the base amount due to multipliers!)
```

**DLMM Pool Creation:**
```
Pool Tokens (80%): 836,000,000 tokens
Pool SOL (80%): 7,448 SOL
Initial Price: ~0.0000089 SOL per token

Creator Reserve (20%): 209,000,000 tokens
Creator SOL: 1,862 SOL (claimable)
```

**Buyback Pricing:**
```
If user wants to re-mint:
- Burn tokens worth 1 SOL
- At 0.0000089 SOL/token = ~112,360 tokens
- Receive new NFT
- Can reveal again
```

---

## 🔒 **Security Considerations**

### **1. Oracle Security:**
- Multi-sig oracle authority
- Verifiable randomness for reveals
- Metadata verification on-chain

### **2. Pool Security:**
- DLMM pool immutable after creation
- Liquidity locked (no rug pulls)
- Creator tokens vested/locked

### **3. Buyback Security:**
- Rate limiting on buybacks
- Cooldown periods
- Anti-bot measures

### **4. Rarity Security:**
- On-chain rarity verification
- Transparent probability
- Auditable distribution

---

## 🚀 **Implementation Plan**

### **Phase 1: Token Launch Program** (Week 1)
- [ ] SPL Token minting per NFT
- [ ] Token escrow management
- [ ] Basic distribution logic
- [ ] Integration with NFT Launchpad

### **Phase 2: Rarity Oracle** (Week 2)
- [ ] Rarity tier configuration
- [ ] Metadata reading
- [ ] Token multiplier calculation
- [ ] Distribution tracking

### **Phase 3: DLMM Integration** (Week 3)
- [ ] Meteora DLMM pool creation
- [ ] Liquidity provision
- [ ] Pool management
- [ ] Trading enablement

### **Phase 4: Buyback Mechanism** (Week 4)
- [ ] Token burning
- [ ] NFT re-minting
- [ ] Price calculation
- [ ] Cooldown system

### **Phase 5: Frontend & Testing** (Week 5-6)
- [ ] UI for all features
- [ ] Testing on Devnet
- [ ] Security audit
- [ ] Mainnet deployment

---

## 📱 **Frontend Features**

### **Minting Page:**
- Real-time bonding curve price
- Tier selection
- Token preview (10,000 tokens)
- Estimated rarity odds

### **Reveal Page:**
- Animated reveal experience
- Rarity announcement
- Token claim animation
- Multiplier display

### **Trading Page:**
- Embedded DEX (losscreener.com)
- Price charts
- Liquidity stats
- Volume tracking

### **Buyback Page:**
- Token balance
- Buyback calculator
- Re-mint interface
- Success rate stats

---

## 🎯 **Success Metrics**

### **For Creators:**
- Token market cap
- Liquidity depth
- Trading volume
- Community engagement

### **For Users:**
- Token value
- Rarity distribution
- Trading profits
- Buyback opportunities

### **For Platform:**
- Collections launched
- Total tokens created
- Trading volume
- Platform fees collected

---

## 🌟 **Unique Selling Points**

1. **"Pump.fun for NFTs"** - First on Analos
2. **Fair Launch** - No pre-mine, transparent distribution
3. **Rarity = Value** - Direct correlation
4. **Buyback Mechanism** - Second chances
5. **Creator Aligned** - 80/20 split incentivizes success
6. **Code is Law** - Everything on-chain
7. **DLMM Efficiency** - Best liquidity on Solana/Analos
8. **losscreener.com Integration** - Professional trading UX

---

## 🚀 **READY TO BUILD**

This architecture creates a **complete ecosystem** where:
- NFTs have intrinsic token value
- Rarity directly affects rewards
- Creators benefit from token success
- Users can trade or buyback
- Everything is on-chain and transparent

**Let's start building! Which program do you want me to tackle first?**
1. Token Launch Program
2. Rarity Oracle Program
3. Both simultaneously

I recommend starting with **Token Launch Program** since it's the core of the system! 🎉
