# 🎭 Analos NFT Launchpad - Blind Mint & Reveal

A production-ready NFT launchpad for Analos (Solana fork) featuring **blind mint and reveal mechanics** using Metaplex Bubblegum for ultra-cheap compressed NFTs (cNFTs). Perfect for hyped NFT launches with mystery boxes that can be traded before reveal!

## 🌟 Features

- ✨ **Blind Mint Mechanic**: Users mint placeholder "mystery box" cNFTs
- 🔀 **Randomized Reveal**: On-chain pseudo-RNG assigns rare traits after threshold
- 💰 **Ultra-Low Cost**: ~$0.0001 per mint using Merkle tree compression (Bubblegum)
- 🎯 **Fair Rarity System**: Legendary (5%), Epic (15%), Rare (30%), Common (50%)
- 🛡️ **Admin Controls**: Pause, withdraw, update pricing, trigger reveals
- 🔄 **Pre-Reveal Trading**: cNFTs can be bought/sold before traits are revealed
- 📊 **Event Emission**: All actions emit events for off-chain indexing
- 💎 **5% Royalties**: Built-in creator royalties on secondary sales

## 🏗️ Architecture

### Smart Contract Stack
- **Program**: Rust + Anchor framework
- **NFT Compression**: Metaplex Bubblegum (mpl-bubblegum)
- **Storage**: Merkle trees via SPL Account Compression
- **Randomness**: Keccak hash-based pseudo-RNG
- **Network**: Analos (Solana fork) - full compatibility

### Key Accounts
- `CollectionConfig` - PDA storing collection parameters, supply, reveal state
- `MerkleTree` - Compressed NFT storage (supports 16,384 NFTs at depth 14)
- `TreeAuthority` - Bubblegum-controlled authority for tree operations

### Instructions
1. `initialize_collection` - Create collection with Merkle tree
2. `mint_placeholder` - Mint mystery box cNFT (user pays in $LOS)
3. `reveal_collection` - Trigger reveal after threshold met
4. `update_nft_metadata` - Batch update individual NFTs with revealed traits
5. `withdraw_funds` - Admin withdraw collected funds
6. `set_pause` - Pause/unpause minting
7. `update_config` - Update price or reveal threshold

## 🚀 Quick Start

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI (configured for Analos)
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Install Node.js dependencies
npm install
```

### Generate Analos Wallet
```bash
# Create new wallet for Analos
solana-keygen new --outfile ~/.config/analos/id.json

# Configure Solana CLI for Analos
solana config set --url https://rpc.analos.io
solana config set --keypair ~/.config/analos/id.json

# Check balance (fund via Analos bridge)
solana balance
```

### Build & Test
```bash
# Build the program
anchor build

# Run tests (requires funded wallet)
anchor test --skip-local-validator

# Or test locally with Amman
anchor test
```

### Deploy to Analos Mainnet
```bash
# Build for mainnet
anchor build --provider.cluster mainnet

# Deploy (ensure wallet is funded with $LOS)
anchor deploy \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --provider.wallet ~/.config/analos/id.json

# Initialize IDL for JS clients
anchor idl init <PROGRAM_ID> \
  --provider.cluster mainnet \
  --provider.url https://rpc.analos.io \
  --filepath target/idl/analos_nft_launchpad.json
```

### Verify Deployment
Visit Analos Explorer: `https://explorer.analos.io/address/<PROGRAM_ID>`

## 📝 Usage Guide

### 1. Initialize Collection
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnalosNftLaunchpad } from "./target/types/analos_nft_launchpad";

const program = anchor.workspace.AnalosNftLaunchpad as Program<AnalosNftLaunchpad>;

// Create Merkle tree (one-time setup)
const merkleTree = anchor.web3.Keypair.generate();
const [treeAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
  [merkleTree.publicKey.toBuffer()],
  BUBBLEGUM_PROGRAM_ID
);

// Initialize collection
await program.methods
  .initializeCollection(
    new BN(10000),              // max supply
    new BN(0.1 * LAMPORTS_PER_SOL), // price per mint
    new BN(5000),               // reveal threshold (50%)
    "My NFT Collection",        // name
    "MYNFT",                    // symbol
    "https://arweave.net/placeholder.json" // placeholder URI
  )
  .accounts({
    collectionConfig: collectionConfigPDA,
    merkleTree: merkleTree.publicKey,
    treeAuthority: treeAuthority,
    collectionMint: collectionMint.publicKey,
    authority: wallet.publicKey,
  })
  .signers([merkleTree, collectionMint])
  .rpc();
```

### 2. Mint Placeholder NFT
```typescript
await program.methods
  .mintPlaceholder()
  .accounts({
    collectionConfig: collectionConfigPDA,
    merkleTree: merkleTree.publicKey,
    treeAuthority: treeAuthority,
    payer: user.publicKey,
    bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
    logWrapper: SPL_NOOP_PROGRAM_ID,
    compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  })
  .signers([user])
  .rpc();
```

### 3. Reveal Collection
```typescript
await program.methods
  .revealCollection("https://arweave.net/revealed/")
  .accounts({
    collectionConfig: collectionConfigPDA,
    authority: authority.publicKey,
  })
  .rpc();
