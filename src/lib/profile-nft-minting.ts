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
  ComputeBudgetProgram,
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
import { METADATA_PROGRAM_CONFIG } from './metadata-service';
import { AnimatedNFTService, MatrixAnimationConfig } from './animated-nft-service';

export interface ProfileNFTMintParams {
  wallet: string;
  username: string;
  price: number;
  tier: string;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  // Use a permissive type to be compatible with various wallet adapters
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: any
  ) => Promise<string>;
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
      console.log('📄 Metadata to upload:', JSON.stringify(profileNFTMetadata, null, 2));
      
      const ipfsResult = await uploadJSONToIPFS(
        profileNFTMetadata,
        `profile-nft-${username}`
      );

      console.log('📤 IPFS upload result:', ipfsResult);

      if (!ipfsResult.success || !ipfsResult.url) {
        console.error('❌ IPFS upload failed:', ipfsResult);
        throw new Error(`Failed to upload metadata to IPFS: ${ipfsResult.error || 'Unknown error'}`);
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

      // 6a. Add compute budget and priority fee to avoid 0-priority txs
      // Moderate defaults suitable for congested networks but inexpensive
      const computeUnitLimit = 300_000; // typical for simple mints
      const priorityMicroLamports = 5_000; // ~1,000 lamports extra for 200k CUs
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityMicroLamports })
      );

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

      // 9. Send via wallet adapter with the mint keypair as an extra signer
      // This avoids losing the partial signature on some mobile wallets
      console.log('✍️ Requesting wallet to sign and send (with mint signer)...');
      let signature: string;
      try {
        signature = await (sendTransaction as any)(transaction, this.connection, {
          signers: [mintKeypair],
          skipPreflight: false,
        });
      } catch (sendViaWalletError: any) {
        console.error('❌ sendTransaction failed, attempting fallback flow:', sendViaWalletError);
        try {
          // Fallback path for mobile wallets that drop non-wallet signatures:
          // 1) Ask wallet to sign first
          // 2) Re-apply the mint keypair signature
          // 3) Send raw transaction
          const walletSignedTx = await signTransaction(transaction);
          walletSignedTx.partialSign(mintKeypair);
          signature = await this.connection.sendRawTransaction(walletSignedTx.serialize(), { skipPreflight: false });
        } catch (fallbackError: any) {
          // Final attempt: try the inverse order just in case
          try {
            transaction.partialSign(mintKeypair);
            const secondAttemptSigned = await signTransaction(transaction);
            signature = await this.connection.sendRawTransaction(secondAttemptSigned.serialize(), { skipPreflight: false });
          } catch (_secondErr) {
            throw new Error(`Failed to send transaction: ${fallbackError.message || sendViaWalletError.message}`);
          }
        }
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
        // Dynamically import Metaplex helpers to avoid build-time dependency mismatch
        let mpl: any = null;
        try {
          mpl = await import('@metaplex-foundation/mpl-token-metadata');
        } catch (_e) {
          mpl = null;
        }

        if (!mpl || (!mpl.createCreateMetadataAccountV3Instruction || !mpl.createCreateMasterEditionV3Instruction)) {
          console.warn('⚠️ Metaplex helpers unavailable, skipping on-chain metadata creation');
          throw new Error('MPL not available');
        }

        // 13a. Upload JSON (URI)
        const metadataCreation = await metadataService.createNFTMetadata(
          mintKeypair.publicKey,
          'Analos Profile',
          'PROFILE',
          1,
          profileNFTMetadata.attributes,
          profileNFTMetadata.image
        );

        const metadataUriToUse = metadataCreation.metadataURI || metadataUri;

        // 13b. Build on-chain metadata + master edition instructions (MPL-compatible)
        const metadataProgramId = new PublicKey(METADATA_PROGRAM_CONFIG.PROGRAM_ID);

        const [metadataPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            metadataProgramId.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          metadataProgramId
        );

        const [masterEditionPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            metadataProgramId.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
            Buffer.from('edition'),
          ],
          metadataProgramId
        );

        const metadataIx = mpl.createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: mintKeypair.publicKey,
            mintAuthority: userPublicKey,
            payer: userPublicKey,
            updateAuthority: userPublicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: 'Analos Profile',
                symbol: 'PROFILE',
                uri: metadataUriToUse || metadataUri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          },
          metadataProgramId
        );

        const masterEditionIx = mpl.createCreateMasterEditionV3Instruction(
          {
            edition: masterEditionPda,
            mint: mintKeypair.publicKey,
            updateAuthority: userPublicKey,
            mintAuthority: userPublicKey,
            payer: userPublicKey,
            metadata: metadataPda,
          },
          { createMasterEditionArgs: { maxSupply: 0 } },
          metadataProgramId
        );

        // 13c. Send metadata transaction
        const metaTx = new Transaction();
        metaTx.add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
          metadataIx,
          masterEditionIx
        );

        const { blockhash: metaBh, lastValidBlockHeight: metaLvb } = await this.connection.getLatestBlockhash('confirmed');
        metaTx.recentBlockhash = metaBh;
        metaTx.feePayer = userPublicKey;
        metaTx.lastValidBlockHeight = metaLvb;

        let metaSig: string;
        try {
          metaSig = await (sendTransaction as any)(metaTx, this.connection, { skipPreflight: false });
        } catch (_sendMetaErr) {
          // Fallback for wallets that don't support sendTransaction properly
          const signedMetaTx = await signTransaction(metaTx);
          metaSig = await this.connection.sendRawTransaction(signedMetaTx.serialize(), { skipPreflight: false });
        }

        try {
          await this.connection.confirmTransaction({ signature: metaSig, blockhash: metaBh, lastValidBlockHeight: metaLvb }, 'confirmed');
          console.log('✅ Metadata + Master Edition created:', metaSig);
        } catch (e) {
          console.warn('⚠️ Metadata confirmation timeout:', e);
        }
      } catch (metadataError) {
        console.warn('⚠️ Failed to create on-chain metadata (non-fatal):', metadataError);
        // Continue anyway - the NFT is still minted; UI may rely on later backfill
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

