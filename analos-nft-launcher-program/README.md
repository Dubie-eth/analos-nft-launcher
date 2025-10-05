# Analos NFT Launcher Program

A proper Solana Anchor program for NFT collection deployment with comprehensive configuration support.

## 🏗️ Architecture

This project uses the correct approach for Solana development:

1. **Anchor Program (Rust)** - The smart contract that runs on Solana
2. **Client SDK (TypeScript)** - JavaScript/TypeScript library to interact with the program
3. **React Hooks** - Easy integration with React applications

## 🚀 Features

- ✅ **Proper Smart Contract** - Built with Anchor framework
- ✅ **Collection Configuration** - Store all collection settings on-chain
- ✅ **Whitelist Phases** - Multiple whitelist phases with different rules
- ✅ **Multi-Token Payments** - Support for different payment tokens
- ✅ **Delayed Reveal** - Configurable reveal mechanisms
- ✅ **On-Chain Storage** - All data stored permanently on Solana
- ✅ **Recovery System** - Access collections even if website goes down
- ✅ **Type Safety** - Full TypeScript support

## 📁 Project Structure

```
analos-nft-launcher-program/
├── programs/
│   └── analos-nft-launcher-program/
│       ├── src/
│       │   ├── lib.rs                 # Main program
│       │   ├── instructions/
│       │   │   ├── mod.rs
│       │   │   ├── initialize.rs
│       │   │   └── create_collection.rs
│       │   ├── state/
│       │   │   └── mod.rs            # Data structures
│       │   ├── error.rs              # Custom errors
│       │   └── constants.rs          # Program constants
│       └── Cargo.toml
├── app/
│   ├── src/
│   │   ├── client.ts                 # Client SDK
│   │   ├── hooks/
│   │   │   └── useAnalosNftLauncher.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── Anchor.toml
└── README.md
```

## 🔧 Setup

### 1. Build the Anchor Program

```bash
cd analos-nft-launcher-program
anchor build
```

### 2. Deploy the Program

```bash
# Deploy to localnet (for testing)
anchor deploy --provider.cluster localnet

# Deploy to devnet (for testing)
anchor deploy --provider.cluster devnet

# Deploy to mainnet (production)
anchor deploy --provider.cluster mainnet
```

### 3. Install Client Dependencies

```bash
cd app
npm install
```

### 4. Build Client SDK

```bash
npm run build
```

## 💻 Usage

### Basic Usage in React

```typescript
import { useAnalosNftLauncher } from './hooks/useAnalosNftLauncher';

function CreateCollection() {
  const {
    createCollection,
    deployCollection,
    isLoading,
    error,
    isConnected
  } = useAnalosNftLauncher();

  const handleCreateCollection = async () => {
    try {
      const collectionConfig = {
        name: "My NFT Collection",
        symbol: "MNC",
        description: "A great NFT collection",
        imageUri: "https://example.com/image.png",
        externalUrl: "https://example.com",
        maxSupply: 1000,
        mintPrice: new anchor.BN(1000000000), // 1 SOL in lamports
        feePercentage: 2.5,
        feeRecipient: wallet.publicKey,
        creator: wallet.publicKey,
        deployedAt: new anchor.BN(Date.now()),
        platform: "Analos NFT Launcher",
        version: "1.0.0"
      };

      // Create collection configuration
      const tx1 = await createCollection(collectionConfig);
      console.log("Collection created:", tx1);

      // Deploy collection to blockchain
      const tx2 = await deployCollection();
      console.log("Collection deployed:", tx2);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div>
      <button onClick={handleCreateCollection} disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Collection"}
      </button>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### Advanced Usage with Whitelist and Multi-Token Payments

```typescript
const handleAdvancedCollection = async () => {
  const collectionConfig = {
    // ... basic config
  };

  const whitelistPhases = [
    {
      name: "VIP Phase",
      startTime: new anchor.BN(Date.now()),
      endTime: new anchor.BN(Date.now() + 86400000), // 24 hours
      maxMintsPerWallet: 5,
      price: new anchor.BN(500000000), // 0.5 SOL
      addresses: [/* VIP addresses */],
      phaseType: 1, // Whitelist phase
      tokenRequirements: []
    }
  ];

  const paymentTokens = [
    {
      tokenMint: new PublicKey("So11111111111111111111111111111111111111112"), // SOL
      symbol: "SOL",
      decimals: 9,
      priceMultiplier: new anchor.BN(1),
      minBalanceForWhitelist: new anchor.BN(1000000000), // 1 SOL
      isEnabled: true
    }
  ];

  const delayedReveal = {
    enabled: true,
    revealType: 1, // Time-based
    revealTime: new anchor.BN(Date.now() + 604800000), // 7 days
    revealAtCompletion: false,
    placeholderImage: "https://example.com/placeholder.png"
  };

  await createCollection(
    collectionConfig,
    whitelistPhases,
    paymentTokens,
    delayedReveal,
    10 // max mints per wallet
  );
};
```

## 🔍 Key Differences from Previous Approach

### ❌ **Old Approach (Problematic)**
- Trying to create blockchain transactions in web service
- Complex TypeScript parsing issues
- No proper smart contract
- Fragile deployment process

### ✅ **New Approach (Correct)**
- Proper Anchor smart contract in Rust
- Clean separation of concerns
- Type-safe client SDK
- Robust on-chain storage
- Standard Solana development practices

## 🛡️ Security Benefits

1. **On-Chain Storage** - All collection data stored permanently on Solana
2. **Program Verification** - Smart contract can be verified on-chain
3. **Access Control** - Only collection creators can modify their collections
4. **Recovery System** - Collections accessible even if website goes down
5. **Immutable Configuration** - Once deployed, collection config is permanent

## 📚 Next Steps

1. **Deploy the Anchor Program** to devnet for testing
2. **Update Frontend** to use the new client SDK instead of direct blockchain calls
3. **Test Collection Creation** with various configurations
4. **Deploy to Mainnet** when ready for production

## 🔗 Integration with Existing Frontend

To integrate with your existing frontend:

1. Replace the `real-deployment-service.ts` with the new client SDK
2. Use the `useAnalosNftLauncher` hook in your admin components
3. Remove the complex blockchain transaction logic
4. Let the Anchor program handle all blockchain interactions

This approach is much more reliable, secure, and follows Solana best practices!
