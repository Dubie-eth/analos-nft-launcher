# Analos NFT Launchpad Program - Update Guide

## Overview
This document provides a comprehensive guide to the updated Analos NFT Launchpad program for the development team. The program has been significantly enhanced with new features, improved security, and better tokenomics integration.

---

## 🔑 Key Changes Summary

### Program ID Updates
- **Current Deployment ID**: `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT` (lib.rs)
- **Playground/Testing ID**: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk` (PLAYGROUND-COMPLETE-CODE.rs)

⚠️ **Important**: When deploying to mainnet, ensure you update the `declare_id!()` macro to match your actual program deployment.

---

## 📦 New Features Added

### 1. **Enhanced Fee Structure**
The program now implements a comprehensive fee distribution system:

#### LOL Ecosystem Fees (6% total on mints)
- **Dev Team**: 1% → `Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D`
- **Pool Creation**: 2% → `myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q`
- **LOL Buyback/Burns**: 1% → `7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721`
- **Platform Maintenance**: 1% → `myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q`
- **Community Rewards**: 1% → `7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721`

#### Dynamic Platform Fees (Volume-Based)
```rust
// Platform fees scale down with volume
< 10 SOL volume:    4.14% platform fee
< 50 SOL volume:    2.76% platform fee
< 100 SOL volume:   1.38% platform fee
100+ SOL volume:    0.50% platform fee (minimum)
```

#### Bonding Curve Fees
```rust
< 10 SOL volume:    5.52% bonding curve fee
< 50 SOL volume:    4.14% bonding curve fee
50+ SOL volume:     2.76% bonding curve fee
```

### 2. **Creator Allocation System**
- **Total Creator Allocation**: 25% (2500 basis points)
  - **Immediate**: 10% after bonding
  - **Vested**: 15% over 12 months
- **Pool Allocation**: 69% to liquidity pool

```rust
pub const CREATOR_TOTAL_BPS: u16 = 2500;         // 25% total
pub const CREATOR_IMMEDIATE_BPS: u16 = 1000;     // 10% immediate
pub const CREATOR_VESTED_BPS: u16 = 1500;        // 15% vested
pub const POOL_ALLOCATION_BPS: u16 = 6900;       // 69% to pool
```

### 3. **Ticker Registry System**
- **Unique Ticker Enforcement**: Each collection gets a unique symbol/ticker
- **Max Ticker Length**: 10 characters
- **Min Ticker Length**: 1 character
- **Registry Capacity**: 1000 tickers (upgradeable to 10,000)

### 4. **Bonding Curve Support**
- Configurable base price, increment, and max price
- Support for tiered bonding curves with different access rules:
  - Public access
  - Whitelist only
  - Token-gated
  - Social verification required

### 5. **Social Verification System**
- Platform-based verification (Twitter, Discord, etc.)
- Minimum follower requirements
- Verification codes for proof
- Per-user verification tracking

### 6. **Mint Phases**
- Create multiple mint phases with different parameters
- Time-based phase activation
- Per-phase mint limits
- Custom pricing per phase

### 7. **Reveal Fee System**
- Optional reveal fees for individual NFTs
- 6.9% platform fee on reveals
- Remainder goes to creator

### 8. **Advanced Security Features**
- **Rate Limiting**: Configurable mint rate limits (default: 60 seconds)
- **Per-User Mint Caps**: Configurable max mints per user
- **Pause Mechanism**: Emergency pause functionality
- **Fee Caps**: Maximum 6.9% trading/mint fees (can be disabled in emergencies)
- **Authority Transfer**: Separate transfer functions for collection and escrow

### 9. **Takeover Proposal System**
- Community-driven authority changes
- Voting mechanism for proposals
- Separate proposals for collection vs escrow authority

### 10. **Commitment/Reveal Scheme**
- Hash commitment for reveal data
- 24-hour reveal window
- Tamper-proof reveal verification

---

## 📊 Account Structures

### CollectionConfig
```rust
pub struct CollectionConfig {
    pub authority: Pubkey,                              // Collection creator
    pub max_supply: u64,                                // Max NFTs
    pub price_lamports: u64,                            // Mint price
    pub reveal_threshold: u64,                          // Mints needed to reveal
    pub current_supply: u64,                            // Current minted count
    pub is_revealed: bool,                              // Reveal status
    pub is_paused: bool,                                // Pause state
    pub collection_mint: Pubkey,                        // Collection mint address
    pub collection_name: String,                        // Collection name
    pub collection_symbol: String,                      // Ticker symbol
    pub placeholder_uri: String,                        // Pre-reveal URI
    pub global_seed: [u8; 32],                         // Randomness seed
    
