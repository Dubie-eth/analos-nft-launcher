# 🏗️ LOSLAUNCHER - COMPLETE SYSTEM ARCHITECTURE

## 📋 TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Blockchain Programs](#blockchain-programs)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Structure](#frontend-structure)
5. [Data Flow](#data-flow)
6. [API Endpoints](#api-endpoints)
7. [Smart Contract Integration](#smart-contract-integration)
8. [Configuration Files](#configuration-files)

---

## 1. SYSTEM OVERVIEW

### **What is LosLauncher?**
LosLauncher is a complete NFT launchpad platform built on the Analos blockchain. It enables creators to launch NFT collections with:
- **Blind Mint Mechanics** - Users mint mystery box NFTs
- **Fair Reveal System** - Commit-reveal scheme for randomness
- **Dynamic Pricing** - USD-pegged pricing using $LOS token
- **Rarity System** - Trait-based rarity calculation
- **Bonding Curves** - Token launch integration
- **Community Governance** - Takeover proposals and voting

### **Tech Stack**
```
┌─────────────────────────────────────────┐
│           FRONTEND (Next.js)            │
│  - React Components                     │
│  - Solana Web3.js                       │
│  - Wallet Adapter                       │
└─────────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ▼
┌─────────────────────────────────────────┐
│          BACKEND (Node.js)              │
│  - Express API                          │
│  - NFT Generator Service                │
│  - IPFS Integration (NFT.Storage/Pinata)│
│  - Rarity Calculator                    │
└─────────────────────────────────────────┘
                    │
                    │ RPC Calls
                    ▼
┌─────────────────────────────────────────┐
│      ANALOS BLOCKCHAIN (Solana Fork)    │
│  ┌─────────────────────────────────┐   │
│  │  NFT Launchpad Program (Main)   │   │
│  └─────────────────────────────────┘   │
│         │        │         │            │
│         ▼        ▼         ▼            │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Price  │ │ Rarity │ │ Token  │     │
│  │ Oracle │ │ Oracle │ │ Launch │     │
│  └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────┘
```

---

## 2. BLOCKCHAIN PROGRAMS

### **Architecture: Grandparent → Parent → Child**

```
                    ┌──────────────────────┐
                    │  NFT LAUNCHPAD       │ ◄── GRANDPARENT
                    │  (Main Orchestrator) │     (Orchestrates everything)
                    └──────────────────────┘
                       │       │       │
        ┌──────────────┼───────┼───────┼──────────────┐
        │              │       │       │              │
        ▼              ▼       ▼       ▼              ▼
┌──────────────┐  ┌────────┐ ┌────────┐  ┌──────────────┐
│ Collection   │  │ Price  │ │ Rarity │  │ Token Launch │ ◄── PARENTS
│ Management   │  │ Oracle │ │ Oracle │  │ (Bonding)    │     (Core Services)
└──────────────┘  └────────┘ └────────┘  └──────────────┘
     │                │           │              │
     ▼                ▼           ▼              ▼
┌────────┐      ┌────────┐  ┌────────┐    ┌────────┐
│ Mint   │      │ Price  │  │ Trait  │    │ Curve  │    ◄── CHILDREN
│ Reveal │      │ Update │  │ Score  │    │ Buy    │        (Specific Functions)
│ Claim  │      │ Query  │  │ Query  │    │ Sell   │
└────────┘      └────────┘  └────────┘    └────────┘
```

### **Program 1: Price Oracle** (Parent)
**Program ID**: `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`

**Purpose**: Provides real-time $LOS price data for USD-pegged NFT pricing

**Functions**:
- `initialize_oracle` - Set up oracle with initial market cap
- `update_los_market_cap` - Update $LOS market cap (with staleness checks)
- `calculate_los_amount_for_usd` - Convert USD to $LOS
- `calculate_pool_target_los` - Calculate bonding curve targets
- `pause_oracle` / `resume_oracle` - Emergency controls

**Account Structure**:
```rust
pub struct PriceOracle {
    pub authority: Pubkey,
    pub los_market_cap_usd: u64,  // Market cap in USD (6 decimals)
    pub los_price_usd: u64,        // Price per token (6 decimals)
    pub last_update: i64,          // Timestamp
    pub update_count: u64,         // Number of updates
    pub is_active: bool,           // Active status
}
```

**Children Functions**:
- USD to $LOS conversion
- Price staleness validation
- Market cap updates with tolerance checks

---

### **Program 2: Rarity Oracle** (Parent)
**Program ID**: `H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6`

**Purpose**: Calculates and stores NFT rarity scores and trait distributions

**Functions**:
- `initialize_rarity_oracle` - Set up rarity tracking
- `register_trait_type` - Add new trait types
- `record_trait_occurrence` - Track trait distribution
- `calculate_trait_rarity` - Calculate rarity scores
- `get_combined_rarity` - Multi-trait rarity calculation

**Account Structure**:
```rust
pub struct RarityOracle {
    pub authority: Pubkey,
    pub total_nfts: u64,
    pub trait_types_count: u64,
    pub is_active: bool,
}

pub struct TraitType {
    pub trait_name: String,
    pub total_occurrences: u64,
    pub unique_values: u64,
}
```

**Children Functions**:
- Trait rarity scoring (0-100 scale)
- Distribution tracking
- Combined rarity calculations

---

### **Program 3: Token Launch** (Parent)
**Program ID**: `HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx`

**Purpose**: Handles token launches with bonding curves

**Functions**:
- `initialize_token_launch` - Create new token launch
- `mint_nft` - Mint NFT (integrates with price/rarity oracles)
- `creator_prebuy_tokens` - Creator token allocation
- `claim_trading_fees` - Fee distribution

**Account Structure**:
```rust
pub struct TokenLaunchConfig {
    pub authority: Pubkey,
    pub collection_mint: Pubkey,
    pub total_supply: u64,
    pub nfts_minted: u64,
    pub creator_prebuy_percentage: u16,
    pub creator_tokens_claimed: u64,
    pub trading_fee_bps: u16,
    pub bonding_curve_type: BondingCurveType,
    pub launch_timestamp: i64,
}
```

**Children Functions**:
- NFT minting with CPI calls
- Bonding curve price calculations
- Creator token vesting
- Fee collection and distribution

---

### **Program 4: NFT Launchpad** (GRANDPARENT - Main Orchestrator)
**Program ID**: `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`

**Purpose**: Main program that orchestrates all other programs and handles the complete NFT lifecycle

**Core Functions**:

#### Collection Management (Parent Functions)
- `initialize_collection` - Create new NFT collection
- `update_collection_config` - Update collection settings
- `set_pause` - Pause/unpause collection

#### Blind Mint System (Parent Functions)
- `mint_placeholder` - Mint unrevealed NFT (mystery box)
- `commit_reveal_data` - Commit reveal data (commit-reveal scheme)
- `reveal_collection` - Trigger collection-wide reveal
- `reveal_nft` - Reveal individual NFT traits

#### Whitelist Management (Parent Functions)
- `add_to_whitelist` - Add addresses to whitelist
- `remove_from_whitelist` - Remove from whitelist

#### Bonding Curve Integration (Parent Functions)
- `initialize_bonding_tier` - Set up pricing tiers
- `progress_to_next_tier` - Move to next price tier

#### Community Governance (Parent Functions)
- `create_takeover_proposal` - Propose community takeover
- `vote_on_takeover_proposal` - Vote on proposals
- `execute_takeover` - Execute successful takeover

#### Admin Functions (Parent Functions)
- `withdraw_funds` - Withdraw collected funds
- `emergency_pause` - Emergency stop

**Account Structures**:
```rust
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub collection_name: String,
    pub collection_symbol: String,
    pub total_supply: u64,
    pub minted_count: u64,
    pub revealed_count: u64,
    pub mint_price_usd: u64,          // USD price (uses Price Oracle)
    pub royalty_bps: u16,
    pub is_whitelist_only: bool,
    pub is_paused: bool,
    pub reveal_timestamp: Option<i64>,
}

pub struct NFTMetadata {
    pub owner: Pubkey,
    pub collection_config: Pubkey,
    pub mint_number: u64,
    pub is_revealed: bool,
    pub rarity_score: u8,              // From Rarity Oracle
    pub tier: u8,                      // Bonding curve tier
}

pub struct CommitmentConfig {
    pub collection_config: Pubkey,
    pub reveal_seed_hash: [u8; 32],    // For commit-reveal
    pub commitment_timestamp: i64,
}
```

**Children Functions** (Specific Operations):
- Individual NFT minting
- Trait reveal calculations
- Price tier transitions
- Whitelist validation
- Vote counting
- Fee calculations

---

## 3. BACKEND ARCHITECTURE

### **Directory Structure**
```
backend/
├── src/
│   ├── working-server.ts              # Main Express server
│   ├── nft-generator-enhanced-routes.ts  # NFT generation API
│   ├── services/
│   │   ├── enhanced-rarity-calculator.ts  # Rarity algorithms
│   │   └── ipfs-integration.ts            # IPFS uploads
│   └── middleware/
│       └── validation.ts
├── package.json
└── .env
```

### **Key Services**

#### **Enhanced Rarity Calculator**
**File**: `backend/src/services/enhanced-rarity-calculator.ts`

**Purpose**: Calculate trait rarity scores using multiple algorithms

**Functions**:
```typescript
export interface TraitRarity {
  traitType: string;
  traitValue: string;
  occurrences: number;
  totalNFTs: number;
  rarityScore: number;
  rarityPercentage: number;
}

export interface NFTRarity {
  traits: TraitRarity[];
  overallRarity: number;
  rarityTier: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
}

// Main function
export function calculateEnhancedRarity(
  nftTraits: Record<string, string>,
  allTraitsData: Record<string, Record<string, number>>,
  totalNFTs: number
): NFTRarity
```

**Algorithms**:
1. **Statistical Rarity**: Based on trait frequency
2. **Trait Rarity Score**: Weighted by trait type
3. **Overall Rarity**: Combined score across all traits

**Tiers**:
- Legendary: 95-100 (Top 5%)
- Epic: 85-95 (Next 10%)
- Rare: 70-85 (Next 15%)
- Uncommon: 50-70 (Next 20%)
- Common: 0-50 (Bottom 50%)

---

#### **IPFS Integration**
**File**: `backend/src/services/ipfs-integration.ts`

**Purpose**: Upload NFT assets and metadata to IPFS (dual upload for redundancy)

**Functions**:
```typescript
export interface IPFSUploadResult {
  nftStorageCID?: string;
  pinataCID?: string;
  gatewayURLs: string[];
  success: boolean;
  errors?: string[];
}

// Upload image to IPFS
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  fileName: string
): Promise<IPFSUploadResult>

// Upload metadata to IPFS
export async function uploadMetadataToIPFS(
  metadata: object
): Promise<IPFSUploadResult>

// Complete NFT upload (image + metadata)
export async function uploadCompleteNFT(
  imageBuffer: Buffer,
  imageName: string,
  metadata: object
): Promise<{
  imageCID: string;
  metadataCID: string;
  metadataURL: string;
}>
```

**Providers**:
1. **NFT.Storage** (Primary)
   - Free tier available
   - Optimized for NFTs
   - Permanent storage

2. **Pinata** (Backup)
   - Enterprise-grade
   - Advanced pinning options
   - Better performance

---

## 4. FRONTEND STRUCTURE

### **Directory Structure**
```
frontend-new/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── EnhancedGeneratorIntegration.tsx
│   │   ├── pages/
│   │   │   ├── launch/
│   │   │   ├── mint/
│   │   │   └── reveal/
│   │   └── layout.tsx
│   ├── config/
│   │   └── analos-programs.ts         # Program IDs config
│   ├── hooks/
│   │   ├── useProgram.ts
│   │   └── useWallet.ts
│   └── utils/
│       ├── solana.ts
│       └── formatting.ts
└── package.json
```

### **Key Components**

#### **Enhanced Generator Integration**
**File**: `frontend-new/src/app/components/EnhancedGeneratorIntegration.tsx`

**Purpose**: UI for NFT generation with rarity calculation

**Features**:
- Trait configuration interface
- Real-time rarity preview
- Batch generation support
- IPFS upload progress
- Metadata preview

---

#### **Program Configuration**
**File**: `frontend-new/src/config/analos-programs.ts`

**Purpose**: Central configuration for all blockchain programs

```typescript
import { PublicKey } from '@solana/web3.js';

export const ANALOS_PROGRAMS = {
  PRICE_ORACLE: new PublicKey('ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn'),
  RARITY_ORACLE: new PublicKey('H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6'),
  TOKEN_LAUNCH: new PublicKey('HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx'),
  NFT_LAUNCHPAD: new PublicKey('5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT'),
};

export const ANALOS_RPC_URL = 'https://rpc.analos.io';
```

---

## 5. DATA FLOW

### **Complete User Journey: Blind Mint → Reveal**

```
1. USER: Connect Wallet
   │
   ▼
2. FRONTEND: Fetch Collection Data
   │ → RPC Call to NFT Launchpad
   │ → Get CollectionConfig account
   │
   ▼
3. FRONTEND: Display Mint Price
   │ → RPC Call to Price Oracle
   │ → Convert USD to $LOS
   │
   ▼
4. USER: Click "Mint"
   │
   ▼
5. FRONTEND: Build Transaction
   │ → Call mint_placeholder instruction
   │ → Include payment in $LOS
   │
   ▼
6. BLOCKCHAIN: NFT Launchpad Program
   │ → Verify payment
   │ → Check whitelist (if enabled)
   │ → Mint placeholder NFT
   │ → Emit MintEvent
   │
   ▼
7. USER: Receives Unrevealed NFT
   │ → Shows "Mystery Box" in wallet
   │
   ▼
8. CREATOR: Commits Reveal Data
   │ → Call commit_reveal_data
   │ → Hash seed stored on-chain
   │
   ▼
9. CREATOR: Triggers Reveal
   │ → Call reveal_collection
   │ → Makes reveal available
   │
   ▼
10. USER: Clicks "Reveal My NFT"
    │
    ▼
11. FRONTEND: Build Reveal Transaction
    │ → Call reveal_nft instruction
    │ → Include reveal seed
    │
    ▼
12. BLOCKCHAIN: NFT Launchpad Program
    │ → Verify reveal seed hash
    │ → Generate random traits
    │ → CPI to Rarity Oracle
    │ → Calculate rarity score
    │ → Update NFT metadata
    │ → Emit RevealEvent
    │
    ▼
13. BACKEND: Detect Reveal Event
    │ → Generate NFT image
    │ → Upload to IPFS
    │ → Create metadata JSON
    │ → Upload metadata to IPFS
    │
    ▼
14. USER: Sees Revealed NFT
    │ → Full metadata visible
    │ → Rarity score displayed
    │ → Traits shown
```

---

### **Price Oracle Integration Flow**

```
1. ADMIN: Updates $LOS Market Cap
   │
   ▼
2. Price Oracle: update_los_market_cap
   │ → Calculate new price
   │ → Store timestamp
   │ → Emit PriceUpdateEvent
   │
   ▼
3. NFT Launchpad: Fetches Current Price
   │ → CPI to Price Oracle
   │ → calculate_los_amount_for_usd
   │
   ▼
4. NFT Launchpad: Calculates NFT Cost
   │ → mint_price_usd * los_price
   │ → Returns amount in $LOS lamports
   │
   ▼
5. User Pays Dynamic Price
   │ → Always pays correct USD equivalent
   │ → Protected from price manipulation
```

---

### **Rarity Oracle Integration Flow**

```
1. CREATOR: Defines Traits
   │ → Hair: Brown, Blonde, Red
   │ → Eyes: Blue, Green, Brown
   │ → Background: Sky, Forest, City
   │
   ▼
2. Rarity Oracle: register_trait_type
   │ → Store trait definitions
   │ → Initialize occurrence counters
   │
   ▼
3. NFT REVEAL: Traits Assigned
   │ → Random traits selected
   │ → CPI to Rarity Oracle
   │
   ▼
4. Rarity Oracle: calculate_trait_rarity
   │ → Count occurrences
   │ → Calculate distribution
   │ → Return rarity score (0-100)
   │
   ▼
5. NFT Metadata Updated
   │ → Rarity score stored
   │ → Tier assigned
   │ → User sees rarity rank
```

---

## 6. API ENDPOINTS

### **Backend API Routes**

#### **NFT Generator Endpoints**

**Base URL**: `/api/nft-generator`

##### `POST /calculate-rarity`
Calculate rarity for NFT traits

**Request**:
```json
{
  "nftTraits": {
    "Background": "Sky",
    "Hair": "Red",
    "Eyes": "Green"
  },
  "allTraitsData": {
    "Background": { "Sky": 50, "Forest": 30, "City": 20 },
    "Hair": { "Brown": 40, "Blonde": 35, "Red": 25 },
    "Eyes": { "Blue": 45, "Green": 30, "Brown": 25 }
  },
  "totalNFTs": 100
}
```

**Response**:
```json
{
  "success": true,
  "rarity": {
    "traits": [
      {
        "traitType": "Background",
        "traitValue": "Sky",
        "occurrences": 50,
        "totalNFTs": 100,
        "rarityScore": 50,
        "rarityPercentage": 50
      }
    ],
    "overallRarity": 65.5,
    "rarityTier": "Uncommon"
  }
}
```

---

##### `POST /upload-image`
Upload image to IPFS

**Request**: `multipart/form-data`
- `image`: File (PNG, JPG, GIF)

**Response**:
```json
{
  "success": true,
  "ipfs": {
    "nftStorageCID": "bafybeiabc123...",
    "pinataCID": "bafybeiabc123...",
    "gatewayURLs": [
      "https://nftstorage.link/ipfs/bafybeiabc123...",
      "https://gateway.pinata.cloud/ipfs/bafybeiabc123..."
    ]
  }
}
```

---

##### `POST /upload-metadata`
Upload metadata JSON to IPFS

**Request**:
```json
{
  "name": "Cool NFT #1",
  "description": "A cool NFT",
  "image": "ipfs://bafybeiabc123...",
  "attributes": [
    { "trait_type": "Background", "value": "Sky" },
    { "trait_type": "Hair", "value": "Red" }
  ],
  "properties": {
    "category": "image",
    "creators": [
      { "address": "4ea9ktn5...", "share": 100 }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "ipfs": {
    "nftStorageCID": "bafybeimetadata...",
    "pinataCID": "bafybeimetadata...",
    "gatewayURLs": [
      "https://nftstorage.link/ipfs/bafybeimetadata..."
    ]
  }
}
```

---

##### `POST /generate-complete`
Complete NFT generation (image + metadata + IPFS)

**Request**: `multipart/form-data`
- `image`: File
- `metadata`: JSON string

**Response**:
```json
{
  "success": true,
  "nft": {
    "imageCID": "bafybeiabc123...",
    "metadataCID": "bafybeimetadata...",
    "metadataURL": "https://nftstorage.link/ipfs/bafybeimetadata...",
    "rarity": {
      "overallRarity": 75.2,
      "rarityTier": "Rare"
    }
  }
}
```

---

## 7. SMART CONTRACT INTEGRATION

### **How Frontend Calls Smart Contracts**

#### **Example: Mint Blind NFT**

```typescript
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';

async function mintBlindNFT(
  wallet: any,
  collectionConfigPubkey: PublicKey,
  paymentAmount: number
) {
  // 1. Setup connection
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, {});
  
  // 2. Load program
  const program = new Program(IDL, ANALOS_PROGRAMS.NFT_LAUNCHPAD, provider);
  
  // 3. Derive PDA accounts
  const [nftMetadataPda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('nft_metadata'),
      collectionConfigPubkey.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );
  
  // 4. Build transaction
  const tx = await program.methods
    .mintPlaceholder()
    .accounts({
      collectionConfig: collectionConfigPubkey,
      nftMetadata: nftMetadataPda,
      minter: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
  
  // 5. Send transaction
  const signature = await wallet.sendTransaction(tx, connection);
  
  // 6. Confirm
  await connection.confirmTransaction(signature);
  
  return { signature, nftMetadata: nftMetadataPda };
}
```

---

#### **Example: Reveal NFT**

```typescript
async function revealNFT(
  wallet: any,
  nftMetadataPubkey: PublicKey,
  revealSeed: string
) {
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(IDL, ANALOS_PROGRAMS.NFT_LAUNCHPAD, provider);
  
  // Call reveal_nft instruction
  const tx = await program.methods
    .revealNft(revealSeed)
    .accounts({
      nftMetadata: nftMetadataPubkey,
      owner: wallet.publicKey,
      rarityOracle: ANALOS_PROGRAMS.RARITY_ORACLE,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
  
  const signature = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(signature);
  
  // Fetch updated metadata
  const nftData = await program.account.nftMetadata.fetch(nftMetadataPubkey);
  
  return {
    signature,
    revealed: nftData.isRevealed,
    rarityScore: nftData.rarityScore,
    tier: nftData.tier,
  };
}
```

---

#### **Example: Query Price Oracle**

```typescript
async function getCurrentLOSPrice(): Promise<number> {
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
  
  // Derive price oracle PDA
  const [priceOraclePda] = await PublicKey.findProgramAddress(
    [Buffer.from('price_oracle')],
    ANALOS_PROGRAMS.PRICE_ORACLE
  );
  
  // Fetch oracle account
  const program = new Program(PRICE_ORACLE_IDL, ANALOS_PROGRAMS.PRICE_ORACLE);
  const oracleData = await program.account.priceOracle.fetch(priceOraclePda);
  
  return oracleData.losPriceUsd / 1_000_000; // Convert from 6 decimals
}

async function convertUSDtoLOS(usdAmount: number): Promise<number> {
  const losPrice = await getCurrentLOSPrice();
  return usdAmount / losPrice;
}
```

---

## 8. CONFIGURATION FILES

### **Environment Variables**

#### **Backend `.env`**
```env
# Server
PORT=3000
NODE_ENV=production

# Analos Blockchain
ANALOS_RPC_URL=https://rpc.analos.io
ANALOS_PRICE_ORACLE=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
ANALOS_RARITY_ORACLE=H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6
ANALOS_TOKEN_LAUNCH=HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx
ANALOS_NFT_LAUNCHPAD=5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT

# IPFS
NFT_STORAGE_API_KEY=d5c39abd.4d9ac6f0985d4620bff140fb7e6bf171
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Database (if needed)
DATABASE_URL=postgresql://...
```

---

#### **Frontend `next.config.js`**
```javascript
module.exports = {
  env: {
    NEXT_PUBLIC_ANALOS_RPC: 'https://rpc.analos.io',
    NEXT_PUBLIC_PRICE_ORACLE: 'ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn',
    NEXT_PUBLIC_RARITY_ORACLE: 'H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
    NEXT_PUBLIC_TOKEN_LAUNCH: 'HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
    NEXT_PUBLIC_NFT_LAUNCHPAD: '5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
  },
};
```

---

## 📊 SUMMARY

### **System Hierarchy**

```
GRANDPARENT (NFT Launchpad)
├── Orchestrates entire NFT lifecycle
├── Manages collections
├── Handles blind mints
├── Controls reveals
└── Coordinates with PARENTS ▼

PARENTS (Oracles & Services)
├── Price Oracle
│   └── CHILDREN: Price updates, conversions, calculations
├── Rarity Oracle  
│   └── CHILDREN: Trait tracking, rarity scoring
└── Token Launch
    └── CHILDREN: Minting, bonding curves, fees

CHILDREN (Specific Operations)
└── Individual function executions
```

### **Data Flow Summary**

1. **User Interaction** → Frontend
2. **Frontend** → Backend API (if needed)
3. **Backend** → IPFS / Database
4. **Frontend** → Blockchain RPC
5. **NFT Launchpad** (Grandparent) → Oracles (Parents)
6. **Oracles** → Specific Functions (Children)
7. **Results** → User

### **Key Integration Points**

- ✅ Frontend calls Backend for IPFS uploads
- ✅ Frontend calls Blockchain for minting/revealing
- ✅ NFT Launchpad calls Price Oracle for pricing
- ✅ NFT Launchpad calls Rarity Oracle for scoring
- ✅ NFT Launchpad calls Token Launch for bonding curves
- ✅ Backend listens to blockchain events for automation

---

**This architecture ensures**:
- Modularity (each program has specific purpose)
- Scalability (programs can be upgraded independently)
- Reliability (dual IPFS providers, error handling)
- Transparency (on-chain verification for all operations)

**Ready to launch! 🚀**

