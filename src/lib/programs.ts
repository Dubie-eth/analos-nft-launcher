import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";

// ===== PROGRAM IDS =====
export const PROGRAM_IDS = {
  // Core Programs
  nftLaunchpad: new PublicKey("5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"),
  tokenLaunch: new PublicKey("CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf"),
  rarityOracle: new PublicKey("C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5"),
  priceOracle: new PublicKey("B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D"),
  
  // NEW ENHANCED PROGRAMS
  otcEnhanced: new PublicKey("7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY"),
  airdropEnhanced: new PublicKey("J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC"),
  vestingEnhanced: new PublicKey("Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY"),
  tokenLockEnhanced: new PublicKey("3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH"),
  monitoringSystem: new PublicKey("7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG"),
};

// ===== LOAD ALL PROGRAMS =====
export async function loadEnhancedPrograms(provider: AnchorProvider) {
  try {
    // Import IDLs (these will be generated after build)
    // For now, returning program IDs for reference
    return {
      programIds: PROGRAM_IDS,
      // Programs will be initialized after IDL generation
      // otcEnhanced: new Program(otcIdl, PROGRAM_IDS.otcEnhanced, provider),
      // airdropEnhanced: new Program(airdropIdl, PROGRAM_IDS.airdropEnhanced, provider),
      // vestingEnhanced: new Program(vestingIdl, PROGRAM_IDS.vestingEnhanced, provider),
      // tokenLockEnhanced: new Program(tokenLockIdl, PROGRAM_IDS.tokenLockEnhanced, provider),
      // monitoringSystem: new Program(monitoringIdl, PROGRAM_IDS.monitoringSystem, provider),
    };
  } catch (error) {
    console.error("Error loading enhanced programs:", error);
    throw error;
  }
}

// ===== PROGRAM INTERFACES =====

/**
 * OTC Enhanced Program
 * - Create P2P trade offers
 * - Accept/cancel trades
 * - Multi-sig approval for large trades
 */
export interface OTCEnhancedProgram {
  createOffer: (
    offerItems: any[],
    requestedItems: any[],
    expiryTime: number
  ) => Promise<string>;
  acceptOffer: (offerId: PublicKey) => Promise<string>;
  cancelOffer: (offerId: PublicKey) => Promise<string>;
}

/**
 * Airdrop Enhanced Program
 * - Initialize merkle tree airdrops
 * - Claim tokens with proof
 * - Rate limiting protection
 */
export interface AirdropEnhancedProgram {
  initializeAirdrop: (
    merkleRoot: Buffer,
    totalAmount: number
  ) => Promise<string>;
  claimAirdrop: (
    amount: number,
    proof: Buffer[]
  ) => Promise<string>;
}

/**
 * Vesting Enhanced Program
 * - Create vesting schedules
 * - Claim vested tokens
 * - Emergency pause/resume
 */
export interface VestingEnhancedProgram {
  createVestingSchedule: (
    totalAmount: number,
    startTime: number,
    endTime: number,
    cliffDuration: number
  ) => Promise<string>;
  claimVestedTokens: () => Promise<string>;
  pauseVesting: (scheduleId: PublicKey) => Promise<string>;
}

/**
 * Token Lock Enhanced Program
 * - Lock tokens with time-based release
 * - Multi-sig unlock
 * - LP token locking
 */
export interface TokenLockEnhancedProgram {
  createLock: (
    amount: number,
    unlockTime: number,
    lockType: string
  ) => Promise<string>;
  unlockTokens: (lockId: PublicKey) => Promise<string>;
  extendLock: (lockId: PublicKey, newUnlockTime: number) => Promise<string>;
}

/**
 * Monitoring System Program
 * - Log system events
 * - Create alerts
 * - Query metrics
 */
export interface MonitoringSystemProgram {
  logEvent: (
    eventType: string,
    eventData: any
  ) => Promise<void>;
  createAlert: (
    condition: string,
    threshold: number
  ) => Promise<string>;
  getMetrics: () => Promise<any>;
}

// ===== HELPER FUNCTIONS =====

/**
 * Get Program Data Account (PDA) for a program
 */
export function getProgramPDA(
  programId: PublicKey,
  seeds: (Buffer | Uint8Array)[]
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

/**
 * Check if a program is deployed
 */
export async function isProgramDeployed(
  connection: anchor.web3.Connection,
  programId: PublicKey
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(programId);
    return accountInfo !== null && accountInfo.executable;
  } catch (error) {
    console.error(`Error checking program ${programId.toBase58()}:`, error);
    return false;
  }
}

/**
 * Get all program statuses
 */
export async function getAllProgramStatuses(
  connection: anchor.web3.Connection
): Promise<Record<string, boolean>> {
  const statuses: Record<string, boolean> = {};
  
  for (const [name, programId] of Object.entries(PROGRAM_IDS)) {
    statuses[name] = await isProgramDeployed(connection, programId);
  }
  
  return statuses;
}

export default {
  PROGRAM_IDS,
  loadEnhancedPrograms,
  getProgramPDA,
  isProgramDeployed,
  getAllProgramStatuses,
};