    // Enhanced features
    pub max_mints_per_user: u64,                       // Per-user limit
    pub mint_rate_limit_seconds: u64,                  // Rate limit
    pub social_verification_required: bool,             // Social verification toggle
    pub bonding_curve_enabled: bool,                   // Bonding curve toggle
    
    // Fee tracking
    pub total_volume: u64,                             // Total volume for dynamic fees
    pub current_platform_fee_bps: u16,                 // Current platform fee
    pub current_bonding_curve_platform_fee_bps: u16,   // Current BC fee
    
    // Bonding curve pricing
    pub bonding_curve_base_price: u64,                 // BC base price
    pub bonding_curve_price_increment_bps: u16,        // BC price increment
    pub bonding_curve_max_price: u64,                  // BC max price
    
    // Reveal fee
    pub reveal_fee_enabled: bool,                       // Reveal fee toggle
    pub reveal_fee_lamports: u64,                       // Reveal fee amount
    pub total_reveals: u64,                             // Total reveals count
    
    // Additional features
    pub trading_fee_bps: u16,                          // Trading fee
    pub mint_fee_bps: u16,                             // Mint fee
    pub fee_caps_disabled: bool,                       // Emergency fee cap override
}
```

### EscrowWallet
```rust
pub struct EscrowWallet {
    pub collection_config: Pubkey,                     // Associated collection
    pub authority: Pubkey,                             // Escrow authority
    pub balance: u64,                                  // Available balance
    pub creator_share_percentage: u16,                 // Creator % (default 25%)
    pub bonding_curve_reserve: u64,                    // BC reserve funds
    pub creator_bc_allocation_bps: u16,                // Creator BC allocation
    pub locked_funds: u64,                             // Locked funds amount
}
```

---

## 🔧 Core Functions

### Collection Management

#### `initialize_collection`
Creates a new NFT collection with all parameters.

**Parameters:**
- `max_supply: u64` - Maximum NFTs in collection
- `price_lamports: u64` - Mint price in lamports
- `reveal_threshold: u64` - Number of mints before reveal
- `collection_name: String` - Collection name
- `collection_symbol: String` - Unique ticker (1-10 chars)
- `placeholder_uri: String` - Pre-reveal metadata URI
- `max_mints_per_user: Option<u64>` - Per-user mint limit
- `mint_rate_limit_seconds: Option<u64>` - Time between mints
- `social_verification_required: Option<bool>` - Require social verification
- `bonding_curve_enabled: Option<bool>` - Enable bonding curve

**Accounts:**
- `collection_config` - PDA: `["collection_config", symbol]`
- `escrow_wallet` - PDA: `["escrow_wallet", symbol]`
- `ticker_registry` - PDA: `["ticker_registry"]`
- `collection_mint` - Collection mint account
- `authority` - Signer and payer

#### `mint_placeholder`
Mints a placeholder NFT (mystery box).

**Fee Distribution Flow:**
1. User pays mint price to escrow
2. 6% distributed to LOL ecosystem wallets
3. Remaining 94% split:
   - Creator allocation (25% default)
   - Bonding curve reserve (creator configurable)
   - Pool allocation (remainder)

**Accounts:**
- `collection_config` - Collection config account
- `escrow_wallet` - Escrow wallet account
- `mint_record` - PDA: `["mint_record", collection_key, supply]`
- `mint` - NFT mint account
- `user_token_account` - User's token account
- `payer` - Signer and payer

#### `reveal_collection`
Reveals the entire collection once threshold is met.

**Requirements:**
- Collection not already revealed
- Current supply >= reveal threshold
- Must be collection authority

### Escrow Management

#### `withdraw_from_escrow`
Withdraw available creator funds from escrow.

**Parameters:**
- `amount: u64` - Amount to withdraw in lamports

**Accounts:**
- `escrow_wallet` - Escrow wallet account
- `authority` - Escrow authority signer
- `recipient` - Recipient wallet
- `system_program` - System program

#### `set_creator_share_percentage`
Update creator share percentage (max 25%).

**Parameters:**
- `percentage_bps: u16` - Percentage in basis points

#### `set_creator_bonding_curve_allocation`
Set creator allocation to bonding curve (max 50%).

**Parameters:**
- `allocation_bps: u16` - Allocation in basis points

#### `lock_creator_funds` / `unlock_creator_funds`
Lock or unlock creator funds for specific purposes.

**Parameters:**
- `amount: u64` - Amount to lock/unlock

### Bonding Curve Functions

#### `configure_bonding_curve_pricing`
Configure bonding curve parameters.

**Parameters:**
- `base_price_lamports: u64` - Starting price
- `price_increment_bps: u16` - Price increase per mint
- `max_price_lamports: u64` - Maximum price cap

**Requirements:**
- Bonding curve must be enabled
- Must be collection authority

#### `create_bonding_curve_tier`
Create a bonding curve tier with specific rules.

**Parameters:**
- `tier_name: String` - Tier name
- `supply_limit: u64` - Max supply for tier
- `price_multiplier_bps: u16` - Price multiplier
- `time_limit_seconds: Option<u64>` - Time limit
- `access_rules: u8` - Access type (0=public, 1=whitelist, 2=token-gate, 3=social)

### Social Verification

#### `configure_social_verification`
Set up social verification requirements.

**Parameters:**
- `platform: u8` - Platform (0=Twitter, 1=Discord, etc.)
- `min_followers: u64` - Minimum follower count
- `verification_code: String` - Verification code

#### `verify_social_account`
Verify a user's social account.

**Parameters:**
- `platform: u8` - Platform type
- `follower_count: u64` - User's follower count
- `verification_proof: String` - Verification proof

### Mint Phases

#### `create_mint_phase`
Create a new mint phase.

**Parameters:**
- `phase_name: String` - Phase name
- `start_time: i64` - Start timestamp
- `end_time: Option<i64>` - Optional end timestamp
- `max_mints_per_user: u64` - Per-user limit for phase
- `price_lamports: u64` - Phase-specific price

#### `activate_phase` / `deactivate_phase`
Enable or disable a mint phase.

**Parameters:**
- `phase_id: u8` - Phase identifier

### Reveal Fee System

#### `configure_reveal_fee`
Enable and set reveal fee.

**Parameters:**
- `fee_enabled: bool` - Enable/disable reveal fee
- `fee_lamports: Option<u64>` - Fee amount

#### `reveal_nft_with_fee`
Reveal individual NFT with fee payment.

**Fee Distribution:**
- 6.9% to platform maintenance wallet
- 93.1% to creator (added to escrow balance)

### Authority Management

#### `transfer_collection_authority`
Transfer collection authority to new address.

**Parameters:**
- `new_authority: Pubkey` - New authority address

#### `transfer_escrow_authority`
Transfer escrow authority to new address.

**Parameters:**
- `new_authority: Pubkey` - New authority address

### Takeover Proposals

#### `create_takeover_proposal`
Create a community takeover proposal.

**Parameters:**
- `proposal_type: u8` - Type (0=collection, 1=escrow)
- `new_authority: Pubkey` - Proposed new authority
- `description: String` - Proposal description

#### `vote_on_takeover_proposal`
Vote on an active takeover proposal.

**Parameters:**
- `vote: bool` - true=for, false=against

### Emergency Controls

#### `set_emergency_pause`
Emergency pause the collection.

**Parameters:**
- `reason: String` - Reason for pause

#### `emergency_disable_fee_caps`
Disable fee caps in emergency (requires authority).

#### `enable_fee_caps`
Re-enable fee caps.

### Admin Functions

#### `update_config`
Update collection configuration.

**Parameters:**
- `max_supply: Option<u64>`
- `price_lamports: Option<u64>`
- `reveal_threshold: Option<u64>`

#### `initialize_ticker_registry`
Initialize the global ticker registry (one-time).

#### `admin_remove_ticker`
Remove a ticker from registry (admin only).

**Parameters:**
- `ticker: String` - Ticker to remove

#### `upgrade_ticker_registry_capacity`
Upgrade ticker registry capacity (max 10,000).

**Parameters:**
- `new_capacity: usize` - New capacity

---

## 🎯 Integration Points

### Frontend Integration

#### Initializing a Collection
```typescript
await program.methods
  .initializeCollection(
    new BN(10000),              // max_supply
    new BN(1000000000),         // price_lamports (1 SOL)
    new BN(5000),               // reveal_threshold
    "Cool Collection",          // collection_name
    "COOL",                     // collection_symbol
    "ipfs://placeholder",       // placeholder_uri
    new BN(10),                 // max_mints_per_user
    new BN(60),                 // mint_rate_limit_seconds
    false,                      // social_verification_required
    true                        // bonding_curve_enabled
  )
  .accounts({
    collectionConfig,
    escrowWallet,
    tickerRegistry,
    collectionMint,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### Minting an NFT
```typescript
await program.methods
  .mintPlaceholder()
  .accounts({
    collectionConfig,
    escrowWallet,
    mintRecord,
    mint,
    userTokenAccount,
    payer: wallet.publicKey,
    authority,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### PDA Derivations

```typescript
// Collection Config
const [collectionConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from("collection_config"), Buffer.from(symbol)],
  programId
);

// Escrow Wallet
const [escrowWallet] = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow_wallet"), Buffer.from(symbol)],
  programId
);

