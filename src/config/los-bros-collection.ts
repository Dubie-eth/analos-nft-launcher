/**
 * LOS BROS COLLECTION CONFIGURATION
 * Pre-generated PFP collection with rarity and traits
 * Integrates with Profile NFT system
 */

import { PublicKey } from '@solana/web3.js';

export interface LosBrosTrait {
  trait_type: string;
  value: string;
  rarity?: string;
}

export interface LosBrosNFT {
  id: number;
  name: string;
  image: string;
  rarity: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  traits: LosBrosTrait[];
  rarityScore: number;
  edition: string;
}

export const LOS_BROS_COLLECTION = {
  name: 'Los Bros',
  symbol: 'LOSBROS',
  description: 'Premium PFP collection on Analos with rarity-based traits',
  totalSupply: 2222,
  
  // Collection Addresses (to be deployed)
  collectionMint: process.env.LOS_BROS_COLLECTION_MINT || 'TBD',
  
  // Rarity Distribution
  rarityDistribution: {
    LEGENDARY: {
      count: 100,
      percentage: 4.5,
      minScore: 90,
      maxScore: 100,
      multiplier: 10,
    },
    EPIC: {
      count: 500,
      percentage: 22.5,
      minScore: 70,
      maxScore: 89,
      multiplier: 5,
    },
    RARE: {
      count: 800,
      percentage: 36,
      minScore: 40,
      maxScore: 69,
      multiplier: 2,
    },
    COMMON: {
      count: 822,
      percentage: 37,
      minScore: 1,
      maxScore: 39,
      multiplier: 1,
    },
  },
  
  // Trait Categories
  traitCategories: {
    background: ['Sunset', 'Galaxy', 'Matrix', 'Desert', 'Ocean', 'Neon City', 'Forest', 'Abstract'],
    hat: ['Cowboy Hat', 'Sombrero', 'Fedora', 'Baseball Cap', 'Top Hat', 'Crown', 'Bandana', 'None'],
    eyes: ['Laser Eyes', 'Sunglasses', 'Eye Patch', 'Regular', '3D Glasses', 'VR Headset', 'Monocle'],
    mouth: ['Cigar', 'Mustache', 'Beard', 'Smile', 'Gold Teeth', 'Pipe', 'Grin', 'Neutral'],
    accessory: ['Gold Chain', 'Diamond Ring', 'Watch', 'Earring', 'Necklace', 'Bracelet', 'None'],
    body: ['Regular', 'Muscular', 'Slim', 'Hoodie', 'Suit', 'T-Shirt', 'Tank Top'],
    special: ['Aura', 'Glow', 'Sparkle', 'Shadow', 'Fire', 'Ice', 'Lightning', 'None'],
  },
  
  // Rarity Weights (lower = rarer)
  traitRarityWeights: {
    background: {
      'Matrix': 2,
      'Galaxy': 3,
      'Neon City': 5,
      'Abstract': 8,
      'Sunset': 12,
      'Ocean': 15,
      'Desert': 20,
      'Forest': 35,
    },
    hat: {
      'Crown': 1,
      'Top Hat': 3,
      'Sombrero': 5,
      'Fedora': 8,
      'Cowboy Hat': 12,
      'Baseball Cap': 20,
      'Bandana': 25,
      'None': 26,
    },
    eyes: {
      'Laser Eyes': 2,
      'VR Headset': 4,
      '3D Glasses': 6,
      'Eye Patch': 8,
      'Monocle': 10,
      'Sunglasses': 15,
      'Regular': 55,
    },
    mouth: {
      'Gold Teeth': 3,
      'Cigar': 5,
      'Pipe': 7,
      'Mustache': 10,
      'Beard': 12,
      'Grin': 18,
      'Smile': 22,
      'Neutral': 23,
    },
    accessory: {
      'Diamond Ring': 2,
      'Gold Chain': 5,
      'Watch': 8,
      'Necklace': 12,
      'Earring': 15,
      'Bracelet': 18,
      'None': 40,
    },
    body: {
      'Suit': 5,
      'Hoodie': 8,
      'Muscular': 10,
      'Tank Top': 12,
      'T-Shirt': 20,
      'Slim': 22,
      'Regular': 23,
    },
    special: {
      'Lightning': 1,
      'Fire': 2,
      'Ice': 3,
      'Aura': 5,
      'Glow': 8,
      'Sparkle': 12,
      'Shadow': 18,
      'None': 51,
    },
  },
};

/**
 * Calculate rarity score for a Los Bros NFT based on traits
 */
export function calculateRarityScore(traits: LosBrosTrait[]): number {
  let totalScore = 0;
  let traitCount = 0;
  
  for (const trait of traits) {
    const category = trait.trait_type.toLowerCase();
    const value = trait.value;
    
    if (LOS_BROS_COLLECTION.traitRarityWeights[category]) {
      const weight = LOS_BROS_COLLECTION.traitRarityWeights[category][value];
      if (weight) {
        // Lower weight = higher rarity = higher score
        const rarityScore = 100 / weight;
        totalScore += rarityScore;
        traitCount++;
      }
    }
  }
  
  // Average score across all traits
  return traitCount > 0 ? Math.round((totalScore / traitCount) * 10) / 10 : 0;
}

/**
 * Determine rarity tier based on score
 */
export function getRarityTier(score: number): 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON' {
  if (score >= 90) return 'LEGENDARY';
  if (score >= 70) return 'EPIC';
  if (score >= 40) return 'RARE';
  return 'COMMON';
}

/**
 * Get rarity multiplier for rewards/staking
 */
export function getRarityMultiplier(rarity: string): number {
  return LOS_BROS_COLLECTION.rarityDistribution[rarity as keyof typeof LOS_BROS_COLLECTION.rarityDistribution]?.multiplier || 1;
}

/**
 * Validate if an NFT belongs to Los Bros collection
 */
export function isLosBrosNFT(collectionAddress: string): boolean {
  // Check if the collection address matches Los Bros
  return collectionAddress === LOS_BROS_COLLECTION.collectionMint;
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'LEGENDARY':
      return 'text-yellow-400 border-yellow-400 bg-yellow-900/20';
    case 'EPIC':
      return 'text-purple-400 border-purple-400 bg-purple-900/20';
    case 'RARE':
      return 'text-blue-400 border-blue-400 bg-blue-900/20';
    case 'COMMON':
      return 'text-gray-400 border-gray-400 bg-gray-900/20';
    default:
      return 'text-gray-400 border-gray-400 bg-gray-900/20';
  }
}

/**
 * Format rarity for display
 */
export function formatRarity(rarity: string): string {
  return rarity.charAt(0) + rarity.slice(1).toLowerCase();
}

