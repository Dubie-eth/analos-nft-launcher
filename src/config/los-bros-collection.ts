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
  
  // Trait Categories (MUST match actual filenames in public/los-bros-traits/)
  traitCategories: {
    background: ['analos', 'baige', 'gradient_purple', 'solid_blue', 'space_galaxy', 'sunset_orange'],
    body: ['analos', 'baige', 'brown', 'gold', 'robot', 'zombie'],
    clothes: [
      'pink_hero', 'cyan_stripe', 'orange_hoodie', 'navy_hoodie', 'teal_hero', 'blue_hero', 'red_hero', 'silver_hero',
      'green_stripe', 'white_stripe', 'black_tee', 'purple_tee', 'teal_tee', 'blue_stripe', 'gray_stripe', 'neon_stripe',
      'yellow_vest', 'green_vest', 'red_vest', 'maroon_vest', 'lime_player', 'blue_player', 'orange_player',
      'purple_overalls', 'blue_overalls', 'green_overalls', 'pink_overalls', 'golden_tie', 'purple_tie', 'red_tie', 'blue_tie',
      'black_suite', 'white_suite', 'yellow_polo', 'white_polo', 'tie_dye_tee', 'yellow_longsleeve',
      'red_hoodie', 'blue_hoodie', 'red_denim', 'blue_denim', 'bomber_jacket', 'jacket_blazer', 'jacket_windbreaker',
      'red_button_up', 'shirt_button', 'shirt_polo', 'shirt_flannel', 'shirt_henley', 'red_scarf',
      'heart_anal', 'polk_a_dot', 'teal_polk_a_dot', 'dress_party', 'dress_winter',
      'casual_swag', 'latenight_swag', 'sunny_days'
    ],
    mouth: ['smile_grin', 'smile_cute', 'smile_happy', 'smile_wide', 'smile_teeth', 'frown_sad', 'frown_angry', 'frown_disappointed', 'neutral_line'],
    eyes: [
      'glowing_neon', 'glowing_cyan', 'glowing_pink', 'glowing_orange', 'glowing_gold', 'glowing_white',
      'laser_blue', 'laser_red', 'laser_green', 'laser_purple', 'laser_yellow',
      'normal_black', 'normal_blue', 'normal_brown', 'normal_green', 'normal_hazel',
      'angry_dark', 'angry_fierce', 'angry_fire', 'angry_intense', 'angry_red',
      'sleepy_closed', 'sleepy_droopy', 'sleepy_half', 'sleepy_tired', 'sleepy_yawn',
      'happy_cheerful', 'surprised_wide', 'curious_look', 'focused_stare', 'winking_left', 'sad_tears', 'shocked_big', 'shifty_side', 'dizzy_spiral'
    ],
    hat: [
      'cap_baseball', 'cap_snapback', 'cap_fitted', 'cap_trucker', 'cap_beanie',
      'bandana_black', 'bandana_blue', 'bandana_red', 'bandana_white', 'bandana_pattern',
      'crown_gold', 'crown_silver', 'crown_iron', 'crown_jeweled', 'crown_wooden',
      'beanie_striped', 'sombrero_classic', 'visor_sport',
      'hat_fedora', 'hat_cowboy', 'hat_top', 'hat_bowler', 'hat_beret',
      'wig_black', 'wig_blonde', 'wig_brown', 'wig_red', 'wig_purple',
      'helmet_racing', 'helmet_motorcycle', 'helmet_military', 'helmet_fire', 'helmet_construction',
      'headband_sport', 'headband_sweat', 'headband_thick', 'headband_yoga', 'headband_terry',
      'hoodie_hood', 'hoodie_zip', 'hoodie_pullover', 'hoodie_oversized', 'hoodie_crop',
      'hats_41', 'None'
    ],
  },
  
  // Rarity Weights (lower weight = rarer = higher rarity score)
  traitRarityWeights: {
    background: {
      'space_galaxy': 1,        // Rarest (1/6 = 16.7% chance, score: 100)
      'sunset_orange': 2,        // Very rare (score: 50)
      'analos': 3,               // Rare (score: 33)
      'gradient_purple': 4,      // Uncommon (score: 25)
      'solid_blue': 5,           // Common (score: 20)
      'baige': 6,                // Most common (score: 16.7)
    },
    body: {
      'robot': 1,                // Rarest (score: 100)
      'zombie': 2,               // Very rare (score: 50)
      'gold': 3,                 // Rare (score: 33)
      'brown': 4,                // Uncommon (score: 25)
      'analos': 5,               // Common (score: 20)
      'baige': 6,                // Most common (score: 16.7)
    },
    clothes: {
      // Ultra rares (1-3)
      'heart_anal': 1, 'silver_hero': 1, 'golden_tie': 1,
      // Rares (4-8)
      'pink_hero': 4, 'red_hero': 4, 'blue_hero': 4, 'teal_hero': 4,
      'neon_stripe': 5, 'tie_dye_tee': 5, 'dress_party': 6, 'dress_winter': 6,
      // Uncommon (10-15)
      'bomber_jacket': 10, 'jacket_blazer': 10, 'jacket_windbreaker': 10,
      'purple_tie': 12, 'red_tie': 12, 'blue_tie': 12,
      // Common (20+) - all others get weight 20
      'cyan_stripe': 20, 'orange_hoodie': 20, 'navy_hoodie': 20, 'green_stripe': 20, 'white_stripe': 20,
      'black_tee': 20, 'purple_tee': 20, 'teal_tee': 20, 'blue_stripe': 20, 'gray_stripe': 20,
      'yellow_vest': 20, 'green_vest': 20, 'red_vest': 20, 'maroon_vest': 20,
      'lime_player': 20, 'blue_player': 20, 'orange_player': 20,
      'purple_overalls': 20, 'blue_overalls': 20, 'green_overalls': 20, 'pink_overalls': 20,
      'black_suite': 20, 'white_suite': 20, 'yellow_polo': 20, 'white_polo': 20, 'yellow_longsleeve': 20,
      'red_hoodie': 20, 'blue_hoodie': 20, 'red_denim': 20, 'blue_denim': 20,
      'red_button_up': 20, 'shirt_button': 20, 'shirt_polo': 20, 'shirt_flannel': 20, 'shirt_henley': 20,
      'red_scarf': 20, 'polk_a_dot': 20, 'teal_polk_a_dot': 20, 'casual_swag': 20, 'latenight_swag': 20, 'sunny_days': 20,
    },
    mouth: {
      'smile_grin': 8,           // Rare
      'smile_teeth': 10,         // Uncommon
      'frown_angry': 12,         // Uncommon
      'smile_cute': 15,          // Common
      'smile_happy': 18,         // Common
      'smile_wide': 18,          // Common
      'neutral_line': 20,        // Common
      'frown_sad': 20,           // Common
      'frown_disappointed': 20,  // Common
    },
    eyes: {
      // Legendary (1-2)
      'glowing_neon': 1, 'glowing_gold': 1,
      // Epic (3-5)
      'laser_blue': 3, 'laser_red': 3, 'laser_purple': 3, 'laser_yellow': 3, 'laser_green': 3,
      'glowing_cyan': 4, 'glowing_pink': 4, 'glowing_orange': 4, 'glowing_white': 4,
      // Rare (6-10)
      'angry_fire': 6, 'angry_fierce': 6, 'angry_intense': 6,
      'dizzy_spiral': 8, 'shocked_big': 8,
      // Uncommon (12-18)
      'angry_dark': 12, 'angry_red': 12,
      'surprised_wide': 15, 'winking_left': 15, 'sad_tears': 15,
      'curious_look': 18, 'focused_stare': 18, 'shifty_side': 18,
      // Common (20+)
      'sleepy_closed': 20, 'sleepy_droopy': 20, 'sleepy_half': 20, 'sleepy_tired': 20, 'sleepy_yawn': 20,
      'happy_cheerful': 22,
      'normal_hazel': 25, 'normal_blue': 25, 'normal_brown': 25, 'normal_green': 25,
      'normal_black': 30,        // Most common
    },
    hat: {
      // Legendary (1-2)
      'crown_gold': 1, 'crown_jeweled': 1,
      // Epic (3-5)
      'crown_silver': 3, 'crown_iron': 3, 'crown_wooden': 3,
      'helmet_racing': 4, 'helmet_motorcycle': 4, 'helmet_military': 4,
      // Rare (6-10)
      'sombrero_classic': 6, 'visor_sport': 6,
      'helmet_fire': 8, 'helmet_construction': 8,
      'wig_purple': 10, 'wig_red': 10,
      // Uncommon (12-18)
      'beanie_striped': 12,
      'hat_top': 15, 'hat_fedora': 15, 'hat_cowboy': 15, 'hat_bowler': 15, 'hat_beret': 15,
      'wig_black': 18, 'wig_blonde': 18, 'wig_brown': 18,
      // Common (20+)
      'cap_baseball': 20, 'cap_snapback': 20, 'cap_fitted': 20, 'cap_trucker': 20, 'cap_beanie': 20,
      'bandana_black': 22, 'bandana_blue': 22, 'bandana_red': 22, 'bandana_white': 22, 'bandana_pattern': 22,
      'headband_sport': 25, 'headband_sweat': 25, 'headband_thick': 25, 'headband_yoga': 25, 'headband_terry': 25,
      'hoodie_hood': 28, 'hoodie_zip': 28, 'hoodie_pullover': 28, 'hoodie_oversized': 28, 'hoodie_crop': 28,
      'hats_41': 30,
      'None': 35,                // Very common
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
    const category = trait.trait_type.toLowerCase() as keyof typeof LOS_BROS_COLLECTION.traitRarityWeights;
    const value = trait.value;
    
    const categoryWeights = LOS_BROS_COLLECTION.traitRarityWeights[category];
    if (categoryWeights) {
      const weight = (categoryWeights as any)[value];
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

