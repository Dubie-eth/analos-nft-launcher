/**
 * Analos Blockchain Program Configuration
 * All 4 programs deployed and verified on Analos mainnet
 * Deployment Date: October 10, 2025
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
  PRICE_ORACLE: new PublicKey('9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym'),

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
} as const;

/**
 * Analos RPC Endpoint
 */
export const ANALOS_RPC_URL = 'https://rpc.analos.io';

/**
 * Program IDs as strings (for display/logging)
 */
export const ANALOS_PROGRAM_IDS = {
  PRICE_ORACLE: '9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym',
  RARITY_ORACLE: 'H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  NFT_LAUNCHPAD: '5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
} as const;

/**
 * Explorer URLs for verification
 */
export const ANALOS_EXPLORER_URLS = {
  PRICE_ORACLE: 'https://explorer.analos.io/address/9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym',
  RARITY_ORACLE: 'https://explorer.analos.io/address/H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6',
  TOKEN_LAUNCH: 'https://explorer.analos.io/address/HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx',
  NFT_LAUNCHPAD: 'https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT',
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

