/**
 * Token Gating Service
 * Checks user token balances for whitelist eligibility and pricing discounts
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

// $LOL Token Configuration
const LOL_TOKEN_MINT = new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6'); // Official $LOL token mint
const WHITELIST_THRESHOLD = 1_000_000; // 1 million $LOL tokens for free mint
const DISCOUNT_THRESHOLD = 100_000; // 100k $LOL tokens for 50% discount

export interface TokenGatingResult {
  eligible: boolean;
  tokenBalance: number;
  discount: number; // 0-100 percentage
  reason: string;
  tier: 'free' | 'discounted' | 'full-price';
}

export class TokenGatingService {
  private connection: Connection;

  constructor(rpcUrl: string = ANALOS_RPC_URL) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🪙 Token Gating Service initialized');
  }

  /**
   * Check if user is eligible for free/discounted mint based on $LOL token holdings
   */
  async checkEligibility(walletAddress: string): Promise<TokenGatingResult> {
    try {
      const userPublicKey = new PublicKey(walletAddress);

      console.log('🔍 Checking $LOL token balance for:', walletAddress);

      // Get user's $LOL token account
      const tokenAccount = await getAssociatedTokenAddress(
        LOL_TOKEN_MINT,
        userPublicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      console.log('📊 Token account:', tokenAccount.toString());

      // Get token balance
      const accountInfo = await getAccount(
        this.connection,
        tokenAccount,
        'confirmed',
        TOKEN_PROGRAM_ID
      );

      const balance = Number(accountInfo.amount);
      console.log('💰 $LOL Balance:', balance.toLocaleString());

      // Check eligibility based on balance
      if (balance >= WHITELIST_THRESHOLD) {
        return {
          eligible: true,
          tokenBalance: balance,
          discount: 100, // 100% discount = FREE
          reason: `🎉 You hold ${balance.toLocaleString()} $LOL tokens! Free mint unlocked!`,
          tier: 'free'
        };
      } else if (balance >= DISCOUNT_THRESHOLD) {
        return {
          eligible: true,
          tokenBalance: balance,
          discount: 50, // 50% discount
          reason: `✨ You hold ${balance.toLocaleString()} $LOL tokens! 50% discount applied!`,
          tier: 'discounted'
        };
      } else {
        return {
          eligible: false,
          tokenBalance: balance,
          discount: 0,
          reason: balance > 0 
            ? `You hold ${balance.toLocaleString()} $LOL tokens. Need ${DISCOUNT_THRESHOLD.toLocaleString()} for discount or ${WHITELIST_THRESHOLD.toLocaleString()} for free mint.`
            : 'Hold $LOL tokens to unlock discounts!',
          tier: 'full-price'
        };
      }

    } catch (error: any) {
      console.log('⚠️ No $LOL token account found or error checking balance:', error.message);
      
      // User doesn't have $LOL tokens
      return {
        eligible: false,
        tokenBalance: 0,
        discount: 0,
        reason: 'Hold $LOL tokens to unlock discounts!',
        tier: 'full-price'
      };
    }
  }

  /**
   * Calculate final price after applying token-based discounts
   */
  calculateFinalPrice(basePrice: number, discount: number): number {
    if (discount >= 100) return 0; // Free mint
    if (discount <= 0) return basePrice; // No discount
    
    return Math.floor(basePrice * (1 - discount / 100));
  }

  /**
   * Get pricing tiers based on username length
   */
  getBasePricing(usernameLength: number): { price: number; tier: string; currency: string } {
    if (usernameLength === 3) {
      return {
        price: 16035, // 15,000 * 1.069 (platform fee)
        tier: '3-digit',
        currency: 'LOS'
      };
    } else if (usernameLength === 4) {
      return {
        price: 6414, // 6,000 * 1.069
        tier: '4-digit',
        currency: 'LOS'
      };
    } else {
      return {
        price: 2673, // 2,500 * 1.069
        tier: '5-plus',
        currency: 'LOS'
      };
    }
  }

  /**
   * Get complete pricing with token discount applied
   */
  async getPricingWithDiscount(username: string, walletAddress: string): Promise<{
    basePrice: number;
    discount: number;
    finalPrice: number;
    tier: string;
    currency: string;
    tokenBalance: number;
    discountReason: string;
    isFree: boolean;
  }> {
    // Get base pricing
    const basePricing = this.getBasePricing(username.length);
    
    // Check token eligibility
    const eligibility = await this.checkEligibility(walletAddress);
    
    // Calculate final price
    const finalPrice = this.calculateFinalPrice(basePricing.price, eligibility.discount);
    
    return {
      basePrice: basePricing.price,
      discount: eligibility.discount,
      finalPrice: finalPrice,
      tier: basePricing.tier,
      currency: basePricing.currency,
      tokenBalance: eligibility.tokenBalance,
      discountReason: eligibility.reason,
      isFree: finalPrice === 0
    };
  }
}

// Export singleton instance
export const tokenGatingService = new TokenGatingService();

