/**
 * LOL Balance Checker - Checks user's $LOL token balance
 * $LOL is the project token, not the native $LOS token
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { tokenMetadataService } from './token-metadata-service';

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
      console.log('🔍 Checking LOL balance for wallet:', walletAddress);
      
      // First, ensure we have the correct token metadata
      const tokenMetadata = await tokenMetadataService.getTokenMetadata(this.lolTokenMint);
      if (!tokenMetadata.valid || !tokenMetadata.token) {
        throw new Error('Failed to fetch LOL token metadata');
      }

      const token = tokenMetadata.token;
      console.log('✅ LOL token metadata verified:', {
        symbol: token.symbol,
        decimals: token.decimals,
        isToken2022: token.isToken2022
      });

      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(this.lolTokenMint);

      // First try the standard SPL token approach
      try {
        const associatedTokenAddress = await getAssociatedTokenAddress(
          tokenMintPublicKey,
          walletPublicKey
        );

        const tokenAccount = await getAccount(this.connection, associatedTokenAddress);
        const balance = Number(tokenAccount.amount);
            const balanceFormatted = tokenMetadataService.formatTokenAmount(this.lolTokenMint, BigInt(balance));
        
        console.log('✅ Found LOL balance via SPL token:', balance);
        
        const minimumRequiredRaw = minimumRequired * Math.pow(10, token.decimals); // Convert to raw units using verified decimals
        const hasMinimumBalance = balance >= minimumRequiredRaw;
        const shortfall = Math.max(0, (minimumRequiredRaw - balance) / Math.pow(10, token.decimals));

        return {
          balance,
          balanceFormatted,
          hasMinimumBalance,
          minimumRequired: minimumRequired,
          shortfall,
          tokenMint: this.lolTokenMint,
          tokenAccount: associatedTokenAddress.toString()
        };
      } catch (splError) {
        console.log('⚠️ SPL token method failed, trying Token-2022 approach:', splError);
        
        // Try Token-2022 approach using raw RPC calls
        return await this.checkLOLBalanceToken2022(walletAddress, minimumRequired, token.decimals);
      }
    } catch (error) {
      console.error('❌ Error checking LOL balance:', error);
      throw new Error('Failed to check LOL balance');
    }
  }

  /**
   * Check LOL balance using Token-2022 approach
   */
  private async checkLOLBalanceToken2022(walletAddress: string, minimumRequired: number, verifiedDecimals: number): Promise<LOLBalanceInfo> {
    try {
      console.log('🔍 Checking LOL balance using Token-2022 approach');
      
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(this.lolTokenMint);

      // Get all token accounts for this wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), // Token-2022 program
        }
      );

      console.log(`📊 Found ${tokenAccounts.value.length} Token-2022 accounts`);

      // Look for LOL token account
      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        
        if (mintAddress === this.lolTokenMint) {
          const balance = Number(parsedInfo.tokenAmount.amount);
            const balanceFormatted = tokenMetadataService.formatTokenAmount(this.lolTokenMint, BigInt(balance));
          
          console.log('✅ Found LOL balance via Token-2022:', balance);
          
          const minimumRequiredRaw = minimumRequired * Math.pow(10, verifiedDecimals); // Convert to raw units using verified decimals
          const hasMinimumBalance = balance >= minimumRequiredRaw;
          const shortfall = Math.max(0, (minimumRequiredRaw - balance) / Math.pow(10, verifiedDecimals));

          return {
            balance,
            balanceFormatted,
            hasMinimumBalance,
            minimumRequired: minimumRequired,
            shortfall,
            tokenMint: this.lolTokenMint,
            tokenAccount: accountInfo.pubkey.toString()
          };
        }
      }

      // Also try standard SPL token program
      const splTokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program
        }
      );

      console.log(`📊 Found ${splTokenAccounts.value.length} SPL token accounts`);

      for (const accountInfo of splTokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        
        if (mintAddress === this.lolTokenMint) {
          const balance = Number(parsedInfo.tokenAmount.amount);
            const balanceFormatted = tokenMetadataService.formatTokenAmount(this.lolTokenMint, BigInt(balance));
          
          console.log('✅ Found LOL balance via SPL token program:', balance);
          
          const minimumRequiredRaw = minimumRequired * Math.pow(10, verifiedDecimals); // Convert to raw units using verified decimals
          const hasMinimumBalance = balance >= minimumRequiredRaw;
          const shortfall = Math.max(0, (minimumRequiredRaw - balance) / Math.pow(10, verifiedDecimals));

          return {
            balance,
            balanceFormatted,
            hasMinimumBalance,
            minimumRequired: minimumRequired,
            shortfall,
            tokenMint: this.lolTokenMint,
            tokenAccount: accountInfo.pubkey.toString()
          };
        }
      }

      console.log('❌ No LOL token account found');
      return {
        balance: 0,
        balanceFormatted: '0.00',
        hasMinimumBalance: false,
        minimumRequired: minimumRequired,
        shortfall: minimumRequired,
        tokenMint: this.lolTokenMint
      };
    } catch (error) {
      console.error('❌ Error in Token-2022 balance check:', error);
      return {
        balance: 0,
        balanceFormatted: '0.00',
        hasMinimumBalance: false,
        minimumRequired: minimumRequired,
        shortfall: minimumRequired,
        tokenMint: this.lolTokenMint
      };
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
      decimals: 9, // $LOL has 9 decimals, not 6
      description: 'The LOL token used for minting NFTs on the Analos blockchain'
    };
  }
}

export const lolBalanceChecker = new LOLBalanceChecker();
