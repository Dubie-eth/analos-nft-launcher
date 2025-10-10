# 🤖 AI CONTEXT - LOSLAUNCHER QUICK REFERENCE

> **Purpose**: Feed this file into AI chats to quickly explain the entire LosLauncher system

---

## SYSTEM SUMMARY (One Paragraph)

LosLauncher is a complete NFT launchpad platform built on Analos blockchain (Solana fork) with 4 deployed Solana programs working in a grandparent→parent→child hierarchy. The NFT Launchpad (grandparent at `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`) orchestrates 3 parent programs: Price Oracle (`ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn`) for USD-pegged pricing, Rarity Oracle (`H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6`) for trait rarity, and Token Launch (`HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx`) for bonding curves. The system supports blind minting, commit-reveal randomness, dynamic pricing, community governance, and integrates with a Node.js backend for IPFS uploads (NFT.Storage + Pinata) and rarity calculations.

---

## PROGRAM IDS (All Deployed on Analos)

```
NFT_LAUNCHPAD    = 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
PRICE_ORACLE     = ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
RARITY_ORACLE    = H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6
TOKEN_LAUNCH     = HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx
ANALOS_RPC       = https://rpc.analos.io
```

---

## HIERARCHY

```
NFT LAUNCHPAD (Grandparent) - Main orchestrator
├── PRICE ORACLE (Parent) - USD to $LOS conversion
├── RARITY ORACLE (Parent) - Trait rarity scoring  
└── TOKEN LAUNCH (Parent) - Bonding curves & minting
```

---

## KEY FILES & LOCATIONS

### Blockchain Programs
- `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\programs\analos-nft-launchpad\src\lib.rs` (2,049 lines)
- `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\programs\analos-price-oracle\src\lib.rs`
- `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\programs\analos-rarity-oracle\src\lib.rs`
- `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\programs\analos-token-launch\src\lib.rs`

### Backend
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\backend\src\working-server.ts` - Main server
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\backend\src\nft-generator-enhanced-routes.ts` - API routes
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\backend\src\services\enhanced-rarity-calculator.ts` - Rarity logic
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\backend\src\services\ipfs-integration.ts` - IPFS uploads

### Frontend
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\frontend-new\src\config\analos-programs.ts` - Program config
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\frontend-new\src\app\components\EnhancedGeneratorIntegration.tsx`

### Configuration
- `C:\Users\dusti\OneDrive\Desktop\LosLauncher\ANALOS-PROGRAMS-CONFIG.env` - Backend env vars
- `C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad\Anchor.toml` - Anchor config

---

## CORE FUNCTIONS

### NFT Launchpad (Main Program)
- `initialize_collection` - Create NFT collection
- `mint_placeholder` - Mint blind/mystery NFT
- `commit_reveal_data` - Commit reveal seed
- `reveal_collection` - Enable reveals
- `reveal_nft` - Reveal individual NFT
- `add_to_whitelist` / `remove_from_whitelist` - Whitelist mgmt
- `initialize_bonding_tier` - Setup pricing tiers
- `create_takeover_proposal` - Community governance
- `vote_on_takeover_proposal` - Vote on proposals
- `withdraw_funds` - Admin withdraw

### Price Oracle
- `initialize_oracle` - Setup oracle
- `update_los_market_cap` - Update $LOS price
- `calculate_los_amount_for_usd` - Convert USD→$LOS
- `pause_oracle` / `resume_oracle` - Emergency controls

### Rarity Oracle
- `initialize_rarity_oracle` - Setup
- `register_trait_type` - Add trait types
- `record_trait_occurrence` - Track distribution
- `calculate_trait_rarity` - Calculate scores
- `get_combined_rarity` - Multi-trait rarity

### Token Launch
- `initialize_token_launch` - Create launch
- `mint_nft` - Mint with bonding curve
- `creator_prebuy_tokens` - Creator allocation
- `claim_trading_fees` - Fee distribution

---

## API ENDPOINTS (Backend)

**Base**: `/api/nft-generator`

- `POST /calculate-rarity` - Calculate NFT rarity from traits
- `POST /upload-image` - Upload image to IPFS (dual: NFT.Storage + Pinata)
- `POST /upload-metadata` - Upload metadata JSON to IPFS
- `POST /generate-complete` - Full NFT generation (image + metadata + IPFS)

---

## DATA STRUCTURES

### CollectionConfig (Main NFT Collection)
```rust
pub struct CollectionConfig {
    pub authority: Pubkey,
    pub collection_name: String,
    pub total_supply: u64,
    pub minted_count: u64,
    pub mint_price_usd: u64,        // Uses Price Oracle
    pub is_whitelist_only: bool,
    pub is_paused: bool,
    pub reveal_timestamp: Option<i64>,
}
```

### NFTMetadata (Individual NFT)
```rust
pub struct NFTMetadata {
    pub owner: Pubkey,
    pub collection_config: Pubkey,
    pub mint_number: u64,
    pub is_revealed: bool,
    pub rarity_score: u8,           // From Rarity Oracle
    pub tier: u8,                   // Bonding curve tier
}
```

### PriceOracle
```rust
pub struct PriceOracle {
    pub authority: Pubkey,
    pub los_market_cap_usd: u64,
    pub los_price_usd: u64,
    pub last_update: i64,
    pub is_active: bool,
}
```

---

## USER FLOW (Blind Mint → Reveal)

