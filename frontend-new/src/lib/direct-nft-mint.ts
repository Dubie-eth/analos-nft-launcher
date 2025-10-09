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
import { blockchainFirstService } from './blockchain-first-service';
import { tokenIDConsistencyService } from './token-id-consistency-service';
import { feeManagementService } from './fee-management-service';

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
      
      // Set the fee payer to the user's wallet (not the NFT mint address)
      transaction.feePayer = payer;
      
      // Get recent blockhash for transaction
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

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
            Math.round(totalCost * Math.pow(10, paymentTokenDecimals)), // Ensure integer for BigInt
          );
          
          transaction.add(lolTransferInstruction);
          console.log('✅ Added LOL token payment instruction');
        } else if (collectionData.paymentToken === 'LOS' || !collectionData.paymentToken) {
          // Native LOS payment - FALLBACK ONLY
          console.log('💰 Processing native LOS payment:', totalCost, 'LOS');
          console.log('🔍 Payer address:', payer.toBase58());
          console.log('🔍 Fee recipient:', '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
          console.log('🔍 Amount in lamports:', totalCost * Math.pow(10, 6));
          
          // Check if accounts exist before creating transfer
          try {
            const payerInfo = await this.connection.getAccountInfo(payer);
            const recipientInfo = await this.connection.getAccountInfo(new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'));
            
            if (!payerInfo) {
              throw new Error('Payer account not found on blockchain');
            }
            if (!recipientInfo) {
              throw new Error('Recipient account not found on blockchain');
            }
            
            console.log('✅ Both accounts exist on blockchain');
          } catch (accountError) {
            console.error('❌ Account verification failed:', accountError);
            throw accountError;
          }
          
          const paymentInstruction = SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'), // Fee recipient
            lamports: Math.round(totalCost * Math.pow(10, 6)), // Ensure integer for BigInt, LOS has 6 decimals
          });
          transaction.add(paymentInstruction);
          console.log('✅ Added LOS payment instruction');
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
            Math.round(totalCost * Math.pow(10, paymentTokenDecimals)), // Ensure integer for BigInt
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

        // 1. Create mint account - payer creates the account for the mint
        const createMintAccountIx = SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintAddress,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        });

        // 2. Initialize mint - payer is the mint authority
        const initializeMintIx = createInitializeMintInstruction(
          mintAddress,
          0, // decimals (0 for NFTs)
          payer, // mint authority
          payer  // freeze authority
        );

        // 3. Create associated token account for the user
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

        // 4. Mint token to user's associated token account
        const mintToIx = createMintToInstruction(
          mintAddress, // mint
          associatedTokenAddress, // destination
          payer, // authority (user is the mint authority)
          1 // amount (1 for NFT)
        );

        // Add all instructions to transaction
        transaction.add(createMintAccountIx);
        transaction.add(initializeMintIx);
        transaction.add(createATAIx);
        transaction.add(mintToIx);

        // Reserve consistent token ID and lock metadata
        const lockedMetadata = tokenIDConsistencyService.reserveTokenId(
          collectionName,
          mintAddress.toBase58(),
          payerAddress
        );

        if (!lockedMetadata) {
          throw new Error(`Failed to reserve token ID for NFT #${nftNumber}`);
        }

        // Track the NFT in our enhanced token ID system
        const collectionMint = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Create collection if it doesn't exist
        if (!tokenIdTracker.getCollectionInfo(collectionMint)) {
          const totalSupply = lockedMetadata.attributes.collection === 'The LosBros' ? 2222 : 1000;
          tokenIdTracker.createCollection(collectionMint, collectionName, totalSupply, feeManagementService.getTotalMintPrice(collectionName));
        }
        
        const tokenId = tokenIdTracker.addNFT(mintAddress.toBase58(), collectionName, collectionMint, payerAddress);

        console.log(`✅ Added REAL Token Program instructions for NFT #${lockedMetadata.tokenId}`);
        console.log(`   Mint: ${mintAddress.toBase58()}`);
        console.log(`   ATA: ${associatedTokenAddress.toBase58()}`);
        console.log(`   Collection: ${collectionName} #${lockedMetadata.tokenId}`);
        console.log(`   Metadata URI: ${lockedMetadata.metadataUri}`);
        console.log(`   Blockchain Reference: ${lockedMetadata.attributes.blockchain_reference}`);
      }

      // Transaction already has blockhash and feePayer set at the beginning

      console.log(`🎯 Created REAL NFT mint transaction with ${transaction.instructions.length} Token Program instructions`);
      console.log(`📊 Total instructions: ${transaction.instructions.length} (${quantity} NFTs × 4 instructions each)`);

      return { transaction, mintKeypairs };

    } catch (error) {
      console.error('❌ Error creating REAL NFT mint transaction:', error);
      throw error;
    }
  }

  /**
   * Log mint event to blockchain via smart contract
   */
  async logMintEvent(
    collectionName: string,
    walletAddress: string,
    tokenIds: string[],
    mintPrice: number,
    phase: string,
    transactionSignature: string
  ): Promise<void> {
    try {
      console.log(`📝 Logging mint events to blockchain for ${tokenIds.length} NFTs`);
      
      // Log each minted NFT to the smart contract
      for (const tokenId of tokenIds) {
        await blockchainFirstService.logMintEvent(
          collectionName,
          walletAddress,
          tokenId,
          mintPrice,
          phase
        );
      }
      
      console.log(`✅ All mint events logged to blockchain via smart contract`);
      
    } catch (error) {
      console.error('❌ Error logging mint events to blockchain:', error);
      // Don't throw - logging failure shouldn't break minting
    }
  }

  /**
   * Submit a signed transaction to the blockchain
   */
  async submitTransaction(signedTransaction: Transaction): Promise<string> {
    try {
      console.log('🚀 Submitting transaction to blockchain...');
      
      // Send the signed transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );
      
      console.log(`📝 Transaction submitted with signature: ${signature}`);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log(`✅ Transaction confirmed: ${signature}`);
      return signature;
      
    } catch (error) {
      console.error('❌ Error submitting transaction:', error);
      throw new Error(`Failed to submit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign mint keypairs and submit complete transaction
   */
  async signAndSubmitTransaction(
    transaction: Transaction, 
    mintKeypairs: Keypair[], 
    signedTransaction: Transaction
  ): Promise<string> {
    try {
      console.log('🔐 Signing mint keypairs and submitting transaction...');
      
      // Use the wallet-signed transaction as the base
      const finalTransaction = signedTransaction;
      
      // Sign the transaction with all mint keypairs
      for (const mintKeypair of mintKeypairs) {
        finalTransaction.sign(mintKeypair);
      }
      
      // Now we have both wallet signature and mint keypair signatures
      
      // Send the fully signed transaction
      const signature = await this.connection.sendRawTransaction(
        finalTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );
      
      console.log(`📝 Transaction submitted with signature: ${signature}`);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log(`✅ Transaction confirmed: ${signature}`);
      return signature;
      
    } catch (error) {
      console.error('❌ Error signing and submitting transaction:', error);
      throw new Error(`Failed to sign and submit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
