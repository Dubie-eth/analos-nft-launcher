/**
 * Record Los Bros NFT Mint API
 * Stores minted Los Bros NFTs in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mintAddress,
      walletAddress,
      tokenId,
      rarityTier,
      rarityScore,
      traits,
      signature,
      imageUrl,
      metadataUri
    } = body;

    if (!mintAddress || !walletAddress || !tokenId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: mintAddress, walletAddress, tokenId'
      }, { status: 400 });
    }

    // Record in database if configured
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, skipping database record');
      return NextResponse.json({
        success: true,
        message: 'Database not configured - mint not recorded',
        recorded: false
      });
    }

    const supabase = getSupabaseAdmin();

    // Insert Los Bros NFT record
    const { data, error } = await (supabase
      .from('los_bros_nfts') as any)
      .insert({
        mint_address: mintAddress,
        wallet_address: walletAddress,
        token_id: tokenId,
        rarity_tier: rarityTier || 'COMMON',
        rarity_score: rarityScore || 0,
        traits: traits || [],
        transaction_signature: signature,
        image_url: imageUrl,
        metadata_uri: metadataUri,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Error recording Los Bros NFT mint:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to record mint in database',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Los Bros NFT mint recorded: ${tokenId} - ${rarityTier} (${mintAddress})`);

    return NextResponse.json({
      success: true,
      message: 'Los Bros NFT mint recorded successfully',
      recorded: true,
      data
    });

  } catch (error) {
    console.error('❌ Error in los-bros/record-mint API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

