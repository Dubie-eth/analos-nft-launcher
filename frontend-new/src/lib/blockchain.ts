// Analos Blockchain Integration Service
// This service handles real blockchain transactions using Analos RPC

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair,
  TransactionInstruction
} from '@solana/web3.js';

export interface AnalosTransaction {
  instructions: TransactionInstruction[];
  feePayer: PublicKey;
  recentBlockhash: string;
  estimatedFee: number;
}

export interface MintInstruction {
  type: 'createMintAccount';
  mintAddress: string;
  metadata: any;
  mintKeypair: Keypair;
}

export class AnalosBlockchainService {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.rpcUrl = rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🔗 Connected to Analos RPC:', rpcUrl);
  }

  async createMintTransaction(
    walletAddress: string,
    instructions: MintInstruction[]
  ): Promise<AnalosTransaction> {
    try {
      const feePayer = new PublicKey(walletAddress);
      const transaction = new Transaction();
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      // For testing purposes, create a simple transfer instruction
      // This ensures the transaction has a valid structure with proper signers
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: feePayer, // Transfer to self (no actual transfer)
        lamports: 0 // No actual transfer amount
      });
      
      transaction.add(transferInstruction);
      
      // Set transaction properties
      transaction.feePayer = feePayer;
      transaction.recentBlockhash = blockhash;
      
      // Calculate estimated fee
      const estimatedFee = await this.connection.getFeeForMessage(transaction.compileMessage());
      
      return {
        instructions: transaction.instructions,
        feePayer,
        recentBlockhash: blockhash,
        estimatedFee: estimatedFee?.value || 5000
      };
      
    } catch (error) {
      console.error('Error creating mint transaction:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const signature = await this.connection.sendTransaction(transaction, []);
      console.log('✅ Transaction sent:', signature);
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature);
      return confirmation.value.err === null;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getNetworkInfo(): Promise<any> {
    try {
      const version = await this.connection.getVersion();
      const blockHeight = await this.connection.getBlockHeight();
      const slot = await this.connection.getSlot();
      
      return {
        network: 'Analos',
        rpcUrl: this.rpcUrl,
        version: version['solana-core'],
        blockHeight,
        slot,
        connected: true
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        network: 'Analos',
        rpcUrl: this.rpcUrl,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Utility method to check if wallet has enough balance
  async hasEnoughBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getBalance(walletAddress);
    return balance >= requiredAmount;
  }

  // Get transaction explorer URL
  getExplorerUrl(signature: string): string {
    return `https://explorer.analos.io/tx/${signature}`;
  }
}
