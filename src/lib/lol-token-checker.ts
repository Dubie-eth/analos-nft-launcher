import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

const LOL_TOKEN_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
const MINIMUM_BALANCE = 1000000; // 1,000,000 LOL tokens
const LOL_DECIMALS = 6; // Assuming 6 decimals for LOL token
const WHITELIST_LIMIT = 100; // First 100 wallets with 1M+ LOL get whitelist access

export interface LOLTokenStatus {
  isWhitelisted: boolean;
  balance: number;
  balanceFormatted: string;
  tier: 'none' | 'supporter';
  benefits: string[];
  freeMintsAvailable: number;
  discountPercentage: number;
  isPublicLaunch: boolean;
  whitelistPosition?: number;
  whitelistSlotsRemaining?: number;
}

export class LOLTokenChecker {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async checkLOLBalance(walletAddress: string): Promise<LOLTokenStatus> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(LOL_TOKEN_MINT);
      
      // Get the associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey
      );

      // Get token account info
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(associatedTokenAddress);
      
      if (!tokenAccountInfo.value) {
        return this.createTokenStatus(0);
      }

      const balance = tokenAccountInfo.value.uiAmount || 0;
      const balanceRaw = tokenAccountInfo.value.amount;
      
      // Check whitelist status
      const whitelistStatus = await this.checkWhitelistStatus(walletAddress, balance);
      
      return this.createTokenStatus(balance, balanceRaw, whitelistStatus);
    } catch (error) {
      console.error('Error checking LOL balance:', error);
      // Return default status if there's an error
      return this.createTokenStatus(0);
    }
  }

  private async checkWhitelistStatus(walletAddress: string, balance: number): Promise<{
    isWhitelisted: boolean;
    isPublicLaunch: boolean;
    whitelistPosition?: number;
    whitelistSlotsRemaining?: number;
  }> {
    try {
      // Check if we've reached the whitelist limit (100 wallets)
      const response = await fetch(`/api/whitelist/status?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          isWhitelisted: data.isWhitelisted && balance >= MINIMUM_BALANCE,
          isPublicLaunch: data.isPublicLaunch,
          whitelistPosition: data.whitelistPosition,
          whitelistSlotsRemaining: data.whitelistSlotsRemaining
        };
      }
      
      // Fallback if API fails
      return {
        isWhitelisted: balance >= MINIMUM_BALANCE,
        isPublicLaunch: false,
        whitelistSlotsRemaining: 0
      };
    } catch (error) {
      console.error('Error checking whitelist status:', error);
      return {
        isWhitelisted: balance >= MINIMUM_BALANCE,
        isPublicLaunch: false,
        whitelistSlotsRemaining: 0
      };
    }
  }

  private createTokenStatus(balance: number, rawBalance?: string, whitelistStatus?: any): LOLTokenStatus {
    const isWhitelisted = balance >= MINIMUM_BALANCE && (whitelistStatus?.isWhitelisted || false);
    const isPublicLaunch = whitelistStatus?.isPublicLaunch || false;
    
    let tier: LOLTokenStatus['tier'] = 'none';
    let freeMintsAvailable = 0;
    let discountPercentage = 0;
    let benefits: string[] = [];

    if (balance >= MINIMUM_BALANCE) { // 1M+ LOL holders
      tier = 'supporter';
      freeMintsAvailable = 1; // 1 free mint per wallet
      discountPercentage = 0; // No discount, just free mint
      
      if (isWhitelisted) {
        benefits = [
          '🎖️ Whitelisted LOL Supporter',
          '🆓 1 Free Profile NFT Mint',
          '💰 Pay only minting and hosting costs',
          '⭐ Priority Support',
          '🎨 Special Supporter Badge',
          '🚀 Early Access to New Features',
          `📍 Position: #${whitelistStatus?.whitelistPosition || 'N/A'}`
        ];
      } else if (isPublicLaunch) {
        benefits = [
          '🎖️ LOL Supporter (Public Launch)',
          '🆓 1 Free Profile NFT Mint',
          '💰 Pay only minting and hosting costs',
          '⭐ Priority Support',
          '🎨 Special Supporter Badge'
        ];
      } else {
        benefits = [
          '💎 LOL Holder - Waiting for Public Launch',
          '🆓 Will get 1 free Profile NFT mint when public',
          '💰 Pay only minting and hosting costs',
          '⭐ Receive priority support'
        ];
      }
    } else {
      if (isPublicLaunch) {
        benefits = [
          '🚀 Public Launch Active',
          '💎 Hold 1,000,000+ LOL tokens for free mint benefits',
          '💰 Regular minting fees apply',
          '⭐ Everyone can mint now!'
        ];
      } else {
        benefits = [
          '⏳ Whitelist Phase Active',
          '💎 Hold 1,000,000+ LOL tokens for whitelist benefits',
          '🆓 Get 1 free Profile NFT mint',
          '💰 Pay only minting and hosting costs',
          `📍 ${whitelistStatus?.whitelistSlotsRemaining || 0} whitelist slots remaining`
        ];
      }
    }

    return {
      isWhitelisted,
      balance,
      balanceFormatted: this.formatBalance(balance),
      tier,
      benefits,
      freeMintsAvailable,
      discountPercentage,
      isPublicLaunch,
      whitelistPosition: whitelistStatus?.whitelistPosition,
      whitelistSlotsRemaining: whitelistStatus?.whitelistSlotsRemaining
    };
  }

  private formatBalance(balance: number): string {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M LOL`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K LOL`;
    } else {
      return `${balance.toFixed(2)} LOL`;
    }
  }

  async getTokenMetadata(): Promise<{ name: string; symbol: string; decimals: number }> {
    return {
      name: 'Analos Token',
      symbol: 'LOL',
      decimals: LOL_DECIMALS
    };
  }

  // Check if user qualifies for free domain mint (5+ character usernames)
  async checkDomainEligibility(username: string, lolStatus: LOLTokenStatus): Promise<{
    eligible: boolean;
    reason: string;
    freeDomainMint: boolean;
  }> {
    const isLongUsername = username.length >= 5;
    const hasLOLTokens = lolStatus.isWhitelisted;
    
    if (isLongUsername && hasLOLTokens) {
      return {
        eligible: true,
        reason: 'Long username + LOL token holder - qualifies for free domain mint!',
        freeDomainMint: true
      };
    } else if (isLongUsername) {
      return {
        eligible: true,
        reason: 'Long username qualifies for domain mint',
        freeDomainMint: false
      };
    } else {
      return {
        eligible: false,
        reason: 'Username must be 5+ characters for domain mint',
        freeDomainMint: false
      };
    }
  }
}
