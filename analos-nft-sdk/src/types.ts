// Type definitions for Analos NFT SDK

export interface AnalosNFT {
  mintAddress: string;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  collection: string;
  collectionAddress: string;
  owner: string;
  metadata: string;
  masterEdition?: string;
  transactionSignature: string;
  explorerUrl: string;
  mintedAt: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

export interface AnalosCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  currency: string;
  mintAddress?: string;
  metadataAddress?: string;
  masterEditionAddress?: string;
  deployedAt: string;
  isActive: boolean;
  feePercentage: number;
  feeRecipient: string;
  externalUrl?: string;
  blockchainInfo: {
    network: string;
    rpcUrl: string;
    deployed: boolean;
    verified: boolean;
    metaplexStandards: boolean;
    sdkUsed: boolean;
  };
}

export interface NFTSearchFilters {
  collection?: string;
  owner?: string;
  minPrice?: number;
  maxPrice?: number;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  mintedAfter?: string;
  mintedBefore?: string;
  limit?: number;
  offset?: number;
}

export interface CollectionSearchFilters {
  name?: string;
  symbol?: string;
  isActive?: boolean;
  minSupply?: number;
  maxSupply?: number;
  limit?: number;
  offset?: number;
}

export interface NFTAnalytics {
  totalNFTs: number;
  totalCollections: number;
  totalVolume: number;
  averagePrice: number;
  topCollections: Array<{
    name: string;
    volume: number;
    count: number;
  }>;
  recentActivity: Array<{
    type: 'mint' | 'transfer' | 'sale';
    nft: string;
    from?: string;
    to?: string;
    price?: number;
    timestamp: string;
  }>;
}

export interface ExplorerConfig {
  rpcUrl: string;
  explorerUrl: string;
  apiUrl: string;
  network: 'mainnet' | 'devnet' | 'testnet';
  cacheEnabled: boolean;
  cacheTimeout: number;
}

export interface SDKOptions {
  config: ExplorerConfig;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

export interface MetadataResult {
  success: boolean;
  metadata?: any;
  error?: string;
}

export interface CollectionStats {
  totalSupply: number;
  currentSupply: number;
  floorPrice: number;
  volume: number;
  owners: number;
  averagePrice: number;
  lastSale?: {
    price: number;
    timestamp: string;
  };
}

export interface OwnerInfo {
  address: string;
  nftCount: number;
  collections: string[];
  firstMint: string;
  lastMint: string;
}

// Event types for real-time updates
export interface NFTEvent {
  type: 'mint' | 'transfer' | 'burn' | 'metadata_update';
  nft: AnalosNFT;
  timestamp: string;
  transactionSignature: string;
}

export interface CollectionEvent {
  type: 'create' | 'update' | 'pause' | 'resume';
  collection: AnalosCollection;
  timestamp: string;
  transactionSignature: string;
}
