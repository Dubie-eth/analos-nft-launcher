# 🚀 Enhanced NFT Launchpad Features Design

## 🎯 **Overview**

Transform the current program into a **professional-grade NFT launchpad** with:
- Multiple minting phases (public, whitelist, bonding curve)
- Social verification integration
- Token holder verification
- Address-based whitelists
- Rate limiting and anti-bot measures
- Advanced admin controls

---

## 🏗️ **New Account Structures**

### **1. CollectionConfig (Enhanced)**
```rust
#[account]
#[derive(InitSpace)]
pub struct CollectionConfig {
    // Existing fields...
    pub authority: Pubkey,
    pub max_supply: u64,
    pub current_supply: u64,
    pub price_lamports: u64,
    pub reveal_threshold: u64,
    pub is_revealed: bool,
    pub is_paused: bool,
    pub global_seed: [u8; 32],
    pub collection_mint: Pubkey,
    pub collection_name: String,
    pub collection_symbol: String,
    pub placeholder_uri: String,
    
    // NEW: Minting Phases
    pub current_phase: MintPhase,
    pub total_phases: u8,
    
    // NEW: Security Features
    pub max_mints_per_user: u64,
    pub mint_rate_limit_seconds: u64,
    pub global_emergency_pause: bool,
    
    // NEW: Bonding Curve
    pub bonding_curve_enabled: bool,
    pub bonding_curve_config: Option<Pubkey>, // PDA to BondingCurveConfig
    
    // NEW: Social Verification
    pub social_verification_required: bool,
    pub social_verification_config: Option<Pubkey>, // PDA to SocialVerificationConfig
}
```

### **2. MintPhase (New)**
```rust
#[account]
#[derive(InitSpace)]
pub struct MintPhase {
    pub phase_id: u8,
    pub phase_type: PhaseType,
    pub start_time: i64,
    pub end_time: i64,
    pub price_lamports: u64,
    pub max_mints_per_user: u64,
    pub total_allocation: u64,
    pub minted_in_phase: u64,
    pub whitelist_config: Option<Pubkey>, // PDA to WhitelistConfig
    pub is_active: bool,
}
```

### **3. WhitelistConfig (New)**
```rust
#[account]
#[derive(InitSpace)]
pub struct WhitelistConfig {
    pub whitelist_type: WhitelistType,
    pub total_addresses: u64,
    pub verified_addresses: u64,
    
    // For token holder verification
    pub required_token_mint: Option<Pubkey>,
    pub minimum_token_balance: Option<u64>,
    
    // For social verification
    pub social_platform: Option<SocialPlatform>,
    pub social_requirements: Option<SocialRequirements>,
    
    // Merkle tree root for address-based whitelist
    pub merkle_root: Option<[u8; 32]>,
    
    pub admin: Pubkey,
}
```

### **4. BondingCurveConfig (New)**
```rust
#[account]
#[derive(InitSpace)]
pub struct BondingCurveConfig {
    pub curve_type: CurveType,
    pub initial_price: u64,
    pub price_increment: u64,
    pub max_price: u64,
    pub virtual_supply: u64,
    pub virtual_reserve: u64,
    pub real_supply: u64,
    pub real_reserve: u64,
    pub admin: Pubkey,
}
```

### **5. UserMintRecord (New)**
```rust
#[account]
#[derive(InitSpace)]
pub struct UserMintRecord {
    pub user: Pubkey,
    pub collection_config: Pubkey,
    pub total_minted: u64,
    pub last_mint_timestamp: i64,
    pub phase_mint_counts: Vec<u64>, // Index = phase_id
}
```

### **6. SocialVerificationConfig (New)**
```rust
#[account]
#[derive(InitSpace)]
pub struct SocialVerificationConfig {
    pub platform: SocialPlatform,
    pub required_followers: Option<u64>,
    pub required_posts: Option<u64>,
    pub verification_endpoint: String,
    pub api_key_hash: [u8; 32], // Hashed API key for security
    pub admin: Pubkey,
}
```

