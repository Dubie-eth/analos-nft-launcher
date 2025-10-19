import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    console.log('🔄 Loading collections for wallet:', walletAddress || 'all');

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
      console.log('❌ Supabase not configured, returning empty collections');
      return NextResponse.json({
        success: true,
        collections: [],
        count: 0
      });
    }

    let query = ((supabaseAdmin as any).from('saved_collections')).select('*');
    
    // If wallet is specified and not 'all', filter by wallet
    if (walletAddress && walletAddress !== 'all') {
      query = query.eq('user_wallet', walletAddress);
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: collections, error } = await query as { data: any; error: any };

    if (error) {
      console.error('❌ Error fetching collections:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load collections' },
        { status: 500 }
      );
    }

    console.log('✅ Loaded collections:', collections?.length || 0);

    return NextResponse.json({
      success: true,
      collections: collections || [],
      count: collections?.length || 0
    });

  } catch (error) {
    console.error('💥 Error in load collections API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