1. **User** connects wallet to frontend
2. **Frontend** fetches collection data from NFT Launchpad
3. **Frontend** queries Price Oracle for current $LOS price
4. **User** clicks "Mint" - pays in $LOS
5. **NFT Launchpad** mints unrevealed placeholder NFT
6. **Creator** commits reveal data (hash stored on-chain)
7. **Creator** triggers collection reveal
8. **User** clicks "Reveal My NFT"
9. **NFT Launchpad** generates random traits using reveal seed
10. **NFT Launchpad** calls Rarity Oracle to calculate rarity score
11. **Backend** detects reveal event, generates image, uploads to IPFS
12. **User** sees revealed NFT with traits and rarity

---

## TECH STACK

- **Blockchain**: Analos (Solana fork), Anchor Framework v0.29.0
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Next.js, React, Solana Web3.js, Wallet Adapter
- **Storage**: IPFS via NFT.Storage (primary) + Pinata (backup)
- **Database**: PostgreSQL (optional, for indexing)
- **Deployment**: Railway (backend), Vercel (frontend)

---

## ENVIRONMENT VARIABLES

```env
# Blockchain
ANALOS_RPC_URL=https://rpc.analos.io
ANALOS_PRICE_ORACLE=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
ANALOS_RARITY_ORACLE=H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6
ANALOS_TOKEN_LAUNCH=HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx
ANALOS_NFT_LAUNCHPAD=5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT

# IPFS
NFT_STORAGE_API_KEY=d5c39abd.4d9ac6f0985d4620bff140fb7e6bf171
PINATA_API_KEY=[YOUR_KEY]
PINATA_SECRET_KEY=[YOUR_SECRET]
```

---

## KEY FEATURES

✅ **Blind Minting** - Users mint mystery box NFTs
✅ **Commit-Reveal** - Fair randomness with hash verification
✅ **Dynamic Pricing** - USD-pegged, auto-adjusts with $LOS price
✅ **Rarity System** - 5 tiers (Common, Uncommon, Rare, Epic, Legendary)
✅ **Bonding Curves** - Progressive pricing tiers
✅ **Community Governance** - Takeover proposals and voting
✅ **Whitelist Management** - Access control for minting
✅ **Dual IPFS Upload** - Redundancy with NFT.Storage + Pinata
✅ **Advanced Rarity Calculator** - Multiple algorithms

---

## INTEGRATION PATTERNS

### Frontend → Blockchain
```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS } from '@/config/analos-programs';

const program = new Program(IDL, ANALOS_PROGRAMS.NFT_LAUNCHPAD, provider);
await program.methods.mintPlaceholder().accounts({...}).rpc();
```

### NFT Launchpad → Price Oracle (CPI)
```rust
use anchor_lang::prelude::*;

let cpi_accounts = CalculatePrice {
    price_oracle: ctx.accounts.price_oracle.to_account_info(),
};
let cpi_ctx = CpiContext::new(ctx.accounts.price_oracle_program.to_account_info(), cpi_accounts);
analos_price_oracle::cpi::calculate_los_amount_for_usd(cpi_ctx, usd_amount)?;
```

### Backend → IPFS
```typescript
import { uploadImageToIPFS, uploadMetadataToIPFS } from '@/services/ipfs-integration';

const imageResult = await uploadImageToIPFS(imageBuffer, 'nft.png');
const metadataResult = await uploadMetadataToIPFS(metadata);
```

---

## TROUBLESHOOTING

### Build Issues
- **Error**: "Solana SDK path does not exist"
  - **Fix**: Use Solana Playground or install BPF tools: `cargo install --git https://github.com/anza-xyz/platform-tools cargo-build-sbf`

### Deployment Issues
- **Error**: WebSocket connection failed
  - **Fix**: Use `--use-rpc` flag: `solana program deploy program.so --use-rpc`

### Frontend Issues
- **Error**: Program account not found
  - **Fix**: Verify RPC is set to `https://rpc.analos.io` and program IDs match

---

## DEPLOYMENT STATUS

✅ All 4 programs deployed to Analos mainnet (Oct 10, 2025)
✅ Backend routes integrated with IPFS services
✅ Frontend config files created
✅ Environment variables documented
⏳ Pinata API keys need to be added
⏳ Railway deployment pending
⏳ Frontend deployment pending

---

## NEXT STEPS

1. Get Pinata API keys from https://pinata.cloud/
2. Add env vars to Railway
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Initialize Price Oracle with $LOS market cap
6. Create first test collection
7. Test mint → reveal flow

---

## USEFUL COMMANDS

```bash
# Build all programs
cd analos-nft-launchpad
$env:HOME = $env:USERPROFILE
anchor build

# Deploy to Analos
solana config set --url https://rpc.analos.io
solana program deploy target/deploy/program.so --program-id target/deploy/program-keypair.json --use-rpc

# Start backend
cd LosLauncher/backend
npm install
npm run dev

# Start frontend
cd LosLauncher/frontend-new
npm install
npm run dev
```

---

## DOCUMENTATION FILES

For deeper understanding, read:
1. `COMPLETE-SYSTEM-ARCHITECTURE.md` - Full technical docs (This file's companion)
2. `ANALOS-DEPLOYMENT-COMPLETE.md` - Deployment details
3. `DEPLOYMENT-SUCCESS-SUMMARY.md` - Quick deployment guide
4. `ANALOS-PROGRAMS-CONFIG.env` - Environment config
5. `FINAL-DEPLOYMENT-PLAN.md` - Deployment strategy

---

**Feed this reference to AI to get instant context on the entire LosLauncher system! 🚀**

