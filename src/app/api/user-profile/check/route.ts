/**
 * User Profile Check API
 * Fetches user profile data from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        profile: null,
        message: 'Database not configured'
      });
    }

    const supabase = getSupabaseAdmin();

    // Fetch profile NFT for this wallet
    const { data: profileNFT, error } = await (supabase
      .from('profile_nfts') as any)
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error fetching profile:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profile'
      }, { status: 500 });
    }

    if (!profileNFT) {
      return NextResponse.json({
        success: true,
        profile: null,
        message: 'No profile found for this wallet'
      });
    }

    // Transform profile data
    const profile = {
      id: profileNFT.id,
      walletAddress: profileNFT.wallet_address,
      username: profileNFT.username,
      displayName: profileNFT.display_name,
      tier: profileNFT.tier,
      mintAddress: profileNFT.mint_address,
      mintNumber: profileNFT.mint_number,
      imageUrl: `/api/profile-nft/generate-image?username=${encodeURIComponent(profileNFT.username)}&tier=${profileNFT.tier || 'basic'}&displayName=${encodeURIComponent(profileNFT.display_name || profileNFT.username)}&referralCode=${profileNFT.username.toUpperCase().slice(0, 8)}&losBrosTokenId=${profileNFT.los_bros_token_id || ''}&discordHandle=${encodeURIComponent(profileNFT.discord_handle || '')}&telegramHandle=${encodeURIComponent(profileNFT.telegram_handle || '')}`,
      metadataUri: profileNFT.metadata_uri,
      losBrosTokenId: profileNFT.los_bros_token_id,
      losBrosRarity: profileNFT.los_bros_rarity,
      discordHandle: profileNFT.discord_handle,
      telegramHandle: profileNFT.telegram_handle,
      createdAt: profileNFT.created_at,
      updatedAt: profileNFT.updated_at
    };

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error('❌ Error in profile check:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
