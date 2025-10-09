/**
 * NFT Launchpad Smart Contract Configuration
 * 
 * This configuration file contains all the necessary constants and settings
 * for interacting with the deployed NFT Launchpad smart contract on Analos.
 */

import { PublicKey } from '@solana/web3.js';

// ✅ DEPLOYED PROGRAM ID - Updated from successful Analos deployment
export const NFT_LAUNCHPAD_PROGRAM_ID = new PublicKey('FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo');

// Program Account Seeds (from the smart contract)
export const SEEDS = {
  COLLECTION: Buffer.from('collection'),
  MINT: Buffer.from('mint'),
} as const;

// Royalty configuration (from the smart contract)
export const ROYALTY_BASIS_POINTS = 500; // 5% royalty

// Collection Configuration Interface
export interface CollectionConfig {
  authority: PublicKey;
  maxSupply: number;
  currentSupply: number;
  priceLamports: number;
  revealThreshold: number;
  isRevealed: boolean;
  isPaused: boolean;
  globalSeed: Uint8Array;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
}

// Mint Record Interface
export interface MintRecord {
  mintIndex: number;
  minter: PublicKey;
  isRevealed: boolean;
  rarityScore: number;
}

// Rarity Tiers (from the smart contract logic)
export enum RarityTier {
  LEGENDARY = 'Legendary', // 0-4 (5%)
  EPIC = 'Epic',           // 5-19 (15%)
  RARE = 'Rare',           // 20-49 (30%)
  COMMON = 'Common',       // 50-99 (50%)
}

// Helper function to get rarity tier from score
export function getRarityTier(rarityScore: number): RarityTier {
  if (rarityScore <= 4) return RarityTier.LEGENDARY;
  if (rarityScore <= 19) return RarityTier.EPIC;
  if (rarityScore <= 49) return RarityTier.RARE;
  return RarityTier.COMMON;
}

// Event interfaces (emitted by the smart contract)
export interface MintEvent {
  mintIndex: number;
  minter: PublicKey;
  rarityScore: number;
  timestamp: number;
}

export interface RevealEvent {
  timestamp: number;
  totalMinted: number;
  revealedBaseUri: string;
}

export interface NftRevealedEvent {
  mintIndex: number;
  rarityTier: string;
  rarityScore: number;
}

// Default collection configuration for testing
export const DEFAULT_COLLECTION_CONFIG = {
  maxSupply: 1000,
  priceLamports: 100_000_000, // 0.1 SOL/LOS
  revealThreshold: 500, // Reveal at 50% minted
  collectionName: 'Analos Mystery Collection',
  collectionSymbol: 'AMC',
  placeholderUri: 'https://arweave.net/placeholder-metadata.json',
} as const;

// Program Error Codes (from the smart contract)
export enum ErrorCode {
  SOLD_OUT = 'Collection is sold out',
  COLLECTION_PAUSED = 'Collection minting is paused',
  ALREADY_REVEALED = 'Collection has already been revealed',
  THRESHOLD_NOT_MET = 'Reveal threshold has not been met',
  NOT_REVEALED = 'Collection has not been revealed yet',
  INSUFFICIENT_FUNDS = 'Insufficient funds for withdrawal',
  INVALID_THRESHOLD = 'Invalid threshold value',
}

// Export configuration summary
export const CONFIG_SUMMARY = {
  programId: NFT_LAUNCHPAD_PROGRAM_ID.toBase58(),
  network: 'Analos Mainnet',
  explorerUrl: `https://explorer.analos.io/address/${NFT_LAUNCHPAD_PROGRAM_ID.toBase58()}`,
  deployedAt: '2025-10-09',
  features: [
    'Blind Mint & Reveal',
    'On-chain Randomness',
    'Rarity System',
    'Collection Management',
    'Admin Controls',
    'Fund Withdrawal',
    'Pause/Resume',
  ],
} as const;

console.log('🎯 NFT Launchpad Config Loaded:', CONFIG_SUMMARY);

