/**
 * PROFILE NFT MINT COUNTER API
 * Track and manage the mint counter for profile NFTs
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 GET /api/profile-nft/mint-counter - Starting request');
    console.log('🔍 Supabase configured:', isSupabaseConfigured);
    console.log('🔍 Supabase admin available:', !!supabaseAdmin);
    
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.log('⚠️ Database not configured, returning mock counter');
      // Return mock counter if database not configured
      return NextResponse.json({
        success: true,
        currentMintNumber: 1,
        totalMinted: 0,
        nextMintNumber: 1
      });
    }

    // Get current mint counter from database
    const { data: counterData, error: counterError } = await (supabaseAdmin as any)
      .from('profile_nft_mint_counter')
      .select('*')
      .single();

    if (counterError && counterError.code !== 'PGRST116') {
      console.error('Error fetching mint counter:', counterError);
      return NextResponse.json(
        { error: 'Failed to fetch mint counter' },
        { status: 500 }
      );
    }

    const currentCounter = counterData?.current_mint_number || 0;
    const nextMintNumber = currentCounter + 1;

    return NextResponse.json({
      success: true,
      currentMintNumber: currentCounter,
      totalMinted: currentCounter,
      nextMintNumber
    });

  } catch (error) {
    console.error('Error in GET /api/profile-nft/mint-counter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { increment } = await request.json();

    if (!isSupabaseConfigured || !supabaseAdmin) {
      // Return mock increment if database not configured
      return NextResponse.json({
        success: true,
        newMintNumber: 1,
        message: 'Mock increment successful'
      });
    }

    // Get current counter
    const { data: counterData, error: counterError } = await (supabaseAdmin as any)
      .from('profile_nft_mint_counter')
      .select('*')
      .single();

    let newMintNumber: number;

    if (counterError && counterError.code === 'PGRST116') {
      // No counter exists, create it
      newMintNumber = 1;
      const { error: insertError } = await (supabaseAdmin as any)
        .from('profile_nft_mint_counter')
        .insert([{
          current_mint_number: newMintNumber,
          total_minted: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error creating mint counter:', insertError);
        return NextResponse.json(
          { error: 'Failed to create mint counter' },
          { status: 500 }
        );
      }
    } else if (counterError) {
      console.error('Error fetching mint counter:', counterError);
      return NextResponse.json(
        { error: 'Failed to fetch mint counter' },
        { status: 500 }
      );
    } else {
      // Increment existing counter
      newMintNumber = (counterData.current_mint_number || 0) + 1;
      const { error: updateError } = await (supabaseAdmin as any)
        .from('profile_nft_mint_counter')
        .update({
          current_mint_number: newMintNumber,
          total_minted: newMintNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', counterData.id);

      if (updateError) {
        console.error('Error updating mint counter:', updateError);
        return NextResponse.json(
          { error: 'Failed to update mint counter' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      newMintNumber,
      totalMinted: newMintNumber,
      message: 'Mint counter incremented successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/profile-nft/mint-counter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
