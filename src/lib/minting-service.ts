/**
 * Minting Service
 * Handles NFT minting transactions with smart contract integration
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { blockchainService } from './blockchain-service';
import { 
  deriveCollectionConfigPDA,
  deriveEscrowWalletPDA,
  deriveMintRecordPDA,
  solToLamports,
} from './account-parser';

export interface MintResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  message: string;
  error?: string;
}

export interface MintParams {
  collectionAddress: string;
  userWallet: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>;
}

/**
 * Minting Service Class
 */
export class MintingService {
  private connection: Connection;
  private programId: PublicKey;

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    this.programId = ANALOS_PROGRAMS.NFT_LAUNCHPAD;
    
    console.log('🎯 Minting Service initialized');
    console.log('🔗 Program ID:', this.programId.toString());
  }

  /**
   * Mint a placeholder NFT from a collection
   */
  async mintPlaceholderNFT(params: MintParams): Promise<MintResult> {
    try {
      const { collectionAddress, userWallet, signTransaction, sendTransaction } = params;

      console.log('🎯 Starting mint transaction...');
      console.log('📍 Collection:', collectionAddress);
      console.log('👤 User:', userWallet.toString());

      // 1. Load collection data to get current supply and pricing
      const collection = await blockchainService.getCollectionByAddress(collectionAddress);
      if (!collection) {
        return {
          success: false,
          message: 'Collection not found on blockchain',
          error: 'COLLECTION_NOT_FOUND'
        };
      }

      // 2. Validate collection status
      if (collection.isPaused) {
        return {
          success: false,
          message: 'Collection is currently paused',
          error: 'COLLECTION_PAUSED'
        };
      }

      if (collection.mintedCount >= collection.totalSupply) {
        return {
          success: false,
          message: 'Collection is sold out',
          error: 'SOLD_OUT'
        };
      }

      console.log('✅ Collection validation passed');
      console.log(`📊 Current supply: ${collection.mintedCount}/${collection.totalSupply}`);
      console.log(`💰 Mint price: ${collection.mintPriceSOL} SOL`);

      // 3. Generate new mint keypair for the NFT
      const mintKeypair = web3.Keypair.generate();
      const mintPublicKey = mintKeypair.publicKey;

      console.log('🔑 Generated mint address:', mintPublicKey.toString());

      // 4. Derive required PDAs
      const collectionConfigPubkey = new PublicKey(collectionAddress);
      
      const [escrowWalletPDA] = deriveEscrowWalletPDA(
        this.programId,
        collectionConfigPubkey
      );

      const [mintRecordPDA] = deriveMintRecordPDA(
        this.programId,
        collectionConfigPubkey,
        collection.mintedCount // Next mint index
      );

      // Get user's associated token account for the new mint
      const userTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        userWallet
      );

      console.log('✅ All PDAs derived');
      console.log('📦 Escrow:', escrowWalletPDA.toString());
      console.log('📝 Mint Record:', mintRecordPDA.toString());

      // 5. Build the mint instruction
      // Note: This is a simplified version. The actual instruction would use Anchor IDL
      const mintInstruction = await this.buildMintInstruction(
        collectionConfigPubkey,
        escrowWalletPDA,
        mintRecordPDA,
        mintPublicKey,
        userWallet,
        userTokenAccount,
        collection.mintPriceLamports
      );

      // 6. Build transaction
      const transaction = new Transaction();
      
      // Add create ATA instruction if needed
      const ataExists = await this.connection.getAccountInfo(userTokenAccount);
      if (!ataExists) {
        const createATAIx = createAssociatedTokenAccountInstruction(
          userWallet,
          userTokenAccount,
          userWallet,
          mintPublicKey
        );
        transaction.add(createATAIx);
      }

      // Add mint instruction
      transaction.add(mintInstruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet;

      // 7. Sign the mint keypair
      transaction.partialSign(mintKeypair);

      console.log('✅ Transaction built and partially signed');

      // 8. Sign with user's wallet
      console.log('📝 Requesting wallet signature...');
      const signedTransaction = await signTransaction(transaction);

      console.log('✅ Transaction signed by user');

      // 9. Send transaction
      console.log('📤 Sending transaction to blockchain...');
      const signature = await sendTransaction(signedTransaction, this.connection);

      console.log('🎉 Transaction sent! Signature:', signature);

      // 10. Confirm transaction
      console.log('⏳ Waiting for confirmation...');
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('✅ Transaction confirmed!');

      return {
        success: true,
        signature,
        mintAddress: mintPublicKey.toString(),
        message: `Successfully minted ${collection.collectionName} #${collection.mintedCount + 1}!`,
      };

    } catch (error: any) {
      console.error('❌ Minting error:', error);
      
      let errorMessage = 'Failed to mint NFT';
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Build mint instruction
   * Note: This is a simplified version. In production, you'd use Anchor's IDL to generate this
   */
  private async buildMintInstruction(
    collectionConfig: PublicKey,
    escrowWallet: PublicKey,
    mintRecord: PublicKey,
    mintAddress: PublicKey,
    minter: PublicKey,
    userTokenAccount: PublicKey,
    priceLamports: number
  ): Promise<TransactionInstruction> {
    // This is a placeholder instruction structure
    // In production, you would:
    // 1. Use Anchor's generated TypeScript client
    // 2. Or manually encode the instruction data matching your program's layout
    
    const instructionData = Buffer.alloc(9);
    // Instruction discriminator for mint_placeholder
    // You'd get this from the Anchor IDL or calculate it as the first 8 bytes of sha256("global:mint_placeholder")
    instructionData.writeUInt8(1, 0); // Placeholder discriminator
    instructionData.writeBigUInt64LE(BigInt(priceLamports), 1);

    const keys = [
      { pubkey: collectionConfig, isSigner: false, isWritable: true },
      { pubkey: escrowWallet, isSigner: false, isWritable: true },
      { pubkey: mintRecord, isSigner: false, isWritable: true },
      { pubkey: mintAddress, isSigner: true, isWritable: true },
      { pubkey: minter, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data: instructionData,
    });
  }

  /**
   * Estimate transaction cost
   */
  async estimateMintCost(collectionAddress: string): Promise<{
    mintPrice: number;
    transactionFee: number;
    total: number;
  } | null> {
    try {
      const collection = await blockchainService.getCollectionByAddress(collectionAddress);
      if (!collection) return null;

      // Get current transaction fee (approximate)
      const recentBlockhash = await this.connection.getLatestBlockhash();
      const transactionFee = 0.000005; // Approximately 5,000 lamports

      return {
        mintPrice: collection.mintPriceSOL,
        transactionFee,
        total: collection.mintPriceSOL + transactionFee,
      };
    } catch (error) {
      console.error('Error estimating cost:', error);
      return null;
    }
  }

  /**
   * Check if user can mint from collection
   */
  async canUserMint(
    collectionAddress: string,
    userWallet: PublicKey
  ): Promise<{ canMint: boolean; reason?: string }> {
    try {
      const collection = await blockchainService.getCollectionByAddress(collectionAddress);
      if (!collection) {
        return { canMint: false, reason: 'Collection not found' };
      }

      if (collection.isPaused) {
        return { canMint: false, reason: 'Collection is paused' };
      }

      if (collection.mintedCount >= collection.totalSupply) {
        return { canMint: false, reason: 'Collection is sold out' };
      }

      // TODO: Check whitelist if enabled
      // TODO: Check social verification if required
      // TODO: Check rate limits
      // TODO: Check max mints per user

      return { canMint: true };
    } catch (error) {
      console.error('Error checking mint eligibility:', error);
      return { canMint: false, reason: 'Error checking eligibility' };
    }
  }
}

// Import web3 for Keypair (not exported in the connection import)
import * as web3 from '@solana/web3.js';

// Export singleton instance
export const mintingService = new MintingService();

// Export convenience functions
export const mintPlaceholderNFT = (params: MintParams) => 
  mintingService.mintPlaceholderNFT(params);
export const estimateMintCost = (collectionAddress: string) => 
  mintingService.estimateMintCost(collectionAddress);
export const canUserMint = (collectionAddress: string, userWallet: PublicKey) => 
  mintingService.canUserMint(collectionAddress, userWallet);

