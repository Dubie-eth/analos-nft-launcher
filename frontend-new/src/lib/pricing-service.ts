/**
 * Pricing Service - Handles pricing calculations and marketplace integration
 * Based on industry-standard pricing models with $LOS token support
 * Now uses real-time market data for dynamic pricing
 */

import { marketDataService } from './market-data-service';

export interface PricingTier {
  name: string;
  description: string;
  pricePerToken: number; // in $LOS (calculated from real-time market data)
  pricePerTokenUSD: number; // in USD (target price)
  features: string[];
  isPopular?: boolean;
}

export interface SmartContractPricing {
  deploymentFee: number; // $LOS
  deploymentFeeUSD: number; // USD
  primarySalesCommission: number; // percentage
  secondarySalesCommission: number; // percentage (usually 0 for creator)
  gasSavings: string;
}

export interface DropPricing {
  deploymentFee: number; // $LOS
  deploymentFeeUSD: number; // USD
  primarySalesCommission: number; // percentage
  dropPageFee: number; // $LOS
  dropPageFeeUSD: number; // USD
}

export interface FormsPricing {
  isFree: boolean;
  features: string[];
  limits?: {
    maxForms?: number;
    maxEntries?: number;
  };
}

export class PricingService {
  /**
   * Art Generator Pricing Tiers
   * Based on industry standards but slightly lower than examples
   * Now uses real-time market data for dynamic pricing
   */
  async getArtGeneratorPricing(): Promise<PricingTier[]> {
    try {
      const pricing = await marketDataService.getArtGeneratorPricing();
      
      return [
        {
          name: "Starter",
          description: "Perfect for small collections",
          pricePerToken: pricing?.starter?.losCost || 800000, // $LOS (calculated from real-time market data)
          pricePerTokenUSD: pricing?.starter?.usdTarget || 0.12,
          features: [
            "Up to 1,000 NFTs",
            "Basic IPFS hosting",
            "Standard generation speed",
            "Email support"
          ]
        },
        {
          name: "Professional",
          description: "Ideal for medium collections",
          pricePerToken: pricing?.professional?.losCost || 1000000, // $LOS (calculated from real-time market data)
          pricePerTokenUSD: pricing?.professional?.usdTarget || 0.15,
          features: [
            "Up to 10,000 NFTs",
            "Premium IPFS hosting",
            "Fast generation speed",
            "Priority support",
            "Custom metadata"
          ],
          isPopular: true
        },
        {
          name: "Enterprise",
          description: "For large-scale collections",
          pricePerToken: pricing?.enterprise?.losCost || 1200000, // $LOS (calculated from real-time market data)
          pricePerTokenUSD: pricing?.enterprise?.usdTarget || 0.18,
          features: [
            "Unlimited NFTs",
            "Dedicated IPFS hosting",
            "Ultra-fast generation",
            "24/7 phone support",
            "Custom branding",
            "White-label options"
          ]
        }
      ];
    } catch (error) {
      console.error('❌ Error getting art generator pricing:', error);
      // Return fallback pricing if market data fails
      return [
        {
          name: "Starter",
          description: "Perfect for small collections",
          pricePerToken: 800000, // Fallback LOS amount
          pricePerTokenUSD: 0.12,
          features: [
            "Up to 1,000 NFTs",
            "Basic IPFS hosting",
            "Standard generation speed",
            "Email support"
          ]
        },
        {
          name: "Professional",
          description: "Ideal for medium collections",
          pricePerToken: 1000000, // Fallback LOS amount
          pricePerTokenUSD: 0.15,
          features: [
            "Up to 10,000 NFTs",
            "Premium IPFS hosting",
            "Fast generation speed",
            "Priority support",
            "Custom metadata"
          ],
          isPopular: true
        },
        {
          name: "Enterprise",
          description: "For large-scale collections",
          pricePerToken: 1200000, // Fallback LOS amount
          pricePerTokenUSD: 0.18,
          features: [
            "Unlimited NFTs",
            "Dedicated IPFS hosting",
            "Ultra-fast generation",
            "24/7 phone support",
            "Custom branding",
            "White-label options"
          ]
        }
      ];
    }
  }

