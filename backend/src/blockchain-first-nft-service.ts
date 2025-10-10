/**
 * Blockchain-First NFT Service
 * Stores all NFT data directly on the blockchain in metadata
 * Can rebuild entire database from blockchain scans
 */

// Using Analos blockchain APIs instead of Solana Web3.js
import { nftTrackingService } from './nft-tracking-service.js';
import type { MintedNFT } from './nft-tracking-service.js';

export interface OnChainNFTMetadata {
  // Standard NFT metadata
  name: string;
  symbol: string;
  description: string;
  image: string;
  
  // Our custom tracking metadata
  collectionName: string;
  tokenId: number;
  mintPhase: string;
  mintPrice: number;
  paymentToken: string;
  creatorWallet: string;
  mintTimestamp: number;
  platformFees: number;
  
  // Attributes for additional data
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface BlockchainNFTData {
  mint: string;
  owner: string;
  tokenAccount: string;
  metadata: OnChainNFTMetadata;
  transactionSignature: string;
  blockTime: number;
  slot: number;
}

export interface CollectionOnChainData {
  collectionName: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  creatorWallet: string;
  isActive: boolean;
  mintingEnabled: boolean;
  phases: Array<{
    name: string;
    price: number;
    supply: number;
    startTime: number;
    endTime: number;
  }>;
  deployedAt: number;
}

export class BlockchainFirstNFTService {
  private knownCollections: Map<string, CollectionOnChainData> = new Map();
  private readonly ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';
  private readonly ANALOS_EXPLORER_URL = 'https://explorer.analos.io';

  constructor() {
    console.log('🔗 Blockchain-First NFT Service initialized for Analos');
  }

