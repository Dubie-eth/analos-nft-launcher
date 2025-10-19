/**
 * TWITTER VERIFICATION WEBHOOK
 * Optional webhook endpoint for automated tweet verification
 * This could be triggered by external services or scheduled jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { twitterApiService } from '@/lib/twitter-api-service';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, referralCode, tweetId } = body;

    // Validate input
    if (!walletAddress || !referralCode || !tweetId) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, referralCode, tweetId' },
        { status: 400 }
      );
    }

    // Verify tweet content
    const verificationResult = await twitterApiService.verifyTweetContent(tweetId, referralCode);

    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        message: verificationResult.message,
        details: verificationResult.details
      });
    }

    // Check if verification already exists
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: existingVerification } = await (supabaseAdmin
        .from('social_verifications') as any)
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

      // Save verification to database
      const { data: verification, error } = await (supabaseAdmin
        .from('social_verifications') as any)
        .insert({
          wallet_address: walletAddress,
          platform: 'twitter',
          tweet_id: tweetId,
          referral_code: referralCode,
          username: verificationResult.userData?.username || 'unknown',
          follower_count: verificationResult.userData?.public_metrics.followers_count || 0,
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
        return NextResponse.json(
          { error: 'Failed to save verification' },
          { status: 500 }
        );
      }

      // Award verification points/rewards
      await awardVerificationRewards(walletAddress, 'twitter');

      return NextResponse.json({
        success: true,
        message: 'Tweet verification successful via webhook!',
        verification: verification,
        rewards: {
          points: 100,
          message: 'You earned 100 points for Twitter verification!'
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Tweet verification successful via webhook! (Database not configured)',
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
    console.error('Twitter verification webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function awardVerificationRewards(walletAddress: string, platform: string): Promise<void> {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) return;

    // Award points for social verification
    const { error } = await (supabaseAdmin
      .from('user_activities') as any)
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

// GET endpoint to check webhook status
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Twitter verification webhook is active',
    endpoints: {
      verify: 'POST /api/webhooks/twitter-verification',
      requirements: {
        walletAddress: 'string (required)',
        referralCode: 'string (required)',
        tweetId: 'string (required)'
      }
    }
  });
}
