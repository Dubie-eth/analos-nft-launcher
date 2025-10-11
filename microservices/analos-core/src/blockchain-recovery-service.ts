/**
 * Blockchain Recovery Service
 * Scans the blockchain to recover all existing minted NFTs
 * Rebuilds the NFT tracking database from on-chain data
 */

// Using Analos blockchain APIs instead of Solana Web3.js
import { nftTrackingService } from './nft-tracking-service.js';
import type { MintedNFT } from './nft-tracking-service.js';

export interface BlockchainNFT {
  mint: string;
  owner: string;
  tokenAccount: string;
  metadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    collection?: string;
    tokenId?: number;
    attributes?: any[];
  };
  transactionSignature: string;
  blockTime: number;
  slot: number;
}

export interface RecoveryStats {
  totalScanned: number;
  totalRecovered: number;
  collectionsFound: string[];
  errors: string[];
  startTime: number;
  endTime?: number;
}

export class BlockchainRecoveryService {
  private knownMints: Set<string> = new Set();
  private readonly ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';
  private readonly ANALOS_EXPLORER_URL = 'https://explorer.analos.io';

  constructor() {
    console.log('🔍 Blockchain Recovery Service initialized for Analos');
  }

  /**
   * Add known mint addresses to scan
   */
  addKnownMints(mints: string[]): void {
    mints.forEach(mint => this.knownMints.add(mint));
    console.log(`📝 Added ${mints.length} known mints to scan list`);
  }

