/**
 * Wallet Security Validator
 * 
 * Comprehensive wallet validation and security checks
 * to ensure all wallet operations are secure and legitimate.
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { SECURITY_CONFIG, isAuthorizedAdminWallet } from './security-config';

export interface WalletValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number; // 0-100
}

export interface WalletInfo {
  address: string;
  balance: number;
  isAdmin: boolean;
  isVerified: boolean;
  lastActivity: Date;
  transactionCount: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class WalletValidator {
  private connection: Connection;
  private walletCache: Map<string, WalletInfo> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Validate a wallet address format and existence
   */
  async validateWalletAddress(address: string): Promise<WalletValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    try {
      // Check if address is valid base58
      const publicKey = new PublicKey(address);
      
      // Check if wallet exists on chain
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      if (!accountInfo) {
        errors.push('Wallet does not exist on the blockchain');
        securityScore -= 50;
      }

      // Check wallet balance
      const balance = await this.connection.getBalance(publicKey);
      const minBalance = SECURITY_CONFIG.WALLET_SECURITY.MIN_BALANCE_REQUIRED;
      
      if (balance < minBalance) {
        warnings.push(`Low balance: ${balance} lamports (minimum recommended: ${minBalance})`);
        securityScore -= 20;
      }

      // Check if wallet is admin
      const isAdmin = isAuthorizedAdminWallet(address);
      
      // Get transaction history
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 });
      
      if (signatures.length === 0) {
        warnings.push('No transaction history found - new wallet');
        securityScore -= 10;
      }

      // Cache wallet info
      const walletInfo: WalletInfo = {
        address,
        balance,
        isAdmin,
        isVerified: accountInfo !== null,
        lastActivity: signatures[0] ? new Date(signatures[0].blockTime! * 1000) : new Date(),
        transactionCount: signatures.length,
        riskLevel: this.calculateRiskLevel(balance, signatures.length, isAdmin)
      };

      this.cacheWalletInfo(address, walletInfo);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityScore: Math.max(0, securityScore)
      };

    } catch (error) {
      errors.push(`Invalid wallet address format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        securityScore: 0
      };
    }
  }

  /**
   * Validate a transaction before signing
   */
  async validateTransaction(
    transaction: Transaction,
    walletAddress: string,
    expectedRecipients?: string[]
  ): Promise<WalletValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    try {
      // Check transaction size
      const serializedSize = transaction.serialize({ requireAllSignatures: false }).length;
      const maxSize = 1232; // Solana transaction size limit
      
      if (serializedSize > maxSize) {
        errors.push(`Transaction too large: ${serializedSize} bytes (max: ${maxSize})`);
        securityScore -= 30;
      }

      // Validate all instructions
      for (let i = 0; i < transaction.instructions.length; i++) {
        const instruction = transaction.instructions[i];
        const instructionValidation = await this.validateInstruction(instruction, walletAddress);
        
        if (!instructionValidation.isValid) {
          errors.push(`Instruction ${i}: ${instructionValidation.errors.join(', ')}`);
          securityScore -= 20;
        }
        
        warnings.push(...instructionValidation.warnings.map(w => `Instruction ${i}: ${w}`));
      }

      // Check for suspicious patterns
      const suspiciousPatterns = this.detectSuspiciousPatterns(transaction, walletAddress);
      if (suspiciousPatterns.length > 0) {
        warnings.push(...suspiciousPatterns);
        securityScore -= 15;
      }

      // Validate recipients if provided
      if (expectedRecipients) {
        const actualRecipients = this.extractRecipients(transaction);
        const unexpectedRecipients = actualRecipients.filter(r => !expectedRecipients.includes(r));
        
        if (unexpectedRecipients.length > 0) {
          errors.push(`Unexpected recipients: ${unexpectedRecipients.join(', ')}`);
          securityScore -= 25;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityScore: Math.max(0, securityScore)
      };

    } catch (error) {
      errors.push(`Transaction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        securityScore: 0
      };
    }
  }

  /**
   * Get cached wallet information
   */
  getWalletInfo(address: string): WalletInfo | null {
    const cached = this.walletCache.get(address);
    const expiry = this.cacheExpiry.get(address);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  /**
   * Check if wallet is authorized for admin operations
   */
  isAdminWallet(address: string): boolean {
    return isAuthorizedAdminWallet(address);
  }

  /**
   * Calculate risk level for a wallet
   */
  private calculateRiskLevel(balance: number, transactionCount: number, isAdmin: boolean): 'low' | 'medium' | 'high' {
    if (isAdmin) return 'low';
    
    let riskScore = 0;
    
    // Low balance increases risk
    if (balance < SECURITY_CONFIG.WALLET_SECURITY.MIN_BALANCE_REQUIRED) {
      riskScore += 30;
    }
    
    // No transaction history increases risk
    if (transactionCount === 0) {
      riskScore += 40;
    } else if (transactionCount < 5) {
      riskScore += 20;
    }
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Validate a single transaction instruction
   */
  private async validateInstruction(
    instruction: TransactionInstruction,
    walletAddress: string
  ): Promise<WalletValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    try {
      // Check if instruction involves the wallet
      const walletPubkey = new PublicKey(walletAddress);
      const involvesWallet = instruction.keys.some(key => key.pubkey.equals(walletPubkey));
      
      if (!involvesWallet) {
        warnings.push('Instruction does not involve the signing wallet');
        securityScore -= 10;
      }

      // Check for dangerous program IDs
      const dangerousPrograms = [
        // Add known malicious program IDs here
      ];
      
      if (dangerousPrograms.includes(instruction.programId.toBase58())) {
        errors.push('Instruction involves potentially dangerous program');
        securityScore -= 50;
      }

      // Validate account permissions
      for (const accountMeta of instruction.keys) {
        if (accountMeta.pubkey.equals(walletPubkey) && !accountMeta.isSigner) {
          warnings.push('Wallet is involved but not required to sign');
          securityScore -= 5;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityScore: Math.max(0, securityScore)
      };

    } catch (error) {
      errors.push(`Instruction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        securityScore: 0
      };
    }
  }

  /**
   * Detect suspicious patterns in transactions
   */
  private detectSuspiciousPatterns(transaction: Transaction, walletAddress: string): string[] {
    const warnings: string[] = [];
    
    // Check for high number of instructions
    if (transaction.instructions.length > 10) {
      warnings.push('High number of instructions - verify all operations');
    }
    
    // Check for multiple transfers to same recipient
    const recipients = this.extractRecipients(transaction);
    const recipientCounts = recipients.reduce((acc, recipient) => {
      acc[recipient] = (acc[recipient] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const multipleRecipients = Object.entries(recipientCounts)
      .filter(([_, count]) => count > 1)
      .map(([recipient, count]) => `${recipient} (${count} times)`);
    
    if (multipleRecipients.length > 0) {
      warnings.push(`Multiple transfers to same recipients: ${multipleRecipients.join(', ')}`);
    }
    
    return warnings;
  }

  /**
   * Extract recipient addresses from transaction
   */
  private extractRecipients(transaction: Transaction): string[] {
    const recipients: string[] = [];
    
    for (const instruction of transaction.instructions) {
      for (const accountMeta of instruction.keys) {
        if (!accountMeta.isSigner && !accountMeta.isWritable) {
          recipients.push(accountMeta.pubkey.toBase58());
        }
      }
    }
    
    return [...new Set(recipients)]; // Remove duplicates
  }

  /**
   * Cache wallet information
   */
  private cacheWalletInfo(address: string, info: WalletInfo): void {
    this.walletCache.set(address, info);
    this.cacheExpiry.set(address, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [address, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.walletCache.delete(address);
        this.cacheExpiry.delete(address);
      }
    }
  }
}

// Export singleton instance
export const walletValidator = new WalletValidator();
