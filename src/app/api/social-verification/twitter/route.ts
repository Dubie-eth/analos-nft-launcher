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
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: existingVerification, error: checkError } = await ((supabaseAdmin as any)
          .from('social_verifications'))
          .select('*')
          .eq('wallet_address', walletAddress)
          .eq('platform', 'twitter')
          .eq('tweet_id', tweetId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing verification:', checkError);
          // Continue with verification even if check fails
        } else if (existingVerification) {
          return NextResponse.json({
            success: false,
            message: 'This tweet has already been verified for this wallet',
            verification: existingVerification
          });
        }
      } catch (checkError) {
        console.error('Error in verification check:', checkError);
        // Continue with verification even if check fails
      }
    }

    // Verify tweet content using Twitter API
    let verificationResult;
    try {
      verificationResult = await twitterApiService.verifyTweetContent(tweetId, referralCode);
    } catch (error) {
      console.error('Twitter API service error:', error);
      return NextResponse.json({
        success: false,
        message: 'Twitter verification service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        message: verificationResult.message,
        details: verificationResult.details
      });
    }

    // Save verification to database
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: verification, error } = await ((supabaseAdmin as any)
          .from('social_verifications'))
          .insert({
            wallet_address: walletAddress,
            platform: 'twitter',
            tweet_id: tweetId,
            tweet_url: tweetUrl,
            referral_code: referralCode,
            username: verificationResult.userData?.username || 'verified_user',
            follower_count: verificationResult.userData?.public_metrics?.followers_count || 0,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
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
          // If table doesn't exist, return success without saving
          if (error.code === '42P01' || error.message?.includes('relation "social_verifications" does not exist')) {
            console.log('⚠️ social_verifications table not found, returning success without saving');
            return NextResponse.json({
              success: true,
              message: 'Tweet verified successfully! (Database table not configured)',
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
          return NextResponse.json(
            { error: 'Failed to save verification', details: error.message },
            { status: 500 }
          );
        }

        // Award points immediately upon verification
        try {
          await awardVerificationRewards(walletAddress, 'twitter');
        } catch (rewardError) {
          console.error('Error awarding rewards:', rewardError);
          // Don't fail the verification if rewards fail
        }

        return NextResponse.json({
          success: true,
          message: 'Tweet verified successfully!',
          verification: verification,
          rewards: {
            points: 100,
            message: 'You earned 100 points for Twitter verification!'
          }
        });
      } catch (dbError) {
        console.error('Database error during verification save:', dbError);
        return NextResponse.json(
          { error: 'Database error during verification', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
          { status: 500 }
        );
      }
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

    if (!supabaseAdmin) return;

    // Award points for social verification
    const { error } = await ((supabaseAdmin as any)
      .from('user_activities'))
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

    if (!supabaseAdmin) {
      return NextResponse.json({ verifications: [] });
    }

    const { data: verifications, error } = await ((supabaseAdmin as any)
      .from('social_verifications'))
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
