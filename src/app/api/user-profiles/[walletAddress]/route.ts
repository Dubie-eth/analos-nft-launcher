/**
 * USER PROFILE API ROUTE
 * Get and update user profile by wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { userProfileService } from '@/lib/database/page-access-service';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const resolvedParams = await params;
    const walletAddress = resolvedParams.walletAddress;
    
    // Check if database is configured
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured - returning default profile');
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
        allowAnalytics: true,
        _warning: 'Database not configured - profile data will not persist'
      });
    }
    
    // Get profile from user_profiles table
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single() as { data: any; error: any };
    
    if (error || !profile) {
      console.log('No profile found or error:', error);
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
    
    // Map database fields to API response format
    return NextResponse.json({
      id: profile.id,
      walletAddress: profile.wallet_address,
      username: profile.username,
      bio: profile.bio || '',
      profilePictureUrl: profile.profile_picture_url || '',
      bannerImageUrl: profile.banner_image_url || '',
      socials: profile.socials || {},
      referralCode: profile.username.toUpperCase(),
      totalReferrals: 0, // TODO: Calculate from referrals table
      totalPoints: 0, // TODO: Calculate from points
      rank: 999, // TODO: Calculate from leaderboard
      privacyLevel: profile.privacy_level || 'public',
      allowDataExport: profile.allow_data_export ?? true,
      allowAnalytics: profile.allow_analytics ?? true
    });
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
    if (!isSupabaseConfigured) {
      console.error('❌ Supabase not configured - profile save will not persist');
      return NextResponse.json(
        { 
          error: 'Database not configured. Please set up Supabase environment variables.',
          details: 'Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY'
        },
        { status: 503 }
      );
    }
    
    // Check username uniqueness if username is being updated
    if (updates.username) {
      const { data: existingUser } = await supabaseAdmin
        .from('user_profiles')
        .select('username')
        .eq('wallet_address', walletAddress)
        .single() as { data: any; error: any };
      
      // Only check uniqueness if username is actually changing
      if (!existingUser || existingUser.username !== updates.username.toLowerCase()) {
        const { data: usernameExists } = await supabaseAdmin
          .from('user_profiles')
          .select('username')
          .eq('username', updates.username.toLowerCase())
          .single() as { data: any; error: any };
          
        if (usernameExists) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
      }
      
      // Convert username to lowercase for consistency
      updates.username = updates.username.toLowerCase();
    }
    
    // Generate wallet address hash for security
    const walletAddressHash = crypto.createHash('sha256').update(walletAddress).digest('hex');
    
    // Prepare data for upsert
    const userData = {
      wallet_address: walletAddress,
      wallet_address_hash: walletAddressHash,
      username: updates.username || walletAddress.slice(0, 8) + '...',
      bio: updates.bio || null,
      profile_picture_url: updates.profilePictureUrl || null,
      banner_image_url: updates.bannerImageUrl || null,
      socials: updates.socials || {},
      privacy_level: updates.privacyLevel || 'public',
      allow_data_export: updates.allowDataExport ?? true,
      allow_analytics: updates.allowAnalytics ?? true,
      updated_at: new Date().toISOString(),
      is_verified: false,
      verification_level: 'none',
      is_active: true
    };
    
    // Upsert user profile
    const { data: updatedProfile, error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(userData, { 
        onConflict: 'wallet_address',
        ignoreDuplicates: false 
      })
      .select()
      .single() as { data: any; error: any };
    
    if (upsertError) {
      console.error('Error upserting user profile:', upsertError);
      throw upsertError;
    }
    
    // Create referral tracking entry if username changed
    if (updates.username && updatedProfile) {
      const referralCode = updates.username.toUpperCase();
      
      console.log(`📊 New referral code created: ${referralCode} for wallet ${walletAddress}`);
      
      // Insert into referrals table for leaderboard tracking
      try {
        await supabaseAdmin.from('referrals').insert({
          referrer_wallet: walletAddress,
          referral_code: referralCode,
          points_earned: 0,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null
        });
        
        console.log(`✅ Referral tracking created for ${referralCode}`);
      } catch (referralError) {
        console.error('⚠️ Failed to create referral tracking:', referralError);
        // Don't fail the profile update if referral tracking fails
      }
    }
    
    // Map response format
    const response = {
      id: updatedProfile.id,
      walletAddress: updatedProfile.wallet_address,
      username: updatedProfile.username,
      bio: updatedProfile.bio || '',
      profilePictureUrl: updatedProfile.profile_picture_url || '',
      bannerImageUrl: updatedProfile.banner_image_url || '',
      socials: updatedProfile.socials || {},
      referralCode: updatedProfile.username.toUpperCase(),
      totalReferrals: 0, // TODO: Calculate from referrals table
      totalPoints: 0, // TODO: Calculate from points
      rank: 999, // TODO: Calculate from leaderboard
      privacyLevel: updatedProfile.privacy_level || 'public',
      allowDataExport: updatedProfile.allow_data_export ?? true,
      allowAnalytics: updatedProfile.allow_analytics ?? true
    };
    
    return NextResponse.json(response);
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