// Ticker Registry
const [tickerRegistry] = PublicKey.findProgramAddressSync(
  [Buffer.from("ticker_registry")],
  programId
);

// Mint Record
const [mintRecord] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("mint_record"),
    collectionConfig.toBuffer(),
    new BN(currentSupply).toArrayLike(Buffer, "le", 8)
  ],
  programId
);
```

---

## 🔐 Security Considerations

### 1. **Authority Management**
- Collection authority and escrow authority are separate
- Both can be transferred independently
- Use takeover proposals for community governance

### 2. **Fee Caps**
- Maximum 6.9% fees enforced by default
- Can only be disabled by authority in emergencies
- Should be re-enabled ASAP after emergency

### 3. **Rate Limiting**
- Default 60-second cooldown between mints
- Prevents spam and bot attacks
- Configurable per collection

### 4. **Ticker Protection**
- Once registered, tickers cannot be reused
- Admin can remove tickers if needed
- Prevents confusion and scams

### 5. **Escrow Safety**
- All funds held in escrow PDAs
- Only authority can withdraw
- Locked funds tracked separately

---

## 📈 Economics Flow

### Mint Flow
```
User Pays Mint Price (100%)
    ↓
Escrow Wallet
    ↓
Fee Distribution:
├─ 1% → Dev Team
├─ 2% → Pool Creation
├─ 1% → LOL Buyback/Burns
├─ 1% → Platform Maintenance
├─ 1% → LOL Community
└─ 94% → Remaining Amount
        ↓
        Split:
        ├─ 25% (default) → Creator (Escrow Balance)
        ├─ X% (configurable) → Bonding Curve Reserve
        └─ Remainder → Pool Allocation (held for liquidity)
