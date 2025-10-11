# 🚀 Complete Analos Programs Integration Guide

## 📦 ALL PROGRAMS IN THE ECOSYSTEM

This document lists ALL the Solana programs we've created for the Analos ecosystem and how to integrate them into your project.

---

## 🏗️ PROGRAM STRUCTURE

Your workspace has **9 main programs** organized in `analos-nft-launchpad/programs/`:

### **1. ANALOS NFT LAUNCHPAD** (Main Program)
📁 **Location:** `programs/analos-nft-launchpad/src/lib.rs`  
🆔 **Program ID:** `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`  
📄 **Lines:** ~2,049 lines

**Purpose:** Core NFT launchpad with mystery box mechanics

**Key Features:**
- Mystery box NFT minting
- Reveal mechanism with threshold
- Ticker registry system (unique symbols)
- Dynamic fee distribution (6% to LOL ecosystem)
- Creator allocation (25% split)
- Bonding curve support
- Social verification
- Mint phases
- Escrow management
- Emergency controls

**Key Functions:**
- `initialize_collection()` - Create new NFT collection
- `mint_placeholder()` - Mint mystery box NFT
- `reveal_collection()` - Reveal entire collection
- `reveal_nft_with_fee()` - Reveal individual NFT
- `configure_bonding_curve_pricing()` - Set up bonding curve
- `create_mint_phase()` - Create phased minting
- `withdraw_from_escrow()` - Withdraw creator funds

---

### **2. ANALOS TOKEN LAUNCH**
📁 **Location:** `programs/analos-token-launch/src/lib.rs`  
🆔 **Program ID:** (To be deployed)  
📄 **Size:** Full token launch platform

**Purpose:** Token launches with bonding curves and fair launch mechanics

**Key Features:**
- Fair launch mechanism
- Bonding curve price discovery
- Anti-bot protections
- Liquidity pool integration
- Vesting schedules for team tokens
- Early supporter rewards

**Key Functions:**
- `initialize_token_launch()` - Create token launch
- `buy_tokens()` - Purchase tokens on bonding curve
- `finalize_launch()` - Complete launch and create LP
- `claim_tokens()` - Claim vested tokens
- `configure_launch_parameters()` - Set launch params

**Integration:**
```typescript
// Initialize token launch
await tokenLaunchProgram.methods
  .initializeTokenLaunch(params)
  .accounts({...})
  .rpc();
```

---

### **3. ANALOS VESTING**
📁 **Location:** `programs/analos-vesting/src/lib.rs`  
🆔 **Enhanced Version ID:** `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY`  
📄 **Enhanced Version:** `analos-vesting-enhanced/src/lib.rs`

**Purpose:** Token vesting with cliff and linear release schedules

**Key Features:**
- Linear vesting schedules
- Cliff periods
- Multi-beneficiary support
- Emergency pause
- Early withdrawal penalties
- Revocable/irrevocable schedules

**Key Functions:**
- `create_vesting_schedule()` - Set up vesting
- `claim_vested_tokens()` - Claim available tokens
- `revoke_vesting()` - Cancel vesting (if revocable)
- `update_beneficiary()` - Change beneficiary

**Vesting Formula:**
```
Available = (Total * (CurrentTime - StartTime)) / (EndTime - StartTime)
If CurrentTime < CliffEnd: Available = 0
```

**Integration:**
```typescript
// Create vesting schedule
await vestingProgram.methods
  .createVestingSchedule(
    totalAmount,
    startTime,
    endTime,
    cliffDuration,
    isRevocable
  )
  .accounts({...})
  .rpc();
```

---

### **4. ANALOS TOKEN LOCK**
📁 **Location:** `programs/analos-token-lock/src/lib.rs`  
🆔 **Enhanced Version ID:** `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH`  
📄 **Enhanced Version:** `analos-token-lock-enhanced/src/lib.rs`

**Purpose:** Time-locked token escrow for team/investor tokens

**Key Features:**
- Time-based token locks
- Multi-milestone unlocks
- LP token locking
- Emergency unlock (admin only)
- Lock extension
- Batch lock creation

**Key Functions:**
- `create_lock()` - Lock tokens
- `unlock_tokens()` - Unlock after time expires
- `extend_lock()` - Extend lock duration
- `emergency_unlock()` - Admin emergency unlock

