/**
 * Profile NFT Mint Count API
 * Returns total minted count and remaining supply
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

const TOTAL_SUPPLY = 2222; // Los Bros collection size

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, returning mock count');
      return NextResponse.json({
        success: true,
        minted: 0,
        remaining: TOTAL_SUPPLY,
        total: TOTAL_SUPPLY,
        percentage: 0
      });
    }

    const supabase = getSupabaseAdmin();

    // Get count of minted Profile NFTs
    const { count, error } = await (supabase
      .from('profile_nfts') as any)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error getting mint count:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to get mint count',
        details: error.message
      }, { status: 500 });
    }

    const minted = count || 0;
    const remaining = TOTAL_SUPPLY - minted;
    const percentage = ((minted / TOTAL_SUPPLY) * 100).toFixed(2);

    console.log(`📊 Profile NFT Mint Count: ${minted}/${TOTAL_SUPPLY} (${percentage}%)`);

    return NextResponse.json({
      success: true,
      minted,
      remaining,
      total: TOTAL_SUPPLY,
      percentage: parseFloat(percentage)
    });

  } catch (error) {
    console.error('❌ Error in mint-count API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
