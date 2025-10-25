import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic validation)
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching user profile for wallet:', wallet);

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, returning mock data');
      return NextResponse.json({
        wallet,
        exists: false,
        message: 'Database not configured - using mock data',
        mock: true
      });
    }

    const supabase = getSupabase();

    // Get user profile by wallet address
    const { data: profile, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    // Gracefully handle errors (table might not exist or profile not found)
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found (not an error)
        console.log('ℹ️ No profile found for wallet:', wallet);
        return NextResponse.json({
          wallet,
          exists: false,
          message: 'No profile found for this wallet'
        });
      }
      
      // Other error (table doesn't exist, etc.)
      console.warn('⚠️ Error fetching user profile (non-critical):', error);
      return NextResponse.json({
        wallet,
        exists: false,
        message: 'Profile not available',
        error: error.message
      });
    }

    if (!profile) {
      return NextResponse.json(
        { 
          wallet,
          exists: false,
          message: 'No profile found for this wallet'
        }
      );
    }

    console.log('✅ Found user profile:', profile?.username || 'Unknown');

    return NextResponse.json({
      wallet,
      exists: true,
      profile: {
        id: profile.id,
        username: profile.username,
        bio: profile.bio,
        email: profile.email,
        socials: profile.socials,
        banner_image_url: profile.banner_image_url,
        profile_image_url: profile.profile_image_url,
        access_level: profile.access_level,
        privacy_level: profile.privacy_level,
        allow_data_export: profile.allow_data_export,
        allow_analytics: profile.allow_analytics,
        custom_name: profile.custom_name,
        referral_link: profile.referral_link,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Error in user profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
