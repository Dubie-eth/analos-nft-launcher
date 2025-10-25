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
    // @ts-ignore - Supabase generated types don't include Los Bros columns yet
    const { data, error } = await (supabase
      .from('profile_nfts') as any)
      .insert({
        mint_address: mintAddress,
        wallet_address: walletAddress,
        username: `losbros_${losBrosTokenId}`, // Generate placeholder username
        display_name: `Los Bros #${losBrosTokenId}`,
        bio: `Los Bros #${losBrosTokenId} - ${losBrosRarity || 'COMMON'} rarity`,
        referral_code: `LOSBROS${losBrosTokenId.toString().slice(0, 1)}`, // Generate referral code
        los_bros_token_id: losBrosTokenId,
        los_bros_rarity: losBrosRarity || 'COMMON',
        los_bros_rarity_score: rarityScore || 0,
        los_bros_traits: traits || [],
        transaction_signature: signature,
        metadata_uri: metadataUri,
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
      console.error('❌ Error details:', error);
      
      // Return success anyway - NFT was minted on-chain successfully
      // Database recording is just for display purposes
      return NextResponse.json({
        success: true,
        message: 'Los Bros NFT minted on-chain (database recording failed)',
        recorded: false,
        dbError: error.message
      });
    }

    // Update allocation count using RPC function (optional - don't fail if it doesn't work)
    if (losBrosTier) {
      try {
        // @ts-ignore - Supabase RPC function
        const { error: allocError } = await (supabase as any).rpc('record_los_bros_mint', {
          p_wallet_address: walletAddress,
          p_mint_address: mintAddress,
          p_tier: losBrosTier,
          p_lol_balance: lolBalanceAtMint || 0,
          p_final_price: losBrosFinalPrice || 0,
          p_discount: losBrosDiscountPercent || 0,
          p_platform_fee: losBrosPlatformFee || 0
        });

        if (allocError) {
          console.warn('⚠️ Allocation update failed (non-critical):', allocError);
        } else {
          console.log(`✅ Los Bros allocation updated for ${losBrosTier} tier`);
        }
      } catch (allocUpdateError: any) {
        console.warn('⚠️ Allocation update exception (non-critical):', allocUpdateError?.message);
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

