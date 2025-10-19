import { NextRequest, NextResponse } from 'next/server';
import { MATRIX_VARIANT_RARITY, MATRIX_RARITY_CONFIG, MatrixVariantType } from '@/lib/matrix-rare-variant';

/**
 * MATRIX VARIANT RARITY ORACLE
 * Determines if a user should receive a rare Matrix-themed NFT variant
 */

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, username, seed, timestamp } = await request.json();

    if (!walletAddress || !username) {
      return NextResponse.json(
        { error: 'Wallet address and username are required' },
        { status: 400 }
      );
    }

    // Create deterministic seed for consistent results
    const deterministicSeed = createDeterministicSeed(walletAddress, username);
    
    // Use oracle logic to determine variant
    const variantType = await determineMatrixVariant(
      walletAddress,
      username,
      deterministicSeed,
      timestamp
    );

    const config = MATRIX_RARITY_CONFIG[variantType];
    
    return NextResponse.json({
      success: true,
      variantType,
      rarity: config,
      message: getVariantMessage(variantType),
      oracleData: {
        seed: deterministicSeed,
        timestamp,
        walletHash: walletAddress.slice(0, 8) + '...',
        usernameHash: username.slice(0, 4) + '...'
      }
    });

  } catch (error) {
    console.error('Matrix variant oracle error:', error);
    return NextResponse.json(
      { error: 'Oracle determination failed' },
      { status: 500 }
    );
  }
}

/**
 * Create deterministic seed from wallet and username
 */
function createDeterministicSeed(walletAddress: string, username: string): string {
  const combined = walletAddress + username + 'matrix_oracle_2025';
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Determine Matrix variant using oracle logic
 */
async function determineMatrixVariant(
  walletAddress: string,
  username: string,
  seed: string,
  timestamp: number
): Promise<MatrixVariantType> {
  
  // Convert seed to number for probability calculation
  const seedNumber = parseInt(seed.slice(0, 8), 16);
  const randomValue = seedNumber / 0xffffffff;
  
  // Special conditions for ultra-rare variants
  
  // Oracle Chosen (0.001% chance) - Only for specific wallet patterns
  if (randomValue < 0.00001 && isOracleChosenPattern(walletAddress, username)) {
    return MATRIX_VARIANT_RARITY.ORACLE_CHOSEN;
  }
  
  // Neo Variant (0.01% chance) - For specific username patterns
  if (randomValue < 0.0001 && isNeoPattern(username)) {
    return MATRIX_VARIANT_RARITY.NEO_VARIANT;
  }
  
  // Matrix Hacker (0.1% chance) - For specific conditions
  if (randomValue < 0.001 && isMatrixHackerPattern(walletAddress, username, timestamp)) {
    return MATRIX_VARIANT_RARITY.MATRIX_HACKER;
  }
  
  return MATRIX_VARIANT_RARITY.NORMAL;
}

/**
 * Check if wallet/username pattern qualifies for Oracle Chosen
 */
function isOracleChosenPattern(walletAddress: string, username: string): boolean {
  // Look for specific patterns that indicate Oracle selection
  const walletPattern = walletAddress.toLowerCase();
  const usernamePattern = username.toLowerCase();
  
  // Check for oracle-related patterns
  const oraclePatterns = ['oracle', 'prophet', 'chosen', 'destiny', 'fate'];
  const hasOraclePattern = oraclePatterns.some(pattern => 
    walletPattern.includes(pattern) || usernamePattern.includes(pattern)
  );
  
  // Check for specific wallet endings that might be "chosen"
  const specialEndings = ['000', '777', '999', 'aaa', 'fff'];
  const hasSpecialEnding = specialEndings.some(ending => 
    walletAddress.toLowerCase().endsWith(ending)
  );
  
  return hasOraclePattern || hasSpecialEnding;
}

/**
 * Check if username qualifies for Neo variant
 */
function isNeoPattern(username: string): boolean {
  const neoPatterns = ['neo', 'one', 'chosen', 'savior', 'messiah'];
  const usernameLower = username.toLowerCase();
  
  return neoPatterns.some(pattern => usernameLower.includes(pattern));
}

/**
 * Check if conditions qualify for Matrix Hacker variant
 */
function isMatrixHackerPattern(
  walletAddress: string, 
  username: string, 
  timestamp: number
): boolean {
  // Check for hacker-related patterns
  const hackerPatterns = ['hack', 'matrix', 'code', 'cyber', 'neo', 'trinity'];
  const usernameLower = username.toLowerCase();
  const hasHackerPattern = hackerPatterns.some(pattern => 
    usernameLower.includes(pattern)
  );
  
  // Check for specific timestamp conditions (e.g., minting at certain times)
  const mintHour = new Date(timestamp).getHours();
  const isNightTime = mintHour >= 22 || mintHour <= 6; // Night owl hackers
  
  // Check for wallet patterns that might indicate a "hacker"
  const walletLower = walletAddress.toLowerCase();
  const hasCryptoPattern = walletLower.includes('0x') || walletLower.includes('dead');
  
  return hasHackerPattern || (isNightTime && hasCryptoPattern);
}

/**
 * Get variant-specific message
 */
function getVariantMessage(variantType: MatrixVariantType): string {
  switch (variantType) {
    case MATRIX_VARIANT_RARITY.MATRIX_HACKER:
      return 'Welcome to the Matrix. You have been chosen to join the resistance.';
    case MATRIX_VARIANT_RARITY.NEO_VARIANT:
      return 'The One has been found. You are destined to save humanity.';
    case MATRIX_VARIANT_RARITY.ORACLE_CHOSEN:
      return 'The Oracle has spoken. Your destiny awaits beyond the Matrix.';
    default:
      return 'Welcome to the Analos NFT Launchpad community.';
  }
}
