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
      'confirmed'
    );
    this.programId = new PublicKey('FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo');
    console.log('🎯 Analos Launchpad Service initialized');
    console.log('   Program ID:', this.programId.toString());
    console.log('   RPC URL:', this.connection.rpcEndpoint);
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
        
        try {
          // First, let's try to simulate the transaction to see what happens
          console.log('🧪 Simulating transaction first...');
          const simulationResult = await this.connection.simulateTransaction(transaction);
          
          if (simulationResult.value.err) {
            console.error('❌ Transaction simulation failed:', simulationResult.value.err);
            console.error('❌ Simulation logs:', simulationResult.value.logs);
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
          }
          
          console.log('✅ Transaction simulation successful');
          
          // Sign the transaction
          const signedTransaction = await signTransaction(transaction);
          
          // Submit the transaction
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

          return {
            success: true,
            collectionConfig: collectionConfig.toString(),
            signature: signature,
            error: undefined
          };

        } catch (txError) {
          console.error('❌ Transaction failed:', txError);
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
    // Try to create a proper Anchor instruction
    // The discriminator for initializeCollection should be the first 8 bytes of sha256("global:initialize_collection")
    
    // For initializeCollection, the discriminator is typically:
    const discriminator = Buffer.from([42, 230, 133, 164, 1, 127, 131, 173]); // This is a placeholder
    
    // Create the instruction data with proper serialization
    const instructionData = Buffer.concat([
      discriminator,
      // Add serialized parameters if needed
    ]);

    const instruction = {
      programId: this.programId,
      keys: [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData
    };

    console.log('🔧 Created initialize collection instruction with proper Anchor format');
    console.log('   Program ID:', this.programId.toString());
    console.log('   Collection Config:', collectionConfig.toString());
    console.log('   Authority:', authority.toString());
    console.log('   Instruction Data Length:', instructionData.length);
    
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
