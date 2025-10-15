/**
 * USER PROFILE API ENDPOINTS
 * Secure user profile management with privacy controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/database/database-service';
import { UserProfile } from '@/lib/database/types';

// Helper function to get client info
function getClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): string | null {
  const adminWallet = request.headers.get('x-admin-wallet');
  const adminSession = request.cookies.get('admin-session');
  
  if (!adminWallet && !adminSession) {
    return null;
  }
  
  // In a real implementation, verify the admin session/wallet
  return adminWallet || 'admin';
}

// GET /api/database/users - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    
    if (!userId && !walletAddress) {
      return NextResponse.json({ error: 'userId or walletAddress required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    const accessedBy = verifyAdminAccess(request) || 'user';
    
    let user: UserProfile | null = null;
    
    if (userId) {
      user = await databaseService.getUserProfile(userId, accessedBy);
    } else if (walletAddress) {
      user = await databaseService.getUserProfileByWallet(walletAddress, accessedBy);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remove sensitive data for non-admin access
    if (!verifyAdminAccess(request)) {
      delete (user as any).walletAddress;
      delete (user as any).bio;
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/database/users - Create user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, username, bio, profilePicture, bannerImage, socials } = body;
    
    if (!walletAddress || !username) {
      return NextResponse.json({ error: 'walletAddress and username required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    const accessedBy = verifyAdminAccess(request) || walletAddress;
    
    // Check if user already exists
    const existingUser = await databaseService.getUserProfileByWallet(walletAddress, accessedBy);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    
    const userProfile = await databaseService.createUserProfile({
      walletAddress,
      username,
      bio,
      profilePicture,
      bannerImage,
      socials: socials || {},
      lastLoginAt: new Date(),
      isVerified: false,
      verificationLevel: 'none'
    }, accessedBy);
    
    return NextResponse.json({ user: userProfile }, { status: 201 });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/database/users - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    const accessedBy = verifyAdminAccess(request) || 'user';
    
    const updatedUser = await databaseService.updateUserProfile(userId, updates, accessedBy);
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/database/users - Delete user profile (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = verifyAdminAccess(request);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const clientInfo = getClientInfo(request);
    const reason = searchParams.get('reason') || 'Admin deletion';
    
    const success = await databaseService.deleteUserData(userId, adminAccess, reason);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'User data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