```

### 4. Update Individual NFT Metadata (Post-Reveal)
```typescript
// Requires Merkle proof from indexer (Helius/SimpleHash)
const proof = await fetchAssetProof(mintIndex);

await program.methods
  .updateNftMetadata(
    new BN(mintIndex),
    proof.root,
    proof.data_hash,
    proof.creator_hash,
    new BN(proof.nonce),
    proof.index
  )
  .accounts({
    collectionConfig: collectionConfigPDA,
    merkleTree: merkleTree.publicKey,
    treeAuthority: treeAuthority,
    leafOwner: ownerPublicKey,
    authority: authority.publicKey,
  })
  .rpc();
```

## 🎨 Metadata Structure

### Placeholder (Before Reveal)
```json
{
  "name": "Analos Mystery #123",
  "symbol": "ANAL",
  "description": "A mysterious NFT waiting to be revealed...",
  "image": "https://arweave.net/mystery-box.png",
  "attributes": [
    {
      "trait_type": "Status",
      "value": "Unrevealed"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://arweave.net/mystery-box.png",
        "type": "image/png"
      }
    ],
    "category": "image",
    "revealed": false
  }
}
```

### Revealed (After Trigger)
```json
{
  "name": "Analos Mystery #123",
  "symbol": "ANAL",
  "description": "A legendary NFT from the Analos collection",
  "image": "https://arweave.net/revealed/123.png",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Background",
      "value": "Cosmic Purple"
    },
    {
      "trait_type": "Character",
      "value": "Robot"
    },
    {
      "trait_type": "Eyes",
      "value": "Laser"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://arweave.net/revealed/123.png",
        "type": "image/png"
      }
    ],
    "category": "image",
    "revealed": true,
    "rarity_score": 3
  }
}
```

## 🎯 Rarity System

The program uses on-chain pseudo-RNG to assign rarities:

```rust
// Pseudo-random trait assignment
let rng_seed = [global_seed, mint_index].concat();
let trait_hash = keccak::hash(&rng_seed);
let rarity_score = hash % 100;

// Rarity tiers
match rarity_score {
    0..=4   => "Legendary",  // 5%
    5..=19  => "Epic",       // 15%
    20..=49 => "Rare",       // 30%
    _       => "Common",     // 50%
}
```

## 🔧 Frontend Integration

### React + Umi Example
```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useWallet } from '@solana/wallet-adapter-react';

function MintButton() {
  const wallet = useWallet();
  const umi = createUmi('https://rpc.analos.io')
    .use(walletAdapterIdentity(wallet));

  const handleMint = async () => {
    const tx = await program.methods
      .mintPlaceholder()
      .accounts({ /* ... */ })
      .rpc();
    
    console.log('Minted!', tx);
  };

  return <button onClick={handleMint}>Mint Mystery Box</button>;
}
```

### Indexing with Helius (for proofs)
```typescript
import { Helius } from "helius-sdk";

const helius = new Helius("YOUR_API_KEY");

// Fetch compressed NFT proof for updates
const assetProof = await helius.rpc.getAssetProof({
  id: assetId,
});

// Use proof for update_nft_metadata instruction
```

## 📊 Cost Comparison

| Method | Cost per NFT | 10K Collection |
|--------|-------------|----------------|
| Traditional (Token Metadata) | ~$2.50 | $25,000 |
| **Compressed (Bubblegum)** | **~$0.0001** | **~$1** |

## 🛡️ Security Features

- ✅ PDA-based authority controls
- ✅ Rent-exempt validation on withdrawals
- ✅ Supply caps and threshold checks
- ✅ Pausable minting
- ✅ CPI-safe Bubblegum integration
- ✅ Proper error handling with custom error codes

## 🔍 Testing

Run comprehensive test suite:
```bash
# Full test suite
anchor test

# Specific test file
anchor test tests/analos-nft-launchpad.ts

# With detailed logs
ANCHOR_LOG=true anchor test
```

## 📚 Additional Resources

- [Metaplex Bubblegum Docs](https://developers.metaplex.com/bubblegum)
- [Analos Documentation](https://docs.analos.io)
- [Analos Explorer](https://explorer.analos.io)
- [SPL Account Compression](https://docs.solana.com/developing/on-chain-programs/account-compression)

## 🚨 Important Notes

### Analos-Specific Configuration
- **RPC**: `https://rpc.analos.io`
- **Native Token**: $LOS (1 LOS = 1e9 lamports)
- **Wallet**: Use wallet.analos.io for browser integration
- **Full Solana Compatibility**: All Solana programs work on Analos

### Production Checklist
- [ ] Fund deployer wallet with sufficient $LOS
- [ ] Upload placeholder & revealed metadata to Arweave/IPFS
- [ ] Generate trait configuration JSON
- [ ] Test on Analos devnet first
- [ ] Set up indexer (Helius/TheGraph) for proof fetching
- [ ] Build frontend with @solana/wallet-adapter
- [ ] Configure royalty enforcement marketplace
- [ ] Set up monitoring for collection events

## 📄 License

MIT License - feel free to use for your NFT launches!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ for the Analos ecosystem**

