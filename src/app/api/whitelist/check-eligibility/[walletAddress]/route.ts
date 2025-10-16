/**
 * WHITELIST ELIGIBILITY API ROUTE
 * Check if a wallet is eligible for whitelist minting in real-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkMintEligibility } from '@/lib/anal-token-verification';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.walletAddress;

    // In production, get current mint count from smart contract or database
    // For now, we'll use a mock value - you'll replace this with actual on-chain data
    const currentMintCount = 0; // TODO: Get from smart contract
    const userAlreadyMintedWhitelist = false; // TODO: Check from database
    const whitelistSupply = 100;

    const eligibility = await checkMintEligibility(
      walletAddress,
      currentMintCount,
      userAlreadyMintedWhitelist,
      whitelistSupply
    );

    return NextResponse.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Error checking whitelist eligibility:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check eligibility'
      },
      { status: 500 }
    );
  }
}
