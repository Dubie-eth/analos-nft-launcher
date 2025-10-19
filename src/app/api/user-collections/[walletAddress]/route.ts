import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: true,
        collections: [],
        count: 0,
        message: 'Database not configured'
      });
    }

    // Get user's collections from database
    const { data: collections, error } = await (supabaseAdmin as any)
      .from('saved_collections')
      .select('*')
      .eq('user_wallet', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collections: collections || [],
      count: collections?.length || 0
    });

  } catch (error) {
    console.error('Error in user collections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
