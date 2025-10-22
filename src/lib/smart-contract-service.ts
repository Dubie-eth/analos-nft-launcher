/**
 * Smart Contract Service
 * Handles direct interactions with Analos smart contracts
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram 
} from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { backendAPI } from './backend-api';

export interface SmartContractCallResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface PauseCollectionParams {
  collectionConfigAddress: string;
  authorityWallet: string;
  paused: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

export interface UpdateCollectionConfigParams {
  collectionConfigAddress: string;
  authorityWallet: string;
  newPrice?: number;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

/**
 * Smart Contract Service Class
 */
export class SmartContractService {
  private connection: Connection;
  private programIds: typeof ANALOS_PROGRAMS;

  constructor() {
    // Configure connection for Analos network with extended timeouts
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
      confirmTransactionTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    
    this.programIds = ANALOS_PROGRAMS;
    
    console.log('🔗 Smart Contract Service initialized');
    console.log('🔗 RPC URL:', ANALOS_RPC_URL);
  }

  /**
   * Pause or unpause a collection
   */
  async pauseCollection(params: PauseCollectionParams): Promise<SmartContractCallResult> {
    try {
      console.log('⏸️ Pausing/Unpausing collection:', {
        collection: params.collectionConfigAddress,
        paused: params.paused,
        authority: params.authorityWallet
      });

      // Create the transaction
      const transaction = new Transaction();

      // Build the setPause instruction
      const pauseInstruction = await this.buildSetPauseInstruction(
        params.collectionConfigAddress,
        params.authorityWallet,
        params.paused
      );

      transaction.add(pauseInstruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(params.authorityWallet);

      // Sign with user's wallet
      const signedTransaction = await params.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3
        }
      );

      console.log('✅ Pause transaction sent:', signature);

      // Wait for confirmation
      try {
        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Pause transaction confirmed on blockchain');
      } catch (confirmError) {
        console.log('⚠️ Confirmation timeout, but transaction was sent:', signature);
      }

      return {
        success: true,
        signature
      };

    } catch (error) {
      console.error('❌ Error pausing collection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update collection configuration
   */
  async updateCollectionConfig(params: UpdateCollectionConfigParams): Promise<SmartContractCallResult> {
    try {
      console.log('⚙️ Updating collection config:', {
        collection: params.collectionConfigAddress,
        newPrice: params.newPrice,
        authority: params.authorityWallet
      });

      // Create the transaction
      const transaction = new Transaction();

      // Build the updateConfig instruction
      const updateInstruction = await this.buildUpdateConfigInstruction(
        params.collectionConfigAddress,
        params.authorityWallet,
        params.newPrice
      );

      transaction.add(updateInstruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(params.authorityWallet);

      // Sign with user's wallet
      const signedTransaction = await params.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3
        }
      );

      console.log('✅ Update config transaction sent:', signature);

      // Wait for confirmation with extended timeout for Analos network
      try {
        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Update config transaction confirmed on blockchain');
      } catch (confirmError: any) {
        console.log('⚠️ Confirmation timeout, checking transaction status...');
        
        try {
          const txStatus = await this.connection.getSignatureStatus(signature);
          if (txStatus.value && !txStatus.value.err) {
            console.log('✅ Transaction confirmed via signature status check:', signature);
          } else {
            console.log('⚠️ Transaction status unclear, but transaction was sent:', signature);
          }
        } catch (statusError) {
          console.log('⚠️ Confirmation timeout, but transaction was sent:', signature);
        }
      }

      return {
        success: true,
        signature
      };

    } catch (error) {
      console.error('❌ Error updating collection config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build setPause instruction
   */
  private async buildSetPauseInstruction(
    collectionConfigAddress: string,
    authorityWallet: string,
    paused: boolean
  ): Promise<TransactionInstruction> {
    // Instruction discriminator for setPause (8 bytes)
    // This should match the discriminator in your program
    const discriminator = Buffer.from([0x8b, 0x9a, 0x3b, 0x2c, 0x1d, 0x4e, 0x5f, 0x6a]); // Example discriminator
    
    // Instruction data: discriminator (8 bytes) + paused (1 byte)
    const instructionData = Buffer.alloc(9);
    instructionData.set(discriminator, 0);
    instructionData.writeUInt8(paused ? 1 : 0, 8);

    console.log('🔧 Building setPause instruction:', {
      discriminator: discriminator.toString('hex'),
      paused,
      dataLength: instructionData.length
    });

    return new TransactionInstruction({
      keys: [
        {
          pubkey: new PublicKey(collectionConfigAddress),
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: new PublicKey(authorityWallet),
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: this.programIds.NFT_LAUNCHPAD,
      data: instructionData,
    });
  }

  /**
   * Build updateConfig instruction
   */
  private async buildUpdateConfigInstruction(
    collectionConfigAddress: string,
    authorityWallet: string,
    newPrice?: number
  ): Promise<TransactionInstruction> {
    // Instruction discriminator for updateConfig (8 bytes)
    const discriminator = Buffer.from([0x7a, 0x8b, 0x9c, 0x2d, 0x3e, 0x4f, 0x5a, 0x6b]); // Example discriminator
    
    // Instruction data: discriminator (8 bytes) + hasNewPrice (1 byte) + newPrice (8 bytes if present)
    const hasNewPrice = newPrice !== undefined ? 1 : 0;
    const instructionData = Buffer.alloc(9 + (hasNewPrice ? 8 : 0));
    
    instructionData.set(discriminator, 0);
    instructionData.writeUInt8(hasNewPrice, 8);
    
    if (hasNewPrice && newPrice !== undefined) {
      const priceBuffer = Buffer.alloc(8);
      priceBuffer.writeBigUInt64LE(BigInt(newPrice), 0);
      instructionData.set(priceBuffer, 9);
    }

    console.log('🔧 Building updateConfig instruction:', {
      discriminator: discriminator.toString('hex'),
      hasNewPrice,
      newPrice,
      dataLength: instructionData.length
    });

    return new TransactionInstruction({
      keys: [
        {
          pubkey: new PublicKey(collectionConfigAddress),
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: new PublicKey(authorityWallet),
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: this.programIds.NFT_LAUNCHPAD,
      data: instructionData,
    });
  }

  /**
   * Get collection config account info
   */
  async getCollectionConfig(collectionConfigAddress: string): Promise<any> {
    try {
      console.log('🔍 Getting collection config:', collectionConfigAddress);

      const result = await backendAPI.getAccountInfo(collectionConfigAddress);

      if (!result.success || !result.data?.value) {
        throw new Error('Collection config not found');
      }

      // Parse the account data
      const accountData = Buffer.from(result.data.value.data[0], 'base64');
      
      // This is a simplified parser - you'd need to implement proper parsing
      // based on your program's account structure
      return {
        address: collectionConfigAddress,
        dataLength: accountData.length,
        rawData: accountData.toString('hex')
      };

    } catch (error) {
      console.error('❌ Error getting collection config:', error);
      throw error;
    }
  }

  /**
   * Verify transaction signature
   */
  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const result = await backendAPI.getTransaction(signature);
      return result.success && result.data !== null;
    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      return false;
    }
  }
}

// Export singleton instance
export const smartContractService = new SmartContractService();

// Export convenience functions
export const pauseCollection = (params: PauseCollectionParams) => 
  smartContractService.pauseCollection(params);
export const updateCollectionConfig = (params: UpdateCollectionConfigParams) => 
  smartContractService.updateCollectionConfig(params);
export const getCollectionConfig = (address: string) => 
  smartContractService.getCollectionConfig(address);
export const verifyTransaction = (signature: string) => 
  smartContractService.verifyTransaction(signature);
