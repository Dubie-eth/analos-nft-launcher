import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/los-bros/check-eligibility
 * Check user's tier eligibility and allocation availability
 */
export async function POST(request: NextRequest) {
  // Lazy initialize Supabase client at runtime (not build time)
  const supabase = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking Los Bros eligibility for:', walletAddress);

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Check $LOL token balance
    const { tokenGatingService } = await import('@/lib/token-gating-service');
    const tokenCheck = await tokenGatingService.checkEligibility(walletAddress);

    // Check holding period (anti-bot measure)
    let holdingPeriodHours = 0;
    try {
      const holdingResponse = await fetch(`${request.nextUrl.origin}/api/los-bros/check-holding-period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (holdingResponse.ok) {
        const holdingData = await holdingResponse.json();
        holdingPeriodHours = holdingData.holdingPeriodHours || 0;
        console.log(`⏰ Token holding period: ${holdingPeriodHours.toFixed(1)} hours`);
      }
    } catch (error) {
      console.warn('⚠️ Could not check holding period:', error);
    }

    // Get current mint count for dynamic pricing
    const { data: mintCountData } = await supabase
      .from('profile_nfts')
      .select('mint_address', { count: 'exact', head: true });
    
    const currentMintCount = mintCountData || 0;

    // Calculate tier based on holdings, holding period, and current mint count
    const { calculateLosBrosPricing } = await import('@/config/los-bros-pricing');
    const pricing = calculateLosBrosPricing(
      walletAddress, 
      tokenCheck.tokenBalance || 0,
      holdingPeriodHours,
      currentMintCount as number
    );

    // Check allocation availability for this tier
    const { data: allocation, error: allocError } = await supabase
      .rpc('check_los_bros_allocation', {
        p_tier: pricing.tier,
        p_wallet_address: walletAddress,
      });

    if (allocError) {
      console.error('❌ Error checking allocation:', allocError);
    }

    const allocationData = allocation?.[0] || null;

    // Check if user already minted
    const { data: existingMints, error: mintError } = await supabase
      .from('profile_nfts')
      .select('mint_address, los_bros_tier, mint_date')
      .eq('wallet_address', walletAddress.toLowerCase())
      .not('los_bros_token_id', 'is', null);

    if (mintError) {
      console.warn('⚠️ Error checking existing mints:', mintError);
    }

    const hasMinted = (existingMints || []).length > 0;
    const mintCount = (existingMints || []).length;

    // Determine eligibility - MUST meet holding period for discounts/free mints
    const isEligible = 
      allocationData?.is_available && 
      !hasMinted &&
      pricing.holdingPeriodMet && // Anti-bot: Must hold tokens for 72 hours
      (pricing.tier === 'TEAM' || 
       pricing.tier === 'PUBLIC' || 
       tokenCheck.tokenBalance >= (allocationData?.requires_lol || 0));

    const response = {
      success: true,
      eligible: isEligible,
      tier: pricing.tier,
      pricing: {
        basePrice: pricing.basePrice,
        discount: pricing.discount,
        finalPrice: pricing.finalPrice,
        platformFee: pricing.platformFee,
        isFree: pricing.isFree,
        message: pricing.message,
        holdingPeriodMet: pricing.holdingPeriodMet,
        holdingPeriodHours: pricing.holdingPeriodHours,
      },
      allocation: allocationData ? {
        allocated: allocationData.allocated,
        minted: allocationData.minted,
        remaining: allocationData.remaining,
        isAvailable: allocationData.is_available,
        requiresLOL: allocationData.requires_lol,
      } : null,
      tokenBalance: tokenCheck.tokenBalance,
      hasMinted,
      mintCount,
      existingMints: existingMints || [],
      message: !isEligible ? (
        hasMinted ? '❌ You have already minted a Los Bro NFT' :
        !pricing.holdingPeriodMet ? `⏰ Must hold $LOL for 72 hours (currently ${pricing.holdingPeriodHours.toFixed(1)}h)` :
        !allocationData?.is_available ? `❌ ${pricing.tier} tier allocation is full or inactive` :
        tokenCheck.tokenBalance < (allocationData?.requires_lol || 0) ? 
          `❌ Insufficient $LOL tokens (need ${(allocationData?.requires_lol || 0).toLocaleString()})` :
        '❌ Not eligible for this tier'
      ) : `✅ Eligible for ${pricing.tier} tier mint!`,
    };

    console.log('✅ Eligibility check complete:', response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error checking eligibility:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        eligible: false,
        message: '❌ Error checking eligibility',
      },
      { status: 500 }
    );
  }
}