  /**
   * Smart Contract Pricing
   * Deploy for free, pay only on sales
   */
  getSmartContractPricing(): SmartContractPricing {
    return {
      deploymentFee: 0, // FREE deployment
      deploymentFeeUSD: 0,
      primarySalesCommission: 4, // 4% (slightly lower than 5% in examples)
      secondarySalesCommission: 0, // No cuts from secondary sales
      gasSavings: "Up to 60% gas savings"
    };
  }

  /**
   * Drops Pricing
   * Similar to smart contracts with drop page
   */
  getDropPricing(): DropPricing {
    return {
      deploymentFee: 0, // FREE deployment
      deploymentFeeUSD: 0,
      primarySalesCommission: 4, // 4% of primary sales
      dropPageFee: 5000, // $LOS for custom drop page
      dropPageFeeUSD: 0.75
    };
  }

  /**
   * Forms Pricing
   * FREE with premium features
   */
  getFormsPricing(): FormsPricing {
    return {
      isFree: true,
      features: [
        "Unlimited forms",
        "Unlimited entries",
        "Token ownership verification",
        "Discord server validation",
        "Role-based access control",
        "Analytics dashboard"
      ],
      limits: {
        maxForms: -1, // Unlimited
        maxEntries: -1 // Unlimited
      }
    };
  }