**Lock Types:**
- Simple time locks
- Milestone-based locks
- Linear unlock locks
- LP token locks

**Integration:**
```typescript
// Lock tokens
await tokenLockProgram.methods
  .createLock(
    amount,
    unlockTime,
    lockType
  )
  .accounts({...})
  .rpc();
```

---

### **5. ANALOS METADATA**
📁 **Location:** `programs/analos-metadata/src/lib.rs`  
🆔 **Program ID:** (To be deployed)

**Purpose:** NFT metadata management and updates

**Key Features:**
- Create NFT metadata
- Update metadata (if mutable)
- Verify collection
- Update collection
- Freeze/thaw metadata

**Key Functions:**
- `create_metadata()` - Create NFT metadata
- `update_metadata()` - Update existing metadata
- `verify_collection()` - Verify NFT in collection
- `set_and_verify_collection()` - Add and verify collection

**Metadata Structure:**
```rust
pub struct Metadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
    pub creators: Vec<Creator>,
    pub collection: Option<Collection>,
}
```

**Integration:**
```typescript
// Create metadata
await metadataProgram.methods
  .createMetadata(
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators
  )
  .accounts({...})
  .rpc();
```

---

### **6. ANALOS RARITY ORACLE**
📁 **Location:** `programs/analos-rarity-oracle/src/lib.rs`  
🆔 **Program ID:** (To be deployed)

**Purpose:** On-chain rarity scoring and ranking for NFTs

**Key Features:**
- Trait rarity calculation
- Collection-wide rarity scoring
- Attribute weighting
- Dynamic rarity updates
- Rarity-based gating

**Key Functions:**
- `initialize_rarity_config()` - Set up rarity system
- `calculate_rarity_score()` - Calculate NFT rarity
- `update_trait_weights()` - Adjust trait importance
- `get_rarity_rank()` - Get NFT ranking

**Rarity Calculation:**
```
Rarity Score = Σ (TraitRarity * TraitWeight)
TraitRarity = 1 / (NFTs with Trait / Total NFTs)
```

**Integration:**
```typescript
// Calculate rarity
const rarityScore = await rarityOracleProgram.methods
  .calculateRarityScore(nftMint)
  .accounts({...})
  .view();
```

---

### **7. ANALOS PRICE ORACLE**
📁 **Location:** `programs/analos-price-oracle/src/lib.rs`  
🆔 **Program ID:** (To be deployed)

**Purpose:** Price feed oracle for NFT floor prices and token prices

**Key Features:**
- Floor price tracking
- Volume-weighted average prices (VWAP)
- Multiple price feeds
- Oracle validation
- Time-weighted prices

**Key Functions:**
- `initialize_price_feed()` - Create price feed
- `update_price()` - Update price (oracle only)
- `get_price()` - Get current price
- `get_twap()` - Get time-weighted average price

**Price Feed Types:**
- Collection floor prices
- Token prices (LOL/SOL, etc.)
- LP token prices
- Custom asset prices

**Integration:**
```typescript
// Get floor price
const floorPrice = await priceOracleProgram.methods
  .getPrice(collectionMint)
  .accounts({...})
  .view();
```

---

### **8. ANALOS AIRDROP**
📁 **Location:** `programs/analos-airdrop/` (in programs folder)  
🆔 **Enhanced Version ID:** `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC`  
📄 **Enhanced Version:** `analos-airdrop-enhanced/src/lib.rs`

**Purpose:** Merkle tree-based airdrops for tokens and NFTs

**Key Features:**
- Merkle tree verification
- Claim tracking
- Multiple airdrop campaigns
- Whitelist management
- Time-limited claims
- Anti-bot protections

**Key Functions:**
- `initialize_airdrop()` - Create airdrop campaign
- `claim_airdrop()` - Claim tokens/NFTs
- `verify_merkle_proof()` - Verify eligibility
- `close_airdrop()` - End campaign and reclaim funds

**Merkle Tree Structure:**
```
Root Hash
  ├── Branch Hash
  │   ├── Leaf (User1, Amount1)
  │   └── Leaf (User2, Amount2)
  └── Branch Hash
      ├── Leaf (User3, Amount3)
      └── Leaf (User4, Amount4)
```

