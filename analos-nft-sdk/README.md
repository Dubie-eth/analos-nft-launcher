# Analos NFT SDK

A comprehensive SDK for integrating NFT functionality into the Analos blockchain explorer and applications.

## 🚀 Features

- **Complete NFT Management**: Fetch, search, and display NFTs from the Analos blockchain
- **Collection Support**: Browse and manage NFT collections with full metadata
- **Explorer Integration**: Ready-to-use components for integrating into the Analos explorer
- **Real-time Data**: Live NFT data with caching and optimization
- **TypeScript Support**: Full TypeScript definitions for better development experience
- **Metaplex Compatible**: Built on Metaplex NFT standards adapted for Analos

## 📦 Installation

```bash
npm install @analos/nft-sdk
```

## 🎯 Quick Start

```typescript
import { AnalosNFTSDK } from '@analos/nft-sdk';

// Initialize the SDK
const sdk = new AnalosNFTSDK({
  config: {
    rpcUrl: 'https://rpc.analos.io',
    explorerUrl: 'https://explorer.analos.io',
    apiUrl: 'https://analos-nft-launcher-production-f3da.up.railway.app',
    network: 'mainnet',
    cacheEnabled: true,
    cacheTimeout: 300000 // 5 minutes
  },
  apiKey: 'your-api-key', // Optional
  timeout: 10000,
  retries: 3
});

// Get all NFTs
const nfts = await sdk.getAllNFTs();

// Get popular collections
const collections = await sdk.getPopularCollections();

// Search NFTs
const searchResults = await sdk.searchNFTs('Analos');

// Render NFT explorer in your app
await sdk.renderNFTExplorer('nft-container', {
  showSearch: true,
  showStats: true
});
```

## 🎨 Explorer Integration

### Render NFT Grid

```typescript
// Get NFTs and render them
const nfts = await sdk.getAllNFTs();
sdk.explorer.renderNFTGrid(nfts, document.getElementById('nft-grid'));
```

### Render Collection Cards

```typescript
// Get collections and render them
const collections = await sdk.getPopularCollections();
collections.forEach(collection => {
  sdk.explorer.renderCollectionCard(collection, document.getElementById('collections'));
});
```

### Render NFT Details

```typescript
// Get specific NFT and render details
const nft = await sdk.client.getNFT('mint-address');
sdk.explorer.renderNFTDetails(nft, document.getElementById('nft-details'));
```

## 🔍 Search and Filtering

```typescript
// Search with filters
const filteredNFTs = await sdk.client.getNFTs({
  collection: 'Analos Collection',
  owner: 'wallet-address',
  minPrice: 100,
  maxPrice: 1000,
  limit: 20,
  offset: 0
});

// Get NFTs by owner
const ownerNFTs = await sdk.getNFTsByOwner('wallet-address');

// Get NFTs by collection
const collectionNFTs = await sdk.getNFTsByCollection('collection-name');
```

## 📊 Analytics and Stats

```typescript
// Get marketplace statistics
const stats = await sdk.getMarketplaceStats();
console.log(`Total NFTs: ${stats.totalNFTs}`);
console.log(`Total Collections: ${stats.totalCollections}`);
console.log(`Total Volume: ${stats.totalVolume}`);

// Get collection-specific stats
const collectionStats = await sdk.getCollectionStats('collection-id');
```

## 🛠️ Utility Functions

```typescript
import { AnalosNFTUtils } from '@analos/nft-sdk';

// Format addresses
const shortAddress = AnalosNFTUtils.formatAddress('long-wallet-address');

// Format prices
const formattedPrice = AnalosNFTUtils.formatPrice(1000, 'LOS');

// Format dates
const formattedDate = AnalosNFTUtils.formatDate('2024-01-01T00:00:00Z');

// Sort NFTs
const sortedNFTs = AnalosNFTUtils.sortNFTs(nfts, 'newest');

// Filter NFTs
const filteredNFTs = AnalosNFTUtils.filterNFTs(nfts, {
  collection: 'Analos Collection',
  hasAttributes: true
});
```

## 🎭 Metadata Handling

