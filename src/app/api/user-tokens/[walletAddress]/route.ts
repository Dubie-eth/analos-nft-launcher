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
        tokens: [],
        count: 0,
        message: 'Database not configured'
      });
    }

    // Get user's token holdings from database
    const { data: tokens, error } = await (supabaseAdmin as any)
      .from('user_token_holdings')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens: tokens || [],
      count: tokens?.length || 0
    });

  } catch (error) {
    console.error('Error in user tokens API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
