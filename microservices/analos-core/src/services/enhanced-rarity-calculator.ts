/**
 * Enhanced Rarity Calculator
 * Integrates with LosLauncher generator to map traits to token multipliers
 */

export interface EnhancedTrait {
  // Your existing fields
  id: string;
  name: string;
  image: string;
  layer: string;
  rarity: number; // Your current weight system (1-100)
  
  // NEW: Maps to token multipliers
  rarityTier: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  tokenMultiplier: 1 | 5 | 10 | 50 | 100 | 1000;
  
  // NEW: Advanced rules
  maxCount?: number;           // Cap this trait
  excludesWith?: string[];     // Conflicts
  requiredWith?: string[];     // Dependencies
  
  // NEW: Auto-calculated
  actualCount?: number;        // How many generated
  targetProbability?: number;  // Expected %
  actualProbability?: number;  // Actual %
}

export interface NFTWithRarity {
  tokenId: number;
  traits: EnhancedTrait[];
  rarity: {
    tier: string;
    multiplier: number;
    totalWeight: number;
    probability: number;
  };
  image: string;
  metadata: any;
}

export interface RarityDistribution {
  Common: number;
  Uncommon: number;
  Rare: number;
  Epic: number;
  Legendary: number;
  Mythic: number;
}

export class EnhancedRarityCalculator {
  private readonly RARITY_THRESHOLDS = {
    MYTHIC: { minWeight: 450, minAvgWeight: 90, multiplier: 1000 },
    LEGENDARY: { minWeight: 350, minAvgWeight: 80, multiplier: 100 },
    EPIC: { minWeight: 250, minAvgWeight: 70, multiplier: 50 },
    RARE: { minWeight: 150, minAvgWeight: 60, multiplier: 10 },
    UNCOMMON: { minWeight: 75, minAvgWeight: 40, multiplier: 5 },
    COMMON: { minWeight: 0, minAvgWeight: 0, multiplier: 1 },
  };

  /**
   * Calculate NFT rarity from traits
   */
  calculateNFTRarity(traits: EnhancedTrait[]): {
    tier: string;
    multiplier: number;
    totalWeight: number;
    probability: number;
  } {
    const totalWeight = traits.reduce((sum, t) => sum + t.rarity, 0);
    const avgWeight = totalWeight / traits.length;
    
    // Determine tier based on combined rarity
    let tier: string;
    let multiplier: number;
    
    if (avgWeight >= this.RARITY_THRESHOLDS.MYTHIC.minAvgWeight || 
        totalWeight >= this.RARITY_THRESHOLDS.MYTHIC.minWeight) {
      tier = 'Mythic';
      multiplier = this.RARITY_THRESHOLDS.MYTHIC.multiplier;
    } else if (avgWeight >= this.RARITY_THRESHOLDS.LEGENDARY.minAvgWeight || 
               totalWeight >= this.RARITY_THRESHOLDS.LEGENDARY.minWeight) {
      tier = 'Legendary';
      multiplier = this.RARITY_THRESHOLDS.LEGENDARY.multiplier;
    } else if (avgWeight >= this.RARITY_THRESHOLDS.EPIC.minAvgWeight || 
               totalWeight >= this.RARITY_THRESHOLDS.EPIC.minWeight) {
      tier = 'Epic';
      multiplier = this.RARITY_THRESHOLDS.EPIC.multiplier;
    } else if (avgWeight >= this.RARITY_THRESHOLDS.RARE.minAvgWeight || 
               totalWeight >= this.RARITY_THRESHOLDS.RARE.minWeight) {
      tier = 'Rare';
      multiplier = this.RARITY_THRESHOLDS.RARE.multiplier;
    } else if (avgWeight >= this.RARITY_THRESHOLDS.UNCOMMON.minAvgWeight || 
               totalWeight >= this.RARITY_THRESHOLDS.UNCOMMON.minWeight) {
      tier = 'Uncommon';
      multiplier = this.RARITY_THRESHOLDS.UNCOMMON.multiplier;
    } else {
      tier = 'Common';
      multiplier = this.RARITY_THRESHOLDS.COMMON.multiplier;
    }
    
    // Calculate probability (how rare this combination is)
    const probability = this.calculateRarityProbability(traits, totalWeight);
    
    return { tier, multiplier, totalWeight, probability };
  }

  /**
   * Calculate probability of this rarity combination
   */
  private calculateRarityProbability(traits: EnhancedTrait[], totalWeight: number): number {
    // Simple probability calculation based on trait weights
    // Lower probability = rarer combination
    const maxPossibleWeight = traits.length * 100; // If all traits were 100 weight
    const probability = (totalWeight / maxPossibleWeight) * 100;
    return Math.max(0.01, Math.min(99.99, probability)); // Clamp between 0.01% and 99.99%
  }

  /**
   * Enhance traits with rarity tiers
   */
  enhanceTraitsWithTiers(traits: EnhancedTrait[]): EnhancedTrait[] {
    return traits.map(trait => {
      // Determine tier based on individual trait rarity
      let tier: string;
      let multiplier: number;
      
      if (trait.rarity >= 95) {
        tier = 'Mythic';
        multiplier = 1000;
      } else if (trait.rarity >= 85) {
        tier = 'Legendary';
        multiplier = 100;
      } else if (trait.rarity >= 70) {
        tier = 'Epic';
        multiplier = 50;
      } else if (trait.rarity >= 50) {
        tier = 'Rare';
        multiplier = 10;
      } else if (trait.rarity >= 25) {
        tier = 'Uncommon';
        multiplier = 5;
      } else {
        tier = 'Common';
        multiplier = 1;
      }
      
      return {
        ...trait,
        rarityTier: tier as any,
        tokenMultiplier: multiplier as any,
        targetProbability: trait.rarity,
      };
    });
  }

