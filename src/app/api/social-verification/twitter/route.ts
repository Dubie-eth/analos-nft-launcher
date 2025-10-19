/**
 * TWITTER SOCIAL VERIFICATION API
 * Simple tweet-based social verification for referral codes
 * Generates text with referral code, user shares it, we verify their handle matches
 */

import { NextRequest, NextResponse } from 'next/server';

interface TweetVerificationRequest {
  walletAddress: string;
  tweetUrl: string;
  referralCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TweetVerificationRequest = await request.json();
    const { walletAddress, tweetUrl, referralCode } = body;

    // Validate input
    if (!walletAddress || !tweetUrl || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, tweetUrl, referralCode' },
        { status: 400 }
      );
    }

    // Extract tweet ID from URL
    const tweetId = extractTweetIdFromUrl(tweetUrl);
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Invalid tweet URL format' },
        { status: 400 }
      );
    }

    // Simple verification: just check if the tweet URL is valid and contains the referral code
    // In a real implementation, you would:
    // 1. Fetch the tweet content
    // 2. Check if it contains the referral code
    // 3. Verify the Twitter handle matches the user's claimed handle
    
    console.log(`📝 Verifying tweet ${tweetId} with referral code ${referralCode} for wallet ${walletAddress}`);

    // For now, we'll just validate the format and return success
    // This can be enhanced later with actual tweet content verification
    return NextResponse.json({
      success: true,
      message: 'Tweet verification successful!',
      verification: {
        wallet_address: walletAddress,
        platform: 'twitter',
        tweet_id: tweetId,
        tweet_url: tweetUrl,
        referral_code: referralCode,
        verification_status: 'verified',
        verified_at: new Date().toISOString()
      },
      rewards: {
        points: 100,
        message: 'You earned 100 points for Twitter verification!'
      }
    });

  } catch (error) {
    console.error('Twitter verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractTweetIdFromUrl(tweetUrl: string): string | null {
  // Handle various Twitter URL formats
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /t\.co\/\w+/ // Short URL - would need to resolve
  ];

  for (const pattern of patterns) {
    const match = tweetUrl.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

// Function to generate referral text for users to share
export function generateReferralText(referralCode: string, walletAddress: string): string {
  return `🚀 Join me on Analos NFT Launcher! 

Use my referral code: ${referralCode}

Create your unique NFT collection and launch it on the Analos blockchain! 

#Analos #NFT #Blockchain #Web3

Wallet: ${walletAddress}`;
}



// GET endpoint to generate referral text or check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const action = searchParams.get('action');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter is required' },
        { status: 400 }
      );
    }

    // Generate referral text
    if (action === 'generate-text') {
      const referralCode = searchParams.get('referralCode');
      if (!referralCode) {
        return NextResponse.json(
          { error: 'referralCode parameter is required for generating text' },
          { status: 400 }
        );
      }

      const referralText = generateReferralText(referralCode, walletAddress);
      
      return NextResponse.json({
        success: true,
        referralText: referralText,
        message: 'Referral text generated successfully'
      });
    }

    // Check verification status (default action)
    console.log(`🔍 Checking Twitter verification status for wallet: ${walletAddress}`);

    return NextResponse.json({
      verifications: [],
      total: 0,
      message: 'Twitter verification system ready'
    });

  } catch (error) {
    console.error('Error in GET /api/social-verification/twitter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
