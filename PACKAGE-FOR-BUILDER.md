# 📦 Complete Package for Builder

## 🎁 **Everything You Need to Integrate**

Hi! Here's everything you need to integrate with the deployed Analos NFT Launchpad smart contract.

---

## 🚀 **Quick Info**

**Program ID:**
```
7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

**Network:**
- RPC: `https://rpc.analos.io`
- Explorer: `https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

**Native Token:** $LOS (1 LOS = 1,000,000,000 lamports)

---

## 📁 **Files in This Package**

### **1. Start Here:**
- 📘 **`BUILDER-QUICKSTART.md`** - Get started in 5 minutes
  - Quick setup guide
  - Copy-paste examples
  - Common issues & solutions

### **2. Complete Reference:**
- 📕 **`INTEGRATION-PACKAGE.md`** - Full API documentation
  - All 9 instructions with examples
  - Account structures
  - PDA derivation
  - Error codes
  - Event types
  - Fee calculations

### **3. Code Examples:**
- 💻 **`example-client.ts`** - Ready-to-use TypeScript client
  - Full client class implementation
  - All functions with examples
  - Helper utilities
  - Type definitions

### **4. Data Reference:**
- 📊 **`program-info.json`** - All constants in JSON
  - Program configuration
  - Fee structure
  - Instruction list
  - Error codes
  - Account structures
  - Events

### **5. Documentation:**
- 📗 **`DEPLOYMENT-SUMMARY.md`** - Deployment details
- 📙 **`TICKER-COLLISION-PREVENTION.md`** - Ticker system docs
- 📓 **`TICKER-SYSTEM-SUMMARY.md`** - Implementation details

---

## ⚡ **Super Quick Start**

### **1. Install Dependencies:**
```bash
npm install @solana/web3.js @solana/spl-token bn.js
```

### **2. Basic Setup:**
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk');
const RPC_URL = 'https://rpc.analos.io';
const connection = new Connection(RPC_URL, 'confirmed');
```

### **3. Core Functions:**

```typescript
// Check ticker availability
await checkTickerAvailability("MYTKR");

// Create collection
await initializeCollection({
  maxSupply: 10000,
  priceLOS: 0.1,
  revealThreshold: 5000,
  collectionName: "My Collection",
  collectionSymbol: "MYTKR",
  placeholderUri: "ipfs://..."
});

// Mint NFT
await mintPlaceholder({ payer, authority });

// Reveal (admin)
await revealCollection({ authority, revealedUri: "ipfs://..." });
```

---

## 🎯 **What This Contract Does**

### **Core Features:**

1. **Blind Mint & Reveal**
   - Users mint "mystery box" NFTs
   - Trade them while unrevealed
   - Admin triggers reveal when threshold is met
   - Randomized rarity/traits assigned on-chain

2. **Ticker Collision Prevention** ⭐ NEW
   - Global registry prevents duplicate symbols
   - Validates format (1-10 alphanumeric chars)
   - Case-insensitive matching
   - Admin management functions

3. **Automatic Fee Distribution**
   - 95% to creator
   - 2.5% platform fee
   - 1.5% buyback fee
   - 1.0% dev fee
   - Distributed automatically on every mint

4. **Admin Controls**
   - Pause/unpause minting
   - Update price/threshold
   - Withdraw collected funds
   - Trigger reveals

---

## 💰 **Fee Structure**

**On Every Mint:**

| Recipient | Amount | Description |
|-----------|--------|-------------|
| Creator | 95.0% | Goes to collection config PDA |
| Platform | 2.5% | Platform maintenance |
| Buyback | 1.5% | For $LOL token buybacks |
| Developer | 1.0% | Development & updates |

**Fee Wallets:**
```
Platform: 3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL
Buyback:  9tNaYj8izZGf4X4k1ywWYDHQd3z3fQpJBg6XhXUK4cEy
Dev:      FCH5FYz6uCsKsyqvDY8BdqisvK4dqLpV5RGTRsRXTd3K
```

**Example (0.1 LOS mint):**
```
Creator receives:  0.095 LOS
Platform fee:      0.0025 LOS
Buyback fee:       0.0015 LOS
Dev fee:           0.001 LOS
```

---

## 📋 **All Available Instructions**

### **User Functions:**
1. **`initialize_collection`** - Create new collection (anyone)
2. **`mint_placeholder`** - Mint mystery box NFT (anyone)
3. **`check_ticker_availability`** - Check if ticker is free (anyone)

### **Admin Functions (Collection Creator):**
4. **`reveal_collection`** - Trigger reveal
5. **`withdraw_funds`** - Withdraw collected fees
6. **`set_pause`** - Pause/unpause minting
7. **`update_config`** - Update price/threshold

### **Registry Admin Functions:**
8. **`initialize_ticker_registry`** - Setup ticker system (once)
9. **`admin_remove_ticker`** - Remove ticker (rare)

---

## 🏗️ **Account Structures**

### **CollectionConfig (PDA)**
```
Seeds: ["collection", authority_pubkey]

Fields:
- authority: Pubkey
- max_supply: u64
- current_supply: u64
- price_lamports: u64
- reveal_threshold: u64
- is_revealed: bool
- is_paused: bool
- global_seed: [u8; 32]
- collection_mint: Pubkey
- collection_name: String
- collection_symbol: String
- placeholder_uri: String
```

### **TickerRegistry (PDA)**
```
Seeds: ["ticker_registry"]

Fields:
- admin: Pubkey
- total_registered: u64
- registered_tickers: Vec<[u8; 11]>  (max 100 tickers)
```

---

