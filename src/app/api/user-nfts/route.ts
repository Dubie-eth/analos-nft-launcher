/**
 * UNIFIED USER NFTs API (Query Param Version)
 * Combines Profile NFTs and Los Bros NFTs from database
 * Uses ?wallet= query param instead of dynamic route for Vercel compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 User NFTs API called');
    
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    console.log('🔍 Wallet from query:', wallet);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required (use ?wallet=ADDRESS)' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching all NFTs for wallet:', wallet);

    // Initialize Supabase at runtime (lazy initialization)
    console.log('🔍 Initializing Supabase...');
    const supabase = getSupabaseAdmin();
    console.log('✅ Supabase initialized');

    // Fetch ALL NFTs from database (Profile NFTs + Los Bros)
    const { data: allNFTs, error } = await supabase
      .from('profile_nfts')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching NFTs:', error);
      return NextResponse.json({
        success: true,
        nfts: [],
        profileNFTs: [],
        losBrosNFTs: [],
        total: 0
      });
    }

    console.log(`📊 Found ${allNFTs?.length || 0} total NFTs in database`);

    // Separate Profile NFTs from Los Bros NFTs
    const profileNFTs = (allNFTs || [])
      .filter((nft: any) => !nft.los_bros_token_id)
      .map((nft: any) => ({
        mint: nft.mint_address,
        name: `@${nft.username}`,
        image: `/api/profile-nft/generate-image?username=${nft.username}`,
        type: 'profile',
        username: nft.username,
        displayName: nft.display_name,
        tier: nft.tier,
        referralCode: nft.referral_code,
        createdAt: nft.created_at,
        owner: nft.wallet_address
      }));

    const losBrosNFTs = (allNFTs || [])
      .filter((nft: any) => nft.los_bros_token_id)
      .map((nft: any) => ({
        mint: nft.mint_address,
        name: `Los Bros #${nft.los_bros_token_id}`,
        image: `/api/los-bros/generate-image?tokenId=${nft.los_bros_token_id}`,
        type: 'losbros',
        tokenId: nft.los_bros_token_id,
        rarity: nft.los_bros_rarity,
        rarityScore: nft.los_bros_rarity_score,
        tier: nft.los_bros_tier,
        traits: nft.los_bros_traits,
        createdAt: nft.created_at,
        owner: nft.wallet_address
      }));

    const combinedNFTs = [...profileNFTs, ...losBrosNFTs];

    console.log(`✅ Returning ${combinedNFTs.length} NFTs (${profileNFTs.length} Profile + ${losBrosNFTs.length} Los Bros)`);

    return NextResponse.json({
      success: true,
      nfts: combinedNFTs,
      profileNFTs,
      losBrosNFTs,
      total: combinedNFTs.length
    });

  } catch (error: any) {
    console.error('❌ Error in unified user NFTs API:', error);
    console.error('❌ Error details:', error?.message, error?.stack);
    return NextResponse.json({
      success: true,
      nfts: [],
      profileNFTs: [],
      losBrosNFTs: [],
      total: 0,
      error: error?.message || 'Unknown error'
    });
  }
}

