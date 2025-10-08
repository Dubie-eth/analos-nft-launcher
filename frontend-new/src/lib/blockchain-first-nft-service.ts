/**
 * Frontend Blockchain-First NFT Service
 * Interacts with the blockchain-first backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://analos-nft-launcher-production-f3da.up.railway.app';

export interface OnChainNFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  collectionName: string;
  tokenId: number;
  mintPhase: string;
  mintPrice: number;
  paymentToken: string;
  creatorWallet: string;
  mintTimestamp: number;
  platformFees: number;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
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
  /**
   * Create NFT with full blockchain metadata
   */
  async createNFTWithFullMetadata(
    collectionName: string,
    tokenId: number,
    ownerWallet: string,
    mintPhase: string,
    mintPrice: number,
    paymentToken: string = 'LOS',
    creatorWallet?: string,
    customAttributes: Array<{ trait_type: string; value: string | number }> = []
  ): Promise<{
    success: boolean;
    mint?: string;
    transactionSignature?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/create-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          tokenId,
          ownerWallet,
          mintPhase,
          mintPrice,
          paymentToken,
          creatorWallet: creatorWallet || ownerWallet,
          customAttributes
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Blockchain-first NFT creation failed:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling blockchain-first NFT creation API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add collection to blockchain-first tracking
   */
  async addCollection(collectionData: CollectionOnChainData): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/add-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to add collection to blockchain-first tracking:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling add collection API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get next token ID for collection
   */
  async getNextTokenId(collectionName: string): Promise<{
    success: boolean;
    nextTokenId?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/next-token-id/${encodeURIComponent(collectionName)}`);
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to get next token ID:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling next token ID API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Rebuild database from blockchain
   */
  async rebuildDatabaseFromBlockchain(): Promise<{
    success: boolean;
    stats?: {
      totalNFTs: number;
      totalCollections: number;
      totalUsers: number;
      errors: string[];
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/rebuild-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to rebuild database from blockchain:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling rebuild database API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify NFT ownership on blockchain
   */
  async verifyNFTOwnership(mintAddress: string, walletAddress: string): Promise<{
    success: boolean;
    isOwner?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/verify-ownership/${mintAddress}/${walletAddress}`);
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to verify NFT ownership:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling verify ownership API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get tracked collections
   */
  async getTrackedCollections(): Promise<{
    success: boolean;
    collections?: CollectionOnChainData[];
    count?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/collections`);
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to get tracked collections:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling get tracked collections API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get collection data
   */
  async getCollectionData(collectionName: string): Promise<{
    success: boolean;
    collection?: CollectionOnChainData;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/collection/${encodeURIComponent(collectionName)}`);
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to get collection data:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling get collection data API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update collection data
   */
  async updateCollectionData(collectionName: string, updates: Partial<CollectionOnChainData>): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/collection/${encodeURIComponent(collectionName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to update collection data:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling update collection data API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Scan collection for NFTs
   */
  async scanCollectionForNFTs(mintAddress: string): Promise<{
    success: boolean;
    nfts?: any[];
    count?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain-first/scan-collection/${mintAddress}`);
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Failed to scan collection for NFTs:', result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('❌ Error calling scan collection API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize Los Bros collection for blockchain-first tracking
   */
  async initializeLosBrosCollection(creatorWallet: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const losBrosCollection: CollectionOnChainData = {
      collectionName: 'Los Bros',
      totalSupply: 2222,
      currentSupply: 0,
      mintPrice: 4200.69,
      paymentToken: 'LOS',
      creatorWallet,
      isActive: true,
      mintingEnabled: true,
      phases: [
        {
          name: 'phase_1_ogs',
          price: 0, // Free for whitelist
          supply: 100,
          startTime: Date.now(),
          endTime: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        },
        {
          name: 'phase_2_public',
          price: 4200.69,
          supply: 2122,
          startTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
          endTime: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        }
      ],
      deployedAt: Date.now()
    };

    return await this.addCollection(losBrosCollection);
  }
}

// Export singleton instance
export const blockchainFirstNFTService = new BlockchainFirstNFTService();