```

### Creator Vesting
- **Immediate (10%)**: Available after bonding
- **Vested (15%)**: Released over 12 months
- Total: 25% of mint revenue (after LOL ecosystem fees)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Update `declare_id!()` to your deployed program ID
- [ ] Verify all wallet addresses are correct
- [ ] Test on devnet thoroughly
- [ ] Audit smart contract
- [ ] Initialize ticker registry

### Post-Deployment
- [ ] Verify program deployment
- [ ] Initialize ticker registry on mainnet
- [ ] Test collection creation
- [ ] Test mint functionality
- [ ] Monitor first transactions

---

## 🐛 Troubleshooting

### Common Issues

#### "Ticker already exists"
- Each ticker must be unique across all collections
- Check ticker registry before creating collection
- Consider adding numbers or variants to ticker

#### "Insufficient funds in escrow"
- Verify fee distribution is working correctly
- Check that mints are accumulating in escrow
- Ensure proper PDA derivation

#### "Not authorized"
- Verify signer is the collection authority
- Check separate authorities for collection vs escrow
- Ensure proper account ownership

#### "Reveal threshold not met"
- Must mint at least `reveal_threshold` NFTs before revealing
- Check current supply count
- Adjust threshold if needed (via update_config)

---

## 📝 Events

The program emits events for all major actions:

- `CollectionInitializedEvent`
- `PlaceholderMintedEvent`
- `CollectionRevealedEvent`
- `EscrowWithdrawalEvent`
- `CollectionPauseToggledEvent`
- `NftBurnedEvent`
- `CreatorSharePercentageUpdatedEvent`
- `CreatorBondingCurveAllocationUpdatedEvent`
- `EscrowAuthorityTransferredEvent`
- `CollectionAuthorityTransferredEvent`
- `TakeoverProposalCreatedEvent`
- `TakeoverProposalVotedEvent`
- `BondingCurvePricingConfiguredEvent`
- `BondingCurveTierCreatedEvent`
- `RevealFeeConfiguredEvent`
- `NftRevealedWithFeeEvent`
- `TickerRegistryCapacityUpgradedEvent`

**Use these events for:**
- Real-time UI updates
- Analytics and tracking
- Audit trails
- User notifications

---

## 🔄 Migration from Previous Version

If migrating from a previous version:

1. **Deploy new program**
2. **Initialize ticker registry**
3. **Migrate existing collections** (manual process):
   - Create new collection with same parameters
   - Transfer NFTs to new collection
   - Update frontend to use new program ID
4. **Update all wallet addresses** to use new constants
5. **Test thoroughly** before going live

---

## 📚 Additional Resources

### Constants Reference
```rust
// Fee Distribution
FEE_DEV_TEAM_BPS = 100           // 1%
FEE_POOL_CREATION_BPS = 200      // 2%
FEE_LOL_BUYBACK_BURN_BPS = 100   // 1%
FEE_PLATFORM_MAINT_BPS = 100     // 1%
FEE_LOL_COMMUNITY_BPS = 100      // 1%
FEE_TOTAL_BPS = 600              // 6%

