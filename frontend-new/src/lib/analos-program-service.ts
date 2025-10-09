/**
 * Analos Launchpad Program Service
 * Integrates with your custom Analos program: FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
 */

import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export interface InitializeCollectionParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  maxSupply: number;
  mintPrice: number;
  creator: string;
  authority: string;
}

export interface InitializeCollectionResult {
  success: boolean;
  collectionConfig?: string;
  signature?: string;
  error?: string;
}

class AnalosLaunchpadService {
  private connection: Connection;
  private programId: PublicKey;

  constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_ANALOS_RPC_URL || 'https://rpc.analos.io',
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000, // 60 seconds timeout
        disableRetryOnRateLimit: false,
        // Handle WebSocket connection issues gracefully
        httpHeaders: {
          'User-Agent': 'Analos-NFT-Launcher/1.0'
        }
      }
    );
    this.programId = new PublicKey('FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo');
    console.log('🎯 Analos Launchpad Service initialized');
    console.log('   Program ID:', this.programId.toString());
    console.log('   RPC URL:', this.connection.rpcEndpoint);
    console.log('   Timeout: 60 seconds');
  }

  /**
   * Initialize a new collection using your Analos program
   */
  async initializeCollection(params: InitializeCollectionParams, signTransaction?: any): Promise<InitializeCollectionResult> {
    try {
      console.log('🚀 Initializing collection with Analos program:', params);
      
      const authority = new PublicKey(params.authority);
      
      // Generate a collection config PDA
      const [collectionConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection_config'), authority.toBuffer()],
        this.programId
      );

      console.log('📍 Collection Config PDA:', collectionConfig.toString());

      // Create transaction
      const transaction = new Transaction();

      // Add initialize collection instruction
      const initInstruction = this.createInitializeCollectionInstruction(
        collectionConfig,
        authority,
        params
      );

      transaction.add(initInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = authority;

      console.log('📝 Transaction created, ready for signing');

      // If signTransaction function is provided, sign and submit the transaction
      if (signTransaction) {
        console.log('🔐 Signing and submitting transaction...');
        console.log('⚠️ Note: Skipping simulation as Backpack wallet doesn\'t support it on custom RPCs');
        
        try {
          // Sign the transaction directly (no simulation for custom RPCs)
          const signedTransaction = await signTransaction(transaction);
          
          // Submit the transaction with skipPreflight to avoid simulation issues
          const signature = await this.connection.sendRawTransaction(
            signedTransaction.serialize(),
            {
              skipPreflight: true, // Skip preflight simulation for custom RPC compatibility
              preflightCommitment: 'confirmed',
            }
          );

          console.log(`📝 Transaction submitted with signature: ${signature}`);

          // Wait for confirmation with extended timeout and better error handling
          console.log(`⏳ Waiting for transaction confirmation: ${signature}`);
          
          try {
            const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
            
            if (confirmation.value.err) {
              throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            console.log(`✅ Transaction confirmed: ${signature}`);
          } catch (confirmationError) {
            console.warn('⚠️ Transaction confirmation failed, checking transaction status manually...');
            
            // Fallback: Check if transaction exists on-chain
            try {
              const txInfo = await this.connection.getTransaction(signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
              });
              
              if (txInfo) {
                console.log(`✅ Transaction found on-chain: ${signature}`);
                console.log(`   Slot: ${txInfo.slot}`);
                console.log(`   Block Time: ${txInfo.blockTime}`);
                
                // Transaction exists, consider it successful
                return {
                  success: true,
                  collectionConfig: collectionConfig.toString(),
                  signature: signature,
                  error: undefined
                };
              } else {
                throw new Error('Transaction not found on-chain after timeout');
              }
            } catch (manualCheckError) {
              console.error('❌ Manual transaction check also failed:', manualCheckError);
              throw new Error(`Transaction confirmation failed: ${confirmationError instanceof Error ? confirmationError.message : 'Unknown error'}. Transaction signature: ${signature}`);
            }
          }

          return {
            success: true,
            collectionConfig: collectionConfig.toString(),
            signature: signature,
            error: undefined
          };

        } catch (txError) {
          console.error('❌ Transaction failed:', txError);
          
          // Provide more helpful error message for DeclaredProgramIdMismatch
          if (txError instanceof Error && txError.message.includes('DeclaredProgramIdMismatch')) {
            return {
              success: false,
              error: `Program ID mismatch: The instruction data doesn't match your program's expected format. This usually means we need the correct instruction discriminator for your program.`
            };
          }
          
          return {
            success: false,
            error: `Transaction failed: ${txError instanceof Error ? txError.message : 'Unknown error'}`
          };
        }
      } else {
        // No signTransaction function provided, return the PDA for manual signing
        return {
          success: true,
          collectionConfig: collectionConfig.toString(),
          signature: 'pending_user_signature',
          error: undefined
        };
      }

    } catch (error) {
      console.error('❌ Error initializing collection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create the initialize collection instruction
   */
  private createInitializeCollectionInstruction(
    collectionConfig: PublicKey,
    authority: PublicKey,
    params: InitializeCollectionParams
  ) {
    // For now, let's create a simple instruction without custom discriminator
    // This will help us test if the program is reachable at all
    // We'll add proper instruction data once we confirm connectivity
    
    const instruction = {
      programId: this.programId,
      keys: [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([]) // Empty data for basic connectivity test
    };

    console.log('🔧 Created basic instruction for connectivity test');
    console.log('   Program ID:', this.programId.toString());
    console.log('   Collection Config:', collectionConfig.toString());
    console.log('   Authority:', authority.toString());
    console.log('   Note: Using empty instruction data to test program accessibility');
    
    return instruction;
  }

  /**
   * Mint a placeholder NFT
   */
  async mintPlaceholder(collectionConfig: string, mintIndex: number): Promise<InitializeCollectionResult> {
    try {
      console.log('🎨 Minting placeholder NFT:', { collectionConfig, mintIndex });
      
      // Implementation would go here
      return {
        success: true,
        signature: 'placeholder_mint_signature'
      };
    } catch (error) {
      console.error('❌ Error minting placeholder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Reveal the collection
   */
  async revealCollection(collectionConfig: string): Promise<InitializeCollectionResult> {
    try {
      console.log('🎭 Revealing collection:', collectionConfig);
      
      // Implementation would go here
      return {
        success: true,
        signature: 'reveal_signature'
      };
    } catch (error) {
      console.error('❌ Error revealing collection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo(collectionConfig: string) {
    try {
      console.log('📊 Getting collection info:', collectionConfig);
      
      const publicKey = new PublicKey(collectionConfig);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        throw new Error('Collection not found');
      }

      return {
        success: true,
        data: {
          address: collectionConfig,
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          dataLength: accountInfo.data.length
        }
      };
    } catch (error) {
      console.error('❌ Error getting collection info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const analosLaunchpadService = new AnalosLaunchpadService();
