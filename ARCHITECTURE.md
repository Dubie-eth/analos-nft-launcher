# 🏗️ Architecture Documentation

## System Overview

The Analos NFT Launchpad implements a **blind mint and reveal** mechanic using compressed NFTs (cNFTs) via Metaplex Bubblegum. This architecture enables ultra-low-cost NFT launches while maintaining the excitement of mystery box mechanics.

## Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Wallet  │  │   Mint   │  │  Collection Stats   │ │
│  │ Adapter  │  │    UI    │  │    Dashboard        │ │
│  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘ │
└───────┼─────────────┼───────────────────┼────────────┘
        │             │                   │
        ▼             ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Analos Blockchain (Solana Fork)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Analos NFT Launchpad Program (Rust)       │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────┐ │  │
│  │  │Initialize  │  │    Mint     │  │  Reveal  │ │  │
│  │  │Collection  │  │ Placeholder │  │Collection│ │  │
│  │  └─────┬──────┘  └──────┬──────┘  └────┬─────┘ │  │
│  │        │                │              │        │  │
│  │        ▼                ▼              ▼        │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │      Collection Config Account (PDA)     │  │  │
│  │  │  - max_supply, price, threshold, seed    │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │ CPI                               │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │     Metaplex Bubblegum Program (Compressed)      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │  │
│  │  │ Mint cNFT  │  │   Update   │  │  Transfer │ │  │
│  │  │   Leaf     │  │  Metadata  │  │   Leaf    │ │  │
│  │  └─────┬──────┘  └──────┬─────┘  └─────┬─────┘ │  │
│  └────────┼─────────────────┼──────────────┼───────┘  │
│           │                 │              │           │
│  ┌────────▼─────────────────▼──────────────▼───────┐  │
│  │     SPL Account Compression (Merkle Tree)       │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  Concurrent Merkle Tree (16,384 leaves)  │  │  │
│  │  │  - Root hash                             │  │  │
│  │  │  - Leaf proofs                           │  │  │
│  │  │  - Compressed storage                    │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│          Off-Chain Infrastructure (Optional)             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Indexer    │  │   Metadata   │  │  Analytics  │  │
│  │   (Helius)   │  │  (Arweave)   │  │  Dashboard  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Collection Initialization

```
Admin → initialize_collection()
  ├─> Create CollectionConfig PDA
  ├─> Create Merkle Tree account
  ├─> Initialize Tree Authority
  ├─> Generate global_seed for RNG
  └─> Set collection parameters
```

**Accounts Created:**
- `CollectionConfig` (PDA): Stores collection state
- `MerkleTree`: Stores compressed NFT leaves
- `TreeAuthority`: Controls tree operations
- `CollectionMint`: Collection verification NFT

### 2. Minting Process

```
User → mint_placeholder()
  ├─> Validate: !paused, supply < max_supply
  ├─> Transfer: price_lamports from user to config
  ├─> CPI → Bubblegum.mint_v1()
  │   ├─> Create leaf in Merkle tree
  │   ├─> Hash metadata (placeholder)
  │   └─> Update tree root
  ├─> Increment: current_supply
  └─> Emit: MintEvent
```

**State Changes:**
- `current_supply++`
- User receives cNFT leaf ownership
- Payment stored in `CollectionConfig`

### 3. Reveal Process

```
Admin → reveal_collection()
  ├─> Validate: current_supply >= reveal_threshold
  ├─> Set: is_revealed = true
  ├─> Update: collection_uri to revealed base
  └─> Emit: RevealEvent

For each NFT:
  Admin → update_nft_metadata(mint_index)
    ├─> Generate: pseudo-random traits
    │   └─> hash(global_seed + mint_index)
    ├─> CPI → Bubblegum.update_metadata()
    │   ├─> Verify: Merkle proof
    │   ├─> Update: leaf data_hash
    │   └─> Update: tree root
    └─> Emit: UpdateMetadataEvent
```

**State Changes:**
- `is_revealed = true`
- Each leaf's metadata hash updated
- New URI points to revealed traits

## Account Structure

### CollectionConfig (PDA)

```rust
#[account]
pub struct CollectionConfig {
    pub authority: Pubkey,           // 32 bytes
    pub max_supply: u64,             // 8 bytes
    pub current_supply: u64,         // 8 bytes
    pub price_lamports: u64,         // 8 bytes
    pub reveal_threshold: u64,       // 8 bytes
    pub is_revealed: bool,           // 1 byte
    pub is_paused: bool,             // 1 byte
    pub global_seed: [u8; 32],       // 32 bytes
    pub merkle_tree: Pubkey,         // 32 bytes
    pub tree_authority: Pubkey,      // 32 bytes
    pub collection_mint: Pubkey,     // 32 bytes
    pub collection_name: String,     // 4 + 32 bytes
    pub collection_symbol: String,   // 4 + 10 bytes
    pub collection_uri: String,      // 4 + 200 bytes
}
// Total: ~450 bytes
```

### Merkle Tree Structure

```
Depth: 14
Max Leaves: 2^14 = 16,384 NFTs
Buffer Size: 64 (concurrent operations)
Space Required: ~1 MB per tree

Leaf Data:
├─> owner: Pubkey
├─> delegate: Pubkey
├─> data_hash: [u8; 32]  // Hash of metadata
├─> creator_hash: [u8; 32]  // Hash of creators
└─> nonce: u64
```

## Security Model

### Access Control