---

## 🔄 **New Instructions**

### **Phase Management:**
```rust
// Create a new minting phase
pub fn create_mint_phase(
    ctx: Context<CreateMintPhase>,
    phase_type: PhaseType,
    start_time: i64,
    end_time: i64,
    price_lamports: u64,
    max_mints_per_user: u64,
    total_allocation: u64,
) -> Result<()>

// Activate a phase
pub fn activate_phase(
    ctx: Context<ActivatePhase>,
    phase_id: u8,
) -> Result<()>

// Deactivate a phase
pub fn deactivate_phase(
    ctx: Context<DeactivatePhase>,
    phase_id: u8,
) -> Result<()>
```

### **Whitelist Management:**
```rust
// Create whitelist configuration
pub fn create_whitelist_config(
    ctx: Context<CreateWhitelistConfig>,
    whitelist_type: WhitelistType,
    required_token_mint: Option<Pubkey>,
    minimum_token_balance: Option<u64>,
    merkle_root: Option<[u8; 32]>,
) -> Result<()>

// Add addresses to whitelist
pub fn add_whitelist_addresses(
    ctx: Context<AddWhitelistAddresses>,
    addresses: Vec<Pubkey>,
) -> Result<()>

// Verify token holder eligibility
pub fn verify_token_holder(
    ctx: Context<VerifyTokenHolder>,
    user_token_account: Pubkey,
) -> Result<()>
```

### **Social Verification:**
```rust
// Configure social verification
pub fn configure_social_verification(
    ctx: Context<ConfigureSocialVerification>,
    platform: SocialPlatform,
    required_followers: Option<u64>,
    required_posts: Option<u64>,
    verification_endpoint: String,
) -> Result<()>

// Verify social account
pub fn verify_social_account(
    ctx: Context<VerifySocialAccount>,
    social_handle: String,
    proof_signature: String,
) -> Result<()>
```

### **Bonding Curve:**
```rust
// Configure bonding curve
pub fn configure_bonding_curve(
    ctx: Context<ConfigureBondingCurve>,
    curve_type: CurveType,
    initial_price: u64,
    price_increment: u64,
    max_price: u64,
) -> Result<()>

// Mint with bonding curve pricing
pub fn mint_with_bonding_curve(
    ctx: Context<MintWithBondingCurve>,
    amount: u64,
) -> Result<()>
```

### **Enhanced Minting:**
```rust
// Enhanced mint function with phase validation
pub fn mint_with_phase_validation(
    ctx: Context<MintWithPhaseValidation>,
    amount: u64,
    merkle_proof: Option<Vec<[u8; 32]>>,
) -> Result<()>
```

---

## 📊 **Phase Types**

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PhaseType {
    Public,           // Anyone can mint
    Whitelist,        // Whitelist addresses only
    TokenHolder,      // Token holders only
    SocialVerified,   // Social verification required
    BondingCurve,     // Dynamic pricing
    Reserved,         // Admin reserved
}
```

## 🎯 **Whitelist Types**

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum WhitelistType {
    AddressList,      // Specific addresses
    TokenHolder,      // Holders of specific token
    SocialVerified,   // Social media verification
    MerkleTree,       // Merkle tree proof
}
```

## 📱 **Social Platforms**

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum SocialPlatform {
    Twitter,
    Discord,
    Telegram,
    Instagram,
    TikTok,
}
```

## 📈 **Bonding Curve Types**

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CurveType {
    Linear,           // Linear price increase
    Exponential,      // Exponential price increase
    Logarithmic,      // Logarithmic price increase
    Custom,           // Custom curve parameters
}
```

---

## 🔒 **Security Features**

### **1. Rate Limiting:**
```rust
// Check rate limit
require!(
    user_mint_record.last_mint_timestamp + collection_config.mint_rate_limit_seconds 
    < Clock::get()?.unix_timestamp,
    ErrorCode::RateLimitExceeded
);
```

