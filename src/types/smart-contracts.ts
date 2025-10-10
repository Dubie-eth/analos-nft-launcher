/**
 * Smart Contract Types
 * TypeScript interfaces matching the on-chain Rust account structures
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Collection Config Account
 * Main NFT collection configuration stored on-chain
 */
export interface CollectionConfig {
  // Core fields
  authority: PublicKey;
  maxSupply: number;
  priceLamports: number;
  revealThreshold: number;
  currentSupply: number;
  isRevealed: boolean;
  isPaused: boolean;
  collectionMint: PublicKey;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
  globalSeed: number[];
  
  // Enhanced features
  maxMintsPerUser: number;
  mintRateLimitSeconds: number;
  socialVerificationRequired: boolean;
  bondingCurveEnabled: boolean;
  
  // Fee tracking
  totalVolume: number;
  currentPlatformFeeBps: number;
  currentBondingCurvePlatformFeeBps: number;
  
  // Bonding curve pricing
  bondingCurveBasePrice: number;
  bondingCurvePriceIncrementBps: number;
  bondingCurveMaxPrice: number;
  
  // Reveal fee
  revealFeeEnabled: boolean;
  revealFeeLamports: number;
  totalReveals: number;
  
  // Additional features
  tradingFeeBps: number;
  mintFeeBps: number;
  feeCapsDisabled: boolean;
}

/**
 * Escrow Wallet Account
 * Holds funds from minting and manages creator payments
 */
export interface EscrowWallet {
  collectionConfig: PublicKey;
  authority: PublicKey;
  balance: number;
  creatorSharePercentage: number; // Basis points (2500 = 25%)
  bondingCurveReserve: number;
  creatorBcAllocationBps: number;
  lockedFunds: number;
}

/**
 * Mint Record Account
 * Individual NFT mint record
 */
export interface MintRecord {
  collectionConfig: PublicKey;
  mintIndex: number;
  mintAddress: PublicKey;
  owner: PublicKey;
  isRevealed: boolean;
}

/**
 * Ticker Registry Account
 * Global registry of all used ticker symbols
 */
export interface TickerRegistry {
  authority: PublicKey;
  tickers: Uint8Array[]; // Array of [u8; MAX_TICKER_LENGTH]
  maxCapacity: number;
}

/**
 * Mint Phase Config Account
 * Configuration for phased/tiered minting
 */
export interface MintPhaseConfig {
  collectionConfig: PublicKey;
  authority: PublicKey;
  phaseName: string;
  startTime: number;
  endTime: number | null;
  maxMintsPerUser: number;
  priceLamports: number;
  isActive: boolean;
}

/**
 * Social Verification Config Account
 * Configuration for social media verification requirements
 */
export interface SocialVerificationConfig {
  collectionConfig: PublicKey;
  platform: number; // 0 = Twitter, 1 = Discord, etc.
  minFollowers: number;
  verificationCode: string;
  isActive: boolean;
}

/**
 * User Social Verification Account
 * User's social verification status
 */
export interface UserSocialVerification {
  user: PublicKey;
  platform: number;
  followerCount: number;
  verifiedAt: number;
  isVerified: boolean;
}

/**
 * Commitment Config Account
 * For commit-reveal scheme
 */
export interface CommitmentConfig {
  collectionConfig: PublicKey;
  commitmentHash: number[];
  committedAt: number;
  revealedAt: number | null;
  isRevealed: boolean;
}

/**
 * Takeover Proposal Account
 * Community governance takeover proposals
 */
export interface TakeoverProposal {
  collectionConfig: PublicKey;
  proposer: PublicKey;
  proposalType: number; // 0 = collection, 1 = escrow
  newAuthority: PublicKey;
  description: string;
  votesFor: number;
  votesAgainst: number;
  isActive: boolean;
  createdAt: number;
}

/**
 * Bonding Curve Tier Account
 * Configuration for bonding curve tiers
 */
export interface BondingCurveTier {
  collectionConfig: PublicKey;
  tierName: string;
  supplyLimit: number;
  priceMultiplierBps: number;
  timeLimitSeconds: number | null;
  accessRules: number; // 0 = public, 1 = whitelist, 2 = token-gate, 3 = social verification
  currentSupply: number;
  isActive: boolean;
}

/**
 * Price Oracle Data (from Price Oracle program)
 */
