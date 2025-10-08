/**
 * Blockchain Recovery Service
 * Scans the blockchain to recover all existing minted NFTs
 * Rebuilds the NFT tracking database from on-chain data
 */

// Using Analos blockchain APIs instead of Solana Web3.js
import { nftTrackingService, MintedNFT } from './nft-tracking-service';

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
   * Scan for NFTs from a specific mint address
   */
  async scanMintForNFTs(mintAddress: string): Promise<BlockchainNFT[]> {
    try {
      console.log(`🔍 Scanning mint ${mintAddress} for NFTs...`);
      
      const mint = new PublicKey(mintAddress);
      const nfts: BlockchainNFT[] = [];

      // Get all token accounts for this mint (using RPC method)
      const tokenAccounts = await this.connection.getProgramAccounts(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), {
        filters: [
          {
            dataSize: 165, // Token account data size
          },
          {
            memcmp: {
              offset: 0,
              bytes: mint.toBase58(),
            },
          },
        ],
      });
      
      console.log(`📊 Found ${tokenAccounts.length} token accounts for mint ${mintAddress}`);

      for (const { pubkey, account } of tokenAccounts) {
        try {
          // Get account info to find owner
          const accountInfo = await this.connection.getAccountInfo(pubkey);
          if (!accountInfo || !accountInfo.data) continue;

          // Parse token account data to get owner
          const owner = this.parseTokenAccountOwner(accountInfo.data);
          if (!owner) continue;

          // Get transaction history to find creation transaction
          const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit: 1 });
          if (signatures.length === 0) continue;

          const transaction = await this.connection.getTransaction(signatures[0].signature, {
            maxSupportedTransactionVersion: 0
          });

          if (!transaction) continue;

          // Try to get metadata if available
          const metadata = await this.getTokenMetadata(pubkey);

          const nft: BlockchainNFT = {
            mint: mintAddress,
            owner: owner.toString(),
            tokenAccount: pubkey.toString(),
            metadata,
            transactionSignature: signatures[0].signature,
            blockTime: signatures[0].blockTime || 0,
            slot: signatures[0].slot
          };

          nfts.push(nft);
          console.log(`✅ Found NFT: ${mintAddress} owned by ${owner.toString().slice(0, 8)}...`);

        } catch (error) {
          console.error(`❌ Error processing token account ${pubkey.toString()}:`, error);
        }
      }

      console.log(`🎯 Scanned ${mintAddress}: Found ${nfts.length} NFTs`);
      return nfts;

    } catch (error) {
      console.error(`❌ Error scanning mint ${mintAddress}:`, error);
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
   * Parse token account data to extract owner
   */
  private parseTokenAccountOwner(data: Buffer): PublicKey | null {
    try {
      // Token account layout: owner is at offset 32 (32 bytes)
      if (data.length < 64) return null;
      
      const ownerBytes = data.slice(32, 64);
      return new PublicKey(ownerBytes);
    } catch (error) {
      console.error('Error parsing token account owner:', error);
      return null;
    }
  }

  /**
   * Get token metadata (simplified - would need full metadata program integration)
   */
  private async getTokenMetadata(tokenAccount: PublicKey): Promise<any> {
    try {
      // This is a simplified version - in production, you'd query the Metaplex metadata program
      // For now, we'll return basic info that we can extract
      return {
        mint: tokenAccount.toString(),
        // Additional metadata would be fetched from Metaplex metadata program
      };
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return null;
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
   * Scan for NFTs by wallet address
   */
  async scanWalletForNFTs(walletAddress: string): Promise<BlockchainNFT[]> {
    try {
      console.log(`🔍 Scanning wallet ${walletAddress} for NFTs...`);
      
      const wallet = new PublicKey(walletAddress);
      const allNFTs: BlockchainNFT[] = [];

      // Get all token accounts owned by this wallet
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(wallet, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token program
      });

      console.log(`📊 Found ${tokenAccounts.value.length} token accounts for wallet ${walletAddress}`);

      for (const { pubkey, account } of tokenAccounts.value) {
        try {
          // Parse token account to get mint
          const mint = this.parseTokenAccountMint(account.data);
          if (!mint) continue;

          // Skip if we don't know this mint
          if (!this.knownMints.has(mint.toString())) continue;

          // Get transaction history
          const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit: 1 });
          if (signatures.length === 0) continue;

          const metadata = await this.getTokenMetadata(pubkey);

          const nft: BlockchainNFT = {
            mint: mint.toString(),
            owner: walletAddress,
            tokenAccount: pubkey.toString(),
            metadata,
            transactionSignature: signatures[0].signature,
            blockTime: signatures[0].blockTime || 0,
            slot: signatures[0].slot
          };

          allNFTs.push(nft);
          console.log(`✅ Found NFT in wallet: ${mint.toString()} owned by ${walletAddress.slice(0, 8)}...`);

        } catch (error) {
          console.error(`❌ Error processing token account ${pubkey.toString()}:`, error);
        }
      }

      console.log(`🎯 Scanned wallet ${walletAddress}: Found ${allNFTs.length} NFTs`);
      return allNFTs;

    } catch (error) {
      console.error(`❌ Error scanning wallet ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Parse token account data to extract mint
   */
  private parseTokenAccountMint(data: Buffer): PublicKey | null {
    try {
      // Token account layout: mint is at offset 0 (32 bytes)
      if (data.length < 32) return null;
      
      const mintBytes = data.slice(0, 32);
      return new PublicKey(mintBytes);
    } catch (error) {
      console.error('Error parsing token account mint:', error);
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
