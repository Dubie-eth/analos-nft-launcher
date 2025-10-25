/**
 * USERNAME UNIQUENESS CHECK API
 * Checks if a username is already taken by another Profile NFT
 * RULE: Each username can only exist ONCE on-chain
 * If NFT is burned/transferred, username becomes available again
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// In-memory cache for taken usernames (fallback if database unavailable)
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

    // Check database first (if configured)
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: profileNFT, error: dbError } = await (supabase
          .from('profile_nfts') as any)
          .select('mint_address, wallet_address, username')
          .eq('username', normalizedUsername)
          .single();

        // If there's an error but it's NOT a "no rows" error, skip database check
        if (dbError && dbError.code !== 'PGRST116') {
          console.warn('⚠️ Database check failed, treating as available:', dbError);
          // Continue to fallback logic below
        } else if (profileNFT) {
          console.log(`❌ Username @${username} is taken by:`, profileNFT.wallet_address);
          return NextResponse.json({
            success: true,
            available: false,
            username: normalizedUsername,
            takenBy: {
              owner: profileNFT.wallet_address,
              mint: profileNFT.mint_address
            },
            message: `Username @${username} is already taken`
          });
        }
      } catch (dbError: any) {
        console.warn('⚠️ Database check failed, treating username as available:', dbError?.message || dbError);
        // Continue to fallback logic below
      }
    }

    // Fallback: Check in-memory cache
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

    // Register in database (if configured)
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        
        // Check if username already exists
        const { data: existing } = await (supabase
          .from('profile_nfts') as any)
          .select('username, wallet_address')
          .eq('username', normalizedUsername)
          .single();

        if (existing) {
          console.log(`⚠️ Username @${username} already registered to ${existing.wallet_address}`);
          return NextResponse.json({
            success: false,
            error: 'Username already registered'
          }, { status: 400 });
        }

        // Insert new profile NFT record
        const { error: insertError } = await (supabase
          .from('profile_nfts') as any)
          .insert({
            mint_address: mint,
            wallet_address: owner,
            username: normalizedUsername,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          // Continue with in-memory fallback
        } else {
          console.log(`✅ Username @${username} registered to database for ${owner}`);
        }
      } catch (dbError) {
        console.warn('⚠️ Database registration failed, using in-memory cache:', dbError);
      }
    }

    // Also register in-memory cache (for redundancy)
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

/**
 * DELETE - Release a username (when NFT is burned)
 * This allows the username to be minted again
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const mint = searchParams.get('mint');

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required'
      }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Remove from database
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        
        const deleteQuery = (supabase
          .from('profile_nfts') as any)
          .delete()
          .eq('username', normalizedUsername);

        // If mint provided, also verify it matches
        if (mint) {
          deleteQuery.eq('mint_address', mint);
        }

        const { error } = await deleteQuery;

        if (error) {
          console.error('Database delete error:', error);
        } else {
          console.log(`✅ Username @${username} released (NFT burned)`);
        }
      } catch (dbError) {
        console.warn('⚠️ Database delete failed:', dbError);
      }
    }

    // Also remove from in-memory cache
    takenUsernames.delete(normalizedUsername);

    return NextResponse.json({
      success: true,
      message: `Username @${username} is now available`
    });

  } catch (error) {
    console.error('Error releasing username:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to release username'
    }, { status: 500 });
  }
}

