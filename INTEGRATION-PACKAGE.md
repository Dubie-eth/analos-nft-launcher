# 🚀 Analos NFT Launchpad - Complete Integration Package

## 📦 **For Developers/Builders Integrating This Contract**

**Program ID:** `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`  
**Network:** Analos Mainnet (Solana Fork)  
**RPC URL:** `https://rpc.analos.io`  
**Explorer:** `https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

---

## 🎯 **Quick Start**

### **1. Basic Setup**

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

// Program Configuration
const PROGRAM_ID = new PublicKey('7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk');
const RPC_URL = 'https://rpc.analos.io';
const connection = new Connection(RPC_URL, 'confirmed');

// Native Token: $LOS (1 LOS = 1,000,000,000 lamports)
const LAMPORTS_PER_LOS = 1_000_000_000;
```

### **2. Key Constants**

```typescript
// Fee Distribution (Automatic on Each Mint)
const FEE_PLATFORM_BPS = 250;   // 2.5%
const FEE_BUYBACK_BPS = 150;    // 1.5%
const FEE_DEV_BPS = 100;        // 1.0%
const FEE_TOTAL_BPS = 500;      // 5.0% total

// Fee Recipient Wallets
const PLATFORM_FEE_WALLET = new PublicKey('3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL');
const BUYBACK_FEE_WALLET = new PublicKey('9tNaYj8izZGf4X4k1ywWYDHQd3z3fQpJBg6XhXUK4cEy');
const DEV_FEE_WALLET = new PublicKey('FCH5FYz6uCsKsyqvDY8BdqisvK4dqLpV5RGTRsRXTd3K');

// Royalties
const ROYALTY_BASIS_POINTS = 500; // 5%

// Ticker System
const MAX_TICKER_LENGTH = 10;
const MIN_TICKER_LENGTH = 1;
```

---

## 📋 **All Available Instructions**

### **1. Initialize Collection**
Creates a new NFT collection with blind mint capability.

```typescript
// Instruction: initialize_collection
// Accounts needed:
{
  collection_config: PDA,      // [seeds: ["collection", authority.key()]]
  collection_mint: Keypair,    // New mint for collection
  ticker_registry: PDA,        // [seeds: ["ticker_registry"]]
  authority: Signer,           // Collection creator
  system_program: PublicKey,
  token_program: PublicKey,
  rent: PublicKey
}

// Parameters:
{
  max_supply: u64,            // Maximum NFTs in collection
  price_lamports: u64,        // Mint price (e.g., 100000000 = 0.1 LOS)
  reveal_threshold: u64,      // Mints needed before reveal
  collection_name: string,    // e.g., "Analos Mystery Box"
  collection_symbol: string,  // e.g., "AMB" (1-10 chars, alphanumeric)
  placeholder_uri: string     // IPFS URI for pre-reveal metadata
}
```

**Example Call:**
```typescript
const [collectionConfig] = await PublicKey.findProgramAddress(
  [Buffer.from('collection'), authority.publicKey.toBuffer()],
  PROGRAM_ID
);

const [tickerRegistry] = await PublicKey.findProgramAddress(
  [Buffer.from('ticker_registry')],
  PROGRAM_ID
);

await program.methods
  .initializeCollection(
    new BN(10000),              // max_supply
    new BN(100_000_000),        // price: 0.1 LOS
    new BN(5000),               // reveal_threshold: 50%
    "Analos Mystery Box",       // collection_name
    "AMB",                      // collection_symbol
    "ipfs://placeholder-uri"    // placeholder_uri
  )
  .accounts({
    collectionConfig,
    collectionMint: collectionMint.publicKey,
    tickerRegistry,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY
  })
  .signers([authority, collectionMint])
  .rpc();
```

---

### **2. Mint Placeholder NFT**
Users mint a "mystery box" NFT before reveal.

```typescript
// Instruction: mint_placeholder
// Accounts needed:
{
  collection_config: PDA,      // [seeds: ["collection", authority]]
  nft_mint: Keypair,          // New mint for this NFT
  token_account: PDA,         // User's token account
  metadata: PDA,              // Metaplex metadata account
  platform_fee_wallet: PublicKey,
  buyback_fee_wallet: PublicKey,
  dev_fee_wallet: PublicKey,
  payer: Signer,
  metadata_program: PublicKey,
  token_program: PublicKey,
  associated_token_program: PublicKey,
  system_program: PublicKey,
  rent: PublicKey
}

// No parameters (uses config from collection)
```

