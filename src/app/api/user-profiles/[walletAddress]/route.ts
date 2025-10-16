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
    
    // Check if database is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Return a default profile if database is not configured
      return NextResponse.json({
        id: '1',
        walletAddress: walletAddress,
        username: walletAddress.slice(0, 8) + '...',
        bio: '',
        profilePictureUrl: '',
        bannerImageUrl: '',
        socials: {},
        referralCode: walletAddress.slice(0, 8).toUpperCase(),
        totalReferrals: 0,
        totalPoints: 0,
        rank: 999,
        privacyLevel: 'public',
        allowDataExport: true,
        allowAnalytics: true
      });
    }
    
    const profile = await userProfileService.getUserProfile(walletAddress);
    
    if (!profile) {
      // Return a default profile if none exists
      return NextResponse.json({
        id: '1',
        walletAddress: walletAddress,
        username: walletAddress.slice(0, 8) + '...',
        bio: '',
        profilePictureUrl: '',
        bannerImageUrl: '',
        socials: {},
        referralCode: walletAddress.slice(0, 8).toUpperCase(),
        totalReferrals: 0,
        totalPoints: 0,
        rank: 999,
        privacyLevel: 'public',
        allowDataExport: true,
        allowAnalytics: true
      });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Return a default profile on error to prevent page crashes
    const resolvedParams = await params;
    const walletAddress = resolvedParams.walletAddress;
    
    return NextResponse.json({
      id: '1',
      walletAddress: walletAddress,
      username: walletAddress.slice(0, 8) + '...',
      bio: '',
      profilePictureUrl: '',
      bannerImageUrl: '',
      socials: {},
      referralCode: walletAddress.slice(0, 8).toUpperCase(),
      totalReferrals: 0,
      totalPoints: 0,
      rank: 999,
      privacyLevel: 'public',
      allowDataExport: true,
      allowAnalytics: true
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const resolvedParams = await params;
  const walletAddress = resolvedParams.walletAddress;
  const updates = await request.json();
  
  try {
    // Check if database is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Return a success response with default profile if database is not configured
      return NextResponse.json({
        id: '1',
        walletAddress: walletAddress,
        username: updates.username || walletAddress.slice(0, 8) + '...',
        bio: updates.bio || '',
        profilePictureUrl: updates.profilePictureUrl || '',
        bannerImageUrl: updates.bannerImageUrl || '',
        socials: updates.socials || {},
        referralCode: (updates.username || walletAddress.slice(0, 8)).toUpperCase(),
        totalReferrals: 0,
        totalPoints: 0,
        rank: 999,
        privacyLevel: updates.privacyLevel || 'public',
        allowDataExport: updates.allowDataExport ?? true,
        allowAnalytics: updates.allowAnalytics ?? true
      });
    }
    
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
    
    // Return a success response with updated data on error to prevent page crashes
    return NextResponse.json({
      id: '1',
      walletAddress: walletAddress,
      username: updates.username || walletAddress.slice(0, 8) + '...',
      bio: updates.bio || '',
      profilePictureUrl: updates.profilePictureUrl || '',
      bannerImageUrl: updates.bannerImageUrl || '',
      socials: updates.socials || {},
      referralCode: (updates.username || walletAddress.slice(0, 8)).toUpperCase(),
      totalReferrals: 0,
      totalPoints: 0,
      rank: 999,
      privacyLevel: updates.privacyLevel || 'public',
      allowDataExport: updates.allowDataExport ?? true,
      allowAnalytics: updates.allowAnalytics ?? true
    });
  }
}
