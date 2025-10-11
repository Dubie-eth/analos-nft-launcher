import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import BlockchainVerificationService from './blockchain-verification-service';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface RetryResult {
  success: boolean;
  transactionSignature?: string;
  attempts: number;
  totalTimeMs: number;
  error?: string;
  verificationResult?: any;
}

export class TransactionRetryService {
  private connection: Connection;
  private verificationService: BlockchainVerificationService;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  };

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.verificationService = new BlockchainVerificationService(rpcUrl);
    console.log('🔄 Transaction Retry Service initialized');
  }

  /**
   * Retry a transaction with exponential backoff
   */
  async retryTransaction(
    transactionFactory: () => Promise<Transaction>,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | null = null;

    console.log('🔄 Starting transaction retry with config:', finalConfig);

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${finalConfig.maxRetries}`);
        
        // Create fresh transaction
        const transaction = await transactionFactory();
        
        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
        console.log(`✅ Transaction sent on attempt ${attempt}:`, signature);
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log(`✅ Transaction confirmed on attempt ${attempt}`);
        
        // Verify transaction
        const verificationResult = await this.verificationService.verifyMintingTransaction(
          signature,
          'Launch On LOS', // Expected collection
          1, // Expected quantity
          '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW' // Expected payer
        );
        
        if (verificationResult.success && verificationResult.verified) {
          const totalTime = Date.now() - startTime;
          console.log(`🎉 Transaction successful on attempt ${attempt} after ${totalTime}ms`);
          
          return {
            success: true,
            transactionSignature: signature,
            attempts: attempt,
            totalTimeMs: totalTime,
            verificationResult
          };
        } else {
          throw new Error(`Transaction verification failed: ${verificationResult.error}`);
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry on the last attempt
        if (attempt < finalConfig.maxRetries) {
          const delay = Math.min(
            finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
            finalConfig.maxDelayMs
          );
          
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.error(`❌ All ${finalConfig.maxRetries} attempts failed after ${totalTime}ms`);
    
    return {
      success: false,
      attempts: finalConfig.maxRetries,
      totalTimeMs: totalTime,
      error: lastError?.message || 'All retry attempts failed'
    };
  }

  /**
   * Retry with different RPC endpoints
   */
  async retryWithMultipleRPCs(
    transactionFactory: () => Promise<Transaction>,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    rpcUrls: string[] = [
      'https://rpc.analos.io',
      'https://api.analos.io',
      'https://analos-mainnet.rpc.extrnode.com'
    ]
  ): Promise<RetryResult> {
    console.log('🌐 Retrying with multiple RPC endpoints:', rpcUrls);
    
    for (let i = 0; i < rpcUrls.length; i++) {
      const rpcUrl = rpcUrls[i];
      console.log(`🌐 Trying RPC ${i + 1}/${rpcUrls.length}: ${rpcUrl}`);
      
      try {
        // Create new service instance with different RPC
        const retryService = new TransactionRetryService(rpcUrl);
        
        const result = await retryService.retryTransaction(
          transactionFactory,
          signTransaction,
          { maxRetries: 2 } // Fewer retries per RPC
        );
        
        if (result.success) {
          console.log(`✅ Success with RPC ${i + 1}: ${rpcUrl}`);
          return result;
        }
        
      } catch (error) {
        console.error(`❌ RPC ${i + 1} failed:`, error);
      }
    }
    
    return {
      success: false,
      attempts: rpcUrls.length,
      totalTimeMs: 0,
      error: 'All RPC endpoints failed'
    };
  }

  /**
   * Smart retry with adaptive strategy
   */
  async smartRetry(
    transactionFactory: () => Promise<Transaction>,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
    options: {
      useMultipleRPCs?: boolean;
      adaptiveDelay?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<RetryResult> {
    const {
      useMultipleRPCs = true,
      adaptiveDelay = true,
      maxRetries = 3
    } = options;

    console.log('🧠 Starting smart retry with adaptive strategy');

    if (useMultipleRPCs) {
      return this.retryWithMultipleRPCs(transactionFactory, signTransaction);
    }

    const config: RetryConfig = {
      maxRetries,
      baseDelayMs: adaptiveDelay ? 500 : 1000,
      maxDelayMs: adaptiveDelay ? 5000 : 10000,
      backoffMultiplier: adaptiveDelay ? 1.5 : 2
    };

    return this.retryTransaction(transactionFactory, signTransaction, config);
  }

  /**
   * Check transaction status with retries
   */
  async checkTransactionStatusWithRetry(
    signature: string,
    maxRetries: number = 5,
    delayMs: number = 2000
  ): Promise<{
    status: 'pending' | 'confirmed' | 'finalized' | 'failed';
    confirmations: number;
    blockTime?: number;
    error?: any;
  }> {
    console.log(`🔍 Checking transaction status with retries: ${signature}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const status = await this.verificationService.getTransactionStatus(signature);
        
        if (status.status === 'confirmed' || status.status === 'finalized') {
          console.log(`✅ Transaction confirmed on attempt ${attempt}`);
          return status;
        }
        
        if (status.status === 'failed') {
          console.log(`❌ Transaction failed on attempt ${attempt}`);
          return status;
        }
        
        console.log(`⏳ Transaction still pending on attempt ${attempt}`);
        
        if (attempt < maxRetries) {
          await this.delay(delayMs);
        }
        
      } catch (error) {
        console.error(`❌ Status check attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await this.delay(delayMs);
        }
      }
    }
    
    return { status: 'pending', confirmations: 0 };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): {
    totalRetries: number;
    successRate: number;
    averageRetryTime: number;
  } {
    // This would track actual retry statistics in a real implementation
    return {
      totalRetries: 0,
      successRate: 0,
      averageRetryTime: 0
    };
  }
}

export default TransactionRetryService;
