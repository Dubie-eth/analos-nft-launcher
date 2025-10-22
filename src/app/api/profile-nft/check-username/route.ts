/**
 * USERNAME UNIQUENESS CHECK API
 * Checks if a username is already taken by another Profile NFT
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

// In-memory cache for taken usernames (in production, use database)
const takenUsernames = new Map<string, {mint: string; owner: string; timestamp: number}>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required'
      }, { status: 400 });
    }

    // Normalize username (lowercase for comparison)
    const normalizedUsername = username.toLowerCase().trim();

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Username can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Check length
    if (normalizedUsername.length < 1 || normalizedUsername.length > 50) {
      return NextResponse.json({
        success: false,
        available: false,
        error: 'Username must be between 1 and 50 characters'
      }, { status: 400 });
    }

    // Check in-memory cache first
    const cached = takenUsernames.get(normalizedUsername);
    if (cached) {
      // Cache for 5 minutes
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return NextResponse.json({
          success: true,
          available: false,
          username: normalizedUsername,
          takenBy: {
            owner: cached.owner,
            mint: cached.mint
          },
          message: `Username @${username} is already taken`
        });
      } else {
        // Cache expired, remove it
        takenUsernames.delete(normalizedUsername);
      }
    }

    // TODO: In production, query blockchain or database for all Profile NFTs
    // and check if username exists
    // For now, we'll use the in-memory cache only

    // Check against reserved usernames
    const reservedUsernames = ['admin', 'analos', 'system', 'official', 'support', 'help', 'api', 'root'];
    if (reservedUsernames.includes(normalizedUsername)) {
      return NextResponse.json({
        success: true,
        available: false,
        username: normalizedUsername,
        message: `Username @${username} is reserved by the system`
      });
    }

    // Username is available
    return NextResponse.json({
      success: true,
      available: true,
      username: normalizedUsername,
      message: `Username @${username} is available!`
    });

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check username availability'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, mint, owner } = body;

    if (!username || !mint || !owner) {
      return NextResponse.json({
        success: false,
        error: 'Username, mint, and owner are required'
      }, { status: 400 });
    }

    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();

    // Register username as taken
    takenUsernames.set(normalizedUsername, {
      mint,
      owner,
      timestamp: Date.now()
    });

    console.log(`✅ Username @${username} registered to ${owner}`);

    return NextResponse.json({
      success: true,
      message: `Username @${username} registered successfully`
    });

  } catch (error) {
    console.error('Error registering username:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to register username'
    }, { status: 500 });
  }
}

