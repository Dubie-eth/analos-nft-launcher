# 🚀 QUICKSTART - NFT Launchpad Integration

## ✅ What's Been Done

Your NFT Launchpad smart contract is **LIVE on Analos!**

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

All necessary files have been created and integrated into your existing project.

---

## 📁 New Files Added

### Smart Contract Config
- `frontend-new/src/lib/nft-launchpad-config.ts` - Configuration & types
- `frontend-new/src/lib/nft-launchpad-service.ts` - Service layer
- `frontend-new/src/lib/analos-web3-wrapper.ts` - **Updated** with new program ID

### UI Components
- `frontend-new/src/app/components/NFTLaunchpadDemo.tsx` - Full demo UI
- `frontend-new/src/app/launchpad-demo/page.tsx` - Page route

### Documentation
- `INTEGRATION-GUIDE.md` - Complete integration guide
- `QUICKSTART.md` - This file!

---

## 🎯 How to Test Right Now

### 1. Navigate to Frontend
```bash
cd frontend-new
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open Your Browser
```
http://localhost:3000/launchpad-demo
```

### 5. Connect Your Wallet
- Use Backpack or any Solana wallet
- Make sure you're on Analos network
- Have some $LOS for gas fees

### 6. Test the Features

**Initialize Collection:**
1. Fill in collection details
2. Click "Initialize Collection"
3. Approve transaction
4. Wait for confirmation

**Mint NFT:**
1. Click "Mint Placeholder"
2. Approve transaction
3. See your rarity score!

**Reveal (Admin):**
1. Click "Reveal Collection"
2. All NFTs become revealed
3. Individual reveals available

---

## 🎨 Make It Match Your Design

### Option 1: Use Demo As-Is
The demo component uses Tailwind CSS and should match your existing dark theme.

### Option 2: Customize Colors
Edit `NFTLaunchpadDemo.tsx`:

```tsx
// Find these classes and change colors:
className="bg-gradient-to-r from-purple-600 to-blue-600"
// Change to your brand colors:
className="bg-gradient-to-r from-[your-color-1] to-[your-color-2]"
```

### Option 3: Integrate Into Existing Pages
Copy the service calls from `NFTLaunchpadDemo.tsx` into your existing components:

```typescript
import { getNFTLaunchpadService } from '@/lib/nft-launchpad-service';

const service = getNFTLaunchpadService(connection);
const result = await service.mintPlaceholder(wallet, authority);
```

---

## 🔗 Add to Your Navigation

### Update Your Nav Component

Find your main navigation (probably in `layout.tsx` or a nav component) and add:

```tsx
<Link href="/launchpad-demo" className="nav-link">
  🚀 NFT Launchpad
</Link>
```

Or wherever your navigation links are defined.

---

## 📊 What the Contract Does

### 🎁 Blind Minting
Users mint "mystery box" NFTs without knowing their rarity

### 🎲 On-Chain Randomness
Each NFT gets a rarity score (0-99) determined by blockchain data

### 🎭 Reveal System
Admin can reveal all NFTs after reaching a threshold

### 💎 Rarity Tiers
- **Legendary** (0-4): 5% chance
- **Epic** (5-19): 15% chance
- **Rare** (20-49): 30% chance
- **Common** (50-99): 50% chance

### 🔐 Admin Controls
- Initialize collections
- Pause/resume minting
- Withdraw collected funds
- Update configuration
- Trigger reveals

---

## 🧪 Testing Checklist

- [ ] Frontend runs without errors
- [ ] Demo page loads at `/launchpad-demo`
- [ ] Wallet connects successfully
- [ ] Can initialize collection
- [ ] Can mint placeholder NFT
- [ ] Rarity score displays
- [ ] Can pause/resume (admin)
- [ ] Can reveal collection (admin)
- [ ] Explorer links work

---

## 🚀 Going to Production

### 1. Update Environment Variables

Create `.env.local`:

```bash
# Analos Network
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NETWORK=mainnet

# NFT Launchpad
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo

# Your Admin Wallet
NEXT_PUBLIC_ADMIN_WALLET=YourWalletAddressHere
```

### 2. Update Metadata URIs

Replace placeholder URIs with your actual IPFS/Arweave links:

```typescript
// In your collection config
placeholderUri: 'https://arweave.net/your-placeholder-metadata'
revealedUri: 'https://arweave.net/your-revealed-metadata/'
```

### 3. Test on Mainnet

- Use real $LOS (small amounts first!)
- Test all functions
- Verify on explorer
- Check metadata displays correctly

### 4. Deploy Frontend

```bash
npm run build
# Deploy to Vercel/Netlify/your host
```

---

## 🎨 Customization Ideas

### 1. Custom Mint UI
Integrate into your existing mint page:

```typescript
// frontend-new/src/app/mint/[collectionName]/page.tsx
import { getNFTLaunchpadService } from '@/lib/nft-launchpad-service';
```

### 2. Collection Gallery
Show all collections with their stats

### 3. Rarity Tracker
Display user's NFTs with their rarity tiers

### 4. Trading Interface
Build marketplace for unrevealed NFTs

### 5. Reveal Countdown
Add timer until reveal threshold

---

## 📝 Important Addresses

**Smart Contract:**
```
Program ID: FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
Network: Analos Mainnet
Explorer: https://explorer.analos.io/address/FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
```

**Source Code:**
```
Contract: analos-nft-launchpad/programs/analos-nft-launchpad/src/lib.rs
Config: frontend-new/src/lib/nft-launchpad-config.ts
Service: frontend-new/src/lib/nft-launchpad-service.ts
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Can't Connect Wallet
- Check you're on Analos network
- Verify RPC URL: https://rpc.analos.io
- Try different wallet (Backpack, Phantom)

### Transaction Fails
- Ensure sufficient $LOS balance
- Check collection is initialized
- Verify you're the authority (for admin functions)
- Check explorer for error details

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 💡 Next Steps

1. **Test locally** - Run the demo, try all features
2. **Customize UI** - Match your brand and design
3. **Create metadata** - Upload your placeholder and revealed JSONs
4. **Test on mainnet** - Small test collection first
5. **Launch!** - Promote your collection

---

## 📚 Resources

- **Full Integration Guide:** `INTEGRATION-GUIDE.md`
- **Smart Contract Code:** `analos-nft-launchpad/programs/analos-nft-launchpad/src/lib.rs`
- **Analos Docs:** https://docs.analos.io
- **Analos Explorer:** https://explorer.analos.io

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just run:

```bash
cd frontend-new
npm run dev
```

Then visit: **http://localhost:3000/launchpad-demo**

---

**Questions?** Check the `INTEGRATION-GUIDE.md` for detailed docs!

**Need help?** The code has extensive comments and error handling built in.

**Ready to customize?** All the code is ready to adapt to your design!

---

Built with ❤️ on Analos 🚀

