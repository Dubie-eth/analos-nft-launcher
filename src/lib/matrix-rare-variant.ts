/**
 * MATRIX RARE VARIANT SYSTEM
 * Creates ultra-rare Matrix-themed NFT variants with spinning animations
 */

import { PublicKey } from '@solana/web3.js';

// Matrix variant rarity levels
export const MATRIX_VARIANT_RARITY = {
  NORMAL: 'normal',
  MATRIX_HACKER: 'matrix_hacker', // 0.1% chance - Ultra rare
  NEO_VARIANT: 'neo_variant',     // 0.01% chance - Legendary
  ORACLE_CHOSEN: 'oracle_chosen'  // 0.001% chance - Mythical
} as const;

export type MatrixVariantType = typeof MATRIX_VARIANT_RARITY[keyof typeof MATRIX_VARIANT_RARITY];

// Rarity oracle configuration
export const MATRIX_RARITY_CONFIG = {
  [MATRIX_VARIANT_RARITY.NORMAL]: {
    probability: 99.889,
    name: 'Standard Profile Card',
    description: 'A standard profile card for the Analos community',
    glowColor: '#6366f1',
    animationType: 'none'
  },
  [MATRIX_VARIANT_RARITY.MATRIX_HACKER]: {
    probability: 0.1,
    name: 'Matrix Hacker Card',
    description: 'You have been chosen by the Matrix. Welcome to the resistance.',
    glowColor: '#00ff41',
    animationType: 'matrix_rain',
    specialEffects: ['glitch', 'rain', 'spinning']
  },
  [MATRIX_VARIANT_RARITY.NEO_VARIANT]: {
    probability: 0.01,
    name: 'Neo Variant Card',
    description: 'The One has been found. You are the chosen one.',
    glowColor: '#ff0080',
    animationType: 'neo_transformation',
    specialEffects: ['spinning', 'transformation', 'bullet_time', 'oracle_vision']
  },
  [MATRIX_VARIANT_RARITY.ORACLE_CHOSEN]: {
    probability: 0.001,
    name: 'Oracle Chosen Card',
    description: 'The Oracle has spoken. You are destined for greatness.',
    glowColor: '#ffff00',
    animationType: 'oracle_glow',
    specialEffects: ['spinning', 'oracle_glow', 'destiny_aura', 'time_bend']
  }
};

/**
 * Check if user should receive a Matrix variant using rarity oracle
 */
export async function checkMatrixVariantEligibility(
  walletAddress: string,
  username: string
): Promise<MatrixVariantType> {
  try {
    // Create a deterministic seed from wallet and username
    const seed = createDeterministicSeed(walletAddress, username);
    
    // Query rarity oracle for variant determination
    const oracleResponse = await fetch('/api/oracle/matrix-variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        username,
        seed,
        timestamp: Date.now()
      })
    });

    if (oracleResponse.ok) {
      const data = await oracleResponse.json();
      return data.variantType;
    }
  } catch (error) {
    console.error('Error checking Matrix variant eligibility:', error);
  }

  // Fallback to local calculation if oracle fails
  return calculateLocalMatrixVariant(walletAddress, username);
}

/**
 * Create deterministic seed for variant calculation
 */