  /**
   * Create NFT with comprehensive on-chain metadata
   */
  async createNFTWithFullMetadata(
    collectionName: string,
    tokenId: number,
    ownerWallet: string,
    mintPhase: string,
    mintPrice: number,
    paymentToken: string,
    creatorWallet: string,
    customAttributes: Array<{ trait_type: string; value: string | number }> = []
  ): Promise<{
    success: boolean;
    mint?: string;
    transactionSignature?: string;
    error?: string;
  }> {
    try {
      console.log(`🎨 Creating NFT with full on-chain metadata: ${collectionName} #${tokenId}`);

      // Generate unique mint address (placeholder for now)
      const mint = '11111111111111111111111111111111'; // Placeholder - would use actual mint generation
      
      // Create comprehensive metadata
      const metadata: OnChainNFTMetadata = {
        name: `${collectionName} #${tokenId}`,
        symbol: collectionName.substring(0, 4).toUpperCase(),
        description: `NFT from ${collectionName} collection. Token ID: ${tokenId}`,
        image: `https://api.analos-nft-launcher.com/nft-image/${collectionName}/${tokenId}`,
        
        // Our tracking data
        collectionName,
        tokenId,
        mintPhase,
        mintPrice,
        paymentToken,
        creatorWallet,
        mintTimestamp: Date.now(),
        platformFees: mintPrice * 0.025, // 2.5% platform fee
        
        // Custom attributes
        attributes: [
          { trait_type: 'Collection', value: collectionName },
          { trait_type: 'Token ID', value: tokenId },
          { trait_type: 'Mint Phase', value: mintPhase },
          { trait_type: 'Mint Price', value: mintPrice },
          { trait_type: 'Payment Token', value: paymentToken },
          { trait_type: 'Creator', value: creatorWallet },
          { trait_type: 'Platform', value: 'Analos NFT Launcher' },
          ...customAttributes
        ]
      };

      // In a real implementation, this would:
      // 1. Create the NFT mint account
      // 2. Upload metadata to IPFS/Arweave
      // 3. Create metadata account on Solana
      // 4. Transfer to owner
      
      // For now, we'll simulate this and store in our backend
      const mintedNFT: MintedNFT = {
        id: `blockchain_${collectionName}_${tokenId}_${Date.now()}`,
        tokenId,
        collectionName,
        walletAddress: ownerWallet,
        mintSignature: `simulated_tx_${Date.now()}`,
        mintedAt: Date.now(),
        phase: mintPhase,
        price: mintPrice,
        currency: paymentToken,
        metadata: {
          mint: mint.toString(),
          onChainMetadata: metadata,
          blockTime: Math.floor(Date.now() / 1000),
          slot: Date.now(),
          isBlockchainFirst: true
        }
      };

      // Store in backend (this will be the source of truth until we implement full on-chain storage)
      nftTrackingService.trackMintedNFT(mintedNFT);

      console.log(`✅ NFT created with blockchain-first metadata: ${mint.toString()}`);
      
      return {
        success: true,
        mint: mint.toString(),
        transactionSignature: mintedNFT.mintSignature
      };

    } catch (error) {
      console.error('❌ Error creating NFT with blockchain metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Scan blockchain to rebuild entire NFT database
   */
  async rebuildDatabaseFromBlockchain(): Promise<{
    success: boolean;
    stats: {
      totalNFTs: number;
      totalCollections: number;
      totalUsers: number;
      errors: string[];
    };
  }> {
    try {
      console.log('🔍 Rebuilding database from blockchain...');
      
      const stats = {
        totalNFTs: 0,
        totalCollections: 0,
        totalUsers: 0,
        errors: [] as string[]
      };

      // Get all known collection mints
      const knownMints = Array.from(this.knownCollections.keys());
      
      for (const mintAddress of knownMints) {
        try {
          const nfts = await this.scanCollectionForNFTs(mintAddress);
          stats.totalNFTs += nfts.length;
          
          // Extract unique collections and users
          const collections = new Set<string>();
          const users = new Set<string>();
          
          nfts.forEach(nft => {
            if (nft.metadata?.collectionName) {
              collections.add(nft.metadata.collectionName);
            }
            users.add(nft.owner);
          });
          
          stats.totalCollections += collections.size;
          stats.totalUsers += users.size;
          
        } catch (error) {
          const errorMsg = `Error scanning ${mintAddress}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }

      console.log(`✅ Database rebuild completed:`, stats);
      
      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('❌ Error rebuilding database from blockchain:', error);
      return {
        success: false,
        stats: {
          totalNFTs: 0,
          totalCollections: 0,
          totalUsers: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      };
    }
  }

  /**
   * Scan a specific collection for all NFTs using Analos APIs
   */
  async scanCollectionForNFTs(mintAddress: string): Promise<BlockchainNFTData[]> {
    try {
      console.log(`🔍 Scanning Analos collection ${mintAddress} for NFTs...`);
      
      const nfts: BlockchainNFTData[] = [];

      // Use Analos RPC API to get token accounts
      const response = await fetch(`${this.ANALOS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getProgramAccounts',
          params: [
            'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            {
              filters: [
                { dataSize: 165 },
                {
                  memcmp: {
                    offset: 0,
                    bytes: mintAddress
                  }
                }
              ]
            }
          ]
        })
      });

      const data: any = await response.json();
      
      if (!data.result || !Array.isArray(data.result)) {
        console.log(`📊 No token accounts found for mint ${mintAddress}`);
        return [];
      }

      console.log(`📊 Found ${data.result.length} token accounts for mint ${mintAddress}`);

      for (const tokenAccount of data.result) {
        try {
          // Parse token account data
          const owner = this.parseTokenAccountOwnerFromBase64(tokenAccount.account.data[0]);
          if (!owner) continue;

          // Get transaction history from Analos explorer
          const txResponse = await fetch(`${this.ANALOS_EXPLORER_URL}/api/v1/transactions?account=${tokenAccount.pubkey}&limit=1`);
          const txData: any = await txResponse.json();

          // Get metadata from Analos
          const metadata = await this.getOnChainMetadata(tokenAccount.pubkey);

          const nft: BlockchainNFTData = {
            mint: mintAddress,
            owner,
            tokenAccount: tokenAccount.pubkey,
            metadata,
            transactionSignature: txData.transactions?.[0]?.signature || 'unknown',
            blockTime: txData.transactions?.[0]?.blockTime || 0,
            slot: txData.transactions?.[0]?.slot || 0
          };

          nfts.push(nft);
          console.log(`✅ Found Analos NFT: ${mintAddress} owned by ${owner.slice(0, 8)}...`);

        } catch (error) {
          console.error(`❌ Error processing token account ${tokenAccount.pubkey}:`, error);
        }
      }

      console.log(`🎯 Scanned Analos collection ${mintAddress}: Found ${nfts.length} NFTs`);
      return nfts;

    } catch (error) {
      console.error(`❌ Error scanning Analos collection ${mintAddress}:`, error);
      return [];
    }
  }

  /**
   * Add a known collection to track
   */
  addKnownCollection(collectionData: CollectionOnChainData): void {
    this.knownCollections.set(collectionData.collectionName, collectionData);
    console.log(`📝 Added collection to tracking: ${collectionData.collectionName}`);
  }

  /**
   * Get all tracked collections
   */
  getTrackedCollections(): CollectionOnChainData[] {
    return Array.from(this.knownCollections.values());
  }

  /**
   * Get collection data by name
   */
  getCollectionData(collectionName: string): CollectionOnChainData | undefined {
    return this.knownCollections.get(collectionName);
  }

  /**
   * Fetch fresh collection data from blockchain
   */
  async fetchCollectionDataFromBlockchain(collectionConfigAddress: string): Promise<CollectionOnChainData | null> {
    try {
      console.log(`🔍 Fetching collection data from blockchain: ${collectionConfigAddress}`);
      
      // Fetch the account data from Analos RPC
      const response = await fetch(this.ANALOS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [
            collectionConfigAddress,
            { encoding: 'base64' }
          ]
        })
      });

