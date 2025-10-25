import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

// Collection founder wallet (you)
const COLLECTION_FOUNDER = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const collectionId = searchParams.get('collectionId') || 'los-bros';

    // Verify founder access
    if (!walletAddress || walletAddress.toLowerCase() !== COLLECTION_FOUNDER.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized - Collection founder only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Get current collection settings
    const { data: settings, error } = await supabase
      .from('collection_settings')
      .select('*')
      .eq('collection_id', collectionId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching collection settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Default settings if none exist
    const defaultSettings = {
      collection_id: collectionId,
      socials: {
        twitter: 'https://x.com/launchonlos',
        telegram: 'https://t.me/launchonlos',
        website: 'https://launchonlos.fun'
      },
      media: {
        logo_url: null,
        banner_url: null
      },
      verification: {
        is_verified: true,
        verified_by: 'founder',
        verified_at: new Date().toISOString()
      },
      whitelist_phases: {
        team: { active: true, mint_limit: 10, requires_lol: 0 },
        community: { active: true, mint_limit: 3, requires_lol: 1000000 },
        early: { active: true, mint_limit: 1, requires_lol: 100000 },
        public: { active: true, mint_limit: 2, requires_lol: 0 }
      },
      reveal_settings: {
        auto_reveal: true,
        reveal_delay_hours: 0,
        placeholder_image: null
      }
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error: any) {
    console.error('❌ Collection settings GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, collectionId = 'los-bros', updates } = body;

    // Verify founder access
    if (!walletAddress || walletAddress.toLowerCase() !== COLLECTION_FOUNDER.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized - Collection founder only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Upsert collection settings
    const { data, error } = await supabase
      .from('collection_settings')
      .upsert({
        collection_id: collectionId,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: walletAddress
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating collection settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    console.log('✅ Collection settings updated:', data);

    return NextResponse.json({
      success: true,
      settings: data
    });

  } catch (error: any) {
    console.error('❌ Collection settings POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
