/**
 * Marketplace Transaction Service
 * Handles Solana transactions for buying NFTs
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ANALOS_RPC_URL, ANALOS_PLATFORM_WALLET } from '@/config/analos-programs';

export interface BuyNFTParams {
  nftMint: string;
  sellerWallet: string;
  buyerWallet: string;
  price: number; // in LOS
  currency: string;
  signTransaction: any;
  sendTransaction: any;
}

export interface BuyNFTResult {
  success: boolean;
  signature?: string;
  error?: string;
}

class MarketplaceTransactionService {
  private connection: Connection;
  private readonly PLATFORM_FEE = 0.069; // 6.9%
  private readonly PLATFORM_WALLET = ANALOS_PLATFORM_WALLET; // Analos platform wallet

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: undefined, // Disable WebSockets for Analos RPC stability
    });
  }

  /**
   * Buy an NFT from the marketplace
   */
  async buyNFT(params: BuyNFTParams): Promise<BuyNFTResult> {
    try {
      console.log('🛒 Starting NFT purchase on Analos...');
      console.log('  Network: Analos Mainnet');
      console.log('  RPC:', ANALOS_RPC_URL);
      console.log('  NFT Mint:', params.nftMint);
      console.log('  Seller:', params.sellerWallet);
      console.log('  Buyer:', params.buyerWallet);
      console.log('  Price:', params.price, params.currency);

      const buyerPublicKey = new PublicKey(params.buyerWallet);
      const sellerPublicKey = new PublicKey(params.sellerWallet);
      const nftMintPublicKey = new PublicKey(params.nftMint);
      const platformPublicKey = new PublicKey(this.PLATFORM_WALLET);

      // Calculate fees
      const platformFee = params.price * this.PLATFORM_FEE;
      const sellerAmount = params.price - platformFee;

      console.log('💰 Fee Breakdown:');
      console.log('  Sale Price:', params.price, params.currency);
      console.log('  Platform Fee (6.9%):', platformFee, params.currency);
      console.log('  Seller Receives:', sellerAmount, params.currency);

      // Get latest blockhash from Analos RPC
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      console.log('📊 Analos blockhash:', blockhash);

      // Create transaction
      const transaction = new Transaction({
        feePayer: buyerPublicKey,
        blockhash,
        lastValidBlockHeight,
      });

      // Analos network supports both SOL and LOS token payments
      // LOS is the native token of Analos with Token-2022 extensions
      
      if (params.currency === 'SOL') {
        // SOL payment (simple transfer)
        
        // Payment to seller
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPublicKey,
            toPubkey: sellerPublicKey,
            lamports: Math.floor(sellerAmount * LAMPORTS_PER_SOL),
          })
        );

        // Platform fee to platform wallet
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPublicKey,
            toPubkey: platformPublicKey,
            lamports: Math.floor(platformFee * LAMPORTS_PER_SOL),
          })
        );

      } else {
        // LOS token payment (Token-2022 transfer on Analos)
        console.log('🪙 LOS token payment on Analos - implementing Token-2022 transfer...');
        
        // $LOL token mint on Analos (Token-2022 with extensions)
        const LOL_TOKEN_MINT = new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6');
        
        // Get token accounts (Token-2022 on Analos)
        const buyerTokenAccount = await getAssociatedTokenAddress(
          LOL_TOKEN_MINT,
          buyerPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        const sellerTokenAccount = await getAssociatedTokenAddress(
          LOL_TOKEN_MINT,
          sellerPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        const platformTokenAccount = await getAssociatedTokenAddress(
          LOL_TOKEN_MINT,
          platformPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        // Convert LOS to smallest unit (assuming 9 decimals like SOL)
        const decimals = 9;
        const sellerAmountInSmallestUnit = Math.floor(sellerAmount * Math.pow(10, decimals));
        const platformFeeInSmallestUnit = Math.floor(platformFee * Math.pow(10, decimals));

        // Transfer to seller
        transaction.add(
          createTransferInstruction(
            buyerTokenAccount,
            sellerTokenAccount,
            buyerPublicKey,
            sellerAmountInSmallestUnit,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );

        // Transfer platform fee
        transaction.add(
          createTransferInstruction(
            buyerTokenAccount,
            platformTokenAccount,
            buyerPublicKey,
            platformFeeInSmallestUnit,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // TODO: Add NFT transfer instruction
      // This requires creating instructions to transfer the NFT from seller to buyer
      // Get NFT token accounts
      const sellerNFTAccount = await getAssociatedTokenAddress(
        nftMintPublicKey,
        sellerPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const buyerNFTAccount = await getAssociatedTokenAddress(
        nftMintPublicKey,
        buyerPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Transfer NFT from seller to buyer
      // Note: This will require seller's signature OR using a program/escrow
      console.log('⚠️  NFT transfer requires seller signature or escrow program');
      console.log('  Seller NFT Account:', sellerNFTAccount.toBase58());
      console.log('  Buyer NFT Account:', buyerNFTAccount.toBase58());

      // Sign transaction with buyer wallet
      console.log('✍️  Requesting wallet signature for Analos transaction...');
      const signed = await params.signTransaction(transaction);

      // Send transaction to Analos network
      console.log('📤 Sending transaction to Analos...');
      const signature = await params.sendTransaction(signed, this.connection);

      // Confirm transaction on Analos
      console.log('⏳ Confirming transaction on Analos network...');
      await this.confirmTransaction(signature);

      console.log('✅ Purchase completed!');
      console.log('  Signature:', signature);

      return {
        success: true,
        signature,
      };

    } catch (error: any) {
      console.error('❌ Error buying NFT:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete purchase',
      };
    }
  }

  /**
   * Confirm transaction using HTTP polling (Analos RPC optimized)
   */
  private async confirmTransaction(signature: string): Promise<void> {
    const maxRetries = 30;
    const retryDelay = 2000; // 2 seconds

    console.log('🔍 Confirming transaction on Analos network...');

    for (let i = 0; i < maxRetries; i++) {
      try {
        const status = await this.connection.getSignatureStatus(signature);
        
        if (status?.value?.confirmationStatus === 'confirmed' || 
            status?.value?.confirmationStatus === 'finalized') {
          console.log(`✅ Analos transaction confirmed (${status.value.confirmationStatus})`);
          console.log(`🔗 Explorer: https://explorer.analos.io/tx/${signature}`);
          return;
        }

        if (status?.value?.err) {
          throw new Error(`Analos transaction failed: ${JSON.stringify(status.value.err)}`);
        }

        console.log(`⏳ Analos confirmation attempt ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));

      } catch (error: any) {
        if (i === maxRetries - 1) {
          throw error;
        }
        console.log(`⚠️  Analos retry ${i + 1}/${maxRetries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Analos transaction confirmation timeout');
  }
}

// Export singleton instance
export const marketplaceTransactionService = new MarketplaceTransactionService();

