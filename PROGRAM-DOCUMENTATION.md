# Analos Program Documentation

## 🎯 **Overview**

This document provides detailed information about each program in the Analos NFT Launchpad ecosystem.

## 💰 **Price Oracle Program**

**Program ID**: `9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym`

### Purpose
Manages real-time price data for LOS and LOL tokens, providing accurate pricing for the entire ecosystem.

### Key Instructions
- `initializeOracle(marketCapUsd: u64)` - Initialize the oracle with market cap data
- `updateLosMarketCap(marketCapUsd: u64)` - Update LOS market cap
- `updatePrice(price: u64)` - Update token prices
- `pauseOracle()` - Pause oracle updates
- `unpauseOracle()` - Resume oracle updates

### Account Structure
```rust
pub struct PriceOracle {
    pub authority: Pubkey,
    pub market_cap_usd: u64,
    pub los_price: u64,
    pub lol_price: u64,
    pub last_updated: i64,
    pub is_paused: bool,
}
```

### Security Features
- Authority-only updates
- Pause mechanism for emergencies
- Price validation and bounds checking

---

## 🔍 **Rarity Oracle Program**

**Program ID**: `H6sAs9Ewx6BNSF3NkPEEtwZo3kfFwSCfhSsLTGD3a4ym`

### Purpose
Manages NFT rarity configurations and provides rarity scoring for collections.

### Key Instructions
- `initializeRarityConfig()` - Initialize rarity configuration
- `updateRarityConfig(config: RarityConfig)` - Update rarity settings
- `calculateRarity(metadata: Metadata)` - Calculate NFT rarity score
- `setRarityTiers(tiers: Vec<RarityTier>)` - Set rarity tiers

### Account Structure
```rust
pub struct RarityConfig {
    pub authority: Pubkey,
    pub collection_config: Pubkey,
    pub rarity_tiers: Vec<RarityTier>,
    pub is_active: bool,
}

pub struct RarityTier {
    pub name: String,
    pub weight: u64,
    pub color: String,
}
```

### Security Features
- Authority-based configuration
- Tier validation
- Collection-specific settings

---

## 🎨 **NFT Launchpad Program**

**Program ID**: `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`

### Purpose
Manages NFT collection creation, minting, and trading on the Analos platform.

### Key Instructions
- `initializeCollection(maxSupply, priceLamports, revealThreshold, name, symbol, placeholderUri)` - Create new collection
- `mintNft(collectionConfig, metadataUri)` - Mint individual NFTs
- `revealCollection(collectionConfig)` - Reveal collection metadata
- `updateCollectionConfig(collectionConfig, newConfig)` - Update collection settings
- `setMintPrice(collectionConfig, newPrice)` - Update mint price

### Account Structure
```rust
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub collection_name: String,
    pub collection_symbol: String,
    pub max_supply: u64,
    pub current_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub placeholder_uri: String,
    pub is_revealed: bool,
    pub is_active: bool,
}

pub struct NftMetadata {
    pub collection_config: Pubkey,
    pub token_id: u64,
    pub metadata_uri: String,
    pub rarity_score: u64,
    pub is_minted: bool,
}
```

### Security Features
- Supply validation
- Price bounds checking
- Authority-based management
- Reveal mechanism protection

---

## 🚀 **Token Launch Program**

**Program ID**: `[Program ID]`

### Purpose
Manages token creation and initial distribution for new projects.

### Key Instructions
- `initializeToken(name, symbol, decimals, supply)` - Create new token
- `distributeTokens(recipients, amounts)` - Distribute tokens
- `setVestingSchedule(recipient, amount, duration)` - Set up vesting
- `claimVestedTokens(recipient)` - Claim vested tokens

### Account Structure
```rust
pub struct TokenLaunch {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub total_supply: u64,
    pub distributed_supply: u64,
    pub is_active: bool,
}

pub struct VestingSchedule {
    pub recipient: Pubkey,
    pub total_amount: u64,
    pub claimed_amount: u64,
    pub start_time: i64,
    pub duration: i64,
    pub is_active: bool,
}
```

### Security Features
- Supply validation
- Vesting schedule enforcement
- Authority controls
- Distribution limits

---

## 💼 **Enhanced Programs**

### OTC Enhanced
- Peer-to-peer trading
- Escrow management
- Dispute resolution

### Airdrop Enhanced
- Batch airdrops
- Merkle tree verification
- Gas optimization

### Vesting Enhanced
- Flexible vesting schedules
- Cliff periods
- Early release options

### Token Lock Enhanced
- Time-locked tokens
- Multi-signature controls
- Emergency release mechanisms

### Monitoring System
- Real-time monitoring
- Alert systems
- Performance metrics

---

## 🛡️ **Security Considerations**

### General Security Features
1. **Authority Controls** - All programs require proper authority
2. **Input Validation** - All inputs are validated
3. **Bounds Checking** - Numeric values are bounded
4. **Pause Mechanisms** - Emergency pause functionality
5. **Upgrade Safety** - Safe upgrade paths

### Best Practices
- Always verify program IDs
- Check authority permissions
- Validate all inputs
- Use proper error handling
- Monitor for unusual activity

### Audit Recommendations
- Code review all instructions
- Test edge cases
- Verify mathematical operations
- Check for reentrancy issues
- Validate account relationships

---

## 📞 **Support & Security**

**Security Contact**: security@analos.io  
**Twitter**: @EWildn  
**Telegram**: t.me/Dubie_420  
**GitHub**: https://github.com/Dubie-eth/analos-programs

For security vulnerabilities, please use responsible disclosure through security@analos.io.
