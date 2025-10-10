/**
 * Account Parser Service
 * Parses raw on-chain account data into TypeScript types
 */

import { PublicKey } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';
import type {
  CollectionConfig,
  EscrowWallet,
  MintRecord,
  TickerRegistry,
  PriceOracleData,
} from '@/types/smart-contracts';

/**
 * Parse CollectionConfig account data
 */
export function parseCollectionConfig(data: Buffer): CollectionConfig | null {
  try {
    // Skip the 8-byte discriminator (Anchor account discriminator)
    const accountData = data.slice(8);
    
    let offset = 0;
    
    // Parse fields in order based on Rust struct
    const authority = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const maxSupply = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const priceLamports = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const revealThreshold = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const currentSupply = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const isRevealed = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    const isPaused = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    const collectionMint = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    // Parse strings (length-prefixed)
    const nameLength = accountData.readUInt32LE(offset);
    offset += 4;
    const collectionName = accountData.slice(offset, offset + nameLength).toString('utf-8');
    offset += nameLength;
    
    const symbolLength = accountData.readUInt32LE(offset);
    offset += 4;
    const collectionSymbol = accountData.slice(offset, offset + symbolLength).toString('utf-8');
    offset += symbolLength;
    
    const uriLength = accountData.readUInt32LE(offset);
    offset += 4;
    const placeholderUri = accountData.slice(offset, offset + uriLength).toString('utf-8');
    offset += uriLength;
    
    // Global seed (32 bytes)
    const globalSeed = Array.from(accountData.slice(offset, offset + 32));
    offset += 32;
    
    // Enhanced features
    const maxMintsPerUser = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const mintRateLimitSeconds = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const socialVerificationRequired = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    const bondingCurveEnabled = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    // Fee tracking
    const totalVolume = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const currentPlatformFeeBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    const currentBondingCurvePlatformFeeBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    // Bonding curve pricing
    const bondingCurveBasePrice = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const bondingCurvePriceIncrementBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    const bondingCurveMaxPrice = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    // Reveal fee
    const revealFeeEnabled = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    const revealFeeLamports = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const totalReveals = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    // Additional features
    const tradingFeeBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    const mintFeeBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    const feeCapsDisabled = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    return {
      authority,
      maxSupply: Number(maxSupply),
      priceLamports: Number(priceLamports),
      revealThreshold: Number(revealThreshold),
      currentSupply: Number(currentSupply),
      isRevealed,
      isPaused,
      collectionMint,
      collectionName,
      collectionSymbol,
      placeholderUri,
      globalSeed,
      maxMintsPerUser: Number(maxMintsPerUser),
      mintRateLimitSeconds: Number(mintRateLimitSeconds),
      socialVerificationRequired,
      bondingCurveEnabled,
      totalVolume: Number(totalVolume),
      currentPlatformFeeBps,
      currentBondingCurvePlatformFeeBps,
      bondingCurveBasePrice: Number(bondingCurveBasePrice),
      bondingCurvePriceIncrementBps,
      bondingCurveMaxPrice: Number(bondingCurveMaxPrice),
      revealFeeEnabled,
      revealFeeLamports: Number(revealFeeLamports),
      totalReveals: Number(totalReveals),
      tradingFeeBps,
      mintFeeBps,
      feeCapsDisabled,
    };
  } catch (error) {
    console.error('Error parsing CollectionConfig:', error);
    return null;
  }
}

/**
 * Parse EscrowWallet account data
 */
export function parseEscrowWallet(data: Buffer): EscrowWallet | null {
  try {
    const accountData = data.slice(8); // Skip discriminator
    let offset = 0;
    
    const collectionConfig = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const authority = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const balance = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const creatorSharePercentage = accountData.readUInt16LE(offset);
    offset += 2;
    
    const bondingCurveReserve = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const creatorBcAllocationBps = accountData.readUInt16LE(offset);
    offset += 2;
    
    const lockedFunds = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    return {
      collectionConfig,
      authority,
      balance: Number(balance),
      creatorSharePercentage,
      bondingCurveReserve: Number(bondingCurveReserve),
      creatorBcAllocationBps,
      lockedFunds: Number(lockedFunds),
    };
  } catch (error) {
    console.error('Error parsing EscrowWallet:', error);
    return null;
  }
}

/**
 * Parse MintRecord account data
 */
export function parseMintRecord(data: Buffer): MintRecord | null {
  try {
    const accountData = data.slice(8); // Skip discriminator
    let offset = 0;
    
    const collectionConfig = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const mintIndex = accountData.readBigUInt64LE(offset);
    offset += 8;
    
    const mintAddress = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const owner = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;
    
    const isRevealed = accountData.readUInt8(offset) === 1;
    offset += 1;
    
    return {
      collectionConfig,
      mintIndex: Number(mintIndex),
      mintAddress,
      owner,
      isRevealed,
    };
  } catch (error) {
    console.error('Error parsing MintRecord:', error);
    return null;
  }
}

/**
 * Derive Collection Config PDA
 */
export function deriveCollectionConfigPDA(
  programId: PublicKey,
  authority: PublicKey,
  collectionName: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('collection_config'),
      authority.toBuffer(),
      Buffer.from(collectionName),
    ],
    programId
  );
}

/**
 * Derive Escrow Wallet PDA
 */
export function deriveEscrowWalletPDA(
  programId: PublicKey,
  collectionConfig: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('escrow_wallet'),
      collectionConfig.toBuffer(),
    ],
    programId
  );
}

/**
 * Derive Mint Record PDA
 */
export function deriveMintRecordPDA(
  programId: PublicKey,
  collectionConfig: PublicKey,
  mintIndex: number
): [PublicKey, number] {
  const mintIndexBuffer = Buffer.alloc(8);
  mintIndexBuffer.writeBigUInt64LE(BigInt(mintIndex));
  
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('mint_record'),
      collectionConfig.toBuffer(),
      mintIndexBuffer,
    ],
    programId
  );
}

/**
 * Derive Ticker Registry PDA
 */
export function deriveTickerRegistryPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('ticker_registry')],
    programId
  );
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSOL(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Convert basis points to percentage
 */
export function bpsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Calculate current bonding curve price
 */
export function calculateBondingCurvePrice(
  basePrice: number,
  currentSupply: number,
  incrementBps: number
): number {
  // Price increases by incrementBps for each NFT minted
  const priceMultiplier = 1 + (currentSupply * incrementBps) / 10000;
  return Math.floor(basePrice * priceMultiplier);
}

/**
 * Calculate platform fee based on volume
 */
export function calculatePlatformFee(
  volume: number,
  isBondingCurve: boolean = false
): number {
  // Volume thresholds (in lamports)
  const EARLY_THRESHOLD = 10_000_000_000;  // 10 SOL
  const MID_THRESHOLD = 50_000_000_000;     // 50 SOL
  const LATE_THRESHOLD = 100_000_000_000;   // 100 SOL
  
  if (isBondingCurve) {
    if (volume < EARLY_THRESHOLD) return 552; // 5.52%
    if (volume < MID_THRESHOLD) return 414;   // 4.14%
    return 276; // 2.76%
  } else {
    if (volume < EARLY_THRESHOLD) return 414; // 4.14%
    if (volume < MID_THRESHOLD) return 276;   // 2.76%
    if (volume < LATE_THRESHOLD) return 138;  // 1.38%
    return 50; // 0.5% minimum
  }
}

