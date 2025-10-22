/**
 * MINT COUNT API
 * Returns the current number of Profile NFTs minted
 * This is used to show the next mint number in the preview
 */

import { NextResponse } from 'next/server';

// In-memory counter (in production, this would be stored in database)
let currentMintCount = 0;

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      count: currentMintCount,
      nextMintNumber: currentMintCount + 1,
      message: `Current mint count: ${currentMintCount}, next mint will be #${currentMintCount + 1}`
    });
  } catch (error) {
    console.error('Error fetching mint count:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch mint count'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Increment mint count (called after successful mint)
    currentMintCount += 1;
    
    return NextResponse.json({
      success: true,
      count: currentMintCount,
      message: `Mint count incremented to ${currentMintCount}`
    });
  } catch (error) {
    console.error('Error incrementing mint count:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to increment mint count'
    }, { status: 500 });
  }
}
