import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

const RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface MintNFTResult {
  success: boolean;
  mint?: string;
  tokenAccount?: string;
  signature?: string;
  metadata?: NFTMetadata;
  error?: string;
}

export class SPLNFTService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, 'confirmed');
  }

  /**
   * Create a real SPL Token NFT (0 decimals)
   */
  async createNFT(
    payerKeypair: Keypair,
    ownerPublicKey: PublicKey,
    metadata: NFTMetadata
  ): Promise<MintNFTResult> {
    try {
      console.log('🎨 Creating SPL Token NFT...');
      console.log('Owner:', ownerPublicKey.toBase58());
      console.log('Metadata:', metadata);

      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🪙 Mint Address:', mintKeypair.publicKey.toBase58());

      // Get rent-exempt balance for mint
      const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

      // Get associated token account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        ownerPublicKey
      );
      console.log('📦 Token Account:', associatedTokenAddress.toBase58());

      // Create transaction
      const transaction = new Transaction();

      // Add priority fee to get faster confirmation
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 50000, // Higher priority fee
        })
      );

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000, // Enough compute units
        })
      );

      // 1. Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payerKeypair.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // 2. Initialize mint with 0 decimals (makes it an NFT)
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          0, // 0 decimals = NFT
          payerKeypair.publicKey, // mint authority
          payerKeypair.publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // 3. Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey, // payer
          associatedTokenAddress, // associated token account
          ownerPublicKey, // owner
          mintKeypair.publicKey // mint
        )
      );

      // 4. Mint 1 token to the owner
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          payerKeypair.publicKey,
          1, // amount (1 NFT)
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash with higher commitment
      console.log('🔗 Getting recent blockhash...');
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = payerKeypair.publicKey;

      // Send transaction
      console.log('📤 Sending transaction...');
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payerKeypair, mintKeypair],
        {
          commitment: 'confirmed',
          maxRetries: 3,
          skipPreflight: false,
        }
      );

      console.log('✅ NFT created successfully!');
      console.log('Signature:', signature);

      return {
        success: true,
        mint: mintKeypair.publicKey.toBase58(),
        tokenAccount: associatedTokenAddress.toBase58(),
        signature,
        metadata,
      };
    } catch (error: any) {
      console.error('❌ Error creating NFT:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        logs: error.logs
      });
      return {
        success: false,
        error: error.message || error.toString() || 'Failed to create NFT',
      };
    }
  }

  /**
   * Get NFT info
   */
  async getNFTInfo(mintAddress: string): Promise<any> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const accountInfo = await this.connection.getAccountInfo(mintPubkey);

      if (!accountInfo) {
        throw new Error('Mint account not found');
      }

      return {
        mint: mintAddress,
        exists: true,
        owner: accountInfo.owner.toBase58(),
        lamports: accountInfo.lamports,
      };
    } catch (error: any) {
      console.error('Error getting NFT info:', error);
      throw error;
    }
  }

  /**
   * Check if an address owns an NFT
   */
  async checkOwnership(
    mintAddress: string,
    ownerAddress: string
  ): Promise<boolean> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const ownerPubkey = new PublicKey(ownerAddress);

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        ownerPubkey
      );

      const accountInfo = await this.connection.getAccountInfo(
        associatedTokenAddress
      );

      return accountInfo !== null;
    } catch (error) {
      console.error('Error checking ownership:', error);
      return false;
    }
  }
}

// Export singleton instance
export const splNFTService = new SPLNFTService();
