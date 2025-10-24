# 🔗 On-Chain Metadata & Username Program Plan

## Overview
Deploy Rust programs to Analos blockchain for:
1. **Profile NFT Metadata Storage** (on-chain)
2. **Username Registry** (on-chain, permanent)
3. **Burn Tracking** (automatic username release)

---

## 🎯 Why On-Chain?

### Current Problem (IPFS + Database)
- ❌ IPFS can be slow/unreliable
- ❌ Database resets on deploy (username cache lost)
- ❌ No automatic burn detection
- ❌ Metadata not truly immutable

### Solution (On-Chain Programs)
- ✅ Metadata stored directly on Analos
- ✅ Username registry is permanent
- ✅ Automatic burn detection via program
- ✅ True decentralization
- ✅ Faster lookups (no IPFS delay)

---

## 📦 Program 1: Profile NFT Metadata Program

### Purpose
Store Profile NFT metadata **directly on the blockchain** instead of IPFS.

### Account Structure
```rust
#[account]
pub struct ProfileNFTMetadata {
    pub mint: Pubkey,              // NFT mint address
    pub owner: Pubkey,             // Current owner
    pub username: String,          // @username
    pub display_name: String,      // Display name
    pub bio: String,               // Bio text
    pub tier: String,              // basic, premium, elite
    pub referral_code: String,     // Referral code
    pub image_uri: String,         // Image URL (still on IPFS for storage)
    pub created_at: i64,           // Unix timestamp
    pub updated_at: i64,           // Unix timestamp
    pub attributes: Vec<Attribute>, // NFT attributes
    pub bump: u8,                  // PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}
```

### Instructions
1. **`initialize_metadata`** - Create metadata account for new Profile NFT
2. **`update_metadata`** - Owner can update bio, display name, etc.
3. **`transfer_metadata`** - Update owner on NFT transfer
4. **`burn_metadata`** - Mark as burned, release username

### PDA Seeds
```rust
// Metadata PDA: [b"profile_nft_metadata", mint.key().as_ref()]
pub fn get_metadata_pda(mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"profile_nft_metadata", mint.as_ref()],
        &PROFILE_NFT_METADATA_PROGRAM_ID,
    )
}
```

---

## 📦 Program 2: Username Registry Program

### Purpose
Track all registered usernames and enforce uniqueness **on-chain**.

### Account Structure
```rust
#[account]
pub struct UsernameRegistry {
    pub username: String,          // Normalized username (lowercase)
    pub mint: Pubkey,              // NFT mint that owns this username
    pub owner: Pubkey,             // Current owner wallet
    pub registered_at: i64,        // Unix timestamp
    pub is_burned: bool,           // Has NFT been burned?
    pub bump: u8,                  // PDA bump
}

#[account]
pub struct GlobalUsernameCounter {
    pub total_registered: u64,     // Total usernames ever registered
    pub total_active: u64,         // Currently active usernames
    pub total_burned: u64,         // Total usernames released via burn
    pub bump: u8,
}
```

### Instructions
1. **`register_username`** - Register a new username (fails if taken)
2. **`release_username`** - Release username when NFT is burned
3. **`check_availability`** - Check if username is available (read-only)
4. **`transfer_username`** - Update owner on NFT transfer

### PDA Seeds
```rust
// Username PDA: [b"username", username.as_bytes()]
pub fn get_username_pda(username: &str) -> (Pubkey, u8) {
    let normalized = username.to_lowercase();
    Pubkey::find_program_address(
        &[b"username", normalized.as_bytes()],
        &USERNAME_REGISTRY_PROGRAM_ID,
    )
}

// Global counter PDA: [b"global_username_counter"]
pub fn get_counter_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"global_username_counter"],
        &USERNAME_REGISTRY_PROGRAM_ID,
    )
}
```

### Constraints
```rust
#[error_code]
pub enum UsernameError {
    #[msg("Username is already taken")]
    UsernameTaken,
    #[msg("Username must be between 1 and 50 characters")]
    InvalidUsernameLength,
    #[msg("Username contains invalid characters")]
    InvalidUsernameCharacters,
    #[msg("Username is reserved")]
    UsernameReserved,
    #[msg("NFT must be burned to release username")]
    NFTNotBurned,
}

// Reserved usernames (hardcoded in program)
const RESERVED_USERNAMES: &[&str] = &[
    "admin", "analos", "system", "official", 
    "support", "help", "api", "root"
];
```

---

## 📦 Program 3: Burn Tracker Program (Optional)

### Purpose
Automatically detect NFT burns and release usernames.

### How It Works
1. Listen for Token-2022 close account events
2. When Profile NFT account is closed → mark as burned
3. Automatically call `release_username` instruction
4. Username becomes available again

### Account Structure
```rust
#[account]
pub struct BurnEvent {
    pub mint: Pubkey,              // Burned NFT mint
    pub username: String,          // Released username
    pub burned_at: i64,            // Unix timestamp
    pub previous_owner: Pubkey,    // Last owner before burn
    pub bump: u8,
}
```

