import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

// NFT Service for fetching user NFTs directly from blockchain
export class NFTService {
  private connection: Connection;
  private metaplex: Metaplex;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.metaplex = Metaplex.make(this.connection);
  }

  // Fetch all NFTs for a wallet address
  async getUserNFTs(walletAddress: string) {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get all NFT accounts owned by this wallet
      const nfts = await this.metaplex
        .nfts()
        .findAllByOwner({ owner: publicKey });

      // Process NFT data
      const processedNFTs = await Promise.all(
        nfts.map(async (nft) => {
          try {
            // Get full NFT metadata
            const fullNft = await this.metaplex.nfts().load({ metadata: nft });
            
            return {
              mint: nft.address.toString(),
              name: fullNft.name,
              symbol: fullNft.symbol,
              image: fullNft.json?.image,
              description: fullNft.json?.description,
              attributes: fullNft.json?.attributes,
              collection: fullNft.collection?.address?.toString(),
              verified: fullNft.collection?.verified,
              creators: fullNft.creators?.map(creator => ({
                address: creator.address.toString(),
                verified: creator.verified,
                share: creator.share
              })),
              sellerFeeBasisPoints: fullNft.sellerFeeBasisPoints,
              primarySaleHappened: fullNft.primarySaleHappened,
              isMutable: fullNft.isMutable,
              updateAuthority: fullNft.updateAuthorityAddress.toString()
            };
          } catch (error) {
            console.warn(`Failed to load NFT ${nft.address}:`, error);
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
      const mint = new PublicKey(mintAddress);
      const nft = await this.metaplex.nfts().load({ metadata: mint });
      
      return {
        mint: mintAddress,
        name: nft.name,
        symbol: nft.symbol,
        image: nft.json?.image,
        description: nft.json?.description,
        attributes: nft.json?.attributes,
        collection: nft.collection?.address?.toString(),
        verified: nft.collection?.verified,
        creators: nft.creators,
        sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
        primarySaleHappened: nft.primarySaleHappened,
        isMutable: nft.isMutable,
        updateAuthority: nft.updateAuthorityAddress.toString()
      };
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      throw new Error('Failed to fetch NFT details');
    }
  }
}

// Export singleton instance
export const nftService = new NFTService(
  process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
);
