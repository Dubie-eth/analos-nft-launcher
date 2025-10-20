/**
 * BLOCKCHAIN PROFILE API
 * Manages user profiles stored on the Analos blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { BlockchainProfile, BlockchainProfileService } from '@/lib/blockchain-profile-service';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';

// Initialize connection and program
const connection = new Connection(ANALOS_RPC_URL);

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
        const blockchainProfile: BlockchainProfile = {
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
    const { walletAddress } = await params;
    const body = await request.json();
    
    if (!walletAddress) {
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

    // For now, we'll store in database as a fallback
    // In a full implementation, this would store on the blockchain
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

      // Check if profile exists
      if (supabaseAdmin) {
        const { data: existingProfile } = await ((supabaseAdmin as any)
          .from('user_profiles'))
          .select('id')
          .eq('wallet_address', walletAddress)
          .single();

        let result;
        if (existingProfile) {
          // Update existing profile
          const { data, error } = await ((supabaseAdmin as any)
            .from('user_profiles'))
            .update(profileData)
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
          result = data;
        } else {
          // Create new profile
          const { data, error } = await ((supabaseAdmin as any)
            .from('user_profiles'))
            .insert([{
              ...profileData,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            console.error('Error creating profile:', error);
            return NextResponse.json(
              { error: 'Failed to create profile' },
              { status: 500 }
            );
          }
          result = data;
        }

        // Convert to blockchain profile format
        const blockchainProfile: BlockchainProfile = {
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

        return NextResponse.json({
          success: true,
          message: 'Profile saved successfully',
          profile: blockchainProfile
        });
      }
    } else {
      // If database not configured, return mock success
      return NextResponse.json({
      success: true,
      message: 'Profile saved (database not configured)',
      profile: {
        wallet: new PublicKey(walletAddress),
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl,
        twitterHandle,
        twitterVerified: false,
        website,
        discord,
        telegram,
        github,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isAnonymous
      }
    });
    }

  } catch (error) {
    console.error('Error in POST /api/blockchain-profiles/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