  /**
   * Scan for NFTs from a specific mint address using Analos APIs
   */
  async scanMintForNFTs(mintAddress: string): Promise<BlockchainNFT[]> {
    try {
      console.log(`🔍 Scanning Analos mint ${mintAddress} for NFTs...`);
      
      const nfts: BlockchainNFT[] = [];

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
      
      if (!data.result) {
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
          const metadata = await this.getTokenMetadata(tokenAccount.pubkey);

          const nft: BlockchainNFT = {
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

      console.log(`🎯 Scanned Analos mint ${mintAddress}: Found ${nfts.length} NFTs`);
      return nfts;

    } catch (error) {
      console.error(`❌ Error scanning Analos mint ${mintAddress}:`, error);
      return [];
    }
  }

  /**
   * Scan all known mints for NFTs
   */
  async scanAllKnownMints(): Promise<{
    nfts: BlockchainNFT[];
    stats: RecoveryStats;
  }> {
    const startTime = Date.now();
    const stats: RecoveryStats = {
      totalScanned: 0,
      totalRecovered: 0,
      collectionsFound: [],
      errors: [],
      startTime
    };

    const allNFTs: BlockchainNFT[] = [];

    console.log(`🚀 Starting blockchain recovery scan for ${this.knownMints.size} known mints...`);

    for (const mintAddress of this.knownMints) {
      try {
        stats.totalScanned++;
        const nfts = await this.scanMintForNFTs(mintAddress);
        allNFTs.push(...nfts);
        stats.totalRecovered += nfts.length;

        // Extract collection names from NFTs
        nfts.forEach(nft => {
          if (nft.metadata?.collection && !stats.collectionsFound.includes(nft.metadata.collection)) {
            stats.collectionsFound.push(nft.metadata.collection);
          }
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMsg = `Error scanning ${mintAddress}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    stats.endTime = Date.now();
    const duration = (stats.endTime - stats.startTime) / 1000;

    console.log(`🎯 Blockchain recovery scan completed in ${duration.toFixed(2)}s`);
    console.log(`📊 Results: ${stats.totalRecovered} NFTs recovered from ${stats.totalScanned} mints`);
    console.log(`🏷️ Collections found: ${stats.collectionsFound.join(', ')}`);

    return { nfts: allNFTs, stats };
  }

  /**
   * Convert blockchain NFTs to our tracking format and save to backend
   */
  async recoverAndSaveNFTs(blockchainNFTs: BlockchainNFT[]): Promise<void> {
    console.log(`💾 Converting and saving ${blockchainNFTs.length} NFTs to backend...`);

    for (const blockchainNFT of blockchainNFTs) {
      try {
        // Determine collection name from metadata or mint address
        const collectionName = this.determineCollectionName(blockchainNFT);
        
        // Generate token ID (we'll use a hash of the mint address for now)
        const tokenId = this.generateTokenIdFromMint(blockchainNFT.mint);

        // Create our tracking format
        const mintedNFT: MintedNFT = {
          id: `recovered_${blockchainNFT.mint}_${Date.now()}`,
          tokenId,
          collectionName,
          walletAddress: blockchainNFT.owner,
          mintSignature: blockchainNFT.transactionSignature,
          mintedAt: blockchainNFT.blockTime * 1000, // Convert to milliseconds
          phase: 'recovered', // Mark as recovered
          price: 0, // We don't know the original price from blockchain scan
          currency: 'LOS', // Default currency
          metadata: {
            mint: blockchainNFT.mint,
            tokenAccount: blockchainNFT.tokenAccount,
            blockTime: blockchainNFT.blockTime,
            slot: blockchainNFT.slot,
            recoveredAt: Date.now(),
            originalMetadata: blockchainNFT.metadata
          }
        };

        // Save to backend
        nftTrackingService.trackMintedNFT(mintedNFT);
        
        console.log(`✅ Recovered NFT: ${collectionName} #${tokenId} for ${blockchainNFT.owner.slice(0, 8)}...`);

      } catch (error) {
        console.error(`❌ Error recovering NFT ${blockchainNFT.mint}:`, error);
      }
    }

    console.log(`🎯 NFT recovery and save completed`);
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
   * Get token metadata from Analos
   */
  private async getTokenMetadata(tokenAccount: string): Promise<any> {
    try {
      // Query Analos metadata API
      const response = await fetch(`${this.ANALOS_EXPLORER_URL}/api/v1/token-metadata/${tokenAccount}`);
      const metadata: any = await response.json();

      if (metadata && metadata.name) {
        return metadata;
      }

      // Fallback metadata
      return {
        mint: tokenAccount,
        name: `NFT #${tokenAccount.slice(0, 8)}`,
        symbol: 'NFT',
        description: 'NFT from Analos blockchain',
        image: `https://api.analos-nft-launcher.com/nft-image/placeholder/${tokenAccount}`
      };
    } catch (error) {
      console.error('Error getting token metadata from Analos:', error);
      return {
        mint: tokenAccount,
        name: `NFT #${tokenAccount.slice(0, 8)}`,
        symbol: 'NFT',
        description: 'NFT from Analos blockchain',
        image: `https://api.analos-nft-launcher.com/nft-image/placeholder/${tokenAccount}`
      };
    }
  }

  /**
   * Determine collection name from NFT data
   */
  private determineCollectionName(nft: BlockchainNFT): string {
    // Try metadata first
    if (nft.metadata?.collection) {
      return nft.metadata.collection;
    }

    // Try to extract from mint address or use known mapping
    const mintToCollection: Record<string, string> = {
      '3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB': 'Los Bros',
      // Add more mappings as needed
    };

    return mintToCollection[nft.mint] || `Collection_${nft.mint.slice(0, 8)}`;
  }

  /**
   * Generate token ID from mint address
   */
  private generateTokenIdFromMint(mint: string): number {
    // Use a simple hash of the mint address to generate a consistent token ID
    let hash = 0;
    for (let i = 0; i < mint.length; i++) {
      const char = mint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 10000 + 1; // Generate ID between 1-10000
  }

  /**
   * Scan for NFTs by wallet address using Analos APIs
   */
  async scanWalletForNFTs(walletAddress: string): Promise<BlockchainNFT[]> {
    try {
      console.log(`🔍 Scanning Analos wallet ${walletAddress} for NFTs...`);
      
      const allNFTs: BlockchainNFT[] = [];

      // Use Analos RPC API to get wallet's token accounts
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
      
      if (!data.result || !data.result.value) {
        console.log(`📊 No token accounts found for wallet ${walletAddress}`);
        return [];
      }

      console.log(`📊 Found ${data.result.value.length} token accounts for wallet ${walletAddress}`);

      for (const tokenAccount of data.result.value) {
        try {
          // Parse token account to get mint
          const mint = this.parseTokenAccountMintFromBase64(tokenAccount.account.data[0]);
          if (!mint) continue;

          // Skip if we don't know this mint
          if (!this.knownMints.has(mint)) continue;

          // Get transaction history from Analos explorer
          const txResponse = await fetch(`${this.ANALOS_EXPLORER_URL}/api/v1/transactions?account=${tokenAccount.pubkey}&limit=1`);
          const txData: any = await txResponse.json();

          const metadata = await this.getTokenMetadata(tokenAccount.pubkey);

          const nft: BlockchainNFT = {
            mint,
            owner: walletAddress,
            tokenAccount: tokenAccount.pubkey,
            metadata,
            transactionSignature: txData.transactions?.[0]?.signature || 'unknown',
            blockTime: txData.transactions?.[0]?.blockTime || 0,
            slot: txData.transactions?.[0]?.slot || 0
          };

          allNFTs.push(nft);
          console.log(`✅ Found Analos NFT in wallet: ${mint} owned by ${walletAddress.slice(0, 8)}...`);

        } catch (error) {
          console.error(`❌ Error processing token account ${tokenAccount.pubkey}:`, error);
        }
      }

      console.log(`🎯 Scanned Analos wallet ${walletAddress}: Found ${allNFTs.length} NFTs`);
      return allNFTs;

    } catch (error) {
      console.error(`❌ Error scanning Analos wallet ${walletAddress}:`, error);
      return [];
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

  /**
   * Get recovery report
   */
  async getRecoveryReport(): Promise<{
    totalNFTs: number;
    totalUsers: number;
    totalCollections: number;
    stats: any;
  }> {
    try {
      const allNFTs = nftTrackingService.getAllNFTs();
      const allUserStats = nftTrackingService.getAllUserStats();
      const allCollectionStats = nftTrackingService.getAllCollectionStats();

      return {
        totalNFTs: allNFTs.length,
        totalUsers: Object.keys(allUserStats).length,
        totalCollections: Object.keys(allCollectionStats).length,
        stats: {
          users: allUserStats,
          collections: allCollectionStats
        }
      };
    } catch (error) {
      console.error('Error getting recovery report:', error);
      return {
        totalNFTs: 0,
        totalUsers: 0,
        totalCollections: 0,
        stats: { users: {}, collections: {} }
      };
    }
  }
}

// Export singleton instance
export const blockchainRecoveryService = new BlockchainRecoveryService();