function createDeterministicSeed(walletAddress: string, username: string): string {
  const combined = walletAddress + username + 'matrix_seed_2025';
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Local fallback calculation for Matrix variants
 */
function calculateLocalMatrixVariant(walletAddress: string, username: string): MatrixVariantType {
  const seed = createDeterministicSeed(walletAddress, username);
  const randomValue = parseInt(seed.slice(0, 8), 16) / 0xffffffff;
  
  // Ultra rare variants based on specific conditions
  if (randomValue < 0.00001) return MATRIX_VARIANT_RARITY.ORACLE_CHOSEN;
  if (randomValue < 0.0001) return MATRIX_VARIANT_RARITY.NEO_VARIANT;
  if (randomValue < 0.001) return MATRIX_VARIANT_RARITY.MATRIX_HACKER;
  
  return MATRIX_VARIANT_RARITY.NORMAL;
}

/**
 * Generate Matrix-themed SVG for rare variants
 */
export function generateMatrixVariantSVG(
  profileData: any,
  variantType: MatrixVariantType,
  referralCode: string
): string {
  const config = MATRIX_RARITY_CONFIG[variantType];
  
  if (variantType === MATRIX_VARIANT_RARITY.NORMAL) {
    return generateStandardCard(profileData, referralCode);
  }

  return generateMatrixCard(profileData, referralCode, config);
}

/**
 * Generate standard profile card
 */
function generateStandardCard(profileData: any, referralCode: string): string {
  return `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="400" height="600" fill="url(#bg)" rx="20"/>
      <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" stroke-width="4" rx="15"/>
      
      <rect x="20" y="20" width="360" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
      <text x="200" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        ANALOS PROFILE CARDS
      </text>
      <text x="200" y="55" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">
        Master Open Edition Collection
      </text>
      <text x="200" y="70" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">
        onlyanal.fun
      </text>
      
      <circle cx="200" cy="180" r="60" fill="white" stroke="#6366f1" stroke-width="4"/>
      <text x="200" y="190" text-anchor="middle" fill="#6366f1" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
        ${profileData.displayName.charAt(0).toUpperCase()}
      </text>
      
      <text x="200" y="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
        ${profileData.displayName}
      </text>
      <text x="200" y="305" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="14">
        @${profileData.username}
      </text>
      
      <rect x="30" y="330" width="340" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
      <text x="200" y="350" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
        ${profileData.bio || 'Profile card holder on Analos'}
      </text>
      
      <rect x="30" y="430" width="340" height="60" fill="rgba(255,255,255,0.2)" rx="10"/>
      <text x="200" y="450" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        REFERRAL CODE
      </text>
      <text x="200" y="470" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
        ${referralCode}
      </text>
      
      <text x="200" y="550" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">
        Open Edition • Minted on Analos • onlyanal.fun
      </text>
    </svg>
  `;
}

/**
 * Generate Matrix-themed rare variant card
 */
function generateMatrixCard(profileData: any, referralCode: string, config: any): string {
  const glowColor = config.glowColor;
  const variantName = config.name;
  
  return `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="matrixBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#001100;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="matrixGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Matrix Background -->
      <rect width="400" height="600" fill="url(#matrixBg)" rx="20"/>
      
      <!-- Matrix Rain Effect -->
      ${generateMatrixRain()}
      
      <!-- Glowing Border -->
      <rect x="10" y="10" width="380" height="580" fill="none" stroke="${glowColor}" stroke-width="4" rx="15" filter="url(#glow)"/>
      
      <!-- Matrix Header -->
      <rect x="20" y="20" width="360" height="80" fill="rgba(0,0,0,0.8)" rx="10" stroke="${glowColor}" stroke-width="2"/>
      <text x="200" y="35" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="12" font-weight="bold" filter="url(#matrixGlow)">
        MATRIX.BREACH.DETECTED
      </text>
      <text x="200" y="50" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="10" filter="url(#matrixGlow)">
        ${variantName.toUpperCase()}
      </text>
      <text x="200" y="65" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="8">
        ORACLE.VERIFIED
      </text>
      <text x="200" y="80" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="8">
        onlyanal.fun
      </text>
      
      <!-- Spinning Avatar -->
      <circle cx="200" cy="180" r="60" fill="black" stroke="${glowColor}" stroke-width="4" filter="url(#glow)"/>
      <text x="200" y="190" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="24" font-weight="bold" filter="url(#matrixGlow)">
        ${profileData.displayName.charAt(0).toUpperCase()}
      </text>
      
      <!-- Matrix User Info -->
      <text x="200" y="280" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="18" font-weight="bold" filter="url(#matrixGlow)">
        ${profileData.displayName.toUpperCase()}
      </text>
      <text x="200" y="305" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="12">
        @${profileData.username}
      </text>
      
      <!-- Matrix Bio -->
      <rect x="30" y="330" width="340" height="80" fill="rgba(0,0,0,0.8)" rx="10" stroke="${glowColor}" stroke-width="2"/>
      <text x="200" y="350" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="10">
        ${profileData.bio || 'CHOSEN BY THE ORACLE'}
      </text>
      
      <!-- Matrix Referral Code -->
      <rect x="30" y="430" width="340" height="60" fill="rgba(0,0,0,0.9)" rx="10" stroke="${glowColor}" stroke-width="2" filter="url(#glow)"/>
      <text x="200" y="450" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="12" font-weight="bold">
        REFERRAL.CODE
      </text>
      <text x="200" y="470" text-anchor="middle" fill="#ffff00" font-family="monospace" font-size="16" font-weight="bold" filter="url(#matrixGlow)">
        ${referralCode}
      </text>
      
      <!-- Matrix Footer -->
      <text x="200" y="550" text-anchor="middle" fill="${glowColor}" font-family="monospace" font-size="8">
        MATRIX.EDITION • ORACLE.VERIFIED • onlyanal.fun
      </text>
      
      <!-- Spinning Animation -->
      <style>
        <![CDATA[
          .spinning-card {
            animation: spin 3s linear infinite;
            transform-origin: center;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .matrix-glow {
            animation: pulse 2s ease-in-out infinite alternate;
          }
          
          @keyframes pulse {
            from { filter: url(#matrixGlow); }
            to { filter: url(#glow); }
          }
        ]]>
      </style>
    </svg>
  `;
}

/**
 * Generate Matrix rain effect for the background
 */
function generateMatrixRain(): string {
  let rainHtml = '';
  const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 400;
    const y = Math.random() * 600;
    const char = chars[Math.floor(Math.random() * chars.length)];
    const opacity = Math.random() * 0.6 + 0.2;
    
    rainHtml += `
      <text x="${x}" y="${y}" fill="#00ff41" font-family="monospace" font-size="10" opacity="${opacity}">
        ${char}
      </text>
    `;
  }
  
  return rainHtml;
}

/**
 * Create spinning card animation component
 */
export function createSpinningCardAnimation(variantType: MatrixVariantType): string {
  if (variantType === MATRIX_VARIANT_RARITY.NORMAL) {
    return '';
  }
  
  const config = MATRIX_RARITY_CONFIG[variantType];
  
  return `
    .matrix-card {
      animation: matrixSpin 4s ease-in-out infinite;
      transform-origin: center center;
    }
    
    .matrix-glow {
      animation: matrixPulse 1.5s ease-in-out infinite alternate;
      filter: drop-shadow(0 0 20px ${config.glowColor});
    }
    
    @keyframes matrixSpin {
      0% { transform: rotateY(0deg) rotateX(0deg); }
      25% { transform: rotateY(90deg) rotateX(5deg); }
      50% { transform: rotateY(180deg) rotateX(0deg); }
      75% { transform: rotateY(270deg) rotateX(-5deg); }
      100% { transform: rotateY(360deg) rotateX(0deg); }
    }
    
    @keyframes matrixPulse {
      0% { filter: drop-shadow(0 0 10px ${config.glowColor}); }
      100% { filter: drop-shadow(0 0 30px ${config.glowColor}); }
    }
  `;
}
