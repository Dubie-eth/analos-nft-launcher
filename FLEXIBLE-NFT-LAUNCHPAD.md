# 🎨 Flexible NFT Launchpad - Two Modes

## 🎯 Two Launch Modes

Your NFT Launchpad should support BOTH:

### **Mode 1: NFT-Only (Regular Collection)**
- Just want to launch an NFT collection
- No tokens
- No bonding curve
- No rarity-to-token conversion
- Users mint, reveal, and that's it!
- **Example**: Art collection, PFPs, collectibles

### **Mode 2: NFT-to-Token (Full Ecosystem)**
- NFTs convert to tokens based on rarity
- Bonding curve for price discovery
- Token trading on DLMM
- Buyback mechanism
- **Example**: Your full Analos vision

---

## 🔧 Implementation

### Add to CollectionConfig:

```rust
#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub max_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub current_supply: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    
    // NEW: Launch mode configuration
    pub launch_mode: LaunchMode,              // 🆕 NFT-Only or NFT-to-Token
    pub token_launch_enabled: bool,            // 🆕 false = NFT-Only
    pub token_launch_config: Option<Pubkey>,   // 🆕 None if NFT-Only
    
    #[max_len(50)]
    pub collection_name: String,
    #[max_len(10)]
    pub collection_symbol: String,
    #[max_len(200)]
    pub placeholder_uri: String,
    #[max_len(200)]
    pub revealed_base_uri: String,
    pub global_seed: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum LaunchMode {
    NftOnly,           // Just NFTs, no tokens
    NftToToken,        // Full ecosystem with tokens
}
```

### Updated initialize_collection:

```rust
pub fn initialize_collection(
    ctx: Context<InitializeCollection>,
    max_supply: u64,
    price_lamports: u64,
    reveal_threshold: u64,
    collection_name: String,
    collection_symbol: String,
    placeholder_uri: String,
    launch_mode: LaunchMode,              // 🆕 Choose mode
    enable_token_launch: bool,            // 🆕 Enable tokens?
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
    
    // NEW: Set launch mode
    config.launch_mode = launch_mode;
    config.token_launch_enabled = enable_token_launch;
    config.token_launch_config = None; // Set later if enabling tokens
    
    let clock = Clock::get()?;
    let seed_data = [
        ctx.accounts.authority.key().as_ref(),
        &clock.unix_timestamp.to_le_bytes(),
        &clock.slot.to_le_bytes(),
    ].concat();
    let seed_hash = keccak::hash(&seed_data);
    config.global_seed = seed_hash.to_bytes();

    msg!("Collection initialized: {} (Mode: {:?})", config.collection_name, launch_mode);
    Ok(())
}
```

### Conditional Logic:

```rust
// In set_nft_rarity - only if token launch enabled
pub fn set_nft_rarity(
    ctx: Context<SetNftRarity>,
    rarity_tier: u8,
    rarity_multiplier: u64,
) -> Result<()> {
    let nft_record = &mut ctx.accounts.nft_record;
    let config = &ctx.accounts.collection_config;
    
    // Only set rarity if token launch is enabled
    require!(config.token_launch_enabled, ErrorCode::TokenLaunchNotEnabled);
    require!(config.is_revealed, ErrorCode::NotRevealed);
    
    nft_record.rarity_tier = Some(rarity_tier);
    nft_record.rarity_multiplier = Some(rarity_multiplier);
    
    Ok(())
}

// In mark_tokens_claimed - only if token launch enabled
pub fn mark_tokens_claimed(
    ctx: Context<MarkTokensClaimed>,
) -> Result<()> {
    let nft_record = &mut ctx.accounts.nft_record;
    let config = &ctx.accounts.collection_config;
    
    require!(config.token_launch_enabled, ErrorCode::TokenLaunchNotEnabled);
    require!(!nft_record.tokens_claimed, ErrorCode::TokensAlreadyClaimed);
    
    nft_record.tokens_claimed = true;
    Ok(())
}
```

---

## 🎨 NFT-Only Mode Flow

```
1. Creator calls initialize_collection(launch_mode: NftOnly)
   └─> token_launch_enabled: false
   └─> No token integration needed

2. Users mint NFTs
   └─> register_nft_mint() still works
   └─> But rarity_tier stays None
   └─> No token multiplier

3. Collection reveals
   └─> Just shows NFT art
   └─> No rarity determination needed
   └─> No token distribution

4. Done!
   └─> Users have NFT collection
   └─> Can trade on marketplaces
   └─> No tokens, no bonding curve
```

---

## 🚀 NFT-to-Token Mode Flow

```
1. Creator calls initialize_collection(launch_mode: NftToToken)
   └─> token_launch_enabled: true
   └─> Full integration active

2. Users mint NFTs
   └─> register_nft_mint()
   └─> rarity_tier: None (not set yet)

3. Collection reveals
   └─> Rarity Oracle determines rarity
   └─> set_nft_rarity() called
   └─> rarity_tier and multiplier set

4. Token distribution
   └─> Token Launch reads rarity
   └─> Distributes tokens based on multiplier
   └─> mark_tokens_claimed()

5. Bonding curve activated
   └─> Trading begins
   └─> DLMM integration
   └─> Buyback available
```

---

## 📊 Comparison