**Integration:**
```typescript
// Claim airdrop
await airdropProgram.methods
  .claimAirdrop(
    amount,
    merkleProof
  )
  .accounts({...})
  .rpc();
```

---

### **9. ANALOS OTC MARKETPLACE**
📁 **Location:** `programs/analos-otc-marketplace/` (in programs folder)  
🆔 **Enhanced Version ID:** `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY`  
📄 **Enhanced Version:** `analos-otc-enhanced/src/lib.rs`

**Purpose:** Peer-to-peer OTC trading for tokens and NFTs

**Key Features:**
- Escrow-based trades
- NFT <-> Token swaps
- Token <-> Token swaps
- NFT <-> NFT swaps
- Partial fills
- Expiring offers

**Key Functions:**
- `create_offer()` - Create trade offer
- `accept_offer()` - Accept trade
- `cancel_offer()` - Cancel offer
- `update_offer()` - Modify offer terms

**Trade Types:**
1. **Direct Trades:** 1:1 swaps
2. **Multiple Items:** Bundles
3. **Partial Fills:** Fill portion of offer
4. **Dutch Auction:** Declining price

**Integration:**
```typescript
// Create OTC offer
await otcProgram.methods
  .createOffer(
    offerItems,
    requestedItems,
    expiryTime
  )
  .accounts({...})
  .rpc();
```

---

## 🌐 ADDITIONAL PROGRAMS (STANDALONE)

### **10. ANALOS MONITORING SYSTEM**
📁 **Location:** `analos-monitoring-system/src/lib.rs`  
🆔 **Program ID:** `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG`

**Purpose:** Real-time monitoring and alerting system

**Key Features:**
- Transaction monitoring
- Event logging
- Alert triggers
- Performance metrics
- Audit trails
- Anomaly detection

**Key Functions:**
- `log_event()` - Log system event
- `create_alert()` - Create alert condition
- `query_logs()` - Query historical logs
- `get_metrics()` - Get system metrics

---

## 🔧 HOW TO ADD ALL PROGRAMS TO YOUR PROJECT

### **Step 1: Update Anchor.toml**

Add all programs to your workspace:

```toml
[workspace]
members = [
    "programs/analos-nft-launchpad",
    "programs/analos-token-launch",
    "programs/analos-vesting",
    "programs/analos-token-lock",
    "programs/analos-metadata",
    "programs/analos-rarity-oracle",
    "programs/analos-price-oracle",
    "programs/analos-airdrop",
    "programs/analos-otc-marketplace",
]

[programs.localnet]
analos_nft_launchpad = "5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"
analos_token_launch = "YOUR_PROGRAM_ID"
analos_vesting = "Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"
analos_token_lock = "3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"
analos_metadata = "YOUR_PROGRAM_ID"
analos_rarity_oracle = "YOUR_PROGRAM_ID"
analos_price_oracle = "YOUR_PROGRAM_ID"
analos_airdrop = "J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"
analos_otc_marketplace = "7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"
```

---

### **Step 2: Update Root Cargo.toml**

```toml
[workspace]
members = [
    "programs/analos-nft-launchpad",
    "programs/analos-token-launch",
    "programs/analos-vesting",
    "programs/analos-token-lock",
    "programs/analos-metadata",
    "programs/analos-rarity-oracle",
    "programs/analos-price-oracle",
    "programs/analos-airdrop",
    "programs/analos-otc-marketplace",
]

[workspace.dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
```

---

### **Step 3: Ensure Each Program Has Correct Structure**

Each program directory needs:
```
programs/program-name/
  ├── Cargo.toml
  └── src/
      └── lib.rs
```

**Example Cargo.toml for each program:**
```toml
[package]
name = "analos-program-name"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "analos_program_name"

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
```

---

### **Step 4: Build All Programs**

```bash
# Build all programs at once
anchor build

# Or build individually
cd programs/analos-nft-launchpad && anchor build
cd programs/analos-token-launch && anchor build
cd programs/analos-vesting && anchor build
# ... etc
```

---

## 📋 PROGRAM DEPLOYMENT ORDER

Deploy in this order to handle dependencies:

