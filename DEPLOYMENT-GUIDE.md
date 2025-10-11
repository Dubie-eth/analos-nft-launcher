# 🚀 Analos NFT Launchpad - Complete Deployment Guide

This guide walks you through the complete deployment process from start to finish.

## 📋 Pre-Deployment Checklist

### 1. Development Environment
- [ ] Rust installed (version 1.70+)
- [ ] Solana CLI installed (version 1.17+)
- [ ] Anchor CLI installed (version 0.29.0)
- [ ] Node.js installed (version 16+)
- [ ] Git initialized

### 2. Wallet Setup
```bash
# Generate Analos wallet
solana-keygen new --outfile ~/.config/analos/id.json

# Save your seed phrase securely!

# Configure for Analos
solana config set --url https://rpc.analos.io
solana config set --keypair ~/.config/analos/id.json

# Verify
solana address
```

### 3. Fund Wallet
- [ ] Acquire $LOS tokens (minimum 5 LOS recommended)
- [ ] Bridge from Solana or buy on Analos DEX
- [ ] Verify balance: `solana balance`

### 4. Prepare Assets

#### A. Images
Upload to IPFS/Arweave:
- [ ] Placeholder mystery box image
- [ ] 10,000 unique revealed NFT images
- [ ] Collection logo

Recommended services:
- **Arweave**: Permanent storage (use Bundlr)
- **IPFS**: via Pinata, NFT.Storage, or Web3.Storage

```bash
# Example with Pinata CLI
pinata upload placeholder-mystery-box.png
pinata upload revealed-folder/
```

#### B. Metadata
- [ ] Generate metadata using `metadata-generator.ts`
- [ ] Update placeholder URI
- [ ] Update revealed base URI
- [ ] Upload to IPFS/Arweave

```bash
# Generate metadata
ts-node app/metadata-generator.ts

# Upload to IPFS
pinata upload metadata/placeholder/
pinata upload metadata/revealed/
```

## 🔨 Build & Deploy

### Step 1: Install Dependencies
```bash
cd analos-nft-launchpad
npm install
```

### Step 2: Configure Collection Parameters

Edit `scripts/initialize-collection.ts`:
```typescript
const CONFIG = {
  maxSupply: 10000,              // Your collection size
  mintPrice: 0.1 * LAMPORTS_PER_SOL,  // Price per mint
  revealThreshold: 5000,         // 50% for reveal
  collectionName: "Your Collection Name",
  collectionSymbol: "SYMBOL",
  placeholderUri: "https://arweave.net/YOUR_PLACEHOLDER_URI",
};
```

### Step 3: Build Program
```bash
# Build the Anchor program
anchor build

# Verify build
ls -la target/deploy/
```

### Step 4: Deploy to Analos
```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

**Expected Output:**
```
✅ Program deployed successfully!
Program ID: ABC123...
```

### Step 5: Initialize Collection
```bash
# Run initialization script
ts-node scripts/initialize-collection.ts
```

This will:
1. Create Merkle tree for compressed NFTs
2. Initialize collection configuration
3. Set all parameters
4. Save `collection-info.json`

### Step 6: Verify Deployment
```bash
# Check program on explorer
# Visit: https://explorer.analos.io/address/<PROGRAM_ID>

# Verify collection config
anchor run verify-collection
```

## 🎨 Frontend Deployment

### Option 1: Next.js App

```bash
# Create Next.js app
npx create-next-app@latest my-nft-launchpad --typescript --tailwind

cd my-nft-launchpad

# Install dependencies
npm install @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @coral-xyz/anchor \
  @solana/web3.js \
  @solana/spl-account-compression

# Copy UI components
cp ../app/mint-ui-example.tsx ./components/MintUI.tsx
cp ../app/wallet-provider-setup.tsx ./components/WalletProvider.tsx

# Copy IDL
cp ../target/idl/analos_nft_launchpad.json ./idl/
```

Update `app/page.tsx`:
```tsx
import { WalletContextProvider } from '@/components/WalletProvider';
import MintUI from '@/components/MintUI';

export default function Home() {
  return (
    <WalletContextProvider>
      <MintUI />
    </WalletContextProvider>
  );
}
```

Update `next.config.js`:
```javascript
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false
    };
    return config;
  },
};
```

Deploy to Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: React + Vite

```bash
# Create Vite app
npm create vite@latest my-nft-launchpad -- --template react-ts

cd my-nft-launchpad
npm install

# Install wallet adapter
npm install @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @coral-xyz/anchor

# Copy components
cp ../app/mint-ui-example.tsx ./src/components/
cp ../app/wallet-provider-setup.tsx ./src/components/
cp ../target/idl/analos_nft_launchpad.json ./src/

