import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createGenericFileFromBrowserFile } from '@metaplex-foundation/umi';
import { 
  createNft, 
  findMetadataPda,
  findMasterEditionPda,
  mplTokenMetadata,
  verifyCollectionV1,
  createCollectionV1,
  findCollectionAuthorityRecordPda,
  findCollectionPda,
  mplToolbox
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  generateSigner, 
  percentAmount, 
  publicKey,
  some,
  none
} from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { Connection, PublicKey } from '@solana/web3.js';

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family: string;
  };
}

export class MetaplexService {
  private umi: any;

  constructor(connection: Connection, wallet: any) {
    this.umi = createUmi(connection.rpcEndpoint)
      .use(mplTokenMetadata())
      .use(mplToolbox())
      .use(walletAdapterIdentity(wallet));
  }

  async createCollection(metadata: CollectionMetadata): Promise<string> {
    try {
      console.log('🏗️ Creating collection with metadata:', metadata);
      
      const collectionMint = generateSigner(this.umi);
      const collectionPda = findCollectionPda(this.umi, {
        mint: collectionMint.publicKey,
      });

      // Create collection NFT
      await createCollectionV1(this.umi, {
        collection: collectionMint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.image, // We'll use the image URL as URI for now
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        isMutable: true,
      }).sendAndConfirm(this.umi);

      console.log('✅ Collection created:', collectionMint.publicKey);
      return collectionMint.publicKey.toString();
    } catch (error) {
      console.error('❌ Error creating collection:', error);
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
      console.log(`🎨 Creating NFT #${tokenId} for collection:`, collectionMint);
      
      const mint = generateSigner(this.umi);
      const metadataPda = findMetadataPda(this.umi, {
        mint: mint.publicKey,
      });
      const masterEditionPda = findMasterEditionPda(this.umi, {
        mint: mint.publicKey,
      });
      const collectionPda = findCollectionPda(this.umi, {
        mint: publicKey(collectionMint),
      });

      // Create NFT with metadata
      await createNft(this.umi, {
        mint,
        authority: this.umi.identity,
        owner: publicKey(receiver.toString()),
        name: `${metadata.name} #${tokenId}`,
        symbol: metadata.symbol,
        uri: metadata.image, // We'll use the image URL as URI for now
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        collection: some(collectionPda),
        isMutable: true,
      }).sendAndConfirm(this.umi);

      // Verify collection
      await verifyCollectionV1(this.umi, {
        metadata: metadataPda,
        collectionMint: publicKey(collectionMint),
        authority: this.umi.identity,
      }).sendAndConfirm(this.umi);

      console.log('✅ NFT created:', mint.publicKey);
      return mint.publicKey.toString();
    } catch (error) {
      console.error('❌ Error creating NFT:', error);
      throw error;
    }
  }

  async getNFTMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      const metadataPda = findMetadataPda(this.umi, {
        mint: publicKey(mintAddress),
      });

      const metadata = await this.umi.rpc.getAccount(metadataPda);
      if (!metadata.exists) {
        return null;
      }

      // Parse metadata account
      const [metadataAccount] = await this.umi.programs.mplTokenMetadata.accounts.metadataV1.findMany({
        filters: [{ memcmp: { offset: 0, bytes: mintAddress } }]
      });

      if (!metadataAccount) {
        return null;
      }

      // For now, return basic metadata
      // In a full implementation, we'd fetch the URI and parse the JSON
      return {
        name: `NFT #${mintAddress.slice(0, 8)}`,
        symbol: 'NFT',
        description: 'NFT created on LOL platform',
        image: `https://picsum.photos/300/300?random=${mintAddress.slice(0, 8)}`,
        collection: {
          name: 'LOL NFT Collection',
          family: 'LOL'
        }
      };
    } catch (error) {
      console.error('❌ Error fetching NFT metadata:', error);
      return null;
    }
  }

  async getCollectionMetadata(collectionMint: string): Promise<CollectionMetadata | null> {
    try {
      const metadataPda = findMetadataPda(this.umi, {
        mint: publicKey(collectionMint),
      });

      const metadata = await this.umi.rpc.getAccount(metadataPda);
      if (!metadata.exists) {
        return null;
      }

      return {
        name: 'LOL NFT Collection',
        symbol: 'LOL',
        description: 'NFT Collection created on LOL platform',
        image: 'https://picsum.photos/300/300?random=collection'
      };
    } catch (error) {
      console.error('❌ Error fetching collection metadata:', error);
      return null;
    }
  }
}