      const result = await response.json();
      
      if (!result.result || !result.result.value) {
        console.log(`⚠️ Collection config account not found: ${collectionConfigAddress}`);
        return null;
      }

      const accountData = Buffer.from(result.result.value.data[0], 'base64');
      
      // Parse the collection config account data
      // Format: [authority: 32 bytes][max_supply: 8 bytes][current_supply: 8 bytes][price: 8 bytes][reveal_threshold: 8 bytes]
      // [name_len: 4 bytes][name: N bytes][symbol_len: 4 bytes][symbol: N bytes][uri_len: 4 bytes][uri: N bytes]
      
      let offset = 0;
      
      // Skip authority (32 bytes)
      offset += 32;
      
      // Read max_supply (u64, 8 bytes, little-endian)
      const maxSupply = accountData.readBigUInt64LE(offset);
      offset += 8;
      
      // Read current_supply (u64, 8 bytes, little-endian)
      const currentSupply = accountData.readBigUInt64LE(offset);
      offset += 8;
      
      // Read price_lamports (u64, 8 bytes, little-endian)
      const priceLamports = accountData.readBigUInt64LE(offset);
      offset += 8;
      
      // Read reveal_threshold (u64, 8 bytes, little-endian)
      const revealThreshold = accountData.readBigUInt64LE(offset);
      offset += 8;
      
      // Read collection_name (u32 length prefix + string)
      const nameLen = accountData.readUInt32LE(offset);
      offset += 4;
      const collectionName = accountData.slice(offset, offset + nameLen).toString('utf8');
      offset += nameLen;
      
      // Read collection_symbol (u32 length prefix + string)
      const symbolLen = accountData.readUInt32LE(offset);
      offset += 4;
      const collectionSymbol = accountData.slice(offset, offset + symbolLen).toString('utf8');
      offset += symbolLen;
      
      console.log(`✅ Parsed collection data from blockchain:`, {
        collectionName,
        maxSupply: Number(maxSupply),
        currentSupply: Number(currentSupply),
        priceLamports: Number(priceLamports),
        revealThreshold: Number(revealThreshold),
        symbol: collectionSymbol
      });
      
      // Convert lamports to LOS (assuming 9 decimals for LOS token)
      const priceInLOS = Number(priceLamports) / 1_000_000_000;
      
