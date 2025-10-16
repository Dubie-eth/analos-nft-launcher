/**
 * ANAL TOKEN VERIFICATION SERVICE
 * Real-time verification of ANAL token balance for whitelist eligibility
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';

// Configuration
const ANAL_TOKEN_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
const MIN_ANAL_BALANCE = 1000000; // 1M ANAL tokens required for whitelist
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.analos.io';

export interface WhitelistEligibility {
  eligible: boolean;
  analBalance: number;
  requiredBalance: number;
  walletAddress: string;
  message: string;
}

/**
 * Check if a wallet has enough ANAL tokens for whitelist eligibility
 */
export async function checkWhitelistEligibility(
  walletAddress: string
): Promise<WhitelistEligibility> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);
    const analMint = new PublicKey(ANAL_TOKEN_MINT);

    // Get the associated token account for this wallet
    const tokenAccount = await getAssociatedTokenAddress(
      analMint,
      walletPubkey
    );

    try {
      // Get the token account info
      const accountInfo = await getAccount(connection, tokenAccount);
      const balance = Number(accountInfo.amount);

      const eligible = balance >= MIN_ANAL_BALANCE;

      return {
        eligible,
        analBalance: balance,
        requiredBalance: MIN_ANAL_BALANCE,
        walletAddress,
        message: eligible
          ? `✅ Eligible! You have ${balance.toLocaleString()} ANAL tokens`
          : `❌ Not eligible. You have ${balance.toLocaleString()} ANAL tokens, need ${MIN_ANAL_BALANCE.toLocaleString()}`
      };
    } catch (error) {
      // Token account doesn't exist - user has 0 ANAL tokens
      return {
        eligible: false,
        analBalance: 0,
        requiredBalance: MIN_ANAL_BALANCE,
        walletAddress,
        message: `❌ Not eligible. You have 0 ANAL tokens, need ${MIN_ANAL_BALANCE.toLocaleString()}`
      };
    }
  } catch (error) {
    console.error('Error checking whitelist eligibility:', error);
    throw new Error('Failed to check ANAL token balance');
  }
}

/**
 * Check eligibility for multiple wallets at once
 */
export async function checkMultipleWallets(
  walletAddresses: string[]
): Promise<WhitelistEligibility[]> {
  const results = await Promise.all(
    walletAddresses.map(address => checkWhitelistEligibility(address))
  );
  return results;
}

/**
 * Get ANAL token balance for a wallet
 */
export async function getANALBalance(walletAddress: string): Promise<number> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);
    const analMint = new PublicKey(ANAL_TOKEN_MINT);

    const tokenAccount = await getAssociatedTokenAddress(
      analMint,
      walletPubkey
    );

    try {
      const accountInfo = await getAccount(connection, tokenAccount);
      return Number(accountInfo.amount);
    } catch (error) {
      return 0; // No token account = 0 balance
    }
  } catch (error) {
    console.error('Error getting ANAL balance:', error);
    return 0;
  }
}

/**
 * Check if whitelist phase is active
 */
export function isWhitelistPhaseActive(
  currentMintCount: number,
  whitelistSupply: number = 100
): boolean {
  return currentMintCount < whitelistSupply;
}

/**
 * Get whitelist phase status
 */
export interface WhitelistPhaseStatus {
  isActive: boolean;
  mintsRemaining: number;
  totalWhitelistSupply: number;
  message: string;
}

export function getWhitelistPhaseStatus(
  currentMintCount: number,
  whitelistSupply: number = 100
): WhitelistPhaseStatus {
  const isActive = currentMintCount < whitelistSupply;
  const mintsRemaining = Math.max(0, whitelistSupply - currentMintCount);

  return {
    isActive,
    mintsRemaining,
    totalWhitelistSupply: whitelistSupply,
    message: isActive
      ? `🎉 Whitelist phase active! ${mintsRemaining} FREE mints remaining`
      : '⏰ Whitelist phase ended. Public sale active.'
  };
}

/**
 * Verify whitelist mint eligibility (combined check)
 */