**Example Call:**
```typescript
const nftMint = Keypair.generate();
const userTokenAccount = await getAssociatedTokenAddress(
  nftMint.publicKey,
  payer.publicKey
);

const [metadata] = await PublicKey.findProgramAddress(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    nftMint.publicKey.toBuffer()
  ],
  METADATA_PROGRAM_ID
);

await program.methods
  .mintPlaceholder()
  .accounts({
    collectionConfig,
    nftMint: nftMint.publicKey,
    tokenAccount: userTokenAccount,
    metadata,
    platformFeeWallet: PLATFORM_FEE_WALLET,
    buybackFeeWallet: BUYBACK_FEE_WALLET,
    devFeeWallet: DEV_FEE_WALLET,
    payer: payer.publicKey,
    metadataProgram: METADATA_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY
  })
  .signers([payer, nftMint])
  .rpc();
```

---

### **3. Reveal Collection**
Triggers the reveal process (admin only).

```typescript
// Instruction: reveal_collection
// Accounts needed:
{
  collection_config: PDA,
  authority: Signer           // Must be collection creator
}

// Parameters:
{
  revealed_base_uri: string   // Base URI for revealed metadata
}
```

**Example Call:**
```typescript
await program.methods
  .revealCollection("ipfs://revealed-base-uri/")
  .accounts({
    collectionConfig,
    authority: authority.publicKey
  })
  .signers([authority])
  .rpc();
```

---

### **4. Withdraw Funds**
Admin withdraws collected funds (admin only).

```typescript
// Instruction: withdraw_funds
// Accounts needed:
{
  collection_config: PDA,
  authority: Signer
}

// Parameters:
{
  amount: u64                 // Lamports to withdraw
}
```

**Example Call:**
```typescript
await program.methods
  .withdrawFunds(new BN(1_000_000_000))  // 1 LOS
  .accounts({
    collectionConfig,
    authority: authority.publicKey
  })
  .signers([authority])
  .rpc();
```

---

### **5. Set Pause**
Pause/unpause minting (admin only).

```typescript
// Instruction: set_pause
// Accounts needed:
{
  collection_config: PDA,
  authority: Signer
}

// Parameters:
{
  paused: bool
}
```

**Example Call:**
```typescript
await program.methods
  .setPause(true)  // true = pause, false = unpause
  .accounts({
    collectionConfig,
    authority: authority.publicKey
  })
  .signers([authority])
  .rpc();
```

---

### **6. Update Config**
Update collection parameters (admin only).

```typescript
// Instruction: update_config
// Accounts needed:
{
  collection_config: PDA,
  authority: Signer
}

// Parameters:
{
  new_price: Option<u64>,            // null or new price
  new_reveal_threshold: Option<u64>  // null or new threshold
}
```

**Example Call:**
```typescript
await program.methods
  .updateConfig(
    { some: new BN(200_000_000) },  // new price: 0.2 LOS
    null                             // keep existing threshold
  )
  .accounts({
    collectionConfig,
    authority: authority.publicKey
  })
  .signers([authority])
  .rpc();
```

---

### **7. Initialize Ticker Registry**
Initialize global ticker registry (admin only, once).

```typescript
// Instruction: initialize_ticker_registry
// Accounts needed:
{
  ticker_registry: PDA,       // [seeds: ["ticker_registry"]]
  admin: Signer,             // Registry admin
  system_program: PublicKey
}

// No parameters
```

**Example Call:**
```typescript
const [tickerRegistry] = await PublicKey.findProgramAddress(
  [Buffer.from('ticker_registry')],
  PROGRAM_ID
);

await program.methods
  .initializeTickerRegistry()
  .accounts({
    tickerRegistry,
    admin: admin.publicKey,
    systemProgram: SystemProgram.programId
  })
  .signers([admin])
  .rpc();
```

---

### **8. Check Ticker Availability**
Check if a ticker symbol is available.

```typescript
// Instruction: check_ticker_availability
// Accounts needed:
{
  ticker_registry: PDA
}

// Parameters:
{
  ticker: string
}
```

**Example Call:**
```typescript
try {
  await program.methods
    .checkTickerAvailability("AMB")
    .accounts({
      tickerRegistry
    })
    .rpc();
  console.log("✅ Ticker is available!");
} catch (error) {
  console.log("❌ Ticker already taken or invalid");
}
```

