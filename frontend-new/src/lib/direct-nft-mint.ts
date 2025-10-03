import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';
import { tokenMetadataService } from './token-metadata-service';
import { tokenIdTracker } from './token-id-tracker';

export interface DirectNFTMintData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  mintPrice?: number;
  paymentToken?: string; // 'LOS' or 'LOL' or other token mint address
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

      // Add payment processing if mintPrice is specified
      console.log('🔍 Payment processing check:', {
        mintPrice: collectionData.mintPrice,
        paymentToken: collectionData.paymentToken,
        hasMintPrice: !!collectionData.mintPrice,
        mintPriceGreaterThanZero: collectionData.mintPrice > 0,
        collectionDataKeys: Object.keys(collectionData),
        fullCollectionData: collectionData
      });
      
      if (collectionData.mintPrice && collectionData.mintPrice > 0) {
        console.log('💰 Processing payment for NFT minting...');
        console.log('💵 Price per NFT:', collectionData.mintPrice);
        console.log('💳 Payment token:', collectionData.paymentToken || 'LOS');
        
        const totalCost = collectionData.mintPrice * quantity;
        
        // Get token metadata for proper decimal handling
        let paymentTokenDecimals = 9; // Default to 9 decimals for safety
        if (collectionData.paymentToken && collectionData.paymentToken !== 'LOS') {
          const tokenMetadata = await tokenMetadataService.getTokenMetadata(collectionData.paymentToken);
          if (tokenMetadata.valid && tokenMetadata.token) {
            paymentTokenDecimals = tokenMetadata.token.decimals;
            console.log('✅ Payment token decimals verified:', paymentTokenDecimals);
          } else {
            console.log('⚠️ Using default decimals for payment token:', paymentTokenDecimals);
          }
        }
        
        if (collectionData.paymentToken === 'LOL') {
          // LOL token payment - THIS SHOULD BE THE DEFAULT FOR THIS COLLECTION
          console.log('💰 Processing LOL token payment:', totalCost, 'LOL');
          const lolMint = new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6'); // LOL token mint
          
          // Get user's LOL token account
          const userLolAccount = await getAssociatedTokenAddress(lolMint, payer);
          
          // Get fee recipient's LOL token account
          const feeRecipientLolAccount = await getAssociatedTokenAddress(
            lolMint, 
            new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW')
          );
          
          // Create LOL transfer instruction
          const lolTransferInstruction = createTransferInstruction(
            userLolAccount, // source
            feeRecipientLolAccount, // destination
            payer, // authority
            totalCost * Math.pow(10, paymentTokenDecimals), // Use verified decimals
          );
          
          transaction.add(lolTransferInstruction);
          console.log('✅ Added LOL token payment instruction');
        } else if (collectionData.paymentToken === 'LOS' || !collectionData.paymentToken) {
          // Native SOL payment - FALLBACK ONLY
          console.log('💰 Processing native SOL payment:', totalCost, 'SOL');
          const paymentInstruction = SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'), // Fee recipient
            lamports: totalCost * LAMPORTS_PER_SOL,
          });
          transaction.add(paymentInstruction);
          console.log('✅ Added SOL payment instruction');
        } else {
          // Other token payment
          console.log('💰 Processing custom token payment:', totalCost, collectionData.paymentToken);
          const tokenMint = new PublicKey(collectionData.paymentToken);
          
          // Get user's token account
          const userTokenAccount = await getAssociatedTokenAddress(tokenMint, payer);
          
          // Get fee recipient's token account
          const feeRecipientTokenAccount = await getAssociatedTokenAddress(
            tokenMint, 
            new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW')
          );
          
          // Create token transfer instruction
          const tokenTransferInstruction = createTransferInstruction(
            userTokenAccount, // source
            feeRecipientTokenAccount, // destination
            payer, // authority
            totalCost * Math.pow(10, paymentTokenDecimals), // Use verified decimals
          );
          
          transaction.add(tokenTransferInstruction);
          console.log('✅ Added custom token payment instruction');
        }
      }

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
        
        const tokenId = tokenIdTracker.addNFT(mintAddress.toBase58(), collectionName, collectionMint, payerAddress);

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
