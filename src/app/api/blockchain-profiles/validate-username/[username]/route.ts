/**
 * BLOCKCHAIN PROFILE USERNAME VALIDATION API
 * Validates username format and checks availability on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { BlockchainProfileService, USERNAME_RULES } from '@/lib/blockchain-profile-service';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';

// Initialize connection
// Configure connection for Analos network with extended timeouts
const connection = new Connection(ANALOS_RPC_URL, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
});

// Force disable WebSocket to prevent connection issues
(connection as any)._rpcWebSocket = null;
(connection as any)._rpcWebSocketConnected = false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: validation.message
      });
    }

    // Check availability on-chain
    const availability = await checkUsernameAvailability(username);
    
    return NextResponse.json({
      available: availability.available,
      valid: true,
      message: availability.available 
        ? `Username '${username}' is available!`
        : `Username '${username}' is already taken`,
      takenBy: availability.takenBy
    });

  } catch (error) {
    console.error('Error validating username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateUsernameFormat(username: string): { valid: boolean; message?: string } {
  const normalized = username.toLowerCase().trim();

  // Length: 3-20
  if (normalized.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  if (normalized.length > 20) {
    return { valid: false, message: 'Username must be 20 characters or less' };
  }

  // Start with letter or number
  if (!/^[a-zA-Z0-9]/.test(normalized)) {
    return { valid: false, message: 'Username must start with a letter or number' };
  }

  // Allowed characters only
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Cannot end with underscore or hyphen
  if (/_$|-$/.test(normalized)) {
    return { valid: false, message: 'Username cannot end with an underscore or hyphen' };
  }

  // No consecutive underscores or hyphens
  if (/[_-]{2,}/.test(normalized)) {
    return { valid: false, message: 'Username cannot have consecutive underscores or hyphens' };
  }

  // Reserved names
  if (USERNAME_RULES.reserved.includes(normalized)) {
    return { valid: false, message: 'This username is reserved and cannot be used' };
  }

  return { valid: true };
}

async function checkUsernameAvailability(username: string): Promise<{ available: boolean; takenBy?: string }> {
  try {
    const normalized = username.toLowerCase();
    
    // Derive PDA for username
    const [usernamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('username'), Buffer.from(normalized)],
      ANALOS_PROGRAMS.MONITORING_SYSTEM
    );

    // Check if account exists on-chain
    const accountInfo = await connection.getAccountInfo(usernamePda);
    
    if (accountInfo) {
      // Username is taken, try to get the owner
      try {
        // Decode username data to get owner
        const { BorshCoder } = await import('@coral-xyz/anchor');
        const IDL = await import('@/idl/analos_monitoring_system.json');
        const coder = new BorshCoder(IDL.default as any);
        const usernameData = coder.accounts.decode('UsernameRecord', accountInfo.data);
        return { available: false, takenBy: new PublicKey(usernameData.owner).toString() };
      } catch {
        return { available: false, takenBy: 'Unknown' };
      }
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking username availability:', error);
    // On error, assume available to not block users
    return { available: true };
  }
}
