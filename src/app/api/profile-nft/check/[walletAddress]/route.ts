/**
 * PROFILE NFT CHECK API
 * Checks if user already has a profile NFT
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    console.log('🔍 GET /api/profile-nft/check/[walletAddress] - Starting request');
    const { walletAddress } = await params;
    console.log('🔍 Wallet address:', walletAddress);
    
    if (!walletAddress) {
      console.log('❌ No wallet address provided');
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Supabase configured:', isSupabaseConfigured);
    console.log('🔍 Supabase admin available:', !!supabaseAdmin);

    // For now, always return mock response to avoid database issues
    console.log('⚠️ Using mock response for testing');
    return NextResponse.json({
      hasNFT: false,
      nft: null,
      message: 'Mock response - database integration pending'
    });

    // TODO: Re-enable database integration once tables are created
    /*
    if (!isSupabaseConfigured) {
      console.log('⚠️ Database not configured, returning mock response');
      return NextResponse.json({
        hasNFT: false,
        nft: null,
        _warning: 'Database not configured - assuming no existing NFT'
      });
    }

    if (!supabaseAdmin) {
      console.log('⚠️ Supabase admin not available, returning false');
      return NextResponse.json({ hasProfileNFT: false });
    }

    // Check if user has a profile NFT
    const { data: nft, error } = await ((supabaseAdmin as any)
      .from('profile_nfts'))
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking profile NFT:', error);
      return NextResponse.json(
        { error: 'Failed to check profile NFT' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasNFT: !!nft,
      nft: nft || null
    });
    */

  } catch (error) {
    console.error('Error in GET /api/profile-nft/check/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
