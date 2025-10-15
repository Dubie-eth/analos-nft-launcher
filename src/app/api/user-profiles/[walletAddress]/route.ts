/**
 * USER PROFILE API ROUTE
 * Get and update user profile by wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { userProfileService } from '@/lib/database/page-access-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.walletAddress;
    
    const profile = await userProfileService.getUserProfile(walletAddress);
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.walletAddress;
    const updates = await request.json();
    
    const updatedProfile = await userProfileService.upsertUserProfile(updates, walletAddress);
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
