/**
 * TypeScript types for all 4 programs
 * Auto-generated from IDLs
 */

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ========== NFT LAUNCHPAD TYPES ==========

export interface CollectionConfig {
  authority: PublicKey;
  maxSupply: BN;
  currentSupply: BN;
  priceLamports: BN;
  revealThreshold: BN;
  isRevealed: boolean;
  isPaused: boolean;
  globalSeed: number[];
  collectionMint: PublicKey;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
  escrowWallet: PublicKey;
  targetPriceUsd?: BN;
  usesUsdPegging: boolean;
  // ... other fields
}

export interface EscrowWallet {
  collectionConfig: PublicKey;
  authority: PublicKey;
  creatorFunds: BN;
  bondingCurveReserve: BN;
  totalWithdrawn: BN;
  totalDeposited: BN;
  fundsLocked: boolean;
  unlockAmount: BN;
  lockUntil: BN;
  creatorBcAllocationBps: number;
}

export interface BondingCurveTier {
  collectionConfig: PublicKey;
  tierId: number;
  tierName: string;
  basePrice: BN;
  priceIncrement: BN;
  maxPrice: BN;
  maxSupply: BN;
  currentSupply: BN;
  isActive: boolean;
  startTime: BN;
  endTime: BN;
  whitelistRequired: boolean;
  tokenGate?: PublicKey;
  minTokenBalance: BN;
  socialVerification: boolean;
  discountBps: number;
}

// ========== TOKEN LAUNCH TYPES ==========

export interface TokenLaunchConfig {
  nftCollectionConfig: PublicKey;
  tokenMint: PublicKey;
  tokenEscrow: PublicKey;
  authority: PublicKey;
  tokensPerNft: BN;
  totalTokensMinted: BN;
  totalTokensDistributed: BN;
  poolPercentageBps: number;
  creatorPercentageBps: number;
  poolTokens: BN;
  creatorTokens: BN;
  dlmmPool?: PublicKey;
  dlmmPosition?: PublicKey;
  isBonded: boolean;
  bondTime?: BN;
  buybackEnabled: boolean;
  buybackPriceTokens: BN;
  totalBuybacks: BN;
  tokenName: string;
  tokenSymbol: string;
  creatorVestingStart?: BN;
  creatorImmediateTokens: BN;
  creatorVestedTokens: BN;
  creatorTokensClaimed: BN;
  vestingDurationMonths: BN;
  creatorPrebuyEnabled: boolean;
  creatorPrebuyMaxBps: number;
  creatorPrebuyAmount: BN;
  tradingFeesCollected: BN;
  tradingFeesClaimed: BN;
}

export interface UserTokenClaim {
  user: PublicKey;
  collectionConfig: PublicKey;
  nftMint: PublicKey;
  rarityTier: number;
  tokensClaimed: BN;
  tokenMultiplier: BN;
  claimedAt: BN;
}

// ========== RARITY ORACLE TYPES ==========

export interface RarityConfig {
  collectionConfig: PublicKey;
  authority: PublicKey;
  oracleAuthority: PublicKey;
  totalRevealed: BN;
  isActive: boolean;
  useMetadataBased: boolean;
  useRandomness: boolean;
  createdAt: BN;
}

export interface RarityTier {
  collectionConfig: PublicKey;
  tierId: number;
  tierName: string;
  tokenMultiplier: BN;
  probabilityBps: number;
  probabilityCumulativeBps: number;
  totalCount: BN;
  maxCount: BN;
  isActive: boolean;
  createdAt: BN;
}

export interface RarityDetermination {
  nftMint: PublicKey;
  collectionConfig: PublicKey;
  rarityTier: number;
  tokenMultiplier: BN;
  randomSeed: number[];
  probabilityRoll: number;
  determinedAt: BN;
  determinedBy: PublicKey;
}

// ========== PRICE ORACLE TYPES ==========

export interface PriceOracle {
  authority: PublicKey;
  losMarketCapUsd: BN;
  losPriceUsd: BN;
  lastUpdate: BN;
  updateCount: BN;
  isActive: boolean;
}

// ========== ENUMS ==========

