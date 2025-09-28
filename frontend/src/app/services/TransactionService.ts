import type { Connection, Transaction, PublicKey } from '@solana/web3.js';

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
    } catch (error: unknown) {
      console.error('Error submitting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
    } catch (error: unknown) {
      console.error('Error getting transaction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
        explorerUrl: `https://explorer.analos.io/tx/${signature}`,
      };
    } catch (error: unknown) {
      console.error('Error signing and submitting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const signatures = signedTransaction.signatures
        .map((sig: any) => (sig?.signature ? uint8ToBase64(sig.signature) : null))
        .filter((val: string | null): val is string => Boolean(val));

      // Submit through backend
      return await this.submitTransaction(transaction, signatures);
    } catch (error: unknown) {
      console.error('Error signing and submitting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const transactionService = new TransactionService();

// Helpers
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in browser; on server, Next polyfills for Edge runtimes
  // If not available, this will throw and be caught by callers.
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}