---

### **9. Admin Remove Ticker**
Remove a ticker from registry (admin only).

```typescript
// Instruction: admin_remove_ticker
// Accounts needed:
{
  ticker_registry: PDA,
  admin: Signer
}

// Parameters:
{
  ticker: string
}
```

**Example Call:**
```typescript
await program.methods
  .adminRemoveTicker("OLDTKR")
  .accounts({
    tickerRegistry,
    admin: admin.publicKey
  })
  .signers([admin])
  .rpc();
```

---

## 🏗️ **Account Structures**

### **CollectionConfig (PDA)**
```rust
{
  authority: Pubkey,          // Collection creator/admin
  max_supply: u64,           // Maximum NFTs
  current_supply: u64,       // Currently minted
  price_lamports: u64,       // Mint price
  reveal_threshold: u64,     // Mints needed for reveal
  is_revealed: bool,         // Has been revealed
  is_paused: bool,          // Minting paused
  global_seed: [u8; 32],    // Random seed
  collection_mint: Pubkey,   // Collection mint address
  collection_name: String,   // Collection name
  collection_symbol: String, // Collection ticker
  placeholder_uri: String    // Pre-reveal metadata URI
}
```

**PDA Derivation:**
```typescript
const [collectionConfig, bump] = await PublicKey.findProgramAddress(
  [
    Buffer.from('collection'),
    authorityPublicKey.toBuffer()
  ],
  PROGRAM_ID
);
```

---

### **TickerRegistry (PDA)**
```rust
{
  admin: Pubkey,                      // Registry admin
  total_registered: u64,              // Total tickers
  registered_tickers: Vec<[u8; 11]>   // List of tickers (max 100)
}
```

**PDA Derivation:**
```typescript
const [tickerRegistry, bump] = await PublicKey.findProgramAddress(
  [Buffer.from('ticker_registry')],
  PROGRAM_ID
);
```

---

## 🎨 **Fee Calculation Examples**

### **Minting Fee Breakdown**

```typescript
// Example: 0.1 LOS mint price
const mintPrice = 100_000_000; // lamports

// Creator receives (95%)
const creatorAmount = mintPrice * 9500 / 10000;  // 95,000,000 lamports

// Fee distribution (5% total)
const platformFee = mintPrice * 250 / 10000;     // 2,500,000 lamports (2.5%)
const buybackFee = mintPrice * 150 / 10000;      // 1,500,000 lamports (1.5%)
const devFee = mintPrice * 100 / 10000;          // 1,000,000 lamports (1.0%)

console.log(`Creator gets: ${creatorAmount / LAMPORTS_PER_LOS} LOS`);
console.log(`Platform fee: ${platformFee / LAMPORTS_PER_LOS} LOS`);
console.log(`Buyback fee: ${buybackFee / LAMPORTS_PER_LOS} LOS`);
console.log(`Dev fee: ${devFee / LAMPORTS_PER_LOS} LOS`);
```

Output:
```
Creator gets: 0.095 LOS
Platform fee: 0.0025 LOS
Buyback fee: 0.0015 LOS
Dev fee: 0.001 LOS
```

---

## 🚨 **Error Codes**

```rust
ErrorCode::SoldOut                // Collection sold out
ErrorCode::CollectionPaused       // Minting is paused
ErrorCode::AlreadyRevealed        // Already revealed
ErrorCode::ThresholdNotMet        // Not enough mints for reveal
ErrorCode::InsufficientFunds      // Not enough funds to withdraw
ErrorCode::InvalidThreshold       // Invalid threshold value
ErrorCode::TickerAlreadyExists    // Ticker already registered
ErrorCode::InvalidTickerLength    // Ticker too short/long
ErrorCode::InvalidTickerFormat    // Ticker not alphanumeric
```

**Handling Errors:**
```typescript
try {
  await program.methods.initializeCollection(/* ... */).rpc();
} catch (error) {
  if (error.message.includes('TickerAlreadyExists')) {
    console.error('This ticker is already taken!');
  } else if (error.message.includes('InvalidTickerFormat')) {
    console.error('Ticker must be alphanumeric only!');
  }
}
```

---

## 📊 **Events Emitted**

