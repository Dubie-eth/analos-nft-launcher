/**
 * Blockchain-First Token Tracker
 * Uses blockchain as single source of truth for NFT tracking
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { blockchainFirstService } from './blockchain-first-service';

export interface BlockchainTokenInfo {
  mintAddress: string;
  collectionName: string;
  tokenId: number;
  ownerAddress: string;
  mintTime: number;
  metadataUri?: string;
  isRevealed: boolean;
  transferHistory: string[]; // Array of transaction signatures
}

export interface BlockchainCollectionInfo {
  name: string;
  mintAddress: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  activePhase: string;
  isRevealed: boolean;
  creatorWallet: string;
  createdAt: number;
  // Track individual minted NFTs from blockchain
  mintedNFTs: BlockchainTokenInfo[];
  // Advanced features from blockchain state
  maxMintsPerWallet: number;
  whitelistPhases: any[];
}

export class BlockchainTokenTracker {
  private connection: Connection;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🔗 Blockchain Token Tracker initialized');
  }

  /**
   * Get collection info from blockchain
   */
  async getCollectionInfo(collectionName: string): Promise<BlockchainCollectionInfo | null> {
    const cacheKey = `collection_info_${collectionName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Using cached collection info for: ${collectionName}`);
      return cached;
    }

    try {
      console.log(`🔍 Getting collection info from blockchain: ${collectionName}`);

      // Get complete collection state from blockchain
      const blockchainState = await blockchainFirstService.getCollectionState(collectionName);
      if (!blockchainState) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return null;
      }

      // Get minted NFTs from blockchain
      const mintedNFTs = await this.getMintedNFTsFromBlockchain(collectionName, blockchainState);

      const collectionInfo: BlockchainCollectionInfo = {
        name: blockchainState.name,
        mintAddress: blockchainState.mintAddress,
        totalSupply: blockchainState.totalSupply,
        currentSupply: blockchainState.currentSupply,
        mintPrice: blockchainState.mintPrice,
        paymentToken: blockchainState.paymentToken,
        activePhase: blockchainState.activePhase,
        isRevealed: blockchainState.isRevealed,
        creatorWallet: blockchainState.creatorWallet,
        createdAt: Date.now(),
        mintedNFTs,
        maxMintsPerWallet: this.getMaxMintsForPhase(blockchainState.activePhase),
        whitelistPhases: []
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: collectionInfo,
        timestamp: Date.now()
      });

      console.log(`✅ Collection info fetched from blockchain: ${collectionName}`);
      return collectionInfo;

    } catch (error) {
      console.error(`❌ Error getting collection info: ${collectionName}`, error);
      return null;
    }
  }

  /**
   * Get minted NFTs from blockchain
   */
  private async getMintedNFTsFromBlockchain(
    collectionName: string, 
    blockchainState: any
  ): Promise<BlockchainTokenInfo[]> {
    try {
      console.log(`🔍 Getting minted NFTs from blockchain: ${collectionName}`);

      const mintedNFTs: BlockchainTokenInfo[] = [];

      // Scan blockchain for minted NFTs
      const mintPubkey = new PublicKey(blockchainState.mintAddress);
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 }, // Token account size
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      // Process each token account
      for (let i = 0; i < tokenAccounts.length; i++) {
        const tokenAccount = tokenAccounts[i];
        
        try {
          const accountInfo = await this.connection.getAccountInfo(tokenAccount.pubkey);
          if (accountInfo?.data) {
            // Parse token account to get owner
            const owner = accountInfo.owner.toString();
            
            const tokenInfo: BlockchainTokenInfo = {
              mintAddress: tokenAccount.pubkey.toString(),
              collectionName,
              tokenId: i + 1, // Sequential token ID
              ownerAddress: owner,
              mintTime: Date.now(), // Would get from blockchain in real implementation
              metadataUri: blockchainState.metadataUri,
              isRevealed: blockchainState.isRevealed,
              transferHistory: [] // Would scan blockchain for transfers
            };

            mintedNFTs.push(tokenInfo);
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse token account:', error);
        }
      }

      console.log(`📊 Found ${mintedNFTs.length} minted NFTs from blockchain`);
      return mintedNFTs;

    } catch (error) {
      console.error('❌ Error getting minted NFTs from blockchain:', error);
      return [];
    }
  }

  /**
   * Get NFT info from blockchain
   */
  async getNFTInfo(mintAddress: string): Promise<BlockchainTokenInfo | null> {
    try {
      console.log(`🔍 Getting NFT info from blockchain: ${mintAddress}`);

      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get token account info
      const tokenAccounts = await this.connection.getTokenAccountsByMint(mintPublicKey);
      
      if (tokenAccounts.value.length === 0) {
        console.log(`❌ No token accounts found for mint: ${mintAddress}`);
        return null;
      }

      // Get the first token account (assuming NFTs have only one holder)
      const tokenAccount = tokenAccounts.value[0];
      const accountInfo = await this.connection.getAccountInfo(tokenAccount.pubkey);
      
      if (!accountInfo?.data) {
        console.log(`❌ No account data for token: ${mintAddress}`);
        return null;
      }

      // Parse account data to get owner
      const owner = accountInfo.owner.toString();

      const nftInfo: BlockchainTokenInfo = {
        mintAddress,
        collectionName: 'Unknown', // Would determine from metadata
        tokenId: 1, // Would get from metadata
        ownerAddress: owner,
        mintTime: Date.now(), // Would get from blockchain
        metadataUri: undefined,
        isRevealed: false,
        transferHistory: []
      };

      console.log(`✅ NFT info fetched from blockchain: ${mintAddress}`);
      return nftInfo;

    } catch (error) {
      console.error(`❌ Error getting NFT info: ${mintAddress}`, error);
      return null;
    }
  }

  /**
   * Get wallet's NFTs from blockchain
   */
  async getWalletNFTs(walletAddress: string, collectionName?: string): Promise<BlockchainTokenInfo[]> {
    try {
      console.log(`🔍 Getting wallet NFTs from blockchain: ${walletAddress}`);

      const walletPublicKey = new PublicKey(walletAddress);
      const nfts: BlockchainTokenInfo[] = [];

      // Get all token accounts for this wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Process each token account
      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        
        // Check if this is an NFT (amount = 1, decimals = 0)
        if (parsedInfo.tokenAmount.amount === '1' && parsedInfo.tokenAmount.decimals === 0) {
          const mintAddress = parsedInfo.mint;
          
          // Get detailed NFT info
          const nftInfo = await this.getNFTInfo(mintAddress);
          if (nftInfo) {
            // Filter by collection if specified
            if (!collectionName || nftInfo.collectionName === collectionName) {
              nfts.push(nftInfo);
            }
          }
        }
      }

      console.log(`📊 Found ${nfts.length} NFTs for wallet: ${walletAddress}`);
      return nfts;

    } catch (error) {
      console.error(`❌ Error getting wallet NFTs: ${walletAddress}`, error);
      return [];
    }
  }

  /**
   * Utility methods
   */
  private getMaxMintsForPhase(phase: string): number {
    const phaseLimits = {
      'phase_1_ogs': 2,
      'phase_2_holders': 5,
      'phase_3_public': 10
    };
    return phaseLimits[phase as keyof typeof phaseLimits] || 10;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clear cache for a collection
   */
  clearCollectionCache(collectionName: string): void {
    const keysToDelete = [
      `collection_info_${collectionName}`,
      `minted_nfts_${collectionName}`
    ];
    
    keysToDelete.forEach(key => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    });
    
    console.log(`🗑️ Cleared cache for collection: ${collectionName}`);
  }
}

export const blockchainTokenTracker = new BlockchainTokenTracker();
