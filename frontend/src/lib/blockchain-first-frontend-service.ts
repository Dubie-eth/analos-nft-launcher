/**
 * Blockchain-First Frontend Service
 * Connects frontend to the new blockchain-first backend APIs
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';

export interface BlockchainFirstNFT {
  id: string;
  tokenId: number;
  collectionName: string;
  walletAddress: string;
  mintSignature: string;
  mintedAt: number;
  phase: string;
  price: number;
  currency: string;
  metadata?: any;
}

export interface BlockchainFirstCollection {
  collectionName: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  creatorWallet: string;
  isActive: boolean;
  mintingEnabled: boolean;
  phases: Array<{
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    maxMintsPerWallet: number;
    price: number;
    isWhitelistOnly: boolean;
  }>;
  deployedAt: number;
}

export interface MintingResult {
  success: boolean;
  transactionSignature?: string;
  tokenId?: number;
  error?: string;
}

class BlockchainFirstFrontendService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  // Collection Management
  async getCollection(collectionName: string): Promise<BlockchainFirstCollection | null> {
    try {
      const result = await this.makeRequest(`/api/blockchain-first/collection/${collectionName}`);
      return result.success ? result.collection : null;
    } catch (error) {
      console.error('Error getting collection:', error);
      return null;
    }
  }

  async getTrackedCollections(): Promise<BlockchainFirstCollection[]> {
    try {
      const result = await this.makeRequest('/api/blockchain-first/collections');
      return result.success ? result.collections : [];
    } catch (error) {
      console.error('Error getting tracked collections:', error);
      return [];
    }
  }

  // NFT Management
  async createNFTWithFullMetadata(
    collectionName: string,
    tokenId: number,
    ownerWallet: string,
    mintPhase: string,
    mintPrice: number,
    paymentToken: string,
    creatorWallet: string,
    customAttributes: Array<{ trait_type: string; value: string }> = []
  ): Promise<MintingResult> {
    try {
      const result = await this.makeRequest('/api/blockchain-first/create-nft', {
        method: 'POST',
        body: JSON.stringify({
          collectionName,
          tokenId,
          ownerWallet,
          mintPhase,
          mintPrice,
          paymentToken,
          creatorWallet,
          customAttributes,
        }),
      });

      return {
        success: result.success,
        transactionSignature: result.transactionSignature,
        tokenId: result.tokenId,
        error: result.error,
      };
    } catch (error) {
      console.error('Error creating NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getNextTokenId(collectionName: string): Promise<number> {
    try {
      const result = await this.makeRequest(`/api/blockchain-first/next-token-id/${collectionName}`);
      return result.success ? result.nextTokenId : 1;
    } catch (error) {
      console.error('Error getting next token ID:', error);
      return 1;
    }
  }

  // User NFT Tracking
  async getUserNFTs(walletAddress: string): Promise<{ nfts: BlockchainFirstNFT[]; stats: any }> {
    try {
      const result = await this.makeRequest(`/api/nft/user/${walletAddress}`);
      return {
        nfts: result.success ? result.nfts : [],
        stats: result.success ? result.stats : {},
      };
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return { nfts: [], stats: {} };
    }
  }

  async getCollectionNFTs(collectionName: string): Promise<{ nfts: BlockchainFirstNFT[]; stats: any }> {
    try {
      const result = await this.makeRequest(`/api/nft/collection/${collectionName}`);
      return {
        nfts: result.success ? result.nfts : [],
        stats: result.success ? result.stats : {},
      };
    } catch (error) {
      console.error('Error getting collection NFTs:', error);
      return { nfts: [], stats: {} };
    }
  }

  async trackMintedNFT(nft: BlockchainFirstNFT): Promise<boolean> {
    try {
      const result = await this.makeRequest('/api/nft/track', {
        method: 'POST',
        body: JSON.stringify(nft),
      });
      return result.success;
    } catch (error) {
      console.error('Error tracking NFT:', error);
      return false;
    }
  }

  // Blockchain Recovery
  async scanCollection(mintAddress: string): Promise<BlockchainFirstNFT[]> {
    try {
      const result = await this.makeRequest(`/api/recovery/scan-mint/${mintAddress}`);
      return result.success ? result.nfts : [];
    } catch (error) {
      console.error('Error scanning collection:', error);
      return [];
    }
  }

  async verifyOwnership(mintAddress: string, walletAddress: string): Promise<boolean> {
    try {
      const result = await this.makeRequest(`/api/blockchain-first/verify-ownership/${mintAddress}/${walletAddress}`);
      return result.success ? result.isOwner : false;
    } catch (error) {
      console.error('Error verifying ownership:', error);
      return false;
    }
  }

  // Health Check
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/health');
      return result.status === 'healthy';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const blockchainFirstFrontendService = new BlockchainFirstFrontendService();
