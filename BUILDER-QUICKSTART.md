# 🚀 Builder Quick Start Guide

## ⚡ **Get Started in 5 Minutes**

### **Program ID (Copy This!):**
```
7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

### **Network:**
```
RPC: https://rpc.analos.io
Explorer: https://explorer.analos.io
```

---

## 📦 **What You're Getting**

This is a **complete NFT Launchpad** with:
- ✅ Blind mint & reveal mechanic (mystery boxes!)
- ✅ Ticker collision prevention (no duplicate symbols)
- ✅ Automatic fee distribution (5% total)
- ✅ Admin controls (pause, reveal, withdraw)
- ✅ Ready to use on Analos mainnet

---

## 🎯 **Three Files You Need**

1. **`INTEGRATION-PACKAGE.md`** - Complete guide with all functions
2. **`example-client.ts`** - Copy-paste ready TypeScript code
3. **`program-info.json`** - All data in JSON format

---

## 💻 **Quick Integration Example**

### **1. Install Dependencies:**
```bash
npm install @solana/web3.js @solana/spl-token bn.js
```

### **2. Basic Setup:**
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk');
const connection = new Connection('https://rpc.analos.io', 'confirmed');
```

### **3. Key Functions:**

#### **Create Collection:**
```typescript
// Check if ticker is available
await checkTickerAvailability("MYTKR");

// Initialize collection
await initializeCollection({
  maxSupply: 10000,
  price: 0.1,  // LOS
  revealThreshold: 50,  // %
  name: "My Collection",
  symbol: "MYTKR",
  uri: "ipfs://..."
});
```

#### **Mint NFT:**
```typescript
// Users mint mystery boxes
await mintPlaceholder({
  payer: userWallet,
  collectionAuthority: creatorPublicKey
});

// Fees automatically distributed:
// - Creator gets: 95%
// - Platform: 2.5%
// - Buyback: 1.5%
// - Dev: 1.0%
```

#### **Reveal Collection (Admin):**
```typescript
// After threshold is met
await revealCollection({
  authority: creatorWallet,
  revealedUri: "ipfs://revealed/"
});
```

---

## 🔑 **Important Addresses**

### **Fee Recipients:**
```typescript
const PLATFORM_FEE = '3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL';
const BUYBACK_FEE  = '9tNaYj8izZGf4X4k1ywWYDHQd3z3fQpJBg6XhXUK4cEy';
const DEV_FEE      = 'FCH5FYz6uCsKsyqvDY8BdqisvK4dqLpV5RGTRsRXTd3K';
```

### **PDA Seeds:**
```typescript
// Collection Config
["collection", authority_pubkey]

// Ticker Registry
["ticker_registry"]
```

---

## 💰 **Fee Breakdown**

**On every mint, fees are automatically split:**

| Recipient | Percentage | Basis Points |
|-----------|------------|--------------|
| Creator   | 95.0%      | 9500         |
| Platform  | 2.5%       | 250          |
| Buyback   | 1.5%       | 150          |
| Developer | 1.0%       | 100          |

**Example:** 0.1 LOS mint price
- Creator receives: 0.095 LOS
- Platform fee: 0.0025 LOS
- Buyback fee: 0.0015 LOS
- Dev fee: 0.001 LOS

---

## 📋 **All Available Functions**

| Function | Who Can Call | Purpose |
|----------|--------------|---------|
| `initialize_ticker_registry` | Admin (once) | Setup ticker system |
| `check_ticker_availability` | Anyone | Check if ticker is free |
| `initialize_collection` | Anyone | Create new collection |
| `mint_placeholder` | Anyone | Mint mystery box NFT |
| `reveal_collection` | Creator only | Trigger reveal |
| `withdraw_funds` | Creator only | Withdraw collected fees |
| `set_pause` | Creator only | Pause/unpause minting |
| `update_config` | Creator only | Update price/threshold |
| `admin_remove_ticker` | Admin only | Remove ticker (rare) |

---

## 🎨 **Ticker System (NEW!)**

### **Rules:**
- ✅ 1-10 characters
- ✅ Alphanumeric only (A-Z, 0-9)
- ✅ Case-insensitive ("AMB" = "amb")
- ❌ No duplicates allowed
- ❌ No special characters

### **Before Creating Collection:**
```typescript
// ALWAYS check ticker first!
const available = await checkTickerAvailability("MYTKR");
if (!available) {
  throw new Error("Ticker already taken!");
}
```

---

## 🧪 **Test It Out**

### **Quick Test on Analos:**

```bash
# 1. Check program exists
solana program show 7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk \
  --url https://rpc.analos.io

# 2. View on explorer
open https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

### **Test Collection Flow:**

```typescript
// 1. Initialize ticker registry (once)
await initializeTickerRegistry(admin);

// 2. Check ticker
const available = await checkTickerAvailability("TEST");

// 3. Create collection
await initializeCollection({
  maxSupply: 100,
  price: 0.01,
  symbol: "TEST",
  // ...
});

// 4. Mint NFT
await mintPlaceholder({ payer, authority });

// 5. Reveal (after threshold)
await revealCollection({ authority, uri: "..." });
```

---

## 🚨 **Common Issues & Solutions**

### **"Ticker already exists"**
✅ Use `checkTickerAvailability()` first  
✅ Try a different ticker symbol

### **"Collection not found"**
✅ Make sure collection is initialized  
✅ Check you're using correct authority pubkey

### **"Threshold not met"**
✅ Wait until enough NFTs are minted  
✅ Check `currentSupply >= revealThreshold`

### **"Insufficient funds"**
✅ Make sure user has enough LOS  
✅ Price includes fees (5% total)

---

## 📚 **Full Documentation**

For complete details, see:
- **`INTEGRATION-PACKAGE.md`** - Complete API reference
- **`example-client.ts`** - Full TypeScript examples
- **`program-info.json`** - All data in JSON

---

## 💡 **Pro Tips**

1. **Always initialize ticker registry first** (once, globally)
2. **Check ticker availability** before creating collection
3. **Fees are automatic** - don't try to bypass them
4. **Test on devnet first** if you're unsure
5. **Use meaningful ticker symbols** (3-5 chars recommended)

---

## 🎯 **Next Steps**

1. ✅ Copy program ID: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`
2. ✅ Read `INTEGRATION-PACKAGE.md` for details
3. ✅ Copy `example-client.ts` to your project
4. ✅ Start building!

---

## 🆘 **Need Help?**

- Check `INTEGRATION-PACKAGE.md` for detailed examples
- View `program-info.json` for all constants
- Look at `example-client.ts` for code samples
- Verify on explorer: https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk

---

**Happy Building! 🚀**

**Program Version:** 2.0 (with Ticker Collision Prevention)  
**Status:** ✅ Live on Analos Mainnet  
**Last Updated:** October 10, 2025

