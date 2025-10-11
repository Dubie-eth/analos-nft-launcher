/**
 * 🎉 ANALOS BLOCKCHAIN PROGRAM CONFIGURATION 🎉
 * 
 * ALL 9 PROGRAMS DEPLOYED AND VERIFIED ON ANALOS MAINNET!
 * 
 * Core Platform Programs: 4/4 ✅
 * Enhancement Programs: 5/5 ✅
 * Total Programs: 9/9 (100%) ✅
 * 
 * Deployment Date: October 11, 2025
 * Total Investment: ~31.5 SOL
 * Network: Analos Mainnet
 * Status: PRODUCTION READY! 🚀
 */

import { PublicKey } from '@solana/web3.js';

/**
 * ========================================
 * ANALOS PROGRAM PUBLIC KEYS
 * ========================================
 */
export const ANALOS_PROGRAMS = {
  // ========================================
  // CORE PLATFORM PROGRAMS (4/4) ✅
  // ========================================

  /**
   * NFT Launchpad Program (Main Integration)
   * - Collection management with ticker collision prevention
   * - Blind mint mechanics & reveal system
   * - Bonding curve integration
   * - Community takeover governance
   * - Whitelist management
   * - Automatic fee distribution
   */
  NFT_LAUNCHPAD: new PublicKey('5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT'),

  /**
   * Price Oracle Program
   * - Real-time $LOS price data
   * - USD-pegged NFT pricing
   * - Market data aggregation
   */
  PRICE_ORACLE: new PublicKey('ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn'),

  /**
   * Rarity Oracle Program
   * - NFT rarity score calculation
   * - Trait distribution analysis
   * - Collection-wide rarity metrics
   */
  RARITY_ORACLE: new PublicKey('H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6'),

  /**
   * Token Launch Program
   * - Token launches with bonding curves
   * - Creator prebuy allocation
   * - Trading fee management
   * - Liquidity pool integration
   */
  TOKEN_LAUNCH: new PublicKey('HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx'),

  // ========================================
  // ENHANCEMENT PROGRAMS (5/5) ✅
  // ========================================

  /**
   * Metadata Program (SPL Token Metadata - Analos Compatible)
   * - On-chain metadata storage
   * - Name, symbol, URI management
   * - Update authority control
   * - Marketplace compatibility
   */
  METADATA: new PublicKey('8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL'),

  /**
   * Vesting Program
   * - Token vesting schedules
   * - Linear and cliff vesting
   * - Team and investor allocations
   * - Time-locked releases
   */
  VESTING: new PublicKey('GbAkoxYYPx5tcn5BD7RHyAYxMZkBxCvY6sHW5x9gcmuL'),

  /**
   * Token Lock Program
   * - Time-locked token holdings
   * - Flexible unlock schedules
   * - Multi-beneficiary support
   * - Emergency unlock mechanisms
   */
  TOKEN_LOCK: new PublicKey('QsA8Y11Sq3hFhqpZtwG7fUap5S3nU4VBxv5V4jTS5gh'),

  /**
   * Airdrop Program
   * - Batch token distribution
   * - Merkle tree verification
   * - Gas-efficient claims
   * - Multi-token support
   */
  AIRDROP: new PublicKey('6oQjb8eyGCN8ZZ7i43ffssYWXE8oQquBuANzccdKuDpM'),

  /**
   * OTC Marketplace Program
   * - Peer-to-peer trading
   * - Escrow management
   * - Multi-asset swaps
   * - Trust-minimized transactions
   */
  OTC_MARKETPLACE: new PublicKey('7FmyCTWgzvZw2q58NJXEXsvGum72yTbbVvn81GN3RDrQ'),
} as const;

/**
 * ========================================
 * PROGRAM IDS AS STRINGS
 * ========================================
 * (For display, logging, and configuration)
 */
export const ANALOS_PROGRAM_IDS = {
  // Core Platform
  NFT_LAUNCHPAD: '5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
  PRICE_ORACLE: 'ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn',
  RARITY_ORACLE: 'H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  
  // Enhancement Programs
  METADATA: '8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL',
  VESTING: 'GbAkoxYYPx5tcn5BD7RHyAYxMZkBxCvY6sHW5x9gcmuL',
  TOKEN_LOCK: 'QsA8Y11Sq3hFhqpZtwG7fUap5S3nU4VBxv5V4jTS5gh',
  AIRDROP: '6oQjb8eyGCN8ZZ7i43ffssYWXE8oQquBuANzccdKuDpM',
  OTC_MARKETPLACE: '7FmyCTWgzvZw2q58NJXEXsvGum72yTbbVvn81GN3RDrQ',
} as const;

/**
 * ========================================
 * EXPLORER URLS
 * ========================================
 */
export const ANALOS_EXPLORER_URLS = {
  // Core Platform
  NFT_LAUNCHPAD: 'https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
  PRICE_ORACLE: 'https://explorer.analos.io/address/ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn',
  RARITY_ORACLE: 'https://explorer.analos.io/address/H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'https://explorer.analos.io/address/HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  
  // Enhancement Programs
  METADATA: 'https://explorer.analos.io/address/8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL',
  VESTING: 'https://explorer.analos.io/address/GbAkoxYYPx5tcn5BD7RHyAYxMZkBxCvY6sHW5x9gcmuL',
  TOKEN_LOCK: 'https://explorer.analos.io/address/QsA8Y11Sq3hFhqpZtwG7fUap5S3nU4VBxv5V4jTS5gh',
  AIRDROP: 'https://explorer.analos.io/address/6oQjb8eyGCN8ZZ7i43ffssYWXE8oQquBuANzccdKuDpM',
  OTC_MARKETPLACE: 'https://explorer.analos.io/address/7FmyCTWgzvZw2q58NJXEXsvGum72yTbbVvn81GN3RDrQ',
} as const;

