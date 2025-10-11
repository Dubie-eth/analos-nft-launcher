'use client';

import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_PROGRAMS, ANALOS_PROGRAM_IDS } from '@/config/analos-programs';
import { PublicKey } from '@solana/web3.js';

/**
 * React hook to access all enhanced Analos programs
 * 
 * Usage:
 * ```tsx
 * const { otcProgram, airdropProgram, vestingProgram } = useEnhancedPrograms();
 * ```
 */
export function useEnhancedPrograms() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const programs = useMemo(() => {
    return {
      // Core Programs
      nftLaunchpad: ANALOS_PROGRAMS.NFT_LAUNCHPAD,
      tokenLaunch: ANALOS_PROGRAMS.TOKEN_LAUNCH,
      priceOracle: ANALOS_PROGRAMS.PRICE_ORACLE,
      rarityOracle: ANALOS_PROGRAMS.RARITY_ORACLE,

      // Enhanced Programs
      otcEnhanced: ANALOS_PROGRAMS.OTC_ENHANCED,
      airdropEnhanced: ANALOS_PROGRAMS.AIRDROP_ENHANCED,
      vestingEnhanced: ANALOS_PROGRAMS.VESTING_ENHANCED,
      tokenLockEnhanced: ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED,
      monitoringSystem: ANALOS_PROGRAMS.MONITORING_SYSTEM,
    };
  }, []);

  const programIds = useMemo(() => {
    return {
      nftLaunchpad: ANALOS_PROGRAM_IDS.NFT_LAUNCHPAD,
      tokenLaunch: ANALOS_PROGRAM_IDS.TOKEN_LAUNCH,
      priceOracle: ANALOS_PROGRAM_IDS.PRICE_ORACLE,
      rarityOracle: ANALOS_PROGRAM_IDS.RARITY_ORACLE,
      otcEnhanced: ANALOS_PROGRAM_IDS.OTC_ENHANCED,
      airdropEnhanced: ANALOS_PROGRAM_IDS.AIRDROP_ENHANCED,
      vestingEnhanced: ANALOS_PROGRAM_IDS.VESTING_ENHANCED,
      tokenLockEnhanced: ANALOS_PROGRAM_IDS.TOKEN_LOCK_ENHANCED,
      monitoringSystem: ANALOS_PROGRAM_IDS.MONITORING_SYSTEM,
    };
  }, []);

  /**
   * Check if a program is deployed on-chain
   */
  const checkProgramDeployment = async (programId: PublicKey): Promise<boolean> => {
    try {
      const accountInfo = await connection.getAccountInfo(programId);
      return accountInfo !== null && accountInfo.executable;
    } catch (error) {
      console.error(`Error checking program ${programId.toBase58()}:`, error);
      return false;
    }
  };

  /**
   * Get all program deployment statuses
   */
  const getAllProgramStatuses = async () => {
    const statuses: Record<string, boolean> = {};
    
    for (const [name, programId] of Object.entries(programs)) {
      statuses[name] = await checkProgramDeployment(programId);
    }
    
    return statuses;
  };

  /**
   * Get Program Derived Address (PDA)
   */
  const getPDA = (programId: PublicKey, seeds: (Buffer | Uint8Array)[]) => {
    return PublicKey.findProgramAddressSync(seeds, programId);
  };

  return {
    // Program Public Keys
    programs,
    programIds,
    
    // Connection and wallet
    connection,
    wallet: publicKey,
    
    // Helper functions
    checkProgramDeployment,
    getAllProgramStatuses,
    getPDA,
    
    // Individual program access (for convenience)
    otcProgram: programs.otcEnhanced,
    airdropProgram: programs.airdropEnhanced,
    vestingProgram: programs.vestingEnhanced,
    tokenLockProgram: programs.tokenLockEnhanced,
    monitoringProgram: programs.monitoringSystem,
  };
}

/**
 * Hook for OTC Trading features
 */
export function useOTCTrading() {
  const { otcProgram, connection, wallet, getPDA } = useEnhancedPrograms();

  const createOffer = async (
    offerItems: any[],
    requestedItems: any[],
    expiryTime: number
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    // Implementation would go here
    console.log('Creating OTC offer...', { offerItems, requestedItems, expiryTime });
    
    return {
      signature: 'placeholder',
      offerId: 'placeholder',
    };
  };

  return {
    programId: otcProgram,
    createOffer,
    // Add more OTC functions here
  };
}

/**
 * Hook for Airdrop features
 */
export function useAirdrop() {
  const { airdropProgram, connection, wallet, getPDA } = useEnhancedPrograms();

  const initializeAirdrop = async (
    merkleRoot: Buffer,
    totalAmount: number
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Initializing airdrop...', { merkleRoot, totalAmount });
    
    return {
      signature: 'placeholder',
      airdropId: 'placeholder',
    };
  };

  const claimAirdrop = async (
    amount: number,
    proof: Buffer[]
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Claiming airdrop...', { amount, proof });
    
    return {
      signature: 'placeholder',
    };
  };

  return {
    programId: airdropProgram,
    initializeAirdrop,
    claimAirdrop,
  };
}

/**
 * Hook for Vesting features
 */
export function useVesting() {
  const { vestingProgram, connection, wallet, getPDA } = useEnhancedPrograms();

  const createVestingSchedule = async (
    totalAmount: number,
    startTime: number,
    endTime: number,
    cliffDuration: number
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Creating vesting schedule...', { 
      totalAmount, 
      startTime, 
      endTime, 
      cliffDuration 
    });
    
    return {
      signature: 'placeholder',
      scheduleId: 'placeholder',
    };
  };

  const claimVestedTokens = async () => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Claiming vested tokens...');
    
    return {
      signature: 'placeholder',
      amount: 0,
    };
  };

  return {
    programId: vestingProgram,
    createVestingSchedule,
    claimVestedTokens,
  };
}

/**
 * Hook for Token Lock features
 */
export function useTokenLock() {
  const { tokenLockProgram, connection, wallet, getPDA } = useEnhancedPrograms();

  const createLock = async (
    amount: number,
    unlockTime: number,
    lockType: string
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Creating token lock...', { amount, unlockTime, lockType });
    
    return {
      signature: 'placeholder',
      lockId: 'placeholder',
    };
  };

  const unlockTokens = async (lockId: PublicKey) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    console.log('Unlocking tokens...', { lockId: lockId.toBase58() });
    
    return {
      signature: 'placeholder',
    };
  };

  return {
    programId: tokenLockProgram,
    createLock,
    unlockTokens,
  };
}

export default useEnhancedPrograms;

