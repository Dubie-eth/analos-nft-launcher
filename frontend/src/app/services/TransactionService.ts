import { Connection, Transaction, PublicKey } from '@solana/web3.js';

export interface TransactionResult {
  success: boolean;
  signature?: string;
  confirmed?: boolean;
  slot?: number;
  blockTime?: number;
  explorerUrl?: string;
  error?: string;
}

export interface MintNftParams {
  collectionId: string;
  nftName: string;
  nftSymbol?: string;
  nftUri?: string;
  userWallet: string;
  programId: string;
}

export interface DeployCollectionParams {
  collectionName: string;
  collectionSymbol?: string;
  collectionUri?: string;
  maxSupply?: number;
  mintPrice?: number;
  authorityWallet: string;
  programId: string;
}

export class TransactionService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  async createMintNftTransaction(params: MintNftParams): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/transactions/mint-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create mint transaction');
      }

      return data;
    } catch (error) {
      console.error('Error creating mint transaction:', error);
      throw error;
    }
  }

  async createDeployCollectionTransaction(params: DeployCollectionParams): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/transactions/deploy-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deployment transaction');
      }

      return data;
    } catch (error) {
      console.error('Error creating deployment transaction:', error);
      throw error;
    }
  }

  async submitTransaction(transaction: Transaction, signatures: string[]): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.backendUrl}/api/transactions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: transaction.serialize({ requireAllSignatures: false }),
          signatures,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      return data.data;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTransactionStatus(signature: string): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.backendUrl}/api/transactions/${signature}/status`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get transaction status');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async signAndSubmitTransaction(
    transaction: Transaction,
    wallet: any,
    connection: Connection
  ): Promise<TransactionResult> {
    try {
      // Sign the transaction with the wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      // Submit the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      return {
        success: true,
        signature,
        confirmed: true,
        slot: confirmation.value.slot,
        blockTime: confirmation.value.blockTime,
        explorerUrl: `https://explorer.analos.io/tx/${signature}`,
      };
    } catch (error) {
      console.error('Error signing and submitting transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async signAndSubmitTransactionWithBackend(
    transaction: Transaction,
    wallet: any
  ): Promise<TransactionResult> {
    try {
      // Sign the transaction with the wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      // Get signatures
      const signatures = signedTransaction.signatures.map(sig => 
        sig.signature ? Buffer.from(sig.signature).toString('base64') : null
      ).filter(Boolean);

      // Submit through backend
      return await this.submitTransaction(transaction, signatures);
    } catch (error) {
      console.error('Error signing and submitting transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const transactionService = new TransactionService();
