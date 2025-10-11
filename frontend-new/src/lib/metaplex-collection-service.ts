import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createNft, 
  findMetadataPda,
  findMasterEditionPda,
  mplTokenMetadata,
  createCollectionV1,
  findCollectionPda,
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  some,
  none
} from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: number;
  mintPrice: number;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  collection?: {
    name: string;
    family: string;
  };
}

export class MetaplexCollectionService {
  private connection: Connection;
  private umi: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.umi = createUmi(connection.rpcEndpoint)
      .use(mplTokenMetadata())
      .use(walletAdapterIdentity(wallet));
  }

  async createCollection(metadata: CollectionMetadata): Promise<string> {
    try {
      console.log('🏗️ Creating Metaplex collection with metadata:', metadata);
      
      const collectionMint = generateSigner(this.umi);
      const collectionPda = findCollectionPda(this.umi, {
        mint: collectionMint.publicKey,
      });

      // Create collection NFT with proper metadata
      await createCollectionV1(this.umi, {
        collection: collectionMint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.image, // We'll use the image URL as URI for now
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        isMutable: true,
      }).sendAndConfirm(this.umi);

      console.log('✅ Metaplex collection created:', collectionMint.publicKey);
      return collectionMint.publicKey.toString();
    } catch (error) {
      console.error('❌ Error creating Metaplex collection:', error);
      throw error;
    }
  }

  async createNFT(
    collectionMint: string,
    tokenId: number,
    metadata: NFTMetadata,
    receiver: PublicKey
  ): Promise<string> {
    try {
      console.log(`🎨 Creating Metaplex NFT #${tokenId} for collection:`, collectionMint);
      
      const mint = generateSigner(this.umi);
      const metadataPda = findMetadataPda(this.umi, {
        mint: mint.publicKey,
      });
      const masterEditionPda = findMasterEditionPda(this.umi, {
        mint: mint.publicKey,
      });
      const collectionPda = findCollectionPda(this.umi, {
        mint: umiPublicKey(collectionMint),
      });

      // Create NFT with proper metadata
      await createNft(this.umi, {
        mint,
        authority: this.umi.identity,
        owner: umiPublicKey(receiver.toString()),
        name: `${metadata.name} #${tokenId}`,
        symbol: metadata.symbol,
        uri: metadata.image, // We'll use the image URL as URI for now
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        collection: some(collectionPda),
        isMutable: true,
      }).sendAndConfirm(this.umi);

      console.log('✅ Metaplex NFT created:', mint.publicKey);
      return mint.publicKey.toString();
    } catch (error) {
      console.error('❌ Error creating Metaplex NFT:', error);
      throw error;
    }
  }

  async getCollectionInfo(collectionMint: string): Promise<CollectionMetadata | null> {
    try {
      // In a real implementation, we'd fetch from the blockchain
      // For now, return basic info for The LosBros collection
      return {
        name: 'The LosBros',
        symbol: 'LBS',
        description: 'The LosBros - The ultimate NFT collection for the Analos ecosystem with 4,200 unique pieces.',
        image: 'https://picsum.photos/300/300?random=collection',
        totalSupply: 1000,
        mintPrice: 4200.69
      };
    } catch (error) {
      console.error('❌ Error fetching collection info:', error);
      return null;
    }
  }

  async getNFTMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      // In a real implementation, we'd fetch from Metaplex metadata
      // For now, return basic info
      return {
        name: `LOL NFT #${mintAddress.slice(0, 8)}`,
        symbol: 'LOL',
        description: 'The LosBros NFT - Part of the ultimate NFT collection for the Analos ecosystem.',
        image: `https://picsum.photos/300/300?random=${mintAddress.slice(0, 8)}`,
        collection: {
          name: 'The LosBros',
          family: 'LBS'
        }
      };
    } catch (error) {
      console.error('❌ Error fetching NFT metadata:', error);
      return null;
    }
  }
}
