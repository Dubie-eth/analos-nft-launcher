import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';

export interface AnalosNFTCreationData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family: string;
  };
}

export interface AnalosMintingResult {
  success: boolean;
  nftId?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export class AnalosCompatibleService {
  private connection: Connection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Validate if an address is compatible with Analos network
   */
  private validateAnalosAddress(address: string): boolean {
    try {
      // Analos uses the same base58 encoding as Solana, but let's be extra careful
      if (!address || typeof address !== 'string') {
        return false;
      }

      // Check if it looks like a valid Solana/Analos address
      if (address.length < 32 || address.length > 44) {
        return false;
      }

      // Try to create a PublicKey to validate format
      new PublicKey(address);
      return true;
    } catch (error) {
      console.error('Address validation failed:', error);
      return false;
    }
  }

  /**
   * Create NFT using Analos-compatible approach
   */
  async createNFT(
    nftData: AnalosNFTCreationData,
    ownerAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Buffer | Transaction>
  ): Promise<AnalosMintingResult> {
    try {
      console.log('🎨 Creating NFT on Analos blockchain...');
      console.log('📋 NFT Data:', nftData);
      console.log('👤 Owner:', ownerAddress);

      // Validate the owner address for Analos compatibility
      if (!this.validateAnalosAddress(ownerAddress)) {
        throw new Error(`Invalid Analos address format: ${ownerAddress}`);
      }

      // Generate a unique NFT ID
      const nftId = `analos_nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a simple transaction that works with Analos
      const transaction = new Transaction();

      // Get recent blockhash from Analos
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Create a simple memo instruction that stores NFT metadata
      const metadata = {
        action: 'analos_nft_creation',
        nft_id: nftId,
        name: nftData.name,
        symbol: nftData.symbol,
        description: nftData.description,
        image: nftData.image,
        attributes: nftData.attributes || [],
        collection: nftData.collection,
        owner: ownerAddress,
        created_at: new Date().toISOString(),
        network: 'Analos',
        type: 'nft_metadata',
        version: '1.0.0'
      };

      // Use Analos-compatible memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [], // Memo instructions don't require keys
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'), // Standard memo program
        data: Buffer.from(JSON.stringify(metadata), 'utf8')
      });

      transaction.add(memoInstruction);

      console.log('🔐 Requesting wallet signature for Analos NFT creation...');
      
      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Handle different return types from wallet adapters
      let serializedTransaction: Buffer;
      if (signedTransaction instanceof Buffer) {
        serializedTransaction = signedTransaction;
      } else if (signedTransaction && typeof (signedTransaction as Transaction).serialize === 'function') {
        serializedTransaction = (signedTransaction as Transaction).serialize();
      } else {
        throw new Error('Invalid signed transaction format');
      }

      console.log('📡 Sending NFT creation transaction to Analos blockchain...');
      
      // Send transaction to Analos
      const confirmation = await this.connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      console.log('✅ NFT creation transaction sent to Analos:', confirmation);

      // Wait for confirmation
      const result = await this.connection.confirmTransaction(confirmation, 'confirmed');
      
      if (result.value.err) {
        throw new Error(`Analos NFT creation failed: ${JSON.stringify(result.value.err)}`);
      }

      console.log('🎉 NFT created successfully on Analos blockchain!');
      console.log('🎨 NFT ID:', nftId);
      console.log('🔗 Analos Explorer URL:', `https://explorer.analos.io/tx/${confirmation}`);

      return {
        success: true,
        nftId: nftId,
        transactionSignature: confirmation,
        explorerUrl: `https://explorer.analos.io/tx/${confirmation}`
      };

    } catch (error) {
      console.error('❌ Analos NFT creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get connection status for Analos network
   */
  async getAnalosConnectionStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    slot: number;
    blockHeight: number;
    network: string;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        connected: true,
        rpcUrl: this.ANALOS_RPC_URL,
        slot,
        blockHeight,
        network: 'Analos'
      };
    } catch (error) {
      console.error('Analos connection check failed:', error);
      return {
        connected: false,
        rpcUrl: this.ANALOS_RPC_URL,
        slot: 0,
        blockHeight: 0,
        network: 'Analos'
      };
    }
  }

  /**
   * Check if the service is compatible with Analos
   */
  async checkAnalosCompatibility(): Promise<{
    compatible: boolean;
    version: string;
    features: string[];
  }> {
    try {
      // Test basic connection to Analos
      const slot = await this.connection.getSlot();
      
      return {
        compatible: true,
        version: '1.0.0',
        features: [
          'Analos RPC Connection',
          'NFT Metadata Storage',
          'Transaction Signing',
          'Explorer Integration'
        ]
      };
    } catch (error) {
      return {
        compatible: false,
        version: '1.0.0',
        features: []
      };
    }
  }
}

// Export singleton instance
export const analosCompatibleService = new AnalosCompatibleService();