export interface MintEligibility {
  canMint: boolean;
  isWhitelistPhase: boolean;
  isWhitelistEligible: boolean;
  hasAlreadyMintedWhitelist: boolean;
  analBalance: number;
  price: number; // 0 for first whitelist mint, 4200.69 LOS for additional
  priceToken: 'FREE' | 'LOS' | 'SOL';
  message: string;
}

export async function checkMintEligibility(
  walletAddress: string,
  currentMintCount: number,
  userAlreadyMintedWhitelist: boolean = false,
  whitelistSupply: number = 100
): Promise<MintEligibility> {
  // Check if whitelist phase is active
  const whitelistPhase = getWhitelistPhaseStatus(currentMintCount, whitelistSupply);
  
  if (whitelistPhase.isActive) {
    // Whitelist phase - check ANAL balance
    const eligibility = await checkWhitelistEligibility(walletAddress);
    
    // Check if user already minted their free whitelist NFT
    if (eligibility.eligible && !userAlreadyMintedWhitelist) {
      return {
        canMint: true,
        isWhitelistPhase: true,
        isWhitelistEligible: true,
        hasAlreadyMintedWhitelist: false,
        analBalance: eligibility.analBalance,
        price: 0, // FREE for first whitelist mint
        priceToken: 'FREE',
        message: `✅ You can mint 1 FREE NFT! (${whitelistPhase.mintsRemaining} whitelist spots left)`
      };
    } else if (eligibility.eligible && userAlreadyMintedWhitelist) {
      return {
        canMint: true,
        isWhitelistPhase: true,
        isWhitelistEligible: true,
        hasAlreadyMintedWhitelist: true,
        analBalance: eligibility.analBalance,
        price: 4200.69, // LOS tokens for additional mints
        priceToken: 'LOS',
        message: `✅ You can mint additional NFTs for 4,200.69 LOS each (you already claimed your FREE mint)`
      };
    } else {
      return {
        canMint: true,
        isWhitelistPhase: true,
        isWhitelistEligible: false,
        hasAlreadyMintedWhitelist: false,
        analBalance: eligibility.analBalance,
        price: 4200.69, // LOS tokens for non-whitelist holders
        priceToken: 'LOS',
        message: `❌ Not eligible for FREE mint. You can mint for 4,200.69 LOS each. Public sale starts after ${whitelistPhase.mintsRemaining} more whitelist mints.`
      };
    }
  } else {
    // Public sale phase - bonding curve in LOS tokens
    const bondingPrice = calculateBondingCurvePrice(currentMintCount, whitelistSupply);
    
    return {
      canMint: true,
      isWhitelistPhase: false,
      isWhitelistEligible: false,
      hasAlreadyMintedWhitelist: userAlreadyMintedWhitelist,
      analBalance: await getANALBalance(walletAddress),
      price: bondingPrice,
      priceToken: 'LOS',
      message: `✅ Public sale active! Current price: ${bondingPrice.toLocaleString()} LOS`
    };
  }
}

/**
 * Calculate bonding curve price based on mint count (in LOS tokens)
 */
function calculateBondingCurvePrice(
  mintedCount: number,
  whitelistSupply: number = 100
): number {
  const publicMinted = mintedCount - whitelistSupply;
  const publicSupply = 1900; // Total public supply
  
  if (publicMinted <= 0) return 4200.69; // Base price during whitelist
  if (publicMinted >= publicSupply) return 42000.69; // Max price at sellout
  
  // Calculate price based on bonding curve in LOS tokens
  const progress = publicMinted / publicSupply;
  
  // Exponential curve from 4,200.69 LOS to 42,000.69 LOS
  const basePrice = 4200.69;
  const maxPrice = 42000.69;
  const priceRange = maxPrice - basePrice;
  
  const price = basePrice + (priceRange * Math.pow(progress, 2));
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

export default {
  checkWhitelistEligibility,
  checkMultipleWallets,
  getANALBalance,
  isWhitelistPhaseActive,
  getWhitelistPhaseStatus,
  checkMintEligibility,
  ANAL_TOKEN_MINT,
  MIN_ANAL_BALANCE
};
