/**
 * Analos Blockchain Program Configuration
 * All 9 programs deployed and verified on Analos mainnet
 * Deployment Date: October 10, 2025
 * Updated: October 11, 2025 - Added 5 Enhanced Programs
 * CACHE BUST: v1.0.2 - Testing original program ID for Price Oracle
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Analos Program Public Keys
 */
export const ANALOS_PROGRAMS = {
  /**
   * Price Oracle Program
   * Provides real-time $LOS price data for USD-pegged NFT pricing
   */
  PRICE_ORACLE: new PublicKey('AaKR2YwrRFohmyUnWLhaVt43Ung6CgAeW43A119i94Vw'),

  /**
   * Rarity Oracle Program
   * Calculates and stores NFT rarity scores and trait distributions
   */
  RARITY_ORACLE: new PublicKey('H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6'),

  /**
   * Token Launch Program
   * Handles token launches with bonding curves, creator prebuy, and trading fees
   */
  TOKEN_LAUNCH: new PublicKey('HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx'),

  /**
   * NFT Launchpad Program (Main Integration)
   * Main NFT launchpad that integrates all oracles and handles:
   * - Collection management
   * - Blind mint mechanics
   * - Reveal system with commit-reveal scheme
   * - Bonding curve integration
   * - Community takeover governance
   * - Whitelist management
   */
  NFT_LAUNCHPAD: new PublicKey('5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT'),

  // ===== NEW ENHANCED PROGRAMS =====

  /**
   * OTC Enhanced Program
   * P2P trading with escrow protection and multi-sig approval
   * Features:
   * - NFT ↔ Token swaps
   * - Token ↔ Token swaps
   * - Expiring offers
   * - Multi-sig for large trades
   */
  OTC_ENHANCED: new PublicKey('7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY'),

  /**
   * Airdrop Enhanced Program
   * Merkle tree-based airdrops with anti-bot protection
   * Features:
   * - Merkle proof verification
   * - Rate limiting
   * - Claim tracking
   * - Multiple campaigns
   */
  AIRDROP_ENHANCED: new PublicKey('J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC'),

  /**
   * Vesting Enhanced Program
   * Token vesting with time-based release schedules
   * Features:
   * - Linear vesting schedules
   * - Cliff periods
   * - Emergency pause/resume
   * - Beneficiary updates
   */
  VESTING_ENHANCED: new PublicKey('Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY'),

  /**
   * Token Lock Enhanced Program
   * Time-locked token escrow with multi-sig unlock
   * Features:
   * - Time-based locks
   * - LP token locking
   * - Multi-sig unlock
   * - Lock extension
   */
  TOKEN_LOCK_ENHANCED: new PublicKey('3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH'),

  /**
   * Monitoring System Program
   * Real-time monitoring and alerting system
   * Features:
   * - Event logging
   * - Alert triggers
   * - Performance metrics
   * - Anomaly detection
   */
  MONITORING_SYSTEM: new PublicKey('7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG'),
} as const;

/**
 * Analos RPC Endpoint
 */
export const ANALOS_RPC_URL = 'https://rpc.analos.io';

/**
 * Program IDs as strings (for display/logging)
 */
export const ANALOS_PROGRAM_IDS = {
  PRICE_ORACLE: 'ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn',
  RARITY_ORACLE: 'H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  NFT_LAUNCHPAD: '5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
  OTC_ENHANCED: '7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY',
  AIRDROP_ENHANCED: 'J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC',
  VESTING_ENHANCED: 'Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY',
  TOKEN_LOCK_ENHANCED: '3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH',
  MONITORING_SYSTEM: '7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG',
} as const;

/**
 * Explorer URLs for verification
 */
export const ANALOS_EXPLORER_URLS = {
  PRICE_ORACLE: 'https://explorer.analos.io/address/ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn',
  RARITY_ORACLE: 'https://explorer.analos.io/address/H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'https://explorer.analos.io/address/HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  NFT_LAUNCHPAD: 'https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
  OTC_ENHANCED: 'https://explorer.analos.io/address/7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY',
  AIRDROP_ENHANCED: 'https://explorer.analos.io/address/J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC',
  VESTING_ENHANCED: 'https://explorer.analos.io/address/Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY',
  TOKEN_LOCK_ENHANCED: 'https://explorer.analos.io/address/3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH',
  MONITORING_SYSTEM: 'https://explorer.analos.io/address/7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG',
} as const;

/**
 * Program deployment information
 */
export const PROGRAM_INFO = {
  DEPLOYMENT_DATE: '2025-10-10',
  NETWORK: 'Analos Mainnet',
  AUTHORITY: '4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q',
  TOTAL_COST: '~16 SOL',
} as const;

/**
 * Helper function to get explorer URL for any address
 */
export function getAnalosExplorerUrl(address: string): string {
  return `https://explorer.analos.io/address/${address}`;
}

/**
 * Helper function to validate program IDs
 */
export function validateProgramIds(): boolean {
  try {
    // Attempt to create PublicKey objects from all program IDs
    Object.values(ANALOS_PROGRAMS).forEach(program => {
      if (!(program instanceof PublicKey)) {
        throw new Error('Invalid program ID');
      }
    });
    return true;
  } catch (error) {
    console.error('Program ID validation failed:', error);
    return false;
  }
}

export default ANALOS_PROGRAMS;