```typescript
import { AnalosMetadataUtils } from '@analos/nft-sdk';

// Fetch metadata from URI
const metadata = await AnalosMetadataUtils.fetchMetadata('metadata-uri');

// Validate metadata
const isValid = AnalosMetadataUtils.validateMetadata(metadata);

// Extract attributes
const attributes = AnalosMetadataUtils.extractAttributes(nft);

// Generate trait statistics
const traitStats = AnalosMetadataUtils.generateTraitStats(nfts);
```

## 🔧 Configuration

```typescript
interface ExplorerConfig {
  rpcUrl: string;           // Analos RPC endpoint
  explorerUrl: string;      // Analos explorer URL
  apiUrl: string;           // NFT API endpoint
  network: 'mainnet' | 'devnet' | 'testnet';
  cacheEnabled: boolean;    // Enable caching
  cacheTimeout: number;     // Cache timeout in ms
}

interface SDKOptions {
  config: ExplorerConfig;
  apiKey?: string;          // Optional API key
  timeout?: number;         // Request timeout
  retries?: number;         // Number of retries
}
```

## 📱 React Integration Example

```tsx
import React, { useEffect, useState } from 'react';
import { AnalosNFTSDK } from '@analos/nft-sdk';

const NFTExplorer: React.FC = () => {
  const [sdk, setSdk] = useState<AnalosNFTSDK | null>(null);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const initializeSDK = async () => {
      const nftSDK = new AnalosNFTSDK({
        config: {
          rpcUrl: 'https://rpc.analos.io',
          explorerUrl: 'https://explorer.analos.io',
          apiUrl: 'https://analos-nft-launcher-production-f3da.up.railway.app',
          network: 'mainnet',
          cacheEnabled: true,
          cacheTimeout: 300000
        }
      });

      setSdk(nftSDK);
      
      // Load NFTs
      const nftData = await nftSDK.getAllNFTs();
      setNfts(nftData);
    };

    initializeSDK();
  }, []);

  if (!sdk) return <div>Loading...</div>;

  return (
    <div>
      <h1>Analos NFT Explorer</h1>
      <div id="nft-grid">
        {nfts.map(nft => (
          <div key={nft.mintAddress} className="nft-card">
            <img src={nft.image} alt={nft.name} />
            <h3>{nft.name}</h3>
            <p>{nft.description}</p>
            <p>Collection: {nft.collection}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Use Cases

### For Analos Explorer Team

1. **NFT Tab Integration**: Add a dedicated NFT tab to the explorer
2. **Collection Browser**: Display all NFT collections on Analos
3. **NFT Details Page**: Show detailed NFT information with metadata
4. **Owner Profiles**: Display NFTs owned by specific addresses
5. **Search Functionality**: Enable NFT search across the platform

### For Developers

1. **Marketplace Integration**: Build NFT marketplaces on Analos
2. **Portfolio Trackers**: Create tools to track NFT portfolios
3. **Collection Analytics**: Build analytics dashboards for collections
4. **Mobile Apps**: Integrate NFT functionality into mobile applications

## 🔗 API Endpoints

The SDK connects to these API endpoints:

- `GET /api/nfts` - Get all NFTs with optional filtering
- `GET /api/nfts/:mintAddress` - Get specific NFT details
- `GET /api/nfts/owner/:address` - Get NFTs by owner
- `GET /api/nfts/collection/:address` - Get NFTs by collection
- `GET /api/collections` - Get all collections
- `GET /api/collections/:id` - Get specific collection
- `GET /api/analytics` - Get marketplace statistics
- `GET /health` - Health check

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.analos.io/nft-sdk](https://docs.analos.io/nft-sdk)
- **Issues**: [GitHub Issues](https://github.com/analos/nft-sdk/issues)
- **Discord**: [Analos Discord](https://discord.gg/analos)

## 🚀 Roadmap

- [ ] Real-time NFT event streaming
- [ ] Advanced analytics and insights
- [ ] Cross-chain NFT support
- [ ] Mobile SDK version
- [ ] GraphQL API support
- [ ] NFT trading functionality

---

**Built for the Analos ecosystem** 🎨
