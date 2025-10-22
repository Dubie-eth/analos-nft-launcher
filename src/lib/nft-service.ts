import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { metadataService } from './metadata-service';
import { 
  findMetadataPda, 
  getMetadataAccount
} from '@metaplex-foundation/mpl-token-metadata';

// NFT Service for fetching user NFTs directly from blockchain
export class NFTService {
  private connection: Connection;

  constructor(rpcUrl: string = ANALOS_RPC_URL) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  // Fetch all NFTs for a wallet address using Metaplex standards
  async getUserNFTs(walletAddress: string) {
    try {
      console.log('🔍 Fetching NFTs for wallet:', walletAddress);
      
      // Get all token accounts owned by this wallet
      const result = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Filter for NFTs (tokens with amount = 1 and decimals = 0)
      const nfts = result.value.filter((account) => {
        const tokenData = account.account.data.parsed.info;
        return (
          tokenData.tokenAmount.decimals === 0 &&
          tokenData.tokenAmount.amount === '1'
        );
      });

      console.log(`📊 Found ${nfts.length} potential NFTs for user`);

      const processedNFTs = await Promise.all(
        nfts.map(async (nft) => {
          try {
            const mintAddress = nft.account.data.parsed.info.mint;
            
            // Use Metaplex standards to get NFT metadata
            const metadataPda = findMetadataPda({ mint: new PublicKey(mintAddress) });
            
            try {
              // Try to get metadata account using Metaplex standards
              const metadataAccount = await getMetadataAccount(this.connection, metadataPda);
              
              if (metadataAccount) {
                // Fetch the JSON metadata from URI
                let metadataJSON = null;
                if (metadataAccount.uri) {
                  metadataJSON = await metadataService.fetchMetadataJSON(metadataAccount.uri);
                }

                return {
                  mint: mintAddress,
                  name: metadataAccount.name || `NFT #${mintAddress.slice(0, 8)}`,
                  symbol: metadataAccount.symbol || 'NFT',
                  image: metadataJSON?.image || '/api/placeholder/400/400',
                  description: metadataJSON?.description || 'NFT from Analos',
                  attributes: metadataJSON?.attributes || [],
                  collection: metadataAccount.collection?.toString() || '',
                  verified: metadataAccount.collection?.verified || false,
                  creators: metadataAccount.creators || [],
                  sellerFeeBasisPoints: metadataAccount.sellerFeeBasisPoints || 0,
                  primarySaleHappened: metadataAccount.primarySaleHappened || false,
                  isMutable: metadataAccount.isMutable || true,
                  updateAuthority: metadataAccount.updateAuthority?.toString() || ''
                };
              }
            } catch (metaplexError) {
              console.warn(`Metaplex metadata not found for ${mintAddress}, trying fallback`);
            }

            // Fallback: Use our existing metadata service
            const metadata = await metadataService.getMetadata(mintAddress);
            
            if (metadata) {
              // Fetch the JSON metadata from URI
              let metadataJSON = null;
              if (metadata.uri) {
                metadataJSON = await metadataService.fetchMetadataJSON(metadata.uri);
              }

              return {
                mint: mintAddress,
                name: metadata.name || `NFT #${mintAddress.slice(0, 8)}`,
                symbol: metadata.symbol || 'NFT',
                image: metadataJSON?.image || '/api/placeholder/400/400',
                description: metadataJSON?.description || 'NFT from Analos',
                attributes: metadataJSON?.attributes || [],
                collection: metadata.collection?.toString() || '',
                verified: false,
                creators: [],
                sellerFeeBasisPoints: 0,
                primarySaleHappened: false,
                isMutable: true,
                updateAuthority: metadata.updateAuthority?.toString() || ''
              };
            } else {
              // Final fallback for NFTs without metadata
              return {
                mint: mintAddress,
                name: `NFT #${mintAddress.slice(0, 8)}`,
                symbol: 'NFT',
                image: '/api/placeholder/400/400',
                description: 'NFT from Analos',
                attributes: [],
                collection: '',
                verified: false,
                creators: [],
                sellerFeeBasisPoints: 0,
                primarySaleHappened: false,
                isMutable: true,
                updateAuthority: ''
              };
            }
          } catch (error) {
            console.warn(`Failed to load NFT ${nft.account.data.parsed.info.mint}:`, error);
            return null;
          }
        })
      );

      // Filter out failed loads
      const validNFTs = processedNFTs.filter(nft => nft !== null);

      return {
        wallet: walletAddress,
        nfts: validNFTs,
        total: validNFTs.length,
        collections: this.groupByCollection(validNFTs),
        message: `Found ${validNFTs.length} NFTs`
      };

    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw new Error('Failed to fetch NFTs from blockchain');
    }
  }

  // Group NFTs by collection
  private groupByCollection(nfts: any[]) {
    const collections = new Map();
    
    nfts.forEach(nft => {
      if (nft.collection) {
        const collectionKey = nft.collection;
        if (!collections.has(collectionKey)) {
          collections.set(collectionKey, {
            address: collectionKey,
            name: nft.collection,
            verified: nft.verified,
            count: 0,
            nfts: []
          });
        }
        collections.get(collectionKey).count++;
        collections.get(collectionKey).nfts.push(nft);
      }
    });

    return Array.from(collections.values());
  }

  // Get NFT details for explorer
  async getNFTDetails(mintAddress: string) {
    try {
      const metadata = await metadataService.getMetadata(mintAddress);
      
      if (metadata) {
        // Fetch the JSON metadata from URI
        let metadataJSON = null;
        if (metadata.uri) {
          metadataJSON = await metadataService.fetchMetadataJSON(metadata.uri);
        }

        return {
          mint: mintAddress,
          name: metadata.name || `NFT #${mintAddress.slice(0, 8)}`,
          symbol: metadata.symbol || 'NFT',
          image: metadataJSON?.image || '/api/placeholder/400/400',
          description: metadataJSON?.description || 'NFT from Analos',
          attributes: metadataJSON?.attributes || [],
          collection: metadata.collection?.toString() || '',
          verified: false,
          creators: [],
          sellerFeeBasisPoints: 0,
          primarySaleHappened: false,
          isMutable: true,
          updateAuthority: metadata.updateAuthority?.toString() || ''
        };
      } else {
        // Fallback for NFTs without metadata
        return {
          mint: mintAddress,
          name: `NFT #${mintAddress.slice(0, 8)}`,
          symbol: 'NFT',
          image: '/api/placeholder/400/400',
          description: 'NFT from Analos',
          attributes: [],
          collection: '',
          verified: false,
          creators: [],
          sellerFeeBasisPoints: 0,
          primarySaleHappened: false,
          isMutable: true,
          updateAuthority: ''
        };
      }
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      throw new Error('Failed to fetch NFT details');
    }
  }

  // Create a new NFT with metadata (for profile NFTs)
  async createProfileNFT(
    walletAddress: string,
    name: string,
    symbol: string,
    description: string,
    imageUri: string,
    attributes: Array<{ trait_type: string; value: string }>
  ) {
    try {
      console.log('🎭 Creating profile NFT for:', walletAddress);
      
      // This would integrate with your existing minting service
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Profile NFT creation will be implemented with your existing minting service',
        mintAddress: 'placeholder-mint-address',
        metadataUri: imageUri
      };
    } catch (error) {
      console.error('Error creating profile NFT:', error);
      throw new Error('Failed to create profile NFT');
    }
  }
}

// Export singleton instance
export const nftService = new NFTService();