  /**
   * Calculate total cost for NFT generation
   */
  async calculateGenerationCost(quantity: number, tier: string = 'Professional'): Promise<{
    totalLOS: number;
    totalUSD: number;
    pricePerToken: number;
    pricePerTokenUSD: number;
  }> {
    try {
      const tiers = await this.getArtGeneratorPricing();
      
      // Ensure tiers is an array and has items
      if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
        throw new Error('No pricing tiers available');
      }
      
      const selectedTier = tiers.find(t => t.name.toLowerCase() === tier.toLowerCase()) || tiers[1] || tiers[0];
      
      const totalLOS = quantity * selectedTier.pricePerToken;
      const totalUSD = quantity * selectedTier.pricePerTokenUSD;

      return {
        totalLOS,
        totalUSD,
        pricePerToken: selectedTier.pricePerToken,
        pricePerTokenUSD: selectedTier.pricePerTokenUSD
      };
    } catch (error) {
      console.error('❌ Error calculating generation cost:', error);
      // Return fallback pricing
      const fallbackPricePerToken = 1000000; // 1M LOS
      const fallbackPricePerTokenUSD = 0.15; // $0.15
      
      return {
        totalLOS: quantity * fallbackPricePerToken,
        totalUSD: quantity * fallbackPricePerTokenUSD,
        pricePerToken: fallbackPricePerToken,
        pricePerTokenUSD: fallbackPricePerTokenUSD
      };
    }
  }

  /**
   * Get market summary for display
   */
  async getMarketSummary(): Promise<{
    losPrice: string;
    lolPrice: string;
    lastUpdated: string;
    source: string;
  }> {
    return await marketDataService.getMarketSummary();
  }

  /**
   * Calculate revenue for smart contract/drops
   */
  calculateRevenue(
    totalSales: number, // in $LOS
    totalSalesUSD: number, // in USD
    service: 'smart-contract' | 'drops' = 'smart-contract'
  ): {
    creatorRevenue: number;
    creatorRevenueUSD: number;
    platformFee: number;
    platformFeeUSD: number;
    netRevenue: number;
    netRevenueUSD: number;
  } {
    const pricing = service === 'drops' ? this.getDropPricing() : this.getSmartContractPricing();
    const commissionRate = pricing.primarySalesCommission / 100;
    
    const platformFee = totalSales * commissionRate;
    const platformFeeUSD = totalSalesUSD * commissionRate;
    
    const creatorRevenue = totalSales - platformFee;
    const creatorRevenueUSD = totalSalesUSD - platformFeeUSD;
    
    const netRevenue = creatorRevenue; // No additional fees
    const netRevenueUSD = creatorRevenueUSD;

    return {
      creatorRevenue,
      creatorRevenueUSD,
      platformFee,
      platformFeeUSD,
      netRevenue,
      netRevenueUSD
    };
  }

  /**
   * Update $LOS to USD exchange rate
   */
  updateExchangeRate(newRate: number): void {
    this.losToUSD = newRate;
  }

  /**
   * Get current exchange rate
   */
  getExchangeRate(): number {
    return this.losToUSD;
  }

  /**
   * Convert $LOS to USD
   */
  losToUSD(amount: number): number {
    return amount * this.losToUSD;
  }

  /**
   * Convert USD to $LOS
   */
  usdToLOS(amount: number): number {
    return amount / this.losToUSD;
  }

  /**
   * Get marketplace comparison data
   */
  getMarketplaceComparison(): {
    platform: string;
    artGeneration: string;
    smartContract: string;
    primarySalesFee: string;
    secondarySalesFee: string;
    gasOptimization: string;
  }[] {
    return [
      {
        platform: "LosLauncher",
        artGeneration: "$0.12-0.18 per NFT",
        smartContract: "FREE deployment",
        primarySalesFee: "4%",
        secondarySalesFee: "0%",
        gasOptimization: "60% savings"
      },
      {
        platform: "LaunchMyNFT",
        artGeneration: "$0.19 per NFT",
        smartContract: "FREE deployment",
        primarySalesFee: "5%",
        secondarySalesFee: "0%",
        gasOptimization: "Standard"
      },
      {
        platform: "Magic Eden",
        artGeneration: "N/A",
        smartContract: "Paid deployment",
        primarySalesFee: "2%",
        secondarySalesFee: "2%",
        gasOptimization: "Standard"
      },
      {
        platform: "OpenSea",
        artGeneration: "N/A",
        smartContract: "Paid deployment",
        primarySalesFee: "2.5%",
        secondarySalesFee: "2.5%",
        gasOptimization: "Standard"
      }
    ];
  }

  /**
   * Get pricing summary for display
   */
  getPricingSummary(): {
    artGenerator: {
      cheapest: number;
      mostPopular: number;
      premium: number;
    };
    smartContract: {
      deployment: string;
      primarySales: string;
      secondarySales: string;
    };
    drops: {
      deployment: string;
      primarySales: string;
      dropPage: number;
    };
    forms: {
      cost: string;
      features: number;
    };
  } {
    const artGeneratorTiers = this.getArtGeneratorPricing();
    const smartContractPricing = this.getSmartContractPricing();
    const dropPricing = this.getDropPricing();
    const formsPricing = this.getFormsPricing();

    return {
      artGenerator: {
        cheapest: artGeneratorTiers[0].pricePerToken, // Starter
        mostPopular: artGeneratorTiers[1].pricePerToken, // Professional
        premium: artGeneratorTiers[2].pricePerToken // Enterprise
      },
      smartContract: {
        deployment: smartContractPricing.deploymentFee === 0 ? "FREE" : `${smartContractPricing.deploymentFee} $LOS`,
        primarySales: `${smartContractPricing.primarySalesCommission}%`,
        secondarySales: `${smartContractPricing.secondarySalesCommission}%`
      },
      drops: {
        deployment: dropPricing.deploymentFee === 0 ? "FREE" : `${dropPricing.deploymentFee} $LOS`,
        primarySales: `${dropPricing.primarySalesCommission}%`,
        dropPage: dropPricing.dropPageFee
      },
      forms: {
        cost: formsPricing.isFree ? "FREE" : "Paid",
        features: formsPricing.features.length
      }
    };
  }
}

export const pricingService = new PricingService();
