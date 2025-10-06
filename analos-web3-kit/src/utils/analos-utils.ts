/**
 * Analos-specific utility functions
 */

import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { ANALOS_CONFIG, AnalosNetwork } from '../types/analos';

export class AnalosUtils {
  /**
   * Create a PublicKey from string with Analos validation
   */
  static createPublicKey(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch (error) {
      throw new Error(`Invalid Analos address: ${address}`);
    }
  }

  /**
   * Validate if an address is a valid Analos address
   */
  static isValidAnalosAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the appropriate RPC endpoint for the network
   */
  static getRpcEndpoint(network: AnalosNetwork = 'MAINNET'): string {
    return ANALOS_CONFIG.RPC_ENDPOINTS[network];
  }

  /**
   * Get the appropriate WebSocket endpoint for the network
   */
  static getWebSocketEndpoint(network: AnalosNetwork = 'MAINNET'): string {
    return ANALOS_CONFIG.WEBSOCKET_ENDPOINTS[network];
  }

  /**
   * Get the explorer URL for the network
   */
  static getExplorerUrl(network: AnalosNetwork = 'MAINNET'): string {
    return ANALOS_CONFIG.EXPLORER_URLS[network];
  }

  /**
   * Create a transaction with Analos-specific optimizations
   */
  static createAnalosTransaction(): Transaction {
    const transaction = new Transaction();
    
    // Add any Analos-specific transaction optimizations here
    // For example, setting specific fee payers, priority fees, etc.
    
    return transaction;
  }

  /**
   * Create a transfer instruction optimized for Analos
   */
  static createAnalosTransferInstruction(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    lamports: number
  ): TransactionInstruction {
    return SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports
    });
  }

  /**
   * Format lamports to SOL for Analos
   */
  static formatAnalosAmount(lamports: number, decimals: number = 9): string {
    return (lamports / Math.pow(10, decimals)).toFixed(decimals);
  }

  /**
   * Parse SOL amount to lamports for Analos
   */
  static parseAnalosAmount(sol: string, decimals: number = 9): number {
    return Math.floor(parseFloat(sol) * Math.pow(10, decimals));
  }

  /**
   * Get network information for display
   */
  static getNetworkDisplayInfo(network: AnalosNetwork) {
    const config = ANALOS_CONFIG.NETWORKS[network];
    return {
      name: config.name,
      rpc: config.rpc,
      ws: config.ws,
      explorer: config.explorer,
      symbol: 'LOS',
      currency: 'Analos'
    };
  }

  /**
   * Check if we're running on a specific network
   */
  static isNetwork(endpoint: string, network: AnalosNetwork): boolean {
    const networkEndpoint = ANALOS_CONFIG.RPC_ENDPOINTS[network];
    return endpoint.includes(networkEndpoint.replace('https://', '').replace('http://', ''));
  }

  /**
   * Get transaction priority fee for Analos (if needed)
   */
  static getAnalosPriorityFee(): number {
    // Return appropriate priority fee for Analos network
    // This might be different from Solana's priority fees
    return 0; // Analos might not need priority fees or have different structure
  }

  /**
   * Create a memo instruction for Analos transactions
   */
  static createAnalosMemoInstruction(memo: string): TransactionInstruction {
    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'), // Memo program ID
      data: Buffer.from(memo, 'utf8')
    });
  }

  /**
   * Validate transaction for Analos-specific constraints
   */
  static validateAnalosTransaction(transaction: Transaction): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Add Analos-specific transaction validation rules here
    // For example:
    // - Check transaction size limits
    // - Validate instruction types
    // - Check for required signatures
    // - Validate fee structure

    if (transaction.instructions.length === 0) {
      errors.push('Transaction must have at least one instruction');
    }

    if (transaction.instructions.length > 20) {
      errors.push('Transaction has too many instructions (max 20)');
    }

    // Check for recent blockhash
    if (!transaction.recentBlockhash) {
      errors.push('Transaction must have a recent blockhash');
    }

    // Check for fee payer
    if (!transaction.feePayer) {
      errors.push('Transaction must have a fee payer');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get Analos-specific error messages
   */
  static getAnalosErrorMessage(error: any): string {
    const errorString = error?.toString() || '';
    
    // Map common Solana errors to Analos-specific messages
    if (errorString.includes('Blockhash not found')) {
      return 'Analos blockhash not found. Please try again.';
    }
    
    if (errorString.includes('Insufficient funds')) {
      return 'Insufficient LOS balance for transaction.';
    }
    
    if (errorString.includes('Transaction too large')) {
      return 'Transaction is too large for Analos network.';
    }
    
    if (errorString.includes('Invalid signature')) {
      return 'Invalid transaction signature for Analos network.';
    }
    
    // Return original error if no mapping found
    return errorString;
  }

  /**
   * Retry logic specific to Analos network characteristics
   */
  static async retryAnalosOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff for Analos network
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`🔄 Analos operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}