### **MintEvent**
```rust
{
  mint_index: u64,
  minter: Pubkey,
  nft_mint: Pubkey,
  timestamp: i64
}
```

### **RevealEvent**
```rust
{
  timestamp: i64,
  total_minted: u64,
  revealed_base_uri: String
}
```

### **FeeCollectionEvent**
```rust
{
  mint_index: u64,
  total_payment: u64,
  creator_payment: u64,
  platform_fee: u64,
  buyback_fee: u64,
  dev_fee: u64,
  timestamp: i64
}
```

### **Ticker Events**
```rust
TickerRegisteredEvent { /* ... */ }
TickerAvailabilityCheckedEvent { /* ... */ }
TickerRemovedEvent { /* ... */ }
TickerRegistryInitializedEvent { /* ... */ }
```

**Listening for Events:**
```typescript
const listener = connection.onLogs(
  PROGRAM_ID,
  (logs) => {
    console.log('Transaction logs:', logs);
  },
  'confirmed'
);
```

---

## 🧪 **Testing Flow**

### **Complete Collection Lifecycle:**

```typescript
// 1. Initialize ticker registry (once, admin only)
await initializeTickerRegistry();

// 2. Check ticker availability
await checkTickerAvailability("MYTKR");

// 3. Initialize collection
await initializeCollection({
  maxSupply: 10000,
  price: 0.1,
  symbol: "MYTKR"
});

// 4. Mint NFTs (users)
for (let i = 0; i < 100; i++) {
  await mintPlaceholder();
}

// 5. Check if reveal threshold met
const config = await fetchCollectionConfig();
if (config.currentSupply >= config.revealThreshold) {
  // 6. Reveal collection (admin)
  await revealCollection("ipfs://revealed/");
}

// 7. Withdraw funds (admin)
await withdrawFunds(amountToWithdraw);
```

---

## 🔐 **Security Considerations**

### **Admin Functions:**
- Only collection creator can:
  - Reveal collection
  - Withdraw funds
  - Pause/unpause
  - Update config

### **Ticker Registry:**
- Only registry admin can:
  - Initialize registry
  - Remove tickers

### **Validation:**
- Ticker: 1-10 alphanumeric characters
- Price: Must be > 0
- Threshold: Must be ≤ max_supply
- Fees: Automatically distributed (cannot be bypassed)

### **PDAs:**
- All PDAs use deterministic seeds
- Cannot be spoofed or manipulated
- Built-in Anchor validation

---

## 📦 **Dependencies Needed**

```json
{
  "dependencies": {
    "@solana/web3.js": "^1.78.0",
    "@solana/spl-token": "^0.3.8",
    "@metaplex-foundation/mpl-token-metadata": "^2.10.0",
    "@project-serum/anchor": "^0.28.0",
    "bn.js": "^5.2.1"
  }
}
```

---

## 🌐 **Network Configuration**

### **Analos Mainnet:**
```typescript
{
  rpcUrl: 'https://rpc.analos.io',
  wsUrl: 'wss://rpc.analos.io',
  explorerUrl: 'https://explorer.analos.io',
  nativeToken: 'LOS',
  lamportsPerToken: 1_000_000_000,
  commitment: 'confirmed'
}
```

### **Testing:**
```bash
# Check RPC connection
curl -X POST https://rpc.analos.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check program
solana program show 7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk \
  --url https://rpc.analos.io
```

---

## 🎯 **Quick Reference**

### **Program ID:**
```
7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

### **Fee Wallets:**
```
Platform: 3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL
Buyback:  9tNaYj8izZGf4X4k1ywWYDHQd3z3fQpJBg6XhXUK4cEy
Dev:      FCH5FYz6uCsKsyqvDY8BdqisvK4dqLpV5RGTRsRXTd3K
```

### **PDA Seeds:**
```
Collection Config: ["collection", authority_pubkey]
Ticker Registry:   ["ticker_registry"]
```

---

## 📞 **Support & Resources**

- **Program Source:** `programs/analos-nft-launchpad/src/lib.rs`
- **Deployment Guide:** `DEPLOYMENT-SUMMARY.md`
- **Ticker System:** `TICKER-COLLISION-PREVENTION.md`
- **Explorer:** https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk

---

**Last Updated:** October 10, 2025  
**Program Version:** 2.0 (with Ticker Collision Prevention)  
**Status:** ✅ Deployed & Live on Analos Mainnet

