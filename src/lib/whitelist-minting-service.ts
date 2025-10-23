import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { LOLTokenChecker, LOLTokenStatus } from './lol-token-checker';

export interface WhitelistMintResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  error?: string;
  isFreeMint?: boolean;
  lolStatus?: LOLTokenStatus;
}

export interface WhitelistMintParams {
  wallet: string;
  username: string;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  sendTransaction: (transaction: Transaction) => Promise<string>;
  connection: Connection;
}

export class WhitelistMintingService {
  private connection: Connection;
  private lolChecker: LOLTokenChecker;

  constructor(connection: Connection) {
    this.connection = connection;
    this.lolChecker = new LOLTokenChecker(connection);
  }

  async mintWithWhitelistCheck(params: WhitelistMintParams): Promise<WhitelistMintResult> {
    try {
      // Check LOL token balance first
      const lolStatus = await this.lolChecker.checkLOLBalance(params.wallet);
      
      if (!lolStatus.isWhitelisted) {
        return {
          success: false,
          error: 'You need to hold 1,000,000+ LOL tokens to mint. Current balance: ' + lolStatus.balanceFormatted,
          lolStatus
        };
      }

      // Check if user has already used their free mint
      const hasUsedFreeMint = await this.checkFreeMintUsage(params.wallet);
      
      if (hasUsedFreeMint) {
        return {
          success: false,
          error: 'You have already used your free mint. Please mint at regular price.',
          lolStatus
        };
      }

      // Proceed with free mint
      const mintResult = await this.executeFreeMint(params);
      
      if (mintResult.success) {
        // Mark free mint as used
        await this.markFreeMintUsed(params.wallet);
      }

      return {
        ...mintResult,
        isFreeMint: true,
        lolStatus
      };

    } catch (error) {
      console.error('Whitelist minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async executeFreeMint(params: WhitelistMintParams): Promise<WhitelistMintResult> {
    try {
      // Create a simple transaction for free mint
      // This would normally call your actual minting program
      const transaction = new Transaction();
      
      // Add minting instruction here
      // For now, we'll create a placeholder transaction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(params.wallet),
          toPubkey: new PublicKey(params.wallet), // Placeholder
          lamports: 0 // Free mint
        })
      );

      // Sign and send transaction
      const signedTransaction = await params.signTransaction(transaction);
      const signature = await params.sendTransaction(signedTransaction);

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        success: true,
        signature,
        mintAddress: 'placeholder-mint-address' // Would be actual mint address
      };

    } catch (error) {
      console.error('Free mint execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute free mint'
      };
    }
  }

  private async checkFreeMintUsage(walletAddress: string): Promise<boolean> {
    try {
      // Check if wallet has already used their free mint
      // This would typically check a database or on-chain record
      const response = await fetch(`/api/whitelist/check-free-mint?wallet=${walletAddress}`);
      const data = await response.json();
      
      return data.hasUsedFreeMint || false;
    } catch (error) {
      console.error('Error checking free mint usage:', error);
      return false; // Default to allowing mint if check fails
    }
  }

  private async markFreeMintUsed(walletAddress: string): Promise<void> {
    try {
      // Mark the free mint as used
      await fetch('/api/whitelist/mark-free-mint-used', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          usedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error marking free mint as used:', error);
    }
  }

  async getWhitelistStatus(walletAddress: string): Promise<{
    isWhitelisted: boolean;
    hasUsedFreeMint: boolean;
    lolStatus: LOLTokenStatus;
    canMint: boolean;
  }> {
    try {
      const lolStatus = await this.lolChecker.checkLOLBalance(walletAddress);
      const hasUsedFreeMint = await this.checkFreeMintUsage(walletAddress);
      
      return {
        isWhitelisted: lolStatus.isWhitelisted,
        hasUsedFreeMint,
        lolStatus,
        canMint: lolStatus.isWhitelisted && !hasUsedFreeMint
      };
    } catch (error) {
      console.error('Error getting whitelist status:', error);
      return {
        isWhitelisted: false,
        hasUsedFreeMint: false,
        lolStatus: {
          isWhitelisted: false,
          balance: 0,
          balanceFormatted: '0 LOL',
          tier: 'none',
          benefits: [],
          freeMintsAvailable: 0,
          discountPercentage: 0,
          isPublicLaunch: true,
          whitelistPosition: null,
          whitelistSlotsRemaining: 0
        },
        canMint: false
      };
    }
  }
}
