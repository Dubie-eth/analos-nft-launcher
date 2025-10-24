/**
 * $LOL Token Holder Count API
 * Returns count of wallets holding 1M+ $LOL tokens (whitelist eligible)
 */

import { NextRequest, NextResponse } from 'next/server';
import { tokenHolderCache } from '@/lib/token-holder-cache';

const WHITELIST_THRESHOLD = 1_000_000; // 1M $LOL for free mint

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Counting wallets with 1M+ $LOL tokens...');

    // Get all token holders from cache
    const allHolders = await tokenHolderCache.getAllHolders();
    
    if (!allHolders || allHolders.length === 0) {
      console.warn('⚠️ Token holder cache is empty or unavailable');
      return NextResponse.json({
        success: true,
        whitelistEligible: 0,
        totalHolders: 0,
        threshold: WHITELIST_THRESHOLD,
        cached: false,
        message: 'Token holder data not yet loaded'
      });
    }

    // Count holders with >= 1M $LOL
    const whitelistEligible = allHolders.filter(holder => 
      holder.balance >= WHITELIST_THRESHOLD
    ).length;

    const totalHolders = allHolders.length;
    const percentage = ((whitelistEligible / totalHolders) * 100).toFixed(2);

    console.log(`✅ Whitelist eligible: ${whitelistEligible}/${totalHolders} wallets (${percentage}%)`);

    return NextResponse.json({
      success: true,
      whitelistEligible,
      totalHolders,
      threshold: WHITELIST_THRESHOLD,
      percentage: parseFloat(percentage),
      cached: true,
      message: `${whitelistEligible} wallets eligible for free mint`
    });

  } catch (error) {
    console.error('❌ Error in holder-count API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

