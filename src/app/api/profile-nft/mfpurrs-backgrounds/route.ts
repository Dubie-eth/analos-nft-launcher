/**
 * MF PURRS BACKGROUNDS API
 * Handle MF Purrs background layers for profile NFT cards
 */

import { NextRequest, NextResponse } from 'next/server';

// MF Purrs background layers (these would be fetched from the GitHub repo in production)
const MFPURRS_BACKGROUNDS = [
  {
    id: 'galaxy',
    name: 'Galaxy',
    rarity: 'legendary',
    chance: 0.1,
    description: 'Cosmic galaxy background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/galaxy.png',
    color: '#1a1a2e'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    rarity: 'epic',
    chance: 0.5,
    description: 'Northern lights aurora background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/aurora.png',
    color: '#0f3460'
  },
  {
    id: 'forest',
    name: 'Mystic Forest',
    rarity: 'rare',
    chance: 2.0,
    description: 'Enchanted forest background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/forest.png',
    color: '#0d4f3c'
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    rarity: 'rare',
    chance: 2.0,
    description: 'Deep ocean depths background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/ocean.png',
    color: '#001a2e'
  },
  {
    id: 'sunset',
    name: 'Alaska Sunset',
    rarity: 'uncommon',
    chance: 5.0,
    description: 'Alaska sunset background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/sunset.png',
    color: '#ff6b35'
  },
  {
    id: 'mountain',
    name: 'Snow Peaks',
    rarity: 'uncommon',
    chance: 5.0,
    description: 'Snow-capped mountain background',
    url: 'https://raw.githubusercontent.com/VirtualAlaska/mfpurrs/main/art/trait-layers/background/mountain.png',
    color: '#2c3e50'
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      backgrounds: MFPURRS_BACKGROUNDS,
      totalBackgrounds: MFPURRS_BACKGROUNDS.length,
      message: 'MF Purrs background layers available'
    });
  } catch (error) {
    console.error('Error fetching MF Purrs backgrounds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, mintNumber } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Generate deterministic background selection based on wallet address and mint number
    const seed = walletAddress + (mintNumber || 0).toString();
    
    // Simple hash function for deterministic randomness
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const randomValue = Math.abs(hash) % 10000; // 0-9999

    // Determine if user gets an MF Purrs background (very rare - 1% chance)
    const mfpurrsChance = 100; // 1% chance
    let selectedBackground = null;
    let isMfpurrs = false;

    if (randomValue < mfpurrsChance) {
      // User gets an MF Purrs background!
      isMfpurrs = true;
      
      // Select specific background based on weighted rarity
      let cumulativeChance = 0;
      const backgroundRandom = (randomValue * 7) % 100; // Different seed for background selection
      
      for (const background of MFPURRS_BACKGROUNDS) {
        cumulativeChance += background.chance;
        if (backgroundRandom < cumulativeChance) {
          selectedBackground = background;
          break;
        }
      }
      
      // Fallback to first background if none selected
      if (!selectedBackground) {
        selectedBackground = MFPURRS_BACKGROUNDS[0];
      }
    }

    return NextResponse.json({
      success: true,
      isMfpurrs,
      background: selectedBackground,
      randomValue,
      mintNumber,
      walletAddress,
      message: isMfpurrs 
        ? `🎉 You received a rare MF Purrs ${selectedBackground?.name} background!` 
        : 'Standard background selected'
    });

  } catch (error) {
    console.error('Error in POST /api/profile-nft/mfpurrs-backgrounds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
