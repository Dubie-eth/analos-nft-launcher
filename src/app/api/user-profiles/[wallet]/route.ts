import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

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

    const supabase = getSupabase();

    // Get user profile by wallet address
    const { data: profile, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { 
          wallet,
          exists: false,
          message: 'No profile found for this wallet'
        },
        { status: 404 }
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
