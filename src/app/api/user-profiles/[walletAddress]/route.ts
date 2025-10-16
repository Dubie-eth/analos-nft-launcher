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
    
    // Check username uniqueness if username is being updated
    if (updates.username) {
      const existingProfile = await userProfileService.getUserProfile(walletAddress);
      
      // Only check uniqueness if username is actually changing
      if (!existingProfile || existingProfile.username !== updates.username.toLowerCase()) {
        const usernameCheck = await userProfileService.checkUsernameAvailability(updates.username);
        if (!usernameCheck.available) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
      }
      
      // Convert username to lowercase for consistency
      updates.username = updates.username.toLowerCase();
    }
    
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