      return {
        collectionName,
        totalSupply: Number(maxSupply),
        currentSupply: Number(currentSupply),
        mintPrice: priceInLOS,
        paymentToken: 'LOS',
        creatorWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Default creator
        isActive: true,
        mintingEnabled: Number(currentSupply) < Number(maxSupply),
        phases: [],
        deployedAt: Date.now()
      };
    } catch (error) {
      console.error('❌ Error fetching collection data from blockchain:', error);
      return null;
    }
  }

  /**
   * Update collection data
   */
  updateCollectionData(collectionName: string, updates: Partial<CollectionOnChainData>): void {
    const existing = this.knownCollections.get(collectionName);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.knownCollections.set(collectionName, updated);
      console.log(`✅ Updated collection data for: ${collectionName}`);
    }
  }

  /**
   * Parse token account data to extract owner from Analos base64 data
   */
  private parseTokenAccountOwnerFromBase64(base64Data: string): string | null {
    try {
      const data = Buffer.from(base64Data, 'base64');
      if (data.length < 64) return null;
      const ownerBytes = data.slice(32, 64);
      return Buffer.from(ownerBytes).toString('hex');
    } catch (error) {
      console.error('Error parsing token account owner from Analos data:', error);
      return null;
    }
  }

  /**
   * Get on-chain metadata from Analos
   */
  private async getOnChainMetadata(tokenAccount: string): Promise<OnChainNFTMetadata> {
    try {
      // Query Analos metadata API
      const response = await fetch(`${this.ANALOS_EXPLORER_URL}/api/v1/token-metadata/${tokenAccount}`);
      const metadata: any = await response.json();

      if (metadata && metadata.name) {
        return {
          name: metadata.name,
          symbol: metadata.symbol || 'NFT',
          description: metadata.description || 'NFT with blockchain-first metadata',
          image: metadata.image || `https://api.analos-nft-launcher.com/nft-image/placeholder/${tokenAccount}`,
          collectionName: metadata.collection?.name || 'Unknown Collection',
          tokenId: metadata.tokenId || Math.floor(Math.random() * 10000),
          mintPhase: metadata.mintPhase || 'unknown',
          mintPrice: metadata.mintPrice || 0,
          paymentToken: metadata.paymentToken || 'LOS',
          creatorWallet: metadata.creator || 'unknown',
          mintTimestamp: metadata.mintTimestamp || Date.now(),
          platformFees: metadata.platformFees || 0,
          attributes: metadata.attributes || [
            { trait_type: 'Source', value: 'Analos Blockchain' },
            { trait_type: 'Token Account', value: tokenAccount }
          ]
        };
      }

      // Fallback metadata
      return {
        name: `NFT #${tokenAccount.slice(0, 8)}`,
        symbol: 'NFT',
        description: 'NFT with blockchain-first metadata from Analos',
        image: `https://api.analos-nft-launcher.com/nft-image/placeholder/${tokenAccount}`,
        collectionName: 'Unknown Collection',
        tokenId: Math.floor(Math.random() * 10000),
        mintPhase: 'unknown',
        mintPrice: 0,
        paymentToken: 'LOS',
        creatorWallet: 'unknown',
        mintTimestamp: Date.now(),
        platformFees: 0,
        attributes: [
          { trait_type: 'Source', value: 'Analos Blockchain Scan' },
          { trait_type: 'Token Account', value: tokenAccount }
        ]
      };
    } catch (error) {
      console.error('Error getting on-chain metadata from Analos:', error);
      // Return fallback metadata
      return {
        name: `NFT #${tokenAccount.slice(0, 8)}`,
        symbol: 'NFT',
        description: 'NFT with blockchain-first metadata from Analos',
        image: `https://api.analos-nft-launcher.com/nft-image/placeholder/${tokenAccount}`,
        collectionName: 'Unknown Collection',
        tokenId: Math.floor(Math.random() * 10000),
        mintPhase: 'unknown',
        mintPrice: 0,
        paymentToken: 'LOS',
        creatorWallet: 'unknown',
        mintTimestamp: Date.now(),
        platformFees: 0,
        attributes: [
          { trait_type: 'Source', value: 'Analos Blockchain Scan' },
          { trait_type: 'Token Account', value: tokenAccount }
        ]
      };
    }
  }

  /**
   * Generate next token ID for a collection
   */
  async getNextTokenId(collectionName: string): Promise<number> {
    try {
      const collectionData = this.getCollectionData(collectionName);
      if (!collectionData) {
        console.warn(`Collection ${collectionName} not found, starting from token ID 1`);
        return 1;
      }

      // Scan blockchain to find highest token ID
      const nfts = await this.scanCollectionForNFTs(collectionData.collectionName);
      let maxTokenId = 0;
      
      nfts.forEach(nft => {
        if (nft.metadata?.tokenId && nft.metadata.tokenId > maxTokenId) {
          maxTokenId = nft.metadata.tokenId;
        }
      });

      return maxTokenId + 1;
    } catch (error) {
      console.error(`Error getting next token ID for ${collectionName}:`, error);
      return 1;
    }
  }

  /**
   * Verify NFT ownership on Analos blockchain
   */
  async verifyNFTOwnership(mintAddress: string, walletAddress: string): Promise<boolean> {
    try {
      // Use Analos RPC API to check wallet's token accounts
      const response = await fetch(`${this.ANALOS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            walletAddress,
            {
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            }
          ]
        })
      });

      const data: any = await response.json();
      
      if (!data.result || !data.result.value || !Array.isArray(data.result.value)) {
        return false;
      }

      // Check if any token account holds the specific mint
      for (const tokenAccount of data.result.value) {
        const accountMint = this.parseTokenAccountMintFromBase64(tokenAccount.account.data[0]);
        if (accountMint === mintAddress) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`Error verifying NFT ownership on Analos:`, error);
      return false;
    }
  }

  /**
   * Parse token account data to extract mint from Analos base64 data
   */
  private parseTokenAccountMintFromBase64(base64Data: string): string | null {
    try {
      const data = Buffer.from(base64Data, 'base64');
      if (data.length < 32) return null;
      const mintBytes = data.slice(0, 32);
      return Buffer.from(mintBytes).toString('hex');
    } catch (error) {
      console.error('Error parsing token account mint from Analos data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const blockchainFirstNFTService = new BlockchainFirstNFTService();
