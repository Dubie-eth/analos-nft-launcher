import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import { tokenIdTracker } from './token-id-tracker';

export interface DirectNFTMintData {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

export class DirectNFTMintService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🎯 Direct NFT Mint Service initialized');
  }

  /**
   * Create real NFT mint transaction directly in frontend
   * This bypasses the backend and creates proper Token Program instructions
   */
  async createRealNFTMintTransaction(
    collectionName: string,
    quantity: number,
    payerAddress: string,
    collectionData: DirectNFTMintData
  ): Promise<{ transaction: Transaction; mintKeypairs: Keypair[] }> {
    try {
      console.log('🎯 Creating REAL NFT mint transaction directly in frontend...');
      console.log('📊 Collection:', collectionName);
      console.log('🔢 Quantity:', quantity);
      console.log('💰 Payer:', payerAddress);

      const payer = new PublicKey(payerAddress);
      const transaction = new Transaction();

      // Get rent exemption amounts
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      const mintKeypairs: Keypair[] = [];

      for (let i = 0; i < quantity; i++) {
        const nftNumber = i + 1;
        const mintKeypair = Keypair.generate();
        const mintAddress = mintKeypair.publicKey;
        mintKeypairs.push(mintKeypair);

        // 1. Create mint account
        const createMintAccountIx = SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintAddress,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        });

        // 2. Initialize mint
        const initializeMintIx = createInitializeMintInstruction(
          mintAddress,
          0, // decimals (0 for NFTs)
          payer, // mint authority
          payer  // freeze authority
        );

        // 3. Create associated token account
        const associatedTokenAddress = await getAssociatedTokenAddress(
          mintAddress,
          payer
        );

        const createATAIx = createAssociatedTokenAccountInstruction(
          payer, // payer
          associatedTokenAddress, // associated token account
          payer, // owner
          mintAddress // mint
        );

        // 4. Mint token to associated token account
        const mintToIx = createMintToInstruction(
          mintAddress, // mint
          associatedTokenAddress, // destination
          payer, // authority
          1 // amount (1 for NFT)
        );

        // Add all instructions to transaction
        transaction.add(createMintAccountIx);
        transaction.add(initializeMintIx);
        transaction.add(createATAIx);
        transaction.add(mintToIx);

        // Track the NFT in our enhanced token ID system
        const collectionMint = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Create collection if it doesn't exist
        if (!tokenIdTracker.getCollectionInfo(collectionMint)) {
          tokenIdTracker.createCollection(collectionMint, collectionName, 1000, 4200.69);
        }
        
        const tokenId = tokenIdTracker.addNFT(mintAddress.toBase58(), collectionName, collectionMint, payerAddress.toBase58());

        console.log(`✅ Added REAL Token Program instructions for NFT #${nftNumber}`);
        console.log(`   Mint: ${mintAddress.toBase58()}`);
        console.log(`   ATA: ${associatedTokenAddress.toBase58()}`);
        console.log(`   Collection: ${collectionName} #${tokenId}`);
      }

      // Set recent blockhash and fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      console.log(`🎯 Created REAL NFT mint transaction with ${transaction.instructions.length} Token Program instructions`);
      console.log(`📊 Total instructions: ${transaction.instructions.length} (${quantity} NFTs × 4 instructions each)`);

      return { transaction, mintKeypairs };

    } catch (error) {
      console.error('❌ Error creating REAL NFT mint transaction:', error);
      throw error;
    }
  }

  /**
   * Get the transaction signature for verification
   */
  getExplorerUrl(signature: string): string {
    return `https://explorer.analos.io/tx/${signature}`;
  }
}

export default DirectNFTMintService;
