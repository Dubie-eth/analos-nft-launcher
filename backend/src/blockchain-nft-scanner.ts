/**
 * Blockchain NFT Scanner
 * Scans the Analos blockchain to recover all existing minted NFTs
 * Rebuilds the NFT database from blockchain transactions
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { nftTrackingService } from '../dist/nft-tracking-service.js';

// Define MintedNFT interface locally since it's not exported from the compiled JS
interface MintedNFT {
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

export interface BlockchainNFTData {
  mintAddress: string;
  ownerAddress: string;
  collectionName: string;
  tokenId: number;
  mintSignature: string;
  mintTimestamp: number;
  price?: number;
  currency?: string;
  metadata?: any;
}

export interface CollectionScanResult {
  collectionName: string;
  totalMinted: number;
  nfts: BlockchainNFTData[];
  lastMint?: number;
  totalRevenue: number;
}

export class BlockchainNFTScanner {
  private connection: Connection;
  private knownMintAddresses: Set<string>;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.knownMintAddresses = new Set();
    console.log('🔍 Blockchain NFT Scanner initialized');
  }

  /**
   * Scan all transactions for a specific mint address to find minted NFTs
   */
  async scanMintForNFTs(mintAddress: string, collectionName: string): Promise<BlockchainNFTData[]> {
    try {
      console.log(`🔍 Scanning mint ${mintAddress} for ${collectionName} NFTs...`);
      
      const mintPublicKey = new PublicKey(mintAddress);
      const nfts: BlockchainNFTData[] = [];
      
      // Get all signatures for this mint address
      const signatures = await this.connection.getSignaturesForAddress(mintPublicKey, {
        limit: 1000 // Get up to 1000 transactions
      });
      
      console.log(`📊 Found ${signatures.length} transactions for mint ${mintAddress}`);
      
      // Process each transaction
      for (const sigInfo of signatures) {
        try {
          // Get transaction details
          const transaction = await this.connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (!transaction) continue;
          
          // Look for token minting in this transaction
          const nftData = await this.extractNFTFromTransaction(transaction, collectionName, mintAddress);
          
          if (nftData) {
            nfts.push(nftData);
            console.log(`✅ Found NFT: ${collectionName} #${nftData.tokenId} minted by ${nftData.ownerAddress.slice(0, 8)}...`);
          }
          
        } catch (txError) {
          console.warn(`⚠️ Error processing transaction ${sigInfo.signature}:`, txError);
          continue;
        }
      }
      
      // Sort by timestamp (oldest first)
      nfts.sort((a, b) => a.mintTimestamp - b.mintTimestamp);
      
      console.log(`🎯 Found ${nfts.length} NFTs for collection ${collectionName}`);
      return nfts;
      
    } catch (error) {
      console.error(`❌ Error scanning mint ${mintAddress}:`, error);
      return [];
    }
  }

  /**
   * Extract NFT data from a transaction
   */
  private async extractNFTFromTransaction(
    transaction: any, 
    collectionName: string, 
    mintAddress: string
  ): Promise<BlockchainNFTData | null> {
    try {
      // Look for token program instructions
      const tokenProgramId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      for (const instruction of transaction.transaction.message.instructions) {
        if (instruction.programId === tokenProgramId) {
          // This is a token instruction - could be a mint
          const nftData = await this.parseTokenInstruction(instruction, transaction, collectionName, mintAddress);
          if (nftData) return nftData;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting NFT from transaction:', error);
      return null;
    }
  }

  /**
   * Parse token instruction to extract NFT data
   */
  private async parseTokenInstruction(
    instruction: any,
    transaction: any,
    collectionName: string,
    mintAddress: string
  ): Promise<BlockchainNFTData | null> {
    try {
      // For now, we'll use a simplified approach
      // In a full implementation, we'd parse the instruction data more carefully
      
      const blockTime = transaction.blockTime;
      const signature = transaction.transaction.signatures[0];
      
      // Get the owner from the transaction accounts
      // The first account is usually the signer/owner
      const ownerAddress = transaction.transaction.message.accountKeys[0]?.toString();
      
      if (!ownerAddress) return null;
      
      // Generate a token ID based on the signature (for now)
      const tokenId = this.generateTokenIdFromSignature(signature);
      
      return {
        mintAddress,
        ownerAddress,
        collectionName,
        tokenId,
        mintSignature: signature,
        mintTimestamp: blockTime ? blockTime * 1000 : Date.now(), // Convert to milliseconds
        price: 4200.69, // Default price - we'll try to extract this later
        currency: 'LOS'
      };
      
    } catch (error) {
      console.warn('Error parsing token instruction:', error);
      return null;
    }
  }

  /**
   * Generate a token ID from signature (temporary solution)
   */
  private generateTokenIdFromSignature(signature: string): number {
    // Use a simple hash of the signature to generate a token ID
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 10000 + 1; // Generate ID between 1-10000
  }

  /**
   * Scan all known collections and recover all NFTs
   */
  async scanAllCollections(): Promise<CollectionScanResult[]> {
    console.log('🔍 Starting comprehensive blockchain scan...');
    
    // Known mint addresses and their collection names
    const knownMints = [
      { address: '3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB', name: 'Los Bros' },
      { address: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP', name: 'Los Bros' },
      // Add more mint addresses as we discover them
    ];
    
    const results: CollectionScanResult[] = [];
    
    for (const mint of knownMints) {
      try {
        console.log(`🔍 Scanning collection: ${mint.name} (${mint.address})`);
        
        const nfts = await this.scanMintForNFTs(mint.address, mint.name);
        
        if (nfts.length > 0) {
          const totalRevenue = nfts.reduce((sum, nft) => sum + (nft.price || 0), 0);
          const lastMint = Math.max(...nfts.map(nft => nft.mintTimestamp));
          
          results.push({
            collectionName: mint.name,
            totalMinted: nfts.length,
            nfts,
            lastMint,
            totalRevenue
          });
          
          console.log(`✅ Recovered ${nfts.length} NFTs for ${mint.name}`);
        } else {
          console.log(`ℹ️ No NFTs found for ${mint.name}`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error scanning ${mint.name}:`, error);
      }
    }
    
    console.log(`🎯 Blockchain scan complete: Found ${results.length} collections with NFTs`);
    return results;
  }

  /**
   * Rebuild the NFT tracking database from blockchain data
   */
  async rebuildDatabase(): Promise<{
    totalNFTs: number;
    totalCollections: number;
    collections: CollectionScanResult[];
  }> {
    console.log('🏗️ Starting database rebuild from blockchain...');
    
    try {
      // Scan all collections
      const scanResults = await this.scanAllCollections();
      
      let totalNFTs = 0;
      let totalCollections = 0;
      
      // Import all found NFTs into the tracking system
      for (const collection of scanResults) {
        console.log(`📥 Importing ${collection.totalMinted} NFTs for ${collection.collectionName}...`);
        
        for (const nft of collection.nfts) {
          try {
            // Convert blockchain NFT data to tracking format
            const trackingNFT: MintedNFT = {
              id: `recovered_${nft.mintAddress}_${nft.tokenId}`,
              tokenId: nft.tokenId,
              collectionName: nft.collectionName,
              walletAddress: nft.ownerAddress,
              mintSignature: nft.mintSignature,
              mintedAt: nft.mintTimestamp,
              phase: 'recovered', // Mark as recovered
              price: nft.price || 4200.69,
              currency: nft.currency || 'LOS',
              metadata: {
                recovered: true,
                originalMintAddress: nft.mintAddress,
                recoveryDate: Date.now()
              }
            };
            
            // Track the NFT
            nftTrackingService.trackMintedNFT(trackingNFT);
            totalNFTs++;
            
          } catch (error) {
            console.error(`❌ Error importing NFT ${nft.mintAddress}:`, error);
          }
        }
        
        totalCollections++;
      }
      
      console.log(`✅ Database rebuild complete: ${totalNFTs} NFTs recovered from ${totalCollections} collections`);
      
      return {
        totalNFTs,
        totalCollections,
        collections: scanResults
      };
      
    } catch (error) {
      console.error('❌ Error rebuilding database:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific NFT (simplified version)
   */
  async getNFTDetails(mintAddress: string): Promise<BlockchainNFTData | null> {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get account info
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      if (!accountInfo) {
        console.log(`NFT ${mintAddress} not found`);
        return null;
      }
      
      // For now, return basic info - we'll enhance this later
      return {
        mintAddress,
        ownerAddress: 'Unknown', // We'll determine this later
        collectionName: 'Unknown',
        tokenId: 1,
        mintSignature: 'Unknown',
        mintTimestamp: Date.now(),
        price: 0,
        currency: 'LOS'
      };
      
    } catch (error) {
      console.error(`Error getting NFT details for ${mintAddress}:`, error);
      return null;
    }
  }

  /**
   * Validate that our recovered data matches blockchain state
   */
  async validateRecovery(): Promise<{
    valid: boolean;
    discrepancies: string[];
    summary: {
      trackedNFTs: number;
      blockchainNFTs: number;
      collections: string[];
    };
  }> {
    console.log('🔍 Validating recovered data against blockchain...');
    
    try {
      // Get all tracked NFTs
      const trackedNFTs = nftTrackingService.getAllNFTs();
      
      // Get blockchain data
      const blockchainResults = await this.scanAllCollections();
      
      const discrepancies: string[] = [];
      const collections = new Set<string>();
      
      // Compare tracked vs blockchain
      for (const collection of blockchainResults) {
        collections.add(collection.collectionName);
        
        const trackedCollectionNFTs = trackedNFTs.filter(
          nft => nft.collectionName === collection.collectionName
        );
        
        if (trackedCollectionNFTs.length !== collection.totalMinted) {
          discrepancies.push(
            `${collection.collectionName}: Tracked ${trackedCollectionNFTs.length}, Blockchain ${collection.totalMinted}`
          );
        }
      }
      
      const valid = discrepancies.length === 0;
      
      console.log(`✅ Validation complete: ${valid ? 'VALID' : 'DISCREPANCIES FOUND'}`);
      if (discrepancies.length > 0) {
        console.log('⚠️ Discrepancies:', discrepancies);
      }
      
      return {
        valid,
        discrepancies,
        summary: {
          trackedNFTs: trackedNFTs.length,
          blockchainNFTs: blockchainResults.reduce((sum, c) => sum + c.totalMinted, 0),
          collections: Array.from(collections)
        }
      };
      
    } catch (error) {
      console.error('❌ Error validating recovery:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainNFTScanner = new BlockchainNFTScanner();
