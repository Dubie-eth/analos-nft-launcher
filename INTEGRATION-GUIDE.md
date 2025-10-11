# 🚀 NFT Launchpad Integration Guide

## ✅ Deployment Summary

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`  
**Network:** Analos Mainnet  
**Explorer:** https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo  
**Deployed:** October 9, 2025

---

## 📁 Files Created/Updated

### New Files

1. **`frontend-new/src/lib/nft-launchpad-config.ts`**
   - Contains all configuration constants
   - Program ID, PDAs, rarity tiers
   - Type definitions for accounts and events

2. **`frontend-new/src/lib/nft-launchpad-service.ts`**
   - Complete service layer for smart contract interaction
   - Functions for all program instructions
   - Connection management and error handling

3. **`frontend-new/src/app/components/NFTLaunchpadDemo.tsx`**
   - Full-featured demo UI component
   - Collection initialization
   - Minting interface
   - Reveal controls
   - Admin panel

### Updated Files

1. **`frontend-new/src/lib/analos-web3-wrapper.ts`**
   - Added `NFT_LAUNCHPAD` to `PROGRAM_IDS`

2. **`analos-nft-launchpad/programs/analos-nft-launchpad/src/lib.rs`**
   - Updated `declare_id!` with deployed Program ID

3. **`analos-nft-launchpad/Anchor.toml`**
   - Updated program address

---

## 🎯 Features Implemented

### Core Functionality

- ✅ **Collection Initialization**: Create NFT collections with custom parameters
- ✅ **Blind Minting**: Mint placeholder NFTs with hidden rarity
- ✅ **On-chain Randomness**: Pseudo-RNG using keccak hash
- ✅ **Rarity System**: 4-tier rarity (Legendary, Epic, Rare, Common)
- ✅ **Reveal Mechanism**: Collection-wide and individual reveals
- ✅ **Admin Controls**: Pause/resume, withdraw funds, update config
- ✅ **Fund Management**: Secure payment collection and withdrawal

### Smart Contract Instructions

1. **`initialize_collection`** - Create new NFT collection
2. **`mint_placeholder`** - Mint unrevealed NFT
3. **`reveal_collection`** - Trigger collection reveal
4. **`reveal_nft`** - Reveal individual NFT
5. **`withdraw_funds`** - Admin withdraw collected funds
6. **`set_pause`** - Pause/resume minting
7. **`update_config`** - Update collection parameters

---

## 🔧 Integration into Existing Frontend

### Step 1: Install the Demo Page

Add the demo component to your navigation:

```typescript
// frontend-new/src/app/launchpad-demo/page.tsx
import NFTLaunchpadDemo from '@/app/components/NFTLaunchpadDemo';

export default function LaunchpadDemoPage() {
  return <NFTLaunchpadDemo />;
}
```

### Step 2: Update Your Main Navigation

Add to your existing navigation menu:

```tsx
<Link href="/launchpad-demo">
  🚀 NFT Launchpad
</Link>
```

### Step 3: Use in Existing Components

Import and use the service in any component:

```typescript
import { getNFTLaunchpadService } from '@/lib/nft-launchpad-service';
import { NFT_LAUNCHPAD_PROGRAM_ID } from '@/lib/nft-launchpad-config';

// In your component
const service = getNFTLaunchpadService(connection);
const result = await service.mintPlaceholder(wallet, authorityPubkey);
```

---

## 🎨 Customization Guide

### Match Your Existing UI

The demo component uses Tailwind CSS classes that should match your existing design. Here are the key areas to customize:

**Colors:**
```tsx
// Current: Purple/Blue gradient
className="bg-gradient-to-r from-purple-600 to-blue-600"

// Change to match your theme:
className="bg-gradient-to-r from-[your-color-1] to-[your-color-2]"
```

**Layout:**
```tsx
// Current: Max-width 6xl
className="max-w-6xl mx-auto"

// Adjust to your container size
```

**Buttons:**
```tsx
// Current gradient buttons
className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"

