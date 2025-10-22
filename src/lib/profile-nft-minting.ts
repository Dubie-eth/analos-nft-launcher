/**
 * Profile NFT Minting Service
 * Handles Profile NFT creation on Analos blockchain
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { uploadJSONToIPFS } from './backend-api';
import { metadataService } from './metadata-service';

export interface ProfileNFTMintParams {
  wallet: string;
  username: string;
  price: number;
  tier: string;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>;
}

export interface ProfileNFTMintResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  metadataUri?: string;
  message: string;
  error?: string;
}

export class ProfileNFTMintingService {
  private connection: Connection;

  constructor(rpcUrl: string = ANALOS_RPC_URL) {
    // Configure connection for Analos network with extended timeouts
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    
    console.log('🎭 Profile NFT Minting Service initialized');
    console.log('🔗 RPC URL:', rpcUrl);
  }

  /**
   * Mint a Profile NFT for a user
   */
  async mintProfileNFT(params: ProfileNFTMintParams): Promise<ProfileNFTMintResult> {
    try {
      const { wallet, username, price, tier, signTransaction, sendTransaction } = params;

      console.log('🎭 Starting Profile NFT mint...');
      console.log('👤 User:', wallet);
      console.log('📝 Username:', username);
      console.log('💰 Price:', price, 'LOS');
      console.log('🏆 Tier:', tier);

      // 1. Validate username uniqueness (optional - can be added later)
      // TODO: Check if username is already taken

      // 2. Create Profile NFT metadata
      const profileNFTMetadata = {
        name: `@${username}`,
        symbol: 'PROFILE',
        description: `Analos Profile NFT for @${username} - ${tier} tier. This NFT represents your unique identity on the Analos platform.`,
        image: this.generateProfileImage(username, tier),
        external_url: `https://analos.io/profile/${wallet}`,
        attributes: [
          {
            trait_type: 'Username',
            value: username
          },
          {
            trait_type: 'Tier',
            value: tier
          },
          {
            trait_type: 'Username Length',
            value: username.length.toString()
          },
          {
            trait_type: 'Price Paid',
            value: `${price} LOS`
          },
          {
            trait_type: 'Platform',
            value: 'Analos'
          },
          {
            trait_type: 'Type',
            value: 'Profile NFT'
          },
          {
            trait_type: 'Mint Date',
            value: new Date().toISOString()
          }
        ],
        properties: {
          files: [] as Array<{uri: string; type: string}>,
          category: 'image',
          creators: [
            {
              address: wallet,
              share: 100
            }
          ]
        }
      };

      // 3. Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...');
      const ipfsResult = await uploadJSONToIPFS(
        profileNFTMetadata,
        `profile-nft-${username}`
      );

      if (!ipfsResult.success || !ipfsResult.url) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      const metadataUri = ipfsResult.url;
      console.log('✅ Metadata uploaded to IPFS:', metadataUri);

      // 4. Create mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🔑 Mint address:', mintKeypair.publicKey.toString());

      // 5. Get associated token account
      const userPublicKey = new PublicKey(wallet);
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userPublicKey
      );
      console.log('🏦 Associated token account:', associatedTokenAccount.toString());

      // 6. Calculate rent
      const lamportsForMint = await getMinimumBalanceForRentExemptMint(this.connection);
      console.log('💵 Rent for mint:', lamportsForMint / LAMPORTS_PER_SOL, 'SOL');

      // 7. Build transaction (use legacy format for Analos compatibility)
      const transaction = new Transaction();

      // Add instruction to create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: userPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: lamportsForMint,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Add instruction to initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          0, // 0 decimals for NFT
          userPublicKey, // mint authority
          userPublicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // Add instruction to create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPublicKey, // payer
          associatedTokenAccount, // associated token account
          userPublicKey, // owner
          mintKeypair.publicKey, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // Add instruction to mint 1 token to user
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey, // mint
          associatedTokenAccount, // destination
          userPublicKey, // authority
          1, // amount (1 for NFT)
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // 8. Get recent blockhash and configure transaction for Analos compatibility
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Ensure we're using legacy transaction format for Analos compatibility
      // Force legacy format by ensuring no version property is set
      if ((transaction as any).version) {
        delete (transaction as any).version;
      }
      if ((transaction as any).message) {
        delete (transaction as any).message;
      }
      
      console.log('📋 Transaction format: Legacy (Analos compatible)');
      console.log('📋 Transaction instructions count:', transaction.instructions.length);
      console.log('📋 Transaction fee payer:', transaction.feePayer?.toString());
      console.log('📋 Transaction version property:', (transaction as any).version || 'none (legacy)');

      // 9. Partially sign with mint keypair
      transaction.partialSign(mintKeypair);

      console.log('✍️ Signing transaction...');
      // 10. Sign with user wallet
      const signedTransaction = await signTransaction(transaction);
      
      // Debug transaction format before sending
      console.log('🔍 Transaction details before sending:');
      console.log('🔍 Transaction type:', signedTransaction.constructor.name);
      console.log('🔍 Transaction version:', (signedTransaction as any).version || 'legacy');
      console.log('🔍 Transaction message format:', (signedTransaction as any).message?.version || 'legacy');
      
      // Additional check: Ensure transaction is still in legacy format after signing
      if ((signedTransaction as any).version !== undefined) {
        console.warn('⚠️ WARNING: Transaction has version property after signing. This may cause issues on Analos network.');
        console.warn('⚠️ Transaction version:', (signedTransaction as any).version);
      }
      
      if ((signedTransaction as any).message) {
        console.warn('⚠️ WARNING: Transaction has message property after signing. This may cause issues on Analos network.');
        console.warn('⚠️ Message version:', (signedTransaction as any).message?.version);
      }

      console.log('📡 Sending transaction...');
      // 11. Send transaction with legacy format enforcement
      let signature: string;
      try {
        // Ensure transaction is serialized in legacy format for Analos compatibility
        const serializedTx = signedTransaction.serialize();
        console.log('🔍 Transaction serialized length:', serializedTx.length);
        console.log('🔍 Transaction first byte (should be 0x01 for legacy):', '0x' + serializedTx[0].toString(16));
        
        signature = await sendTransaction(signedTransaction, this.connection);
      } catch (sendError: any) {
        console.error('❌ Transaction send error:', sendError);
        throw new Error(`Failed to send transaction: ${sendError.message}`);
      }

      console.log('⏳ Confirming transaction...');
      // 12. Confirm transaction with extended timeout for Analos network
      try {
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('✅ Transaction confirmed:', signature);
      } catch (confirmError: any) {
        // If confirmation times out, check if transaction was successful
        console.log('⚠️ Confirmation timeout, checking transaction status...');
        
        try {
          const txStatus = await this.connection.getSignatureStatus(signature);
          if (txStatus.value && !txStatus.value.err) {
            console.log('✅ Transaction confirmed via signature status check:', signature);
          } else {
            throw new Error(`Transaction failed or not found: ${signature}`);
          }
        } catch (statusError) {
          console.error('❌ Transaction confirmation failed:', statusError);
          throw new Error(`Transaction confirmation failed: ${confirmError.message || 'Unknown error'}`);
        }
      }

      // 13. Create Metaplex metadata account
      console.log('📝 Creating Metaplex metadata...');
      try {
        await metadataService.createNFTMetadata(
          mintKeypair.publicKey,
          'Analos Profile',
          'PROFILE',
          1, // mint number (we could track this per-user)
          profileNFTMetadata.attributes,
          profileNFTMetadata.image
        );
        console.log('✅ Metaplex metadata created');
      } catch (metadataError) {
        console.warn('⚠️ Failed to create Metaplex metadata:', metadataError);
        // Continue anyway - the NFT is still minted
      }

      return {
        success: true,
        signature: signature,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataUri: metadataUri,
        message: `Profile NFT minted successfully for @${username}!`
      };

    } catch (error: any) {
      console.error('❌ Profile NFT minting error:', error);
      return {
        success: false,
        message: 'Failed to mint Profile NFT',
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Generate a profile image URL
   * Using DiceBear API for now, can be replaced with custom generation
   */
  private generateProfileImage(username: string, tier: string): string {
    const tierColors: Record<string, string> = {
      '3-digit': 'FFD700', // Gold
      '4-digit': 'C0C0C0', // Silver
      '5-plus': 'CD7F32'   // Bronze
    };

    const bgColor = tierColors[tier] || '000000';
    
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${username}&backgroundColor=${bgColor}`;
  }

  /**
   * Check if username is already taken
   * TODO: Implement username registry on blockchain
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    // Placeholder - implement with on-chain username registry
    return false;
  }

  /**
   * Get user's Profile NFT
   */
  async getUserProfileNFT(walletAddress: string): Promise<any | null> {
    try {
      // This would query the blockchain for Profile NFTs owned by the user
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error fetching user Profile NFT:', error);
      return null;
    }
  }
}

// Export singleton instance
export const profileNFTMintingService = new ProfileNFTMintingService();