/**
 * ========================================
 * PROGRAM CATEGORIES
 * ========================================
 */
export const PROGRAM_CATEGORIES = {
  CORE: ['NFT_LAUNCHPAD', 'PRICE_ORACLE', 'RARITY_ORACLE', 'TOKEN_LAUNCH'],
  ENHANCEMENT: ['METADATA', 'VESTING', 'TOKEN_LOCK', 'AIRDROP', 'OTC_MARKETPLACE'],
} as const;

/**
 * ========================================
 * PROGRAM DISPLAY NAMES
 * ========================================
 */
export const PROGRAM_NAMES = {
  NFT_LAUNCHPAD: 'NFT Launchpad',
  PRICE_ORACLE: 'Price Oracle',
  RARITY_ORACLE: 'Rarity Oracle',
  TOKEN_LAUNCH: 'Token Launch',
  METADATA: 'Metadata',
  VESTING: 'Vesting',
  TOKEN_LOCK: 'Token Lock',
  AIRDROP: 'Airdrop',
  OTC_MARKETPLACE: 'OTC Marketplace',
} as const;

/**
 * ========================================
 * PROGRAM EMOJI ICONS
 * ========================================
 */
export const PROGRAM_ICONS = {
  NFT_LAUNCHPAD: '🚀',
  PRICE_ORACLE: '💰',
  RARITY_ORACLE: '🎲',
  TOKEN_LAUNCH: '📈',
  METADATA: '📝',
  VESTING: '⏳',
  TOKEN_LOCK: '🔒',
  AIRDROP: '🎁',
  OTC_MARKETPLACE: '🤝',
} as const;

/**
 * ========================================
 * NETWORK CONFIGURATION
 * ========================================
 */
export const ANALOS_RPC_URL = 'https://rpc.analos.io';
export const ANALOS_EXPLORER_BASE = 'https://explorer.analos.io';

/**
 * ========================================
 * DEPLOYMENT INFORMATION
 * ========================================
 */
export const PROGRAM_INFO = {
  DEPLOYMENT_DATE: '2025-10-11',
  NETWORK: 'Analos Mainnet',
  AUTHORITY: '4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q',
  TOTAL_PROGRAMS: 9,
  CORE_PROGRAMS: 4,
  ENHANCEMENT_PROGRAMS: 5,
  TOTAL_COST: '~31.5 SOL',
  STATUS: 'PRODUCTION READY',
} as const;

/**
 * ========================================
 * HELPER FUNCTIONS
 * ========================================
 */

/**
 * Get explorer URL for any address
 */
export function getAnalosExplorerUrl(address: string): string {
  return `${ANALOS_EXPLORER_BASE}/address/${address}`;
}

/**
 * Validate all program IDs
 */
export function validateProgramIds(): boolean {
  try {
    Object.values(ANALOS_PROGRAMS).forEach(program => {
      if (!(program instanceof PublicKey)) {
        throw new Error('Invalid program ID');
      }
    });
    return true;
  } catch (error) {
    console.error('❌ Program ID validation failed:', error);
    return false;
  }
}

/**
 * Get all program IDs as array
 */
export function getAllProgramIds(): PublicKey[] {
  return Object.values(ANALOS_PROGRAMS);
}

/**
 * Get core program IDs
 */
export function getCoreProgramIds(): PublicKey[] {
  return PROGRAM_CATEGORIES.CORE.map(key => ANALOS_PROGRAMS[key as keyof typeof ANALOS_PROGRAMS]);
}

/**
 * Get enhancement program IDs
 */
export function getEnhancementProgramIds(): PublicKey[] {
  return PROGRAM_CATEGORIES.ENHANCEMENT.map(key => ANALOS_PROGRAMS[key as keyof typeof ANALOS_PROGRAMS]);
}

/**
 * Get program info by key
 */
export function getProgramInfo(programKey: keyof typeof ANALOS_PROGRAMS) {
  return {
    name: PROGRAM_NAMES[programKey],
    icon: PROGRAM_ICONS[programKey],
    programId: ANALOS_PROGRAM_IDS[programKey],
    explorerUrl: ANALOS_EXPLORER_URLS[programKey],
    publicKey: ANALOS_PROGRAMS[programKey],
  };
}

/**
 * Log all deployed programs (for debugging)
 */
export function logDeployedPrograms(): void {
  console.log('🎉 ANALOS DEPLOYED PROGRAMS 🎉');
  console.log('='.repeat(60));
  
  console.log('\n📦 CORE PLATFORM (4/4):');
  PROGRAM_CATEGORIES.CORE.forEach(key => {
    const info = getProgramInfo(key as keyof typeof ANALOS_PROGRAMS);
    console.log(`  ${info.icon} ${info.name}: ${info.programId}`);
  });
  
  console.log('\n✨ ENHANCEMENT PROGRAMS (5/5):');
  PROGRAM_CATEGORIES.ENHANCEMENT.forEach(key => {
    const info = getProgramInfo(key as keyof typeof ANALOS_PROGRAMS);
    console.log(`  ${info.icon} ${info.name}: ${info.programId}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total Programs: ${PROGRAM_INFO.TOTAL_PROGRAMS}/9 (100%)`);
  console.log(`💰 Total Investment: ${PROGRAM_INFO.TOTAL_COST}`);
  console.log(`🚀 Status: ${PROGRAM_INFO.STATUS}`);
  console.log('='.repeat(60));
}

export default ANALOS_PROGRAMS;