// Creator Allocation
CREATOR_TOTAL_BPS = 2500         // 25%
CREATOR_IMMEDIATE_BPS = 1000     // 10%
CREATOR_VESTED_BPS = 1500        // 15%
POOL_ALLOCATION_BPS = 6900       // 69%

// Fee Caps
MAX_TRADING_FEE_BPS = 690        // 6.9%
MAX_MINT_FEE_BPS = 690           // 6.9%

// Volume Thresholds
VOLUME_THRESHOLD_EARLY = 10 SOL
VOLUME_THRESHOLD_MID = 50 SOL
VOLUME_THRESHOLD_LATE = 100 SOL
```

### Wallet Addresses
```
Dev Team:            Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D
Pool Creation:       myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q
LOL Buyback/Burns:   7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721
Platform Maint:      myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q
LOL Community:       7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721
```

---

## 💬 Support & Questions

For questions or issues:
1. Review this documentation thoroughly
2. Check the error codes in the contract
3. Review event logs for transaction details
4. Test on devnet before mainnet deployment

---

## ✅ Testing Checklist

### Core Functionality
- [ ] Initialize collection with all parameters
- [ ] Mint placeholder NFTs
- [ ] Verify fee distribution (check all 5 wallets)
- [ ] Test reveal functionality
- [ ] Withdraw from escrow
- [ ] Transfer authorities

### Advanced Features
- [ ] Configure bonding curve
- [ ] Create bonding curve tiers
- [ ] Set up social verification
- [ ] Create and activate mint phases
- [ ] Configure and use reveal fees
- [ ] Test rate limiting
- [ ] Test per-user mint caps

### Security
- [ ] Test pause mechanism
- [ ] Test authority checks
- [ ] Verify fee caps enforcement
- [ ] Test emergency controls
- [ ] Test takeover proposals

### Edge Cases
- [ ] Sell out collection
- [ ] Exceed mint limits
- [ ] Invalid ticker lengths
- [ ] Duplicate tickers
- [ ] Insufficient funds scenarios

---

## 📊 Gas/Cost Estimates

Estimated costs (approximate, in SOL):
- **Initialize Collection**: ~0.05 SOL (rent for accounts)
- **Mint NFT**: ~0.002 SOL (+ mint price + fees)
- **Reveal Collection**: ~0.0001 SOL
- **Configure Features**: ~0.0001-0.001 SOL

Note: Actual costs depend on current Solana network conditions.

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Program Version**: 0.1.0  
**Anchor Version**: 0.28.0

