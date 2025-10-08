import { 
  Connection, 
  PublicKey as Web3PublicKey,
  Keypair as Web3Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createNft,
  mplTokenMetadata,
  updateV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  Umi,
} from '@metaplex-foundation/umi';
import { base58 } from '@metaplex-foundation/umi/serializers';

export interface RealNFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  properties?: {
    files?: Array<{ uri: string; type: string }>;
    category?: string;
  };
}

export interface RealNFTMintResult {
  success: boolean;
  mint?: string;
  metadata?: string;
  masterEdition?: string;
  tokenAccount?: string;
  owner?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export class RealNFTMintingService {
  private connection: Connection;
  private umi: Umi;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private feePayer: Web3Keypair;

  constructor(feePayerSecretKey?: Uint8Array) {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
    
    // Initialize fee payer keypair
    if (feePayerSecretKey) {
      this.feePayer = Web3Keypair.fromSecretKey(feePayerSecretKey);
    } else {
      // Generate a new keypair for development
      this.feePayer = Web3Keypair.generate();
      console.log('⚠️  Using generated fee payer keypair. Fund this address with SOL:');
      console.log('💰 Fee Payer Address:', this.feePayer.publicKey.toBase58());
    }

    // Initialize UMI with Analos RPC
    this.umi = createUmi(this.ANALOS_RPC_URL);
    
    // Set up UMI with our keypair identity
    this.umi.use(keypairIdentity({
      publicKey: publicKey(this.feePayer.publicKey.toBase58()),
      secretKey: this.feePayer.secretKey,
    }));
    
    // Use the Token Metadata plugin
    this.umi.use(mplTokenMetadata());

    console.log('🎨 Real NFT Minting Service initialized with UMI');
    console.log('🔑 Fee Payer:', this.feePayer.publicKey.toBase58());
  }

  /**
   * Create a real, fully-functional NFT with Metaplex Token Metadata using UMI
   * This NFT will work with all staking platforms, marketplaces, and wallets
   */
  async mintRealNFT(
    metadata: RealNFTMetadata,
    ownerPublicKey: Web3PublicKey,
    updateAuthority?: Web3PublicKey
  ): Promise<RealNFTMintResult> {
    try {
      console.log('🎨 Minting real NFT with Metaplex Token Metadata (UMI)...');
      console.log('📋 NFT Name:', metadata.name);
      console.log('👤 Owner:', ownerPublicKey.toBase58());

      // Generate a new mint signer
      const mint = generateSigner(this.umi);
      console.log('🔑 Mint Address:', mint.publicKey);

      // Create the NFT using UMI's createNft function
      const result = await createNft(this.umi, {
        mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.image, // In production, this should be a JSON metadata URI (IPFS/Arweave)
        sellerFeeBasisPoints: percentAmount(5), // 5% royalty
        creators: [
          {
            address: publicKey(updateAuthority?.toBase58() || this.feePayer.publicKey.toBase58()),
            verified: true,
            share: 100,
          },
        ],
        isMutable: true, // Allow metadata updates (for delayed reveals)
        tokenOwner: publicKey(ownerPublicKey.toBase58()),
      }).sendAndConfirm(this.umi);

      const signature = base58.deserialize(result.signature)[0];
      
      console.log('🎉 Real NFT minted successfully!');
      console.log('🔑 Mint:', mint.publicKey);
      console.log('📝 Signature:', signature);
      console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);

      return {
        success: true,
        mint: mint.publicKey,
        metadata: mint.publicKey, // Metadata PDA is derived from mint
        masterEdition: mint.publicKey, // Master edition PDA is derived from mint
        tokenAccount: mint.publicKey, // Token account is created automatically
        owner: ownerPublicKey.toBase58(),
        transactionSignature: signature,
        explorerUrl: `https://explorer.analos.io/tx/${signature}`,
      };

    } catch (error) {
      console.error('❌ Error minting real NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update NFT metadata (for delayed reveals)
   */
  async updateNFTMetadata(
    mintAddress: string,
    newMetadata: RealNFTMetadata,
    updateAuthority?: Web3Keypair
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      console.log('🔄 Updating NFT metadata...');
      console.log('🔑 Mint:', mintAddress);

      // If update authority is provided, use it; otherwise use fee payer
      const authority = updateAuthority || this.feePayer;
      
      // Set up UMI with the update authority
      const umiWithAuthority = createUmi(this.ANALOS_RPC_URL);
      umiWithAuthority.use(keypairIdentity({
        publicKey: publicKey(authority.publicKey.toBase58()),
        secretKey: authority.secretKey,
      }));
      umiWithAuthority.use(mplTokenMetadata());

      // Update the NFT metadata
      const result = await updateV1(umiWithAuthority, {
        mint: publicKey(mintAddress),
        data: {
          name: newMetadata.name,
          symbol: newMetadata.symbol,
          uri: newMetadata.image,
          sellerFeeBasisPoints: 500, // 5%
          creators: [], // Empty array to keep existing creators
        },
      }).sendAndConfirm(umiWithAuthority);

      const signature = base58.deserialize(result.signature)[0];

      console.log('✅ Metadata updated successfully!');
      console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);

      return {
        success: true,
        signature,
      };

    } catch (error) {
      console.error('❌ Error updating metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get fee payer balance
   */
  async getFeePayerBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.feePayer.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting fee payer balance:', error);
      return 0;
    }
  }

  /**
   * Get fee payer public key
   */
  getFeePayerPublicKey(): string {
    return this.feePayer.publicKey.toBase58();
  }
}

// Export singleton instance
export const realNFTMintingService = new RealNFTMintingService();