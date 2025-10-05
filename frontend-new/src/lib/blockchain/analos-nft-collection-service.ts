import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  Keypair
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  createMintToInstruction,
  createAccount,
  mintTo,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  sellerFeeBasisPoints: number;
  maxSupply?: number;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
}

export interface CollectionCreationResult {
  success: boolean;
  collectionMint?: string;
  collectionMetadata?: string;
  collectionMasterEdition?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export interface NFTInCollection {
  mintAddress: string;
  tokenAccount: string;
  owner: string;
  metadata?: any;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export class AnalosNFTCollectionService {
  private connection: Connection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Create a new NFT collection
   */
  async createCollection(
    collectionConfig: CollectionConfig,
    creatorAddress: string,
    sendTransaction: (transaction: Transaction) => Promise<string>
  ): Promise<CollectionCreationResult> {
    try {
      console.log('🏛️ Creating NFT Collection on Analos...');
      console.log('📋 Collection Config:', collectionConfig);

      const creatorPublicKey = new PublicKey(creatorAddress);

      // Create collection mint
      const collectionMintKeypair = Keypair.generate();
      const collectionMint = collectionMintKeypair.publicKey;

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Create transaction
      const transaction = new Transaction();

      // Add recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Create collection mint account instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: creatorPublicKey,
        newAccountPubkey: collectionMint,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      });

      transaction.add(createMintInstruction);

      // Initialize collection mint instruction - FIXED: Use createInitializeMintInstruction
      const initializeMintInstruction = createInitializeMintInstruction(
        collectionMint,   // mint address
        0,                // decimals (0 for NFTs)
        creatorPublicKey, // mint authority
        creatorPublicKey  // freeze authority
      );

      transaction.add(initializeMintInstruction);

      // Add signers
      transaction.sign(collectionMintKeypair);

      console.log('🔐 Sending collection creation transaction...');

      // Send transaction
      const signature = await sendTransaction(transaction);

      console.log('🎉 Collection created successfully!');
      console.log('🏛️ Collection Mint:', collectionMint.toBase58());
      console.log('📝 Transaction Signature:', signature);

      // Store collection info locally
      const collectionData = {
        ...collectionConfig,
        collectionMint: collectionMint.toBase58(),
        creator: creatorAddress,
        createdAt: new Date().toISOString(),
        transactionSignature: signature,
        nfts: []
      };

      const existingCollections = JSON.parse(localStorage.getItem('analos_collections') || '[]');
      existingCollections.push(collectionData);
      localStorage.setItem('analos_collections', JSON.stringify(existingCollections));

      return {
        success: true,
        collectionMint: collectionMint.toBase58(),
        collectionMetadata: '', // TODO: Implement Metaplex metadata
        collectionMasterEdition: '', // TODO: Implement Master Edition
        transactionSignature: signature,
        explorerUrl: `https://explorer.analos.io/tx/${signature}`
      };

    } catch (error) {
      console.error('❌ Collection creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mint an NFT to an existing collection
   */
  async mintNFTToCollection(
    collectionMint: string,
    nftData: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    },
    ownerAddress: string,
    sendTransaction: (transaction: Transaction) => Promise<string>
  ): Promise<{
    success: boolean;
    nftMint?: string;
    tokenAccount?: string;
    transactionSignature?: string;
    error?: string;
  }> {
    try {
      console.log('🎨 Minting NFT to collection:', collectionMint);
      console.log('📋 NFT Data:', nftData);

      const ownerPublicKey = new PublicKey(ownerAddress);
      const collectionMintPublicKey = new PublicKey(collectionMint);

      // Create NFT mint
      const nftMintKeypair = Keypair.generate();
      const nftMint = nftMintKeypair.publicKey;

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        nftMint,
        ownerPublicKey
      );

      // Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Create transaction
      const transaction = new Transaction();

      // Add recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Create NFT mint account instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: nftMint,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      });

      transaction.add(createMintInstruction);

      // Initialize NFT mint instruction - FIXED: Use createInitializeMintInstruction
      const initializeMintInstruction = createInitializeMintInstruction(
        nftMint,        // mint address
        0,              // decimals (0 for NFTs)
        ownerPublicKey, // mint authority
        ownerPublicKey  // freeze authority
      );

      transaction.add(initializeMintInstruction);

      // Create associated token account instruction
      const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        ownerPublicKey, // payer
        tokenAccount,   // associated token account
        ownerPublicKey, // owner
        nftMint         // mint
      );

      transaction.add(createTokenAccountInstruction);

      // Mint token instruction (1 token for NFT) - FIXED: Use createMintToInstruction
      const mintToInstruction = createMintToInstruction(
        nftMint,        // mint
        tokenAccount,   // destination
        ownerPublicKey, // authority
        1,              // amount (1 for NFT)
        []              // multiSigners
      );

      transaction.add(mintToInstruction);

      // Add signers
      transaction.sign(nftMintKeypair);

      console.log('🔐 Sending NFT minting transaction...');

      // Send transaction
      const signature = await sendTransaction(transaction);

      console.log('🎉 NFT minted to collection successfully!');
      console.log('🎨 NFT Mint:', nftMint.toBase58());
      console.log('🔗 Token Account:', tokenAccount.toBase58());

      // Update collection with new NFT
      const existingCollections = JSON.parse(localStorage.getItem('analos_collections') || '[]');
      const collectionIndex = existingCollections.findIndex((col: any) => col.collectionMint === collectionMint);
      
      if (collectionIndex !== -1) {
        existingCollections[collectionIndex].nfts.push({
          mintAddress: nftMint.toBase58(),
          tokenAccount: tokenAccount.toBase58(),
          owner: ownerAddress,
          metadata: nftData,
          createdAt: new Date().toISOString(),
          transactionSignature: signature
        });
        localStorage.setItem('analos_collections', JSON.stringify(existingCollections));
      }

      return {
        success: true,
        nftMint: nftMint.toBase58(),
        tokenAccount: tokenAccount.toBase58(),
        transactionSignature: signature
      };

    } catch (error) {
      console.error('❌ NFT minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all collections
   */
  getAllCollections(): any[] {
    try {
      return JSON.parse(localStorage.getItem('analos_collections') || '[]');
    } catch (error) {
      console.error('Error retrieving collections:', error);
      return [];
    }
  }

  /**
   * Get NFTs in a collection
   */
  getNFTsInCollection(collectionMint: string): NFTInCollection[] {
    try {
      const collections = this.getAllCollections();
      const collection = collections.find((col: any) => col.collectionMint === collectionMint);
      return collection ? collection.nfts : [];
    } catch (error) {
      console.error('Error retrieving NFTs in collection:', error);
      return [];
    }
  }

  /**
   * Get collection by mint address
   */
  getCollection(collectionMint: string): any {
    try {
      const collections = this.getAllCollections();
      return collections.find((col: any) => col.collectionMint === collectionMint);
    } catch (error) {
      console.error('Error retrieving collection:', error);
      return null;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    slot: number;
    blockHeight: number;
    network: string;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        connected: true,
        rpcUrl: this.ANALOS_RPC_URL,
        slot,
        blockHeight,
        network: 'Analos'
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      return {
        connected: false,
        rpcUrl: this.ANALOS_RPC_URL,
        slot: 0,
        blockHeight: 0,
        network: 'Analos'
      };
    }
  }
}

// Export singleton instance
export const analosNFTCollectionService = new AnalosNFTCollectionService();