## 🎨 **Ticker System Rules**

### **Valid Tickers:**
- ✅ 1-10 characters
- ✅ Alphanumeric only (A-Z, 0-9)
- ✅ Case-insensitive
- ✅ Examples: "AMB", "MYTKR", "NFT123"

### **Invalid Tickers:**
- ❌ Too short: ""
- ❌ Too long: "VERYLONGTICKER"
- ❌ Special chars: "MY-TKR", "NFT_123"
- ❌ Duplicates: Already registered

### **Best Practices:**
```typescript
// ALWAYS check before creating collection
const available = await checkTickerAvailability("MYTKR");
if (!available) {
  // Try different ticker
  throw new Error("Ticker already taken");
}

// Then create collection
await initializeCollection({ symbol: "MYTKR", ... });
```

---

## 🚨 **Error Codes**

| Code | Message | Solution |
|------|---------|----------|
| `SoldOut` | Collection sold out | Can't mint more |
| `CollectionPaused` | Minting paused | Wait for unpause |
| `AlreadyRevealed` | Already revealed | Can't reveal again |
| `ThresholdNotMet` | Not enough mints | Need more mints |
| `TickerAlreadyExists` | Ticker taken | Use different ticker |
| `InvalidTickerLength` | Length invalid | Use 1-10 chars |
| `InvalidTickerFormat` | Format invalid | Use alphanumeric only |

---

## 🧪 **Testing Flow**

### **Complete Lifecycle:**

```typescript
// 1. Setup (once, admin only)
await initializeTickerRegistry(admin);

// 2. Create Collection
const tickerOk = await checkTickerAvailability("TEST");
if (tickerOk) {
  await initializeCollection({
    maxSupply: 100,
    priceLOS: 0.01,
    revealThresholdPercent: 50,
    name: "Test Collection",
    symbol: "TEST",
    uri: "ipfs://placeholder"
  });
}

// 3. Users Mint (simulate 50+ users)
for (let i = 0; i < 50; i++) {
  await mintPlaceholder({ payer: users[i], authority });
}

// 4. Check Progress
const config = await fetchCollectionConfig(authority);
console.log(`Minted: ${config.currentSupply}/${config.maxSupply}`);

// 5. Reveal (admin, when threshold met)
if (config.currentSupply >= config.revealThreshold) {
  await revealCollection({
    authority,
    revealedUri: "ipfs://revealed/"
  });
}

// 6. Withdraw (admin)
await withdrawFunds({ authority, amountLOS: 1.0 });
```

---

## 📊 **Example Calculations**

### **Collection Setup:**
```typescript
{
  maxSupply: 10000,
  priceLOS: 0.1,
  revealThresholdPercent: 50
}

// Calculations:
priceLamports = 0.1 * 1_000_000_000 = 100_000_000
revealThreshold = 10000 * 0.5 = 5000

// At 5000 mints:
totalCollected = 5000 * 0.1 = 500 LOS
creatorGets = 500 * 0.95 = 475 LOS (in PDA)
platformFee = 500 * 0.025 = 12.5 LOS
buybackFee = 500 * 0.015 = 7.5 LOS
devFee = 500 * 0.01 = 5 LOS
```

---

## 🔐 **Security Notes**

1. **PDAs are safe** - Deterministic seeds, can't be spoofed
2. **Fees can't be bypassed** - Hardcoded in program
3. **Admin validation** - Anchor checks authority signatures
4. **Ticker validation** - Enforced on-chain
5. **Rent-exempt** - All accounts are rent-exempt

---

## 📞 **Support & Resources**

### **Need Help? Check:**
1. **`BUILDER-QUICKSTART.md`** - Quick start guide
2. **`INTEGRATION-PACKAGE.md`** - Complete API reference
3. **`example-client.ts`** - Code examples
4. **`program-info.json`** - All data in JSON

### **Explorer:**
https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk

### **Test RPC Connection:**
```bash
curl -X POST https://rpc.analos.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

---

## ✅ **Checklist for Integration**

- [ ] Read `BUILDER-QUICKSTART.md`
- [ ] Install dependencies
- [ ] Copy `example-client.ts` to your project
- [ ] Update program ID in your code
- [ ] Test ticker availability check
- [ ] Test collection creation
- [ ] Test minting
- [ ] Test reveal (when threshold met)
- [ ] Test withdrawal
- [ ] Review `program-info.json` for all constants
- [ ] Read `INTEGRATION-PACKAGE.md` for complete details

---

## 🎯 **TL;DR - Absolute Minimum**

```typescript
// Program ID
const PROGRAM_ID = '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk';

// Create collection
await initializeCollection({ /* params */ });

// Mint NFT  
await mintPlaceholder({ /* params */ });

// Reveal
await revealCollection({ /* params */ });
```

**That's it! See other files for complete details.**

---

## 📦 **Package Contents Summary**

| File | Purpose | Size |
|------|---------|------|
| `BUILDER-QUICKSTART.md` | Quick start (5 min) | Essential |
| `INTEGRATION-PACKAGE.md` | Complete API docs | Full Reference |
| `example-client.ts` | Code examples | Copy-Paste Ready |
| `program-info.json` | All constants | JSON Data |
| `DEPLOYMENT-SUMMARY.md` | Deployment info | Background |
| `TICKER-*.md` | Ticker system | Feature Docs |
| `lib.rs` | Source code | Full Program |

---

**Everything you need is in this package! Happy building! 🚀**

**Program Status:** ✅ Live on Analos Mainnet  
**Version:** 2.0 (with Ticker Collision Prevention)  
**Last Updated:** October 10, 2025