  /**
   * Calculate expected rarity distribution for collection
   */
  calculateExpectedDistribution(
    layers: any[],
    totalSupply: number
  ): RarityDistribution {
    const distribution: RarityDistribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Mythic: 0,
    };

    // Simulate generation to predict distribution
    const simulations = Math.min(1000, totalSupply * 2);
    
    for (let i = 0; i < simulations; i++) {
      const simulatedTraits = this.simulateTraitSelection(layers);
      const rarity = this.calculateNFTRarity(simulatedTraits);
      distribution[rarity.tier as keyof RarityDistribution]++;
    }

    // Convert to percentages and scale to total supply
    const totalSimulations = simulations;
    for (const tier in distribution) {
      const percentage = distribution[tier as keyof RarityDistribution] / totalSimulations;
      distribution[tier as keyof RarityDistribution] = Math.round(percentage * totalSupply);
    }

    return distribution;
  }

  /**
   * Simulate trait selection for distribution calculation
   */
  private simulateTraitSelection(layers: any[]): EnhancedTrait[] {
    const selectedTraits: EnhancedTrait[] = [];

    for (const layer of layers) {
      if (!layer.visible || !layer.traits || layer.traits.length === 0) continue;

      // Weighted random selection
      const totalWeight = layer.traits.reduce((sum: number, t: any) => sum + (t.rarity || 1), 0);
      let random = Math.random() * totalWeight;

      for (const trait of layer.traits) {
        random -= trait.rarity || 1;
        if (random <= 0) {
          selectedTraits.push({
            ...trait,
            rarityTier: 'Common',
            tokenMultiplier: 1,
          });
          break;
        }
      }
    }

    return selectedTraits;
  }

  /**
   * Verify generated collection matches expected distribution
   */
  verifyDistribution(
    generated: NFTWithRarity[],
    expected: RarityDistribution,
    tolerance: number = 5 // 5% tolerance
  ): {
    isValid: boolean;
    discrepancies: any[];
  } {
    const actual: RarityDistribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Mythic: 0,
    };

    // Count actual distribution
    for (const nft of generated) {
      actual[nft.rarity.tier as keyof RarityDistribution]++;
    }

    // Check discrepancies
    const discrepancies: any[] = [];
    
    for (const tier in expected) {
      const expectedCount = expected[tier as keyof RarityDistribution];
      const actualCount = actual[tier as keyof RarityDistribution];
      const diff = Math.abs(actualCount - expectedCount);
      const toleranceAmount = expectedCount * (tolerance / 100);
      
      if (diff > toleranceAmount) {
        discrepancies.push({
          tier,
          expected: expectedCount,
          actual: actualCount,
          difference: diff,
          tolerance: toleranceAmount,
        });
      }
    }

    return {
      isValid: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Generate rarity-based metadata for NFT
   */
  generateRarityMetadata(nft: NFTWithRarity, collectionSettings: any): any {
    return {
      name: `${collectionSettings.name} #${nft.tokenId + 1}`,
      description: collectionSettings.description,
      image: nft.image,
      
      attributes: [
        // Trait attributes
        ...nft.traits.map(trait => ({
          trait_type: trait.layer,
          value: trait.name,
          rarity: trait.rarity,
        })),
        
        // Rarity attributes
        {
          trait_type: "Rarity Tier",
          value: nft.rarity.tier,
        },
        {
          trait_type: "Token Multiplier",
          value: nft.rarity.multiplier,
        },
        {
          trait_type: "Total Weight",
          value: nft.rarity.totalWeight,
        },
      ],
      
      properties: {
        category: "image",
        files: [{
          uri: nft.image,
          type: "image/png",
        }],
        creators: [{
          address: collectionSettings.creator?.wallet,
          verified: true,
          share: 100,
        }],
      },
      
      // Custom fields for our system
      rarity_tier: nft.rarity.tier,
      token_multiplier: nft.rarity.multiplier,
      total_weight: nft.rarity.totalWeight,
      rarity_probability: nft.rarity.probability,
    };
  }

  /**
   * Calculate collection statistics
   */
  calculateCollectionStats(generated: NFTWithRarity[]): {
    totalSupply: number;
    rarityDistribution: RarityDistribution;
    averageRarity: number;
    mostCommonTrait: string;
    rarestTrait: string;
    totalTokenMultiplier: number;
  } {
    const distribution: RarityDistribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Mythic: 0,
    };

    let totalWeight = 0;
    let totalMultiplier = 0;
    const traitCounts: { [key: string]: number } = {};

    for (const nft of generated) {
      distribution[nft.rarity.tier as keyof RarityDistribution]++;
      totalWeight += nft.rarity.totalWeight;
      totalMultiplier += nft.rarity.multiplier;

      // Count individual traits
      for (const trait of nft.traits) {
        const key = `${trait.layer}:${trait.name}`;
        traitCounts[key] = (traitCounts[key] || 0) + 1;
      }
    }

    // Find most common and rarest traits
    const sortedTraits = Object.entries(traitCounts).sort((a, b) => a[1] - b[1]);
    const mostCommonTrait = sortedTraits[sortedTraits.length - 1]?.[0] || 'N/A';
    const rarestTrait = sortedTraits[0]?.[0] || 'N/A';

    return {
      totalSupply: generated.length,
      rarityDistribution: distribution,
      averageRarity: totalWeight / generated.length,
      mostCommonTrait,
      rarestTrait,
      totalTokenMultiplier: totalMultiplier,
    };
  }
}

// Export singleton instance
export const rarityCalculator = new EnhancedRarityCalculator();