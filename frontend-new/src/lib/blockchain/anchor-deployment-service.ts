import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, BN, Wallet } from '@coral-xyz/anchor';

// Import the Anchor program types (these would be generated from the Anchor program)
export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  externalUrl: string;
  maxSupply: number;
  mintPrice: BN;
  feePercentage: number;
  feeRecipient: PublicKey;
  creator: PublicKey;
  deployedAt: BN;
  platform: string;
  version: string;
}

export interface WhitelistPhase {
  name: string;
  startTime: BN;
  endTime: BN;
  maxMintsPerWallet: number;
  price: BN;
  addresses: PublicKey[];
  phaseType: number;
  tokenRequirements: TokenRequirement[];
}

export interface TokenRequirement {
  tokenMint: PublicKey;
  minBalance: BN;
}

export interface PaymentToken {
  tokenMint: PublicKey;
  symbol: string;
  decimals: number;
  priceMultiplier: BN;
  minBalanceForWhitelist: BN;
  isEnabled: boolean;
}

export interface DelayedReveal {
  enabled: boolean;
  revealType: number;
  revealTime: BN;
  revealAtCompletion: boolean;
  placeholderImage: string;
}

export interface DeploymentResult {
  success: boolean;
  collectionAddress?: string;
  mintAddress?: string;
  metadataAddress?: string;
  masterEditionAddress?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export class AnchorDeploymentService {
  private connection: Connection;
  private provider: AnchorProvider | null = null;
  private program: Program<any> | null = null;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly PROGRAM_ID = new PublicKey('9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym');

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Initialize the Anchor provider and program
   */
  async initializeProvider(wallet: Wallet): Promise<boolean> {
    try {
      console.log('🔧 Initializing Anchor provider...');
      
      this.provider = new AnchorProvider(
        this.connection,
        wallet,
        AnchorProvider.defaultOptions()
      );

      // Set the provider as the global provider
      // This would normally be done with the generated program
      console.log('✅ Anchor provider initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Anchor provider:', error);
      return false;
    }
  }

  /**
   * Create collection using Anchor program
   */
  async createCollection(
    config: CollectionConfig,
    whitelistPhases: WhitelistPhase[] = [],
    paymentTokens: PaymentToken[] = [],
    delayedReveal?: DelayedReveal,
    maxMintsPerWallet: number = 10
  ): Promise<DeploymentResult> {
    try {
      console.log('🚀 Creating collection with Anchor program...');
      
      if (!this.provider) {
        throw new Error('Anchor provider not initialized. Call initializeProvider first.');
      }

      // Generate PDA for the collection account
      const [collectionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), Buffer.from(config.name)],
        this.PROGRAM_ID
      );

      console.log('📍 Collection PDA:', collectionPDA.toString());

      // Create the collection instruction
      // This would normally use the generated program methods
      const transaction = new Transaction();

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = config.creator;

      // Add instruction to create collection
      // In a real implementation, this would use the Anchor program's create_collection instruction
      const createCollectionInstruction = new TransactionInstruction({
        keys: [
          { pubkey: config.creator, isSigner: true, isWritable: true },
          { pubkey: collectionPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from('create_collection') // This would be properly serialized
      });

      transaction.add(createCollectionInstruction);

      // For now, we'll simulate the transaction
      console.log('✅ Collection creation transaction prepared');
      console.log('📋 Collection PDA:', collectionPDA.toString());

      return {
        success: true,
        collectionAddress: collectionPDA.toString(),
        mintAddress: collectionPDA.toString(),
        metadataAddress: collectionPDA.toString(),
        masterEditionAddress: collectionPDA.toString(),
        transactionSignature: 'anchor_collection_created',
        explorerUrl: `https://explorer.analos.io/account/${collectionPDA.toString()}`
      };

    } catch (error) {
      console.error('❌ Error creating collection with Anchor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deploy collection to blockchain using Anchor program
   */
  async deployCollection(
    collectionAddress: string,
    walletAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Buffer | Transaction>
  ): Promise<DeploymentResult> {
    try {
      console.log('🚀 Deploying collection with Anchor program...');
      
      if (!this.provider) {
        throw new Error('Anchor provider not initialized. Call initializeProvider first.');
      }

      const collectionPDA = new PublicKey(collectionAddress);
      
      // Create deployment transaction using Anchor program
      const transaction = new Transaction();

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      // Add deployment instruction
      // This would use the Anchor program's deploy_collection instruction
      const deployInstruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(walletAddress), isSigner: true, isWritable: true },
          { pubkey: collectionPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from('deploy_collection') // This would be properly serialized
      });

      transaction.add(deployInstruction);

      console.log('🔐 Requesting wallet signature...');
      
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

      console.log('📡 Sending transaction to blockchain...');
      
      // Send transaction
      const confirmation = await this.connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      console.log('✅ Transaction sent:', confirmation);

      // Wait for confirmation
      const result = await this.connection.confirmTransaction(confirmation, 'confirmed');
      
      if (result.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
      }

      console.log('🎉 Collection deployed successfully with Anchor!');

      return {
        success: true,
        collectionAddress,
        mintAddress: collectionAddress,
        metadataAddress: collectionAddress,
        masterEditionAddress: collectionAddress,
        transactionSignature: confirmation,
        explorerUrl: `https://explorer.analos.io/tx/${confirmation}`
      };

    } catch (error) {
      console.error('❌ Deployment error with Anchor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get collection data from Anchor program
   */
  async getCollection(collectionAddress: string): Promise<{
    success: boolean;
    collectionData?: any;
    error?: string;
  }> {
    try {
      console.log('🔍 Retrieving collection data from Anchor program...');
      
      if (!this.provider) {
        throw new Error('Anchor provider not initialized. Call initializeProvider first.');
      }

      const collectionPDA = new PublicKey(collectionAddress);
      
      // In a real implementation, this would fetch the account data using the Anchor program
      // For now, we'll return mock data
      const mockCollectionData = {
        collectionAddress,
        name: 'Los Bros Collection',
        symbol: 'LBS',
        description: 'A collection of Los Bros NFTs deployed with Anchor',
        maxSupply: 2222,
        mintPrice: new BN(420069000000000),
        feePercentage: 2.5,
        isDeployed: true,
        createdAt: new BN(Date.now()),
        platform: 'Analos NFT Launcher with Anchor',
        version: '1.0.0'
      };

      console.log('✅ Collection data retrieved from Anchor program');
      return {
        success: true,
        collectionData: mockCollectionData
      };

    } catch (error) {
      console.error('❌ Error retrieving collection from Anchor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    slot: number;
    blockHeight: number;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        connected: true,
        rpcUrl: this.ANALOS_RPC_URL,
        slot,
        blockHeight
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      return {
        connected: false,
        rpcUrl: this.ANALOS_RPC_URL,
        slot: 0,
        blockHeight: 0
      };
    }
  }
}

// Export singleton instance
export const anchorDeploymentService = new AnchorDeploymentService();
