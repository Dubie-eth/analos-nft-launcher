import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Loading collections for wallet:', walletAddress);

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Supabase not configured');
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Fetch collections for this wallet
    const { data: collections, error } = await (supabaseAdmin
      .from('saved_collections') as any)
      .select('*')
      .eq('user_wallet', walletAddress)
      .order('created_at', { ascending: false }) as { data: any; error: any };

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
