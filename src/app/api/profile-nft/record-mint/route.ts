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
      telegramHandle
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