| Feature | NFT-Only | NFT-to-Token |
|---------|----------|--------------|
| NFT Minting | ✅ Yes | ✅ Yes |
| Blind Reveal | ✅ Yes | ✅ Yes |
| Rarity System | ❌ No | ✅ Yes |
| Token Distribution | ❌ No | ✅ Yes |
| Bonding Curve | ❌ No | ✅ Yes |
| DLMM Trading | ❌ No | ✅ Yes |
| Buyback | ❌ No | ✅ Yes |
| **Complexity** | Simple | Full |
| **Use Case** | Art/PFPs | GameFi/DeFi |

---

## 🎯 Frontend UI

### Launch Wizard:

```typescript
interface LaunchOptions {
  // Step 1: Choose Mode
  launchMode: 'nft-only' | 'nft-to-token';
  
  // Step 2: Collection Details
  collectionName: string;
  collectionSymbol: string;
  maxSupply: number;
  mintPrice: number;
  
  // Step 3: Token Options (only if nft-to-token)
  enableTokenLaunch?: boolean;
  tokensPerNft?: number;
  bondingCurveEnabled?: boolean;
  
  // Step 4: Advanced
  revealThreshold: number;
}
```

### UI Flow:

```
┌─────────────────────────────────┐
│  Choose Your Launch Type        │
│                                 │
│  ○ NFT-Only Collection          │
│    Simple NFT collection        │
│    No tokens, no complexity     │
│                                 │
│  ● NFT-to-Token Launchpad       │
│    Full ecosystem with tokens   │
│    Bonding curve & trading      │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  Collection Details             │
│                                 │
│  Name: Analos Genesis          │
│  Symbol: ANALOS                │
│  Max Supply: 10,000            │
│  Mint Price: 0.1 LOS           │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  Token Options                  │
│  (Only if NFT-to-Token)         │
│                                 │
│  ☑ Enable Token Launch          │
│  Tokens per NFT: 1,000         │
│  ☑ Enable Bonding Curve         │
│  Initial Price: 0.001 LOS      │
└─────────────────────────────────┘
```

---

## 💰 Pricing Examples

### NFT-Only (Simple):
- **Mint Price**: Fixed (e.g., 0.1 LOS per NFT)
- **Revenue**: Goes to creator
- **No tokens**: Just NFT sales
- **Example**: 10,000 NFTs × 0.1 LOS = 1,000 LOS revenue

### NFT-to-Token (Complex):
- **Mint Price**: Fixed (e.g., 0.1 LOS per NFT)
- **Token Revenue**: From bonding curve
- **Creator Share**: 20% of tokens (vested)
- **Example**: 
  - NFT sales: 1,000 LOS
  - Token launch: Creates pool
  - Trading fees: Ongoing revenue
  - Much higher potential!

---

## 🎮 Use Cases

### NFT-Only Mode:
✅ **Art Collections** - Just want to sell art
✅ **PFP Projects** - Profile pictures
✅ **Small Drops** - 100-500 NFTs
✅ **Community Passes** - Membership NFTs
✅ **No Token Complexity** - Keep it simple

### NFT-to-Token Mode:
✅ **GameFi Projects** - NFTs → Game tokens
✅ **Large Launches** - 5,000-10,000 NFTs
✅ **Community Tokens** - Build ecosystem
✅ **Rarity Matters** - Different tiers
✅ **Ongoing Economy** - Not just a mint

---

## ✅ Benefits of Dual Mode

### For Creators:
- **Flexibility**: Choose what fits their project
- **Lower Barrier**: Can start simple (NFT-Only)
- **Upgrade Path**: Can add tokens later
- **Cost**: NFT-Only is cheaper (fewer txs)

### For Platform:
- **More Users**: Appeal to simple projects too
- **Revenue**: Fees from both modes
- **Ecosystem**: More collections = more activity
- **Competitive**: Other platforms only do one mode

---

## 🔄 Mode Switching

### Can you switch modes later?

```rust
// Add instruction to enable token launch later
pub fn enable_token_launch(
    ctx: Context<EnableTokenLaunch>,
    token_launch_config: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.collection_config;
    
    // Only if currently NFT-Only
    require!(config.launch_mode == LaunchMode::NftOnly, ErrorCode::AlreadyTokenMode);
    require!(!config.token_launch_enabled, ErrorCode::AlreadyEnabled);
    
    // Upgrade to NFT-to-Token mode
    config.launch_mode = LaunchMode::NftToToken;
    config.token_launch_enabled = true;
    config.token_launch_config = Some(token_launch_config);
    
    msg!("Token launch enabled for collection: {}", config.collection_name);
    Ok(())
}
```

**Benefits**:
- Start simple with NFT-Only
- If successful, upgrade to NFT-to-Token
- Add tokens/bonding curve later
- Flexibility for creators!

---

## 🎯 Recommendation

### Implement BOTH modes:

1. **Default**: Let creator choose at initialization
2. **NFT-Only**: Skip all token/rarity logic
3. **NFT-to-Token**: Full ecosystem
4. **Upgrade Path**: Allow enabling tokens later
5. **UI**: Clear choice in launch wizard

This makes your platform:
- ✅ **More accessible** (simple projects can use it)
- ✅ **More powerful** (complex projects have full features)
- ✅ **More competitive** (supports all use cases)
- ✅ **More revenue** (more projects = more fees)

**You become the go-to launchpad for BOTH simple and complex NFT projects!** 🚀

