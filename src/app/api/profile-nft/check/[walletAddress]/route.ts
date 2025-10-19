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
    const { walletAddress } = await params;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        hasNFT: false,
        nft: null,
        _warning: 'Database not configured - assuming no existing NFT'
      });
    }

    // Check if user has a profile NFT
    const { data: nft, error } = await (supabaseAdmin
      .from('profile_nfts') as any)
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

  } catch (error) {
    console.error('Error in GET /api/profile-nft/check/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
