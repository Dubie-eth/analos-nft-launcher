/**
 * PROFILE NFT MYSTERY VARIANT API
 * Determine mystery variants for profile NFTs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, mintNumber } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Generate deterministic variant based on wallet address and mint number
    const seed = walletAddress + (mintNumber || 0).toString();
    
    // Simple hash function for deterministic randomness
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const randomValue = Math.abs(hash) % 10000; // 0-9999

    // Determine variant based on rarity
    let variant: 'standard' | 'rare' | 'epic' | 'legendary' | 'mystery';
    let rarity: string;
    let chance: number;

    if (randomValue < 1) {
      // 0.01% chance - Mystery (Matrix Hacker)
      variant = 'mystery';
      rarity = 'Matrix Hacker';
      chance = 0.01;
    } else if (randomValue < 10) {
      // 0.09% chance - Legendary (Neo Variant)
      variant = 'legendary';
      rarity = 'Neo Variant';
      chance = 0.09;
    } else if (randomValue < 100) {
      // 0.9% chance - Epic (Oracle Chosen)
      variant = 'epic';
      rarity = 'Oracle Chosen';
      chance = 0.9;
    } else if (randomValue < 1000) {
      // 9% chance - Rare (Agent Smith)
      variant = 'rare';
      rarity = 'Agent Smith';
      chance = 9;
    } else {
      // 90% chance - Standard
      variant = 'standard';
      rarity = 'Standard';
      chance = 90;
    }

    // Special conditions for specific mint numbers
    if (mintNumber === 1) {
      variant = 'legendary';
      rarity = 'Genesis Card';
      chance = 0.01;
    } else if (mintNumber === 100) {
      variant = 'epic';
      rarity = 'Century Card';
      chance = 1;
    } else if (mintNumber === 1000) {
      variant = 'legendary';
      rarity = 'Millennium Card';
      chance = 0.1;
    } else if (mintNumber && mintNumber % 100 === 0) {
      // Every 100th mint gets a special variant
      variant = 'rare';
      rarity = 'Milestone Card';
      chance = 1;
    }

    return NextResponse.json({
      success: true,
      variant,
      rarity,
      chance,
      mintNumber,
      walletAddress,
      randomValue,
      message: `You received a ${rarity} variant!`
    });

  } catch (error) {
    console.error('Error in POST /api/profile-nft/mystery-variant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return variant information
    const variants = [
      {
        name: 'Standard',
        variant: 'standard',
        chance: 90,
        description: 'Standard profile card with purple gradient',
        color: '#6366f1'
      },
      {
        name: 'Agent Smith',
        variant: 'rare',
        chance: 9,
        description: 'Rare green variant with enhanced features',
        color: '#10b981'
      },
      {
        name: 'Oracle Chosen',
        variant: 'epic',
        chance: 0.9,
        description: 'Epic purple variant with special effects',
        color: '#8b5cf6'
      },
      {
        name: 'Neo Variant',
        variant: 'legendary',
        chance: 0.09,
        description: 'Legendary orange variant with unique traits',
        color: '#f59e0b'
      },
      {
        name: 'Matrix Hacker',
        variant: 'mystery',
        chance: 0.01,
        description: 'Ultra-rare red variant with matrix effects',
        color: '#ef4444'
      }
    ];

    return NextResponse.json({
      success: true,
      variants,
      totalChance: variants.reduce((sum, v) => sum + v.chance, 0),
      message: 'Profile NFT variant information'
    });

  } catch (error) {
    console.error('Error in GET /api/profile-nft/mystery-variant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
