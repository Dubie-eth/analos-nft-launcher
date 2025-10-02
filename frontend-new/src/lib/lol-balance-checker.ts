/**
 * LOL Balance Checker - Checks user's $LOL token balance
 * $LOL is the project token, not the native $LOS token
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

export interface LOLBalanceInfo {
  balance: number;
  balanceFormatted: string;
  hasMinimumBalance: boolean;
  minimumRequired: number;
  shortfall: number;
  tokenMint: string;
  tokenAccount?: string;
}

export class LOLBalanceChecker {
  private connection: Connection;
  private lolTokenMint: string;

  constructor() {
    // Use Analos RPC
    this.connection = new Connection('https://rpc.analos.io', 'confirmed');
    
    // $LOL token mint address on Analos
    this.lolTokenMint = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
  }

  /**
   * Check user's $LOL token balance
   */
  async checkLOLBalance(walletAddress: string, minimumRequired: number = 1000): Promise<LOLBalanceInfo> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(this.lolTokenMint);

      // Get associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey
      );

      try {
        // Get token account info
        const tokenAccount = await getAccount(this.connection, associatedTokenAddress);
        const balance = Number(tokenAccount.amount);
        const balanceFormatted = (balance / Math.pow(10, tokenAccount.mint.toString() === this.lolTokenMint ? 6 : 6)).toFixed(2);
        
        const hasMinimumBalance = balance >= minimumRequired;
        const shortfall = Math.max(0, minimumRequired - balance);

        return {
          balance,
          balanceFormatted,
          hasMinimumBalance,
          minimumRequired,
          shortfall,
          tokenMint: this.lolTokenMint,
          tokenAccount: associatedTokenAddress.toString()
        };
      } catch (error) {
        // Token account doesn't exist or has zero balance
        return {
          balance: 0,
          balanceFormatted: '0.00',
          hasMinimumBalance: false,
          minimumRequired,
          shortfall: minimumRequired,
          tokenMint: this.lolTokenMint,
          tokenAccount: associatedTokenAddress.toString()
        };
      }
    } catch (error) {
      console.error('Error checking LOL balance:', error);
      throw new Error('Failed to check LOL balance');
    }
  }

  /**
   * Check if user has minimum $LOL balance
   */
  async hasMinimumLOLBalance(walletAddress: string, minimumRequired: number = 1000): Promise<boolean> {
    try {
      const balanceInfo = await this.checkLOLBalance(walletAddress, minimumRequired);
      return balanceInfo.hasMinimumBalance;
    } catch (error) {
      console.error('Error checking minimum LOL balance:', error);
      return false;
    }
  }

  /**
   * Get LOL token metadata
   */
  getLOLTokenInfo() {
    return {
      symbol: 'LOL',
      name: 'LOL Token',
      mint: this.lolTokenMint,
      decimals: 6,
      description: 'The LOL token used for minting NFTs on the Analos blockchain'
    };
  }
}

export const lolBalanceChecker = new LOLBalanceChecker();