1. **Analos Metadata** - Base metadata system
2. **Analos Price Oracle** - Price feeds needed by others
3. **Analos Rarity Oracle** - Rarity data needed by NFT programs
4. **Analos Token Lock** - Needed by vesting and token launch
5. **Analos Vesting** - Needed by token launch
6. **Analos Airdrop** - Independent
7. **Analos OTC Marketplace** - Independent
8. **Analos Token Launch** - Depends on vesting/lock
9. **Analos NFT Launchpad** - Main program, can use all others

---

## 🔗 CROSS-PROGRAM INVOCATION (CPI)

### **How Programs Call Each Other**

**Example: NFT Launchpad calling Price Oracle**

```rust
// In analos-nft-launchpad
use analos_price_oracle::cpi::accounts::GetPrice;
use analos_price_oracle::cpi::get_price;

pub fn check_nft_price(ctx: Context<CheckPrice>) -> Result<()> {
    let cpi_program = ctx.accounts.price_oracle_program.to_account_info();
    let cpi_accounts = GetPrice {
        price_feed: ctx.accounts.price_feed.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    let price = get_price(cpi_ctx)?;
    msg!("Current floor price: {}", price);
    
    Ok(())
}
```

---

## 🎯 INTEGRATION PATTERNS

### **Pattern 1: NFT Mint with Rarity + Metadata**

```typescript
// 1. Mint NFT (NFT Launchpad)
const mint = await nftLaunchpadProgram.methods
  .mintPlaceholder()
  .accounts({...})
  .rpc();

// 2. Create Metadata (Metadata Program)
await metadataProgram.methods
  .createMetadata(name, symbol, uri, ...)
  .accounts({...})
  .rpc();

// 3. Calculate Rarity (Rarity Oracle)
const rarity = await rarityOracleProgram.methods
  .calculateRarityScore(mint)
  .accounts({...})
  .view();
```

---

### **Pattern 2: Token Launch with Vesting**

```typescript
// 1. Initialize Token Launch
await tokenLaunchProgram.methods
  .initializeTokenLaunch(params)
  .accounts({...})
  .rpc();

// 2. Create Team Vesting Schedule
await vestingProgram.methods
  .createVestingSchedule(
    teamTokens,
    startTime,
    endTime,
    cliffDuration
  )
  .accounts({...})
  .rpc();

// 3. Lock Liquidity Tokens
await tokenLockProgram.methods
  .createLock(lpTokens, unlockTime)
  .accounts({...})
  .rpc();
```

---

### **Pattern 3: Airdrop with Price Oracle**

```typescript
// 1. Get current token price
const price = await priceOracleProgram.methods
  .getPrice(tokenMint)
  .accounts({...})
  .view();

// 2. Calculate airdrop amounts based on price
const airdropAmount = calculateAmount(price);

// 3. Initialize airdrop
await airdropProgram.methods
  .initializeAirdrop(merkleRoot, totalAmount)
  .accounts({...})
  .rpc();
```

---

## 📦 FRONTEND INTEGRATION

### **Install Anchor Client**

```bash
npm install @project-serum/anchor @solana/web3.js
```

### **Load All Programs**

```typescript
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";

// Load IDLs
import nftLaunchpadIdl from "./idl/analos_nft_launchpad.json";
import tokenLaunchIdl from "./idl/analos_token_launch.json";
import vestingIdl from "./idl/analos_vesting.json";
// ... etc

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Initialize programs
const nftLaunchpadProgram = new Program(nftLaunchpadIdl, programId, provider);
const tokenLaunchProgram = new Program(tokenLaunchIdl, programId, provider);
const vestingProgram = new Program(vestingIdl, programId, provider);
// ... etc
```

---

## 🎨 COMPLETE ECOSYSTEM FLOW

```
User Journey:
1. Create Token (Token Launch) →
2. Add Vesting (Vesting Program) →
3. Lock LP Tokens (Token Lock) →
4. Create NFT Collection (NFT Launchpad) →
5. Add Metadata (Metadata Program) →
6. Calculate Rarity (Rarity Oracle) →
7. Set Up Airdrop (Airdrop Program) →
8. Enable OTC Trading (OTC Marketplace) →
9. Monitor Everything (Monitoring System)
```

---

## 📊 PROGRAM DEPENDENCIES MAP

