/**
 * BLOCKCHAIN PROFILE API
 * Manages user profiles stored on the Analos blockchain
 */

import { NextRequest, NextResponse } from 'next/server';

// Wrap imports in try-catch to handle any import errors
let Connection: any, PublicKey: any, Keypair: any, Program: any, AnchorProvider: any;
let BlockchainProfile: any, BlockchainProfileService: any;
let supabaseAdmin: any, isSupabaseConfigured: any;
let ANALOS_PROGRAMS: any, ANALOS_RPC_URL: any;
let connection: any;

try {
  const solanaWeb3 = require('@solana/web3.js');
  Connection = solanaWeb3.Connection;
  PublicKey = solanaWeb3.PublicKey;
  Keypair = solanaWeb3.Keypair;
  
  const anchor = require('@coral-xyz/anchor');
  Program = anchor.Program;
  AnchorProvider = anchor.AnchorProvider;
  
  const blockchainProfileService = require('@/lib/blockchain-profile-service');
  BlockchainProfile = blockchainProfileService.BlockchainProfile;
  BlockchainProfileService = blockchainProfileService.BlockchainProfileService;
  
  const supabaseClient = require('@/lib/supabase/client');
  supabaseAdmin = supabaseClient.supabaseAdmin;
  isSupabaseConfigured = supabaseClient.isSupabaseConfigured;
  
  const analosPrograms = require('@/config/analos-programs');
  ANALOS_PROGRAMS = analosPrograms.ANALOS_PROGRAMS;
  ANALOS_RPC_URL = analosPrograms.ANALOS_RPC_URL;
  
  // Initialize connection and program
  // Configure connection for Analos network with extended timeouts
  connection = new Connection(ANALOS_RPC_URL, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    confirmTransactionTimeout: 120000, // 2 minutes for Analos network
  });
  
  // Force disable WebSocket to prevent connection issues
  (connection as any)._rpcWebSocket = null;
  (connection as any)._rpcWebSocketConnected = false;
  
  console.log('✅ All imports successful');
} catch (importError) {
  console.error('❌ Import error:', importError);
  console.error('❌ Import error stack:', importError instanceof Error ? importError.stack : 'No stack trace');
}

// GET - Fetch blockchain profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // For now, we'll fetch from database as a fallback
    // In a full implementation, this would fetch from the blockchain
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: profile, error } = await ((supabaseAdmin as any)
        .from('user_profiles'))
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        );
      }

      if (profile) {
        // Convert database profile to blockchain profile format
        const blockchainProfile: any = {
          wallet: new PublicKey(profile.wallet_address),
          username: profile.username || '',
          displayName: profile.display_name || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url || '',
          bannerUrl: profile.banner_url || '',
          twitterHandle: profile.twitter_handle || '',
          twitterVerified: profile.twitter_verified || false,
          website: profile.website || '',
          discord: profile.discord || '',
          telegram: profile.telegram || '',
          github: profile.github || '',
          createdAt: new Date(profile.created_at).getTime(),
          updatedAt: new Date(profile.updated_at).getTime(),
          isAnonymous: profile.is_anonymous || false
        };

        return NextResponse.json(blockchainProfile);
      }
    }

    // Return empty profile if not found
    return NextResponse.json({
      wallet: new PublicKey(walletAddress),
      username: '',
      displayName: '',
      bio: '',
      avatarUrl: '',
      bannerUrl: '',
      twitterHandle: '',
      twitterVerified: false,
      website: '',
      discord: '',
      telegram: '',
      github: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAnonymous: false
    });

  } catch (error) {
    console.error('Error in GET /api/blockchain-profiles/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update blockchain profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    console.log('🔍 POST /api/blockchain-profiles/[walletAddress] - Starting request');
    
    // Check if imports were successful
    if (!Connection || !PublicKey || !supabaseAdmin) {
      console.error('❌ Import check failed - missing required modules');
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          details: 'Required modules not loaded properly',
          missingModules: {
            Connection: !!Connection,
            PublicKey: !!PublicKey,
            supabaseAdmin: !!supabaseAdmin,
            isSupabaseConfigured: !!isSupabaseConfigured
          }
        },
        { status: 500 }
      );
    }
    
    const { walletAddress } = await params;
    console.log('🔍 Wallet address:', walletAddress);
    
    const body = await request.json();
    console.log('🔍 Request body:', JSON.stringify(body, null, 2));
    
    if (!walletAddress) {
      console.log('❌ No wallet address provided');
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const {
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      twitterHandle,
      website,
      discord,
      telegram,
      github,
      isAnonymous
    } = body;

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Store profile data in database (temporary solution)
    // TODO: Implement full blockchain storage
    console.log('🔍 Supabase configured:', isSupabaseConfigured);
    console.log('🔍 Supabase admin available:', !!supabaseAdmin);
    
    if (isSupabaseConfigured && supabaseAdmin) {
      const profileData = {
        wallet_address: walletAddress,
        username: username.toLowerCase(),
        display_name: displayName || '',
        bio: bio || '',
        avatar_url: avatarUrl || '',
        banner_url: bannerUrl || '',
        twitter_handle: twitterHandle || '',
        twitter_verified: false, // Will be updated when social verification is completed
        website: website || '',
        discord: discord || '',
        telegram: telegram || '',
        github: github || '',
        is_anonymous: isAnonymous || false,
        updated_at: new Date().toISOString()
      };

      // Use upsert to handle both create and update in one operation
      console.log('🔍 Upserting profile for wallet:', walletAddress);
      const { data: result, error: upsertError } = await ((supabaseAdmin as any)
        .from('user_profiles'))
        .upsert(profileData, { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        })
        .select('*')
        .single();

      if (upsertError) {
        console.error('❌ Error upserting profile:', upsertError);
        return NextResponse.json(
          { error: 'Failed to save profile. Please run database setup first.' },
          { status: 500 }
        );
      }

      console.log('✅ Profile upserted successfully');

      if (!result) {
        console.error('❌ No profile data returned after save operation');
        return NextResponse.json(
          { error: 'Failed to save profile: No data returned' },
          { status: 500 }
        );
      }

      // Convert to blockchain profile format
      const blockchainProfile: any = {
        wallet: new PublicKey(result.wallet_address),
        username: result.username,
        displayName: result.display_name,
        bio: result.bio,
        avatarUrl: result.avatar_url,
        bannerUrl: result.banner_url,
        twitterHandle: result.twitter_handle,
        twitterVerified: result.twitter_verified,
        website: result.website,
        discord: result.discord,
        telegram: result.telegram,
        github: result.github,
        createdAt: new Date(result.created_at).getTime(),
        updatedAt: new Date(result.updated_at).getTime(),
        isAnonymous: result.is_anonymous
      };

      console.log('✅ Returning success response with profile data');
      return NextResponse.json({
        success: true,
        message: 'Profile saved successfully',
        profile: blockchainProfile,
      });
    } else {
      console.log('⚠️ Supabase not configured or admin client not available.');
      return NextResponse.json(
        { error: 'Database not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in POST /api/blockchain-profiles/[walletAddress]:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update specific profile fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const body = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const updates = body.updates || {};
    
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await ((supabaseAdmin as any)
        .from('user_profiles'))
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        profile: data
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated (database not configured)'
    });

  } catch (error) {
    console.error('Error in PUT /api/blockchain-profiles/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