export enum SocialPlatform {
  Twitter,
  Discord,
  Telegram,
  Instagram,
  TikTok,
  YouTube,
  GitHub,
  Reddit,
}

export enum WhitelistType {
  AddressList,
  TokenHolder,
  SocialVerification,
}

export enum VerificationMethod {
  Oracle,
  SelfVerification,
  CommunityVerification,
}

// ========== HELPER FUNCTIONS ==========

export function calculateVestedTokens(
  config: TokenLaunchConfig,
  currentTime: number
): BN {
  if (!config.creatorVestingStart) return new BN(0);
  
  const vestingStart = config.creatorVestingStart.toNumber();
  const elapsedTime = currentTime - vestingStart;
  const elapsedMonths = Math.floor(elapsedTime / (30 * 24 * 60 * 60));
  const vestingMonths = config.vestingDurationMonths.toNumber();
  
  if (elapsedMonths >= vestingMonths) {
    return config.creatorVestedTokens;
  }
  
  return config.creatorVestedTokens
    .mul(new BN(elapsedMonths))
    .div(new BN(vestingMonths));
}

export function calculateAvailableToWithdraw(
  config: TokenLaunchConfig,
  currentTime: number
): BN {
  const vestedTokens = calculateVestedTokens(config, currentTime);
  const totalAvailable = config.creatorImmediateTokens.add(vestedTokens);
  const available = totalAvailable.sub(config.creatorTokensClaimed);
  
  return available.gt(new BN(0)) ? available : new BN(0);
}

export function calculateCurrentPrice(
  tier: BondingCurveTier
): BN {
  const baseWithDiscount = tier.basePrice
    .mul(new BN(10000 - tier.discountBps))
    .div(new BN(10000));
  
  const priceFromCurve = baseWithDiscount.add(
    tier.currentSupply.mul(tier.priceIncrement)
  );
  
  // Apply max price cap
  if (tier.maxPrice.gt(new BN(0)) && priceFromCurve.gt(tier.maxPrice)) {
    return tier.maxPrice;
  }
  
  return priceFromCurve;
}

export function calculateLosAmountForUsd(
  usdAmount: BN,
  losPriceUsd: BN
): BN {
  // usd_amount (6 decimals) * 1e9 / los_price_usd (6 decimals)
  return usdAmount
    .mul(new BN(1_000_000_000))
    .div(losPriceUsd);
}

export function formatUSD(amount: BN): string {
  return `$${(amount.toNumber() / 1e6).toFixed(2)}`;
}

export function formatLOS(lamports: BN): string {
  return `${(lamports.toNumber() / 1e9).toFixed(4)} LOS`;
}

export function formatTokens(amount: BN, decimals: number = 6): string {
  return `${(amount.toNumber() / 10 ** decimals).toLocaleString()} tokens`;
}

// ========== PDA HELPERS ==========

export function getCollectionConfigPDA(
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("collection"), authority.toBuffer()],
    programId
  );
}

export function getEscrowWalletPDA(
  collectionConfig: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_wallet"), collectionConfig.toBuffer()],
    programId
  );
}

export function getTokenLaunchConfigPDA(
  nftCollectionConfig: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_launch_config"), nftCollectionConfig.toBuffer()],
    programId
  );
}

export function getRarityConfigPDA(
  collectionConfig: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rarity_config"), collectionConfig.toBuffer()],
    programId
  );
}

export function getRarityTierPDA(
  rarityConfig: PublicKey,
  tierId: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rarity_tier"), rarityConfig.toBuffer(), Buffer.from([tierId])],
    programId
  );
}

export function getPriceOraclePDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("price_oracle")],
    programId
  );
}

export function getBondingCurveTierPDA(
  collectionConfig: PublicKey,
  tierId: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bc_tier"), collectionConfig.toBuffer(), Buffer.from([tierId])],
    programId
  );
}

export function getUserTokenClaimPDA(
  tokenLaunchConfig: PublicKey,
  user: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_token_claim"), tokenLaunchConfig.toBuffer(), user.toBuffer()],
    programId
  );
}

export function getRarityDeterminationPDA(
  rarityConfig: PublicKey,
  nftMint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rarity_determination"), rarityConfig.toBuffer(), nftMint.toBuffer()],
    programId
  );
}

