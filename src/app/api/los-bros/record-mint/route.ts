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
      losBrosTokenId,
      losBrosRarity,
      rarityScore,
      traits,
      signature,
      metadataUri,
      losBrosTier,
      losBrosDiscountPercent,
      losBrosFinalPrice,
      losBrosPlatformFee,
      lolBalanceAtMint
    } = body;

    console.log('📝 Los Bros mint record request:', body);

    if (!mintAddress || !walletAddress || !losBrosTokenId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: mintAddress, walletAddress, losBrosTokenId'
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

    // Insert into profile_nfts table (Los Bros NFTs are stored here)
    const { data, error } = await supabase
      .from('profile_nfts')
      .insert({
        mint_address: mintAddress,
        wallet_address: walletAddress,
        los_bros_token_id: losBrosTokenId,
        los_bros_rarity: losBrosRarity || 'COMMON',
        los_bros_rarity_score: rarityScore || 0,
        los_bros_traits: traits || [],
        transaction_signature: signature,
        metadata_uri: metadataUri,
        image_url: `/api/los-bros/generate-image?tokenId=${losBrosTokenId}`,
        // Tier tracking
        los_bros_tier: losBrosTier || 'PUBLIC',
        los_bros_discount_percent: losBrosDiscountPercent || 0,
        los_bros_final_price: losBrosFinalPrice || 0,
        los_bros_platform_fee: losBrosPlatformFee || 0,
        lol_balance_at_mint: lolBalanceAtMint || 0,
        // Timestamps
        created_at: new Date().toISOString()
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

    // Update allocation count using RPC function
    if (losBrosTier) {
      try {
        // @ts-ignore - Supabase RPC function
        const { error: allocError } = await supabase.rpc('record_los_bros_mint', {
          p_wallet_address: walletAddress,
          p_mint_address: mintAddress,
          p_tier: losBrosTier,
          p_lol_balance: lolBalanceAtMint || 0,
          p_final_price: losBrosFinalPrice || 0,
          p_discount: losBrosDiscountPercent || 0,
          p_platform_fee: losBrosPlatformFee || 0
        });

        if (allocError) {
          console.error('⚠️ Error updating allocation count:', allocError);
        } else {
          console.log(`✅ Los Bros allocation updated for ${losBrosTier} tier`);
        }
      } catch (allocUpdateError) {
        console.error('⚠️ Exception updating allocation:', allocUpdateError);
      }
    }

    console.log(`✅ Los Bros NFT mint recorded: ${losBrosTokenId} - ${losBrosRarity} (${mintAddress})`);

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