// Change to solid colors or your brand colors
className="bg-primary hover:bg-primary-dark"
```

### Replace Demo Component with Your Design

1. **Copy the service calls** from `NFTLaunchpadDemo.tsx`
2. **Paste into your existing components**
3. **Style with your own CSS/Tailwind classes**
4. **Keep the same state management patterns**

Example integration into existing mint page:

```tsx
// frontend-new/src/app/mint/[collectionName]/page.tsx

import { getNFTLaunchpadService } from '@/lib/nft-launchpad-service';

export default function MintPage() {
  const service = getNFTLaunchpadService(connection);
  
  async function handleMint() {
    try {
      const result = await service.mintPlaceholder(wallet, collectionAuthority);
      // Your success handling
    } catch (error) {
      // Your error handling
    }
  }

  // Your existing UI with new functionality
}
```

---

## 📊 Data Flow

### Collection Initialization
```
User Wallet → initializeCollection()
  ↓
Creates CollectionConfig PDA
  ↓
Stores: authority, supply, price, seeds, metadata
```

### Minting Flow
```
User clicks Mint → mintPlaceholder()
  ↓
Transfers payment to CollectionConfig
  ↓
Creates MintRecord PDA
  ↓
Generates rarity score (0-99)
  ↓
Emits MintEvent
```

### Reveal Flow
```
Admin triggers → revealCollection()
  ↓
Updates CollectionConfig.isRevealed = true
  ↓
Updates placeholderUri to revealed URI
  ↓
Emits RevealEvent
```

---

## 🔐 Security Considerations

### Admin Functions

Only the collection authority can:
- Initialize collections
- Reveal collections
- Withdraw funds
- Pause/resume minting
- Update configuration

### User Protection

- Funds held in PDA until withdrawal
- Minimum balance enforced (rent-exempt)
- Supply limits enforced on-chain
- Duplicate prevention via PDAs

---

## 🚀 Next Steps

### 1. Test the Integration

```bash
cd frontend-new
npm install
npm run dev
```

Visit: `http://localhost:3000/launchpad-demo`

### 2. Create Your First Collection

1. Connect your wallet (must have $LOS)
2. Fill in collection details
3. Click "Initialize Collection"
4. Wait for confirmation

### 3. Test Minting

1. Click "Mint Placeholder"
2. Approve transaction
3. View your rarity score
4. Check mint record on explorer

### 4. Integrate into Your Design

- Copy relevant functions
- Style to match your brand
- Add to existing pages
- Test thoroughly

---

## 📚 API Reference

### NFTLaunchpadService Methods

```typescript
// Initialize collection
initializeCollection(wallet, config): Promise<{signature, collectionConfig}>

// Mint placeholder
mintPlaceholder(wallet, authority): Promise<{signature, mintRecord, rarityScore}>

// Reveal collection
revealCollection(wallet, revealedUri): Promise<string>

// Reveal individual NFT
revealNFT(wallet, authority, mintIndex): Promise<string>

// Withdraw funds
withdrawFunds(wallet, amount): Promise<string>

// Pause/resume
setPause(wallet, paused): Promise<string>

// Get collection data
getCollectionConfig(authority): Promise<CollectionConfig | null>

// Get mint record
getMintRecord(authority, mintIndex): Promise<MintRecord | null>
```

---

## 🐛 Troubleshooting

### Common Issues

**"Collection not found"**
- Ensure collection is initialized
- Check authority pubkey matches

**"Insufficient funds"**
- User needs enough $LOS for mint price + transaction fees
- Check balance: `connection.getBalance(publicKey)`

**"Threshold not met"**
- Reveal requires minimum mints (revealThreshold)
- Check currentSupply >= revealThreshold

**Transaction fails**
- Check RPC connection
- Ensure wallet has funds
- Verify program ID is correct

---

## 📞 Support

- **GitHub Issues**: Create an issue in your repository
- **Discord**: Join Analos community
- **Docs**: https://docs.analos.io

---

## ✨ Credits

Built with:
- Anchor Framework
- Solana Web3.js
- React / Next.js
- Tailwind CSS
- Deployed on Analos Mainnet

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

---

🎉 **Congratulations!** Your NFT Launchpad is ready to use!

