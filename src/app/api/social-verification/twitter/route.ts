/**
 * TWITTER SOCIAL VERIFICATION API
 * Handles tweet-based social verification for referral codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import { twitterApiService } from '@/lib/twitter-api-service';

interface TweetVerificationRequest {
  walletAddress: string;
  tweetUrl: string;
  referralCode: string;
}

interface TwitterApiResponse {
  data?: {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    public_metrics: {
      retweet_count: number;
      like_count: number;
      reply_count: number;
    };
  };
  includes?: {
    users: Array<{
      id: string;
      username: string;
      name: string;
      verified: boolean;
      public_metrics: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
      };
    }>;
  };
  errors?: Array<{
    detail: string;
    title: string;
  }>;
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

    // Check if verification already exists
    if (isSupabaseConfigured) {
      const { data: existingVerification } = await supabaseAdmin
        .from('social_verifications')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('platform', 'twitter')
        .eq('tweet_id', tweetId)
        .single();

      if (existingVerification) {
        return NextResponse.json({
          success: false,
          message: 'This tweet has already been verified for this wallet',
          verification: existingVerification
        });
      }
    }

    // Verify tweet content using Twitter API
    const verificationResult = await twitterApiService.verifyTweetContent(tweetId, referralCode);

    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        message: verificationResult.message,
        details: verificationResult.details
      });
    }

    // Save verification to database
    if (isSupabaseConfigured) {
      const { data: verification, error } = await supabaseAdmin
        .from('social_verifications')
        .insert({
          wallet_address: walletAddress,
          platform: 'twitter',
          tweet_id: tweetId,
          tweet_url: tweetUrl,
          referral_code: referralCode,
          username: verificationResult.userData?.username || 'pending_verification',
          follower_count: verificationResult.userData?.public_metrics.followers_count || 0,
          verification_status: 'pending',
          verified_at: null,
          metadata: {
            tweet_text: verificationResult.tweetData?.text,
            author_id: verificationResult.userData?.id,
            engagement_metrics: verificationResult.tweetData?.public_metrics,
            verification_details: verificationResult.details
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving verification:', error);
        return NextResponse.json(
          { error: 'Failed to save verification' },
          { status: 500 }
        );
      }

      // Don't award points yet - admin needs to verify first
      // await awardVerificationRewards(walletAddress, 'twitter');

      return NextResponse.json({
        success: true,
        message: 'Tweet submitted for verification! Admin will review and approve within 24 hours.',
        verification: verification,
        note: 'Your tweet has been submitted. You will receive 100 points once admin verifies your tweet.'
      });
    } else {
      // Fallback for when database is not configured
      return NextResponse.json({
        success: true,
        message: 'Tweet verification successful! (Database not configured)',
        verification: {
          wallet_address: walletAddress,
          platform: 'twitter',
          tweet_id: tweetId,
          verification_status: 'verified'
        },
        rewards: {
          points: 100,
          message: 'You earned 100 points for Twitter verification!'
        }
      });
    }

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


async function awardVerificationRewards(walletAddress: string, platform: string): Promise<void> {
  try {
    if (!isSupabaseConfigured) return;

    // Award points for social verification
    const { error } = await supabaseAdmin
      .from('user_activities')
      .insert({
        wallet_address: walletAddress,
        activity_type: 'social_verification',
        activity_data: {
          platform: platform,
          points_awarded: 100,
          timestamp: new Date().toISOString()
        },
        points_earned: 100
      });

    if (error) {
      console.error('Error awarding verification rewards:', error);
    }
  } catch (error) {
    console.error('Error in awardVerificationRewards:', error);
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        verifications: [],
        message: 'Database not configured'
      });
    }

    const { data: verifications, error } = await supabaseAdmin
      .from('social_verifications')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('platform', 'twitter')
      .order('verified_at', { ascending: false });

    if (error) {
      console.error('Error fetching verifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verifications: verifications || [],
      total: verifications?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/social-verification/twitter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