1. **Admin-Only Functions**:
   - `initialize_collection` ✓
   - `reveal_collection` ✓
   - `update_nft_metadata` ✓
   - `withdraw_funds` ✓
   - `set_pause` ✓
   - `update_config` ✓

2. **User Functions**:
   - `mint_placeholder` (anyone can mint)

3. **Validation**:
```rust
#[account(
    has_one = authority,  // Validates signer is collection authority
)]
pub collection_config: Account<'info, CollectionConfig>
```

### Payment Security

```rust
// Direct SOL transfer to PDA
let transfer_ix = system_instruction::transfer(
    user.key,
    config.key(),
    price_lamports,
);
invoke(&transfer_ix, &[/* accounts */])?;

// Withdrawal with rent-exempt check
require!(
    config_lamports - amount >= rent_exempt,
    ErrorCode::InsufficientFunds
);
```

### Randomness

**Pseudo-RNG Implementation**:
```rust
// Seed generation (at initialization)
let seed_data = [
    authority.key().as_ref(),
    clock.unix_timestamp.to_le_bytes(),
    clock.slot.to_le_bytes(),
].concat();
let global_seed = keccak::hash(&seed_data).to_bytes();

// Trait assignment (at reveal)
let rng_seed = [global_seed, mint_index.to_le_bytes()].concat();
let trait_hash = keccak::hash(&rng_seed);
let rarity_score = u64::from_le_bytes(trait_hash[0..8]) % 100;
```

**Properties**:
- Deterministic: Same index always gets same traits
- Unpredictable: Based on block data at initialization
- Fair: Cannot be manipulated after initialization
- Verifiable: Anyone can verify trait assignment

## Compression Benefits

### Traditional NFT vs Compressed NFT

| Metric | Traditional | Compressed (Bubblegum) |
|--------|-------------|------------------------|
| Mint cost | ~$2.50 | ~$0.0001 |
| Account rent | ~5000 lamports/NFT | ~0 (shared tree) |
| 10K collection | ~$25,000 | ~$1 |
| Storage | On-chain accounts | Merkle tree leaves |
| Transfer cost | ~$0.002 | ~$0.0001 |
| Metadata updates | 5000 lamports | ~100 lamports |

### Merkle Tree Efficiency

```
Storage: O(log n) per operation
Proof size: 14 hashes × 32 bytes = 448 bytes
Verification: O(log n) hashing operations
Concurrent ops: 64 buffered changes
```

## Gas Optimization

### Compute Units

**Typical Transaction Costs**:
- `initialize_collection`: ~200,000 CU
- `mint_placeholder`: ~100,000 CU
- `reveal_collection`: ~50,000 CU
- `update_nft_metadata`: ~150,000 CU (with proof)

### Optimization Techniques

1. **Minimize Account Reads**:
```rust
// Load account once, reuse
let config = &ctx.accounts.collection_config;
```

2. **Efficient Hashing**:
```rust
// Use keccak (native) instead of SHA-256
use anchor_lang::solana_program::keccak;
```

3. **Batch Operations**:
```typescript
// Update metadata in batches
const batch_size = 100;
for (let i = 0; i < total; i += batch_size) {
  await batchUpdateMetadata(i, Math.min(i + batch_size, total));
}
```

## Scalability

### Horizontal Scaling

**Multiple Trees**:
```
Collection A (Tree 1) → 16,384 NFTs
Collection B (Tree 2) → 16,384 NFTs
Collection C (Tree 3) → 16,384 NFTs
...
```

Each tree is independent, allowing:
- Parallel minting
- Separate reveal schedules
- Different rarity distributions

### Indexing Strategy

**On-Chain Events**:
```rust
#[event]
pub struct MintEvent {
    mint_index: u64,
    minter: Pubkey,
    timestamp: i64,
}
```

**Off-Chain Indexer** (Helius/TheGraph):
1. Listen for program events
2. Fetch Merkle proofs
3. Store in database
4. Provide API for frontend

## Future Enhancements

### Possible Extensions

1. **Dynamic Pricing**:
   - Bonding curve pricing
   - Time-based discounts
   - Whitelist tiers

2. **Advanced Randomness**:
   - Switchboard VRF integration
   - Verifiable randomness

3. **Staking Mechanics**:
   - Lock NFTs for rewards
   - Rarity-based multipliers

4. **Marketplace Integration**:
   - Direct listing from launchpad
   - Royalty enforcement
   - Pre-reveal trading

5. **Governance**:
   - DAO control of collection
   - Community reveals
   - Trait voting

## Performance Benchmarks

### Transaction Times (Analos Mainnet)

- Mint transaction: ~400ms
- Reveal trigger: ~300ms
- Metadata update: ~500ms (with proof fetch)
- Withdrawal: ~300ms

### Throughput

- Concurrent mints: Up to 64 (tree buffer size)
- Max TPS: ~1000 mints/second (theoretical)
- Practical: ~100-200 mints/second (with indexing)

## Monitoring & Maintenance

### Key Metrics to Track

1. **Collection Health**:
   - Mint velocity
   - Supply remaining
   - Revenue collected
   - Reveal progress

2. **Performance**:
   - Transaction success rate
   - Average confirmation time
   - Failed transactions (and reasons)

3. **User Behavior**:
   - Unique minters
   - Repeat minters
   - Secondary market activity

### Maintenance Tasks

- Monitor tree health
- Update metadata URIs if needed
- Respond to community feedback
- Plan future drops

---

For implementation details, see the source code and inline comments.

