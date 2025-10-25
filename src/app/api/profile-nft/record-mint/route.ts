/**
 * Record Profile NFT Mint API
 * Stores minted Profile NFTs in database for explorer/marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mintAddress,
      walletAddress,
      username,
      displayName,
      tier,
      price,
      isFree,
      signature,
      imageUrl,
      metadataUri,
      losBrosTokenId,
      losBrosRarity,
      discordHandle,
      telegramHandle,
      // Los Bros tier tracking
      losBrosTier,
      losBrosDiscountPercent,
      losBrosFinalPrice,
      losBrosPlatformFee,
      lolBalanceAtMint
    } = body;

    if (!mintAddress || !walletAddress || !username) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: mintAddress, walletAddress, username'
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

    // CRITICAL: Check if username already exists (double-check before insert)
    const { data: existingUsername } = await (supabase
      .from('profile_nfts') as any)
      .select('username, wallet_address, mint_address')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (existingUsername) {
      console.error(`❌ Username @${username} already exists! Owned by ${existingUsername.wallet_address}`);
      return NextResponse.json({
        success: false,
        error: 'Username already taken',
        details: `Username @${username} is already registered to ${existingUsername.wallet_address}`
      }, { status: 409 });
    }

    // Get current mint count to determine mint number
    const { count } = await (supabase
      .from('profile_nfts') as any)
      .select('*', { count: 'exact', head: true });

    const mintNumber = (count || 0) + 1;

    // Insert Profile NFT record
    const { data, error } = await (supabase
      .from('profile_nfts') as any)
      .insert({
        mint_address: mintAddress,
        wallet_address: walletAddress,
        username: username.toLowerCase().trim(),
        display_name: displayName || username,
        tier: tier || 'basic',
        mint_price: price || 0,
        is_free: isFree || false,
        mint_number: mintNumber,
        transaction_signature: signature,
        image_url: imageUrl,
        metadata_uri: metadataUri,
        los_bros_token_id: losBrosTokenId || null,
        los_bros_rarity: losBrosRarity || null,
        discord_handle: discordHandle || null,
        telegram_handle: telegramHandle || null,
        // Los Bros tier tracking
        los_bros_tier: losBrosTier || null,
        los_bros_discount_percent: losBrosDiscountPercent || 0,
        los_bros_final_price: losBrosFinalPrice || 0,
        los_bros_platform_fee: losBrosPlatformFee || 0,
        lol_balance_at_mint: lolBalanceAtMint || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Error recording Profile NFT mint:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to record mint in database',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Profile NFT mint recorded: #${mintNumber} - @${username} (${mintAddress})`);

    // If Los Bros mint, update allocation count
    if (losBrosTier && losBrosTokenId) {
      try {
        const { error: allocError } = await supabase
          .rpc('record_los_bros_mint', {
            p_wallet_address: walletAddress,
            p_mint_address: mintAddress,
            p_tier: losBrosTier,
            p_lol_balance: lolBalanceAtMint || 0,
            p_final_price: losBrosFinalPrice || 0,
            p_discount: losBrosDiscountPercent || 0,
            p_platform_fee: losBrosPlatformFee || 0
          } as any);

        if (allocError) {
          console.error('⚠️ Error updating allocation count:', allocError);
          // Don't fail the whole request - mint is already recorded
        } else {
          console.log(`✅ Los Bros allocation updated for ${losBrosTier} tier`);
        }
      } catch (allocUpdateError) {
        console.error('⚠️ Exception updating allocation:', allocUpdateError);
        // Don't fail - mint is recorded
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile NFT mint recorded successfully',
      recorded: true,
      mintNumber,
      data
    });

  } catch (error) {
    console.error('❌ Error in record-mint API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