# Build and deploy
npm run build
```

## 🔧 Post-Deployment Configuration

### 1. Update Frontend Constants

In your `MintUI` component:
```typescript
const PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');
const COLLECTION_AUTHORITY = new PublicKey('YOUR_AUTHORITY_PUBKEY');
```

### 2. Set Up Indexer

For production, use Helius or similar indexer to fetch compressed NFT proofs:

```typescript
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY", "mainnet-beta");

// Fetch NFT proof for updates
async function getAssetProof(assetId: string) {
  return await helius.rpc.getAssetProof({ id: assetId });
}
```

### 3. Configure Analytics

Add analytics to track:
- Mint transactions
- Wallet connections
- Reveal events
- Secondary sales

### 4. Set Up Monitoring

Monitor your collection:
```bash
# Watch program logs
solana logs <PROGRAM_ID> --url https://rpc.analos.io

# Monitor account changes
solana account <COLLECTION_CONFIG_PDA> --url https://rpc.analos.io
```

## 🎯 Launch Day Operations

### Pre-Launch (1 hour before)
- [ ] Verify mint price is correct
- [ ] Test mint with a test wallet
- [ ] Verify metadata URIs are accessible
- [ ] Check wallet has LOS for any admin actions
- [ ] Announce on social media
- [ ] Prepare FAQ document

### During Launch
- [ ] Monitor transaction success rate
- [ ] Watch for errors in logs
- [ ] Track mint progress
- [ ] Respond to community questions
- [ ] Be ready to pause if issues arise

### Emergency Controls
```bash
# Pause minting (if issues)
anchor run pause-collection

# Update price (if needed)
anchor run update-price -- --new-price 150000000

# Resume minting
anchor run unpause-collection
```

## 🎊 Reveal Process

### Automatic Reveal (at threshold)
```bash
# Check if threshold met
anchor run check-threshold

# Trigger reveal
ts-node scripts/reveal-collection.ts
```

### Manual Reveal (admin triggered)
```bash
# Force reveal (only after threshold)
anchor run force-reveal
```

### Batch Update Metadata
```bash
# Update all NFT metadata with revealed traits
# This can take time for large collections
ts-node scripts/batch-update-metadata.ts
```

**Note**: Metadata updates require fetching Merkle proofs for each NFT. Use an indexer service for efficiency.

## 💰 Revenue Management

### Withdraw Funds
```bash
# Check collection balance
anchor run check-balance

# Withdraw (specify amount in lamports)
anchor run withdraw-funds -- --amount 10000000000  # 10 LOS
```

### Royalty Setup
Royalties are enforced at the program level (5% by default). Ensure your marketplace integration supports Metaplex royalty standards.

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Insufficient funds"
```bash
# Solution: Fund wallet with more LOS
solana balance
# Transfer more LOS to wallet
```

**Issue**: "Tree account doesn't exist"
```bash
# Solution: Ensure tree was created in initialize step
# Check tree account exists:
solana account <MERKLE_TREE_PUBKEY> --url https://rpc.analos.io
```

**Issue**: "Transaction too large"
```bash
# Solution: For batch updates, reduce batch size
# Update in smaller batches of 50-100 NFTs
```

**Issue**: "Invalid proof"
```bash
# Solution: Ensure you're fetching the latest Merkle proof
# Use a reliable indexer (Helius, TheGraph)
```

## 📊 Analytics & Monitoring

### Track Collection Stats
```typescript
// Fetch collection data
const config = await program.account.collectionConfig.fetch(configPDA);

console.log({
  minted: config.currentSupply.toNumber(),
  remaining: config.maxSupply.toNumber() - config.currentSupply.toNumber(),
  revealed: config.isRevealed,
  revenue: config.currentSupply * config.priceLamports / LAMPORTS_PER_SOL,
});
```

### Set Up Webhooks
Use Helius webhooks to get notified of:
- New mints
- NFT transfers
- Metadata updates

## 🎓 Best Practices

1. **Test on Devnet First**: Always test full flow on devnet
2. **Backup Keys**: Keep multiple secure backups of your keypair
3. **Rate Limiting**: Implement rate limiting on frontend
4. **Error Handling**: Graceful error messages for users
5. **Gas Estimation**: Always estimate transaction costs
6. **Monitoring**: Set up alerts for unusual activity
7. **Community**: Keep community informed throughout process

## 📚 Additional Resources

- [Metaplex Docs](https://docs.metaplex.com)
- [Analos Docs](https://docs.analos.io)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)

## 🆘 Support

If you encounter issues:
1. Check logs: `solana logs <PROGRAM_ID>`
2. Review explorer: `https://explorer.analos.io`
3. Consult documentation
4. Ask in Analos Discord/community

---

**Good luck with your launch! 🚀**

