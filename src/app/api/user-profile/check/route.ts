import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  walletAddress: string;
  username: string;
  bio?: string;
  email?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
  };
  profilePicture?: string;
  bannerImage?: string;
  privacyLevel: 'public' | 'private' | 'friends';
  allowDataExport: boolean;
  allowAnalytics: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for demo (replace with database in production)
let userProfiles: UserProfile[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user has a profile
    const existingProfile = userProfiles.find(profile => 
      profile.walletAddress === walletAddress
    );

    return NextResponse.json({
      success: true,
      hasProfile: !!existingProfile,
      profile: existingProfile || null
    });

  } catch (error) {
    console.error('Error checking user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profileData: UserProfile = await request.json();
    
    if (!profileData.walletAddress || !profileData.username) {
      return NextResponse.json(
        { error: 'Wallet address and username are required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingIndex = userProfiles.findIndex(profile => 
      profile.walletAddress === profileData.walletAddress
    );

    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing profile
      userProfiles[existingIndex] = {
        ...userProfiles[existingIndex],
        ...profileData,
        updatedAt: now
      };
    } else {
      // Create new profile
      userProfiles.push({
        ...profileData,
        createdAt: now,
        updatedAt: now
      });
    }

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Profile updated successfully' : 'Profile created successfully',
      profile: userProfiles[existingIndex >= 0 ? existingIndex : userProfiles.length - 1]
    });

  } catch (error) {
    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
