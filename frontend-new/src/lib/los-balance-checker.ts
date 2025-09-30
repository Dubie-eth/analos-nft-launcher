import { Connection, PublicKey } from '@solana/web3.js';

export interface LOSBalanceInfo {
  walletAddress: string;
  losBalance: number;
  losBalanceFormatted: number;
  hasMinimumBalance: boolean;
  minimumRequired: number;
  tokenAccountAddress?: string;
}

export class LOSBalanceChecker {
  private connection: Connection;
  private losTokenMint: string = 'So11111111111111111111111111111111111111112'; // SOL token mint (assuming $LOS uses SOL mint)

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Check if a wallet holds enough $LOS tokens for minting
   * For now, we'll check native SOL balance as $LOS is likely SOL-based
   */
  async checkLOSBalance(
    walletAddress: string, 
    minimumBalance: number = 1000
  ): Promise<LOSBalanceInfo> {
    try {
      console.log(`🔍 Checking $LOS balance for wallet: ${walletAddress}`);
      console.log(`💰 Minimum required: ${minimumBalance} $LOS`);

      const walletPublicKey = new PublicKey(walletAddress);
      
      // Check native SOL balance (assuming $LOS is SOL-based)
      const solBalance = await this.connection.getBalance(walletPublicKey);
      const losBalance = solBalance / 1e9; // Convert lamports to SOL
      
      console.log(`✅ Found native SOL balance: ${losBalance} SOL (${solBalance} lamports)`);

      const hasMinimumBalance = losBalance >= minimumBalance;
      
      const result: LOSBalanceInfo = {
        walletAddress,
        losBalance: solBalance, // Raw amount in lamports
        losBalanceFormatted: losBalance,
        hasMinimumBalance,
        minimumRequired: minimumBalance
      };

      console.log(`📊 $LOS Balance Check Result:`, result);
      return result;

    } catch (error) {
      console.error(`❌ Error checking $LOS balance for ${walletAddress}:`, error);
      
      return {
        walletAddress,
        losBalance: 0,
        losBalanceFormatted: 0,
        hasMinimumBalance: false,
        minimumRequired: minimumBalance
      };
    }
  }

  /**
   * Check balance for multiple wallets
   */
  async checkMultipleWallets(
    walletAddresses: string[],
    minimumBalance: number = 1000
  ): Promise<LOSBalanceInfo[]> {
    const results: LOSBalanceInfo[] = [];
    
    for (const walletAddress of walletAddresses) {
      try {
        const result = await this.checkLOSBalance(walletAddress, minimumBalance);
        results.push(result);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error checking wallet ${walletAddress}:`, error);
        results.push({
          walletAddress,
          losBalance: 0,
          losBalanceFormatted: 0,
          hasMinimumBalance: false,
          minimumRequired: minimumBalance
        });
      }
    }
    
    return results;
  }

  /**
   * Get balance check message for UI display
   */
  getBalanceMessage(balanceInfo: LOSBalanceInfo): string {
    if (balanceInfo.hasMinimumBalance) {
      return `✅ You have ${balanceInfo.losBalanceFormatted.toFixed(2)} $LOS (Required: ${balanceInfo.minimumRequired})`;
    } else {
      return `❌ You need ${balanceInfo.minimumRequired - balanceInfo.losBalanceFormatted} more $LOS tokens (Current: ${balanceInfo.losBalanceFormatted.toFixed(2)}, Required: ${balanceInfo.minimumRequired})`;
    }
  }

  /**
   * Get balance status color for UI
   */
  getBalanceStatusColor(balanceInfo: LOSBalanceInfo): string {
    return balanceInfo.hasMinimumBalance ? 'text-green-600' : 'text-red-600';
  }
}

export const losBalanceChecker = new LOSBalanceChecker();