### **2. Maximum Mints Per User:**
```rust
// Check max mints per user
require!(
    user_mint_record.total_minted + amount <= phase.max_mints_per_user,
    ErrorCode::MaxMintsExceeded
);
```

### **3. Phase Allocation:**
```rust
// Check phase allocation
require!(
    phase.minted_in_phase + amount <= phase.total_allocation,
    ErrorCode::PhaseAllocationExceeded
);
```

### **4. Emergency Pause:**
```rust
// Check global emergency pause
require!(
    !collection_config.global_emergency_pause,
    ErrorCode::GlobalEmergencyPause
);
```

### **5. Whitelist Verification:**
```rust
// Verify whitelist eligibility
match whitelist_config.whitelist_type {
    WhitelistType::AddressList => {
        // Check if address is in whitelist
    },
    WhitelistType::TokenHolder => {
        // Check token balance
    },
    WhitelistType::SocialVerified => {
        // Check social verification
    },
    WhitelistType::MerkleTree => {
        // Verify merkle proof
    },
}
```

---

## 🎨 **Example Usage Flow**

### **1. Create Collection with Phases:**
```rust
// Initialize collection
initialize_collection(/* ... */);

// Create whitelist phase
create_mint_phase(
    phase_type: PhaseType::Whitelist,
    start_time: start_timestamp,
    end_time: end_timestamp,
    price_lamports: 50_000_000, // 0.05 LOS
    max_mints_per_user: 2,
    total_allocation: 1000,
);

// Create public phase
create_mint_phase(
    phase_type: PhaseType::Public,
    start_time: end_timestamp + 1,
    end_time: final_timestamp,
    price_lamports: 100_000_000, // 0.1 LOS
    max_mints_per_user: 5,
    total_allocation: 9000,
);
```

### **2. Configure Whitelist:**
```rust
// Create whitelist config
create_whitelist_config(
    whitelist_type: WhitelistType::TokenHolder,
    required_token_mint: Some(LOS_TOKEN_MINT),
    minimum_token_balance: Some(1_000_000_000), // 1 LOS
    merkle_root: None,
);
```

### **3. Users Mint:**
```rust
// During whitelist phase
mint_with_phase_validation(
    amount: 2,
    merkle_proof: None, // Not needed for token holder verification
);

// During public phase
mint_with_phase_validation(
    amount: 5,
    merkle_proof: None,
);
```

---

## 🚀 **Benefits of This Approach**

### **Security:**
- ✅ On-chain validation prevents gaming
- ✅ Rate limiting prevents bot attacks
- ✅ Phase-based allocation ensures fair distribution
- ✅ Emergency pause for critical situations

### **Flexibility:**
- ✅ Multiple phase types
- ✅ Configurable parameters
- ✅ Social verification integration
- ✅ Bonding curve pricing

### **User Experience:**
- ✅ Clear phase progression
- ✅ Fair distribution mechanisms
- ✅ Transparent on-chain rules
- ✅ No frontend manipulation possible

### **Professional Features:**
- ✅ Token holder verification
- ✅ Social media integration
- ✅ Dynamic pricing
- ✅ Advanced admin controls

---

## 🎯 **Implementation Strategy**

### **Phase 1: Core Phase System**
1. Add `MintPhase` and `UserMintRecord` accounts
2. Implement phase validation in minting
3. Add basic whitelist support

### **Phase 2: Advanced Whitelists**
1. Token holder verification
2. Merkle tree support
3. Address-based whitelists

### **Phase 3: Social Integration**
1. Social verification config
2. Platform-specific verification
3. API integration

### **Phase 4: Bonding Curves**
1. Bonding curve mathematics
2. Dynamic pricing
3. Curve visualization

---

This enhanced system would make your launchpad **professional-grade** and **unbypassable**! 🚀