export interface PriceOracleData {
  authority: PublicKey;
  losMarketCapUsd: number;
  losPriceUsd: number;
  lastUpdate: number;
  isActive: boolean;
}

/**
 * Rarity Oracle Data (from Rarity Oracle program)
 */
export interface RarityOracleData {
  authority: PublicKey;
  collectionConfig: PublicKey;
  traitTypes: Map<string, TraitRarity>;
  totalSupply: number;
  isActive: boolean;
}

export interface TraitRarity {
  traitType: string;
  traitValue: string;
  occurrences: number;
  rarityScore: number;
}

/**
 * Events emitted by the program
 */
export interface CollectionInitializedEvent {
  collectionConfig: PublicKey;
  authority: PublicKey;
  maxSupply: number;
  priceLamports: number;
  collectionSymbol: string;
  timestamp: number;
}

export interface PlaceholderMintedEvent {
  collectionConfig: PublicKey;
  mintIndex: number;
  owner: PublicKey;
  mintAddress: PublicKey;
  priceLamports: number;
  timestamp: number;
}

export interface CollectionRevealedEvent {
  collectionConfig: PublicKey;
  authority: PublicKey;
  revealedSupply: number;
  timestamp: number;
}

/**
 * Program instruction parameters
 */
export interface InitializeCollectionParams {
  maxSupply: number;
  priceLamports: number;
  revealThreshold: number;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
  maxMintsPerUser?: number;
  mintRateLimitSeconds?: number;
  socialVerificationRequired?: boolean;
  bondingCurveEnabled?: boolean;
}

export interface MintPlaceholderParams {
  // No additional params needed - uses collection config
}

export interface RevealCollectionParams {
  revealSeed: Uint8Array;
}

/**
 * Helper types for UI
 */
export interface CollectionDisplayData {
  address: string;
  authority: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  maxSupply: number;
  currentSupply: number;
  mintPriceSOL: number;
  mintPriceUSD: number;
  isActive: boolean;
  isPaused: boolean;
  isRevealed: boolean;
  revealThreshold: number;
  bondingCurveEnabled: boolean;
  socialVerificationRequired: boolean;
  placeholderUri: string;
}

export interface UserNFTData {
  mint: string;
  collectionName: string;
  collectionSymbol: string;
  mintIndex: number;
  isRevealed: boolean;
  imageUrl: string;
  metadata?: {
    name: string;
    description: string;
    attributes: Array<{
      traitType: string;
      value: string;
    }>;
  };
}

/**
 * Program constants
 */
export const PROGRAM_CONSTANTS = {
  // Fee distribution (basis points)
  FEE_DEV_TEAM_BPS: 100,           // 1%
  FEE_POOL_CREATION_BPS: 200,      // 2%
  FEE_LOL_BUYBACK_BURN_BPS: 100,   // 1%
  FEE_PLATFORM_MAINT_BPS: 100,     // 1%
  FEE_LOL_COMMUNITY_BPS: 100,      // 1%
  FEE_TOTAL_BPS: 600,              // 6% total
  
  // Creator allocation
  CREATOR_TOTAL_BPS: 2500,         // 25% total
  CREATOR_IMMEDIATE_BPS: 1000,     // 10% immediate
  CREATOR_VESTED_BPS: 1500,        // 15% vested
  
  // Pool allocation
  POOL_ALLOCATION_BPS: 6900,       // 69%
  
  // Ticker constraints
  MAX_TICKER_LENGTH: 10,
  MIN_TICKER_LENGTH: 1,
  
  // Security
  DEFAULT_MINT_RATE_LIMIT_SECONDS: 60,
  DEFAULT_COMMITMENT_REVEAL_WINDOW: 24 * 60 * 60, // 24 hours
  
  // Lamports per SOL
  LAMPORTS_PER_SOL: 1_000_000_000,
};

/**
 * PDA Seeds for account derivation
 */
export const PDA_SEEDS = {
  COLLECTION_CONFIG: 'collection_config',
  ESCROW_WALLET: 'escrow_wallet',
  MINT_RECORD: 'mint_record',
  TICKER_REGISTRY: 'ticker_registry',
  BONDING_CURVE_TIER: 'bonding_curve_tier',
  MINT_PHASE: 'mint_phase',
  SOCIAL_VERIFICATION: 'social_verification',
  USER_SOCIAL_VERIFICATION: 'user_social_verification',
  COMMITMENT: 'commitment',
  TAKEOVER_PROPOSAL: 'takeover_proposal',
};