---

## 🔄 Integration Flow

### Minting a Profile NFT
```typescript
// 1. Check username availability (on-chain)
const usernameAvailable = await checkUsernameAvailability(username);
if (!usernameAvailable) {
  throw new Error('Username taken');
}

// 2. Mint Token-2022 NFT
const mintKeypair = Keypair.generate();
await mintProfileNFT(mintKeypair, username, ...);

// 3. Register username on-chain
await registerUsername({
  username,
  mint: mintKeypair.publicKey,
  owner: userPublicKey
});

// 4. Create metadata account on-chain
await initializeMetadata({
  mint: mintKeypair.publicKey,
  username,
  displayName,
  bio,
  tier,
  ...
});
```

### Burning a Profile NFT
```typescript
// 1. Burn Token-2022 NFT
await burnNFT(mintAddress);

// 2. Release username on-chain
await releaseUsername({
  username,
  mint: mintAddress
});

// 3. Mark metadata as burned
await burnMetadata({
  mint: mintAddress
});
```

### Querying NFT Data
```typescript
// Fetch metadata from on-chain account (fast!)
const metadata = await getProfileNFTMetadata(mintAddress);

// Check username availability
const available = await isUsernameAvailable(username);
```

---

## 🛠️ Development Roadmap

### Phase 1: Username Registry Program (Priority)
**Timeline: 1-2 weeks**
- [ ] Write Rust program with Anchor framework
- [ ] Test on Analos devnet
- [ ] Deploy to Analos mainnet
- [ ] Update frontend to use on-chain username checks
- [ ] Migrate existing usernames from database to on-chain

### Phase 2: Profile NFT Metadata Program
**Timeline: 1-2 weeks**
- [ ] Write Rust program for metadata storage
- [ ] Integrate with Token-2022 mint
- [ ] Test metadata updates
- [ ] Deploy to mainnet
- [ ] Update frontend to read on-chain metadata

### Phase 3: Burn Tracker (Optional)
**Timeline: 1 week**
- [ ] Implement burn event listener
- [ ] Automatic username release
- [ ] Deploy to mainnet

### Phase 4: Migration & Testing
**Timeline: 1 week**
- [ ] Migrate existing Profile NFTs to on-chain metadata
- [ ] Full end-to-end testing
- [ ] Load testing (handle 10,000+ usernames)
- [ ] Security audit

---

## 💰 Cost Analysis

### Storage Costs (Analos)
- Username Registry Account: ~500 bytes = 0.001 LOS rent per account
- Metadata Account: ~2KB = 0.004 LOS rent per account
- **Total per Profile NFT: ~0.005 LOS + gas**

### Comparison vs. Database
- Database: $0 rent, but requires backend (Supabase cost)
- On-chain: Small one-time rent, but permanent and decentralized

---

## 🔐 Security Considerations

### Username Registry
1. **Uniqueness enforced by PDA** (same username = same PDA = account already exists)
2. **Only mint authority can register** (prevent spam)
3. **Only owner can burn** (prevent griefing)

### Metadata Program
1. **Only owner can update** (bio, display name)
2. **Immutable fields** (username, created_at, mint)
3. **Burn requires NFT ownership proof**

---

## 📊 Benefits Summary

| Feature | Current (IPFS + DB) | On-Chain Programs |
|---------|---------------------|-------------------|
| **Username Uniqueness** | ⚠️ Database (resets) | ✅ On-chain (permanent) |
| **Metadata Storage** | ⚠️ IPFS (slow) | ✅ On-chain (fast) |
| **Burn Detection** | ❌ Manual | ✅ Automatic |
| **Decentralization** | ⚠️ Partial | ✅ Full |
| **Query Speed** | 🐢 Slow (IPFS) | ⚡ Fast (RPC) |
| **Cost** | 💵 Supabase fees | 💰 One-time rent |

---

## 🚀 Next Steps

1. **Review this plan** with the team
2. **Set up Anchor project** for Analos programs
3. **Start with Username Registry** (highest priority)
4. **Test on devnet** before mainnet
5. **Plan migration** for existing Profile NFTs

---

## 📝 Program IDs (To Be Deployed)

```
USERNAME_REGISTRY_PROGRAM_ID = TBD (deploy to mainnet)
PROFILE_NFT_METADATA_PROGRAM_ID = TBD (deploy to mainnet)
BURN_TRACKER_PROGRAM_ID = TBD (optional)
```

---

## 🔗 References

- Anchor Framework: https://www.anchor-lang.com/
- Solana Program Library: https://spl.solana.com/
- Token-2022 Extensions: https://spl.solana.com/token-2022
- Analos RPC: https://rpc.analos.io

---

**Status: PLANNED ✏️**  
**Ready to start development!** 🚀

