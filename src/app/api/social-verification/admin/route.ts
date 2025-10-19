/**
 * ADMIN SOCIAL VERIFICATION API
 * Handles admin approval/rejection of pending social verifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Admin wallets that can approve/reject verifications
const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
];

// GET - Fetch all pending verifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminWallet = searchParams.get('adminWallet');
    const status = searchParams.get('status') || 'pending';

    // Verify admin access
    if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        verifications: [],
        message: 'Database not configured'
      });
    }

    // Fetch pending verifications
    const { data: verifications, error } = await supabaseAdmin
      .from('social_verifications')
      .select('*')
      .eq('verification_status', status)
      .order('created_at', { ascending: false });

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
    console.error('Error in GET /api/social-verification/admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminWallet, verificationId, action, rejectedReason } = body;

    // Validate input
    if (!adminWallet || !verificationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: adminWallet, verificationId, action' },
        { status: 400 }
      );
    }

    // Verify admin access
    if (!ADMIN_WALLETS.includes(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured'
      });
    }

    // Get the verification record
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('social_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Update verification status
    const updateData: any = {
      verification_status: action === 'approve' ? 'verified' : 'rejected',
      updated_at: new Date().toISOString()
    };

    if (action === 'approve') {
      updateData.verified_at = new Date().toISOString();
    } else {
      updateData.rejected_reason = rejectedReason || 'Rejected by admin';
    }

    const { data: updatedVerification, error: updateError } = await supabaseAdmin
      .from('social_verifications')
      .update(updateData)
      .eq('id', verificationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification' },
        { status: 500 }
      );
    }

    // If approved, award points
    if (action === 'approve') {
      await awardVerificationRewards(verification.wallet_address, verification.platform);
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Verification approved! User has been awarded 100 points.' 
        : 'Verification rejected.',
      verification: updatedVerification
    });

  } catch (error) {
    console.error('Error in POST /api/social-verification/admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
