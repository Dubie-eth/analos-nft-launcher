/**
 * NFT TRANSFER SERVICE
 * Handles transferring Los Bros and Profile NFTs on Analos blockchain
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

export interface TransferNFTParams {
  nftMint: string;
  fromWallet: string;
  toWallet: string;
  signTransaction: any;
  sendTransaction: any;
}

export interface TransferNFTResult {
  success: boolean;
  signature?: string;
  error?: string;
  message?: string;
}

class NFTTransferService {
  private connection: Connection;

  constructor() {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://rpc.analos.io';
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🔄 NFT Transfer Service initialized');
  }

  /**
   * Transfer NFT from one wallet to another
   */
  async transferNFT(params: TransferNFTParams): Promise<TransferNFTResult> {
    try {
      const { nftMint, fromWallet, toWallet, signTransaction, sendTransaction } = params;

      console.log('🔄 Starting NFT transfer...');
      console.log('  NFT Mint:', nftMint);
      console.log('  From:', fromWallet);
      console.log('  To:', toWallet);

      const fromPublicKey = new PublicKey(fromWallet);
      const toPublicKey = new PublicKey(toWallet);
      const mintPublicKey = new PublicKey(nftMint);

      // Get token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        fromPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        toPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Check if sender owns the NFT
      const fromAccountInfo = await this.connection.getTokenAccountBalance(fromTokenAccount);
      if (!fromAccountInfo || fromAccountInfo.value.uiAmount !== 1) {
        return {
          success: false,
          error: 'You do not own this NFT'
        };
      }

      // Build transaction
      const transaction = new Transaction();
      transaction.feePayer = fromPublicKey;

      // Check if recipient's token account exists
      const toAccountInfo = await this.connection.getAccountInfo(toTokenAccount);
      
      if (!toAccountInfo) {
        console.log('📦 Creating recipient token account...');
        // Create associated token account for recipient
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPublicKey, // payer
            toTokenAccount,
            toPublicKey,
            mintPublicKey,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction (NFTs have amount = 1)
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromPublicKey,
          1, // NFTs always transfer 1
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      console.log('✍️ Requesting wallet signature...');

      // Sign transaction
      const signedTx = await signTransaction(transaction);

      console.log('📡 Sending transaction to Analos blockchain...');

      // Send transaction
      const signature = await sendTransaction(signedTx, this.connection);

      console.log('⏳ Confirming transaction...');

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (confirmation.value.err) {
        console.error('❌ Transaction failed:', confirmation.value.err);
        return {
          success: false,
          error: 'Transaction failed on-chain',
          message: JSON.stringify(confirmation.value.err)
        };
      }

      console.log('✅ NFT transferred successfully!');
      console.log('📝 Transaction signature:', signature);

      return {
        success: true,
        signature,
        message: 'NFT transferred successfully!'
      };

    } catch (error: any) {
      console.error('❌ Error transferring NFT:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer NFT',
        message: error.toString()
      };
    }
  }
}

// Export singleton instance
export const nftTransferService = new NFTTransferService();

// Export for direct import
export { NFTTransferService };