```
┌─────────────────────────────────────────┐
│         Analos NFT Launchpad            │
│         (Main Application)              │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼─────────┐  ┌──────▼────────┐
│  Analos         │  │  Analos       │
│  Metadata       │  │  Rarity       │
│  Program        │  │  Oracle       │
└───────┬─────────┘  └──────┬────────┘
        │                   │
        └───────┬───────────┘
                │
        ┌───────▼──────────┐
        │  Analos Price    │
        │  Oracle          │
        └──────────────────┘

┌─────────────────────────────────────────┐
│      Analos Token Launch                │
└─────────────┬───────────────────────────┘
              │
     ┌────────┴─────────┐
     │                  │
┌────▼─────┐    ┌──────▼────────┐
│  Vesting │    │  Token Lock   │
│  Program │    │  Program      │
└──────────┘    └───────────────┘

┌──────────────┐  ┌──────────────┐
│   Airdrop    │  │     OTC      │
│   Program    │  │  Marketplace │
└──────────────┘  └──────────────┘
        │                │
        └───────┬────────┘
                │
        ┌───────▼──────────┐
        │   Monitoring     │
        │    System        │
        └──────────────────┘
```

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Build all programs
anchor build

# 2. Generate TypeScript clients
anchor idl init <PROGRAM_ID> -f target/idl/program_name.json

# 3. Deploy all programs
anchor deploy

# 4. Run tests
anchor test

# 5. Generate program addresses
solana-keygen grind --starts-with LOL:1 --ignore-case
```

---

## 🔐 SECURITY NOTES

1. **Each program is independent** - Failure in one doesn't affect others
2. **CPI calls are atomic** - Either all succeed or all fail
3. **Use PDAs for cross-program accounts** - Ensures security
4. **Rate limiting on all programs** - Prevents spam/DOS
5. **Emergency pause on critical programs** - Safety mechanism
6. **Multi-sig for admin functions** - No single point of failure

---

## 📝 TESTING ALL PROGRAMS

```typescript
describe("Complete Ecosystem Test", () => {
  
  it("Tests NFT mint flow", async () => {
    // 1. Mint NFT
    await nftLaunchpadProgram.methods.mintPlaceholder()...
    
    // 2. Add metadata
    await metadataProgram.methods.createMetadata()...
    
    // 3. Calculate rarity
    const rarity = await rarityOracleProgram.methods.calculateRarityScore()...
    
    assert.ok(rarity > 0);
  });
  
  it("Tests token launch flow", async () => {
    // 1. Launch token
    await tokenLaunchProgram.methods.initializeTokenLaunch()...
    
    // 2. Create vesting
    await vestingProgram.methods.createVestingSchedule()...
    
    // 3. Lock LP tokens
    await tokenLockProgram.methods.createLock()...
  });
  
  it("Tests airdrop flow", async () => {
    // 1. Create airdrop
    await airdropProgram.methods.initializeAirdrop()...
    
    // 2. Claim tokens
    await airdropProgram.methods.claimAirdrop()...
  });
});
```

---

## 🎯 PROGRAM FILES CHECKLIST

✅ **Core Programs:**
- [ ] analos-nft-launchpad (✓ Main program)
- [ ] analos-token-launch (Add to workspace)
- [ ] analos-vesting (Add to workspace)
- [ ] analos-token-lock (Add to workspace)
- [ ] analos-metadata (Add to workspace)
- [ ] analos-rarity-oracle (Add to workspace)
- [ ] analos-price-oracle (Add to workspace)
- [ ] analos-airdrop (Add to workspace)
- [ ] analos-otc-marketplace (Add to workspace)

✅ **Enhanced Versions (Separate):**
- [ ] analos-vesting-enhanced
- [ ] analos-token-lock-enhanced
- [ ] analos-airdrop-enhanced
- [ ] analos-otc-enhanced
- [ ] analos-monitoring-system

---

## 📞 SUPPORT

If you need help integrating any program:
1. Check the specific program's lib.rs file
2. Review the function documentation
3. Look at the account structures
4. Test on devnet first
5. Use monitoring system for debugging

---

**Last Updated:** October 2025  
**Ecosystem Version:** 1.0  
**Total Programs:** 9 Core + 1 Monitoring

