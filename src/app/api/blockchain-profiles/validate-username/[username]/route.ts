/**
 * BLOCKCHAIN PROFILE USERNAME VALIDATION API
 * Validates username format and checks availability on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { BlockchainProfileService, USERNAME_RULES } from '@/lib/blockchain-profile-service';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';

// Initialize connection
const connection = new Connection(ANALOS_RPC_URL);

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
  const normalized = username.toLowerCase();

  // Check length
  if (normalized.length < USERNAME_RULES.minLength) {
    return { valid: false, message: `Username must be at least ${USERNAME_RULES.minLength} characters long` };
  }
  if (normalized.length > USERNAME_RULES.maxLength) {
    return { valid: false, message: `Username must be ${USERNAME_RULES.maxLength} characters or less` };
  }

  // Check pattern
  if (!USERNAME_RULES.pattern.test(normalized)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens. Cannot start or end with special characters.' };
  }

  // Check reserved names
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
        const coder = new (await import('@coral-xyz/anchor')).BorshCoder({
          accounts: [
            {
              name: 'UsernameRecord',
              type: {
                kind: 'struct',
                fields: [
                  { name: 'username', type: 'string' },
                  { name: 'owner', type: 'publicKey' },
                  { name: 'createdAt', type: 'i64' }
                ]
              }
            }
          ]
        });
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
