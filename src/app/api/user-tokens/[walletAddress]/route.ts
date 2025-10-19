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

    // For now, return empty tokens since user_token_holdings table doesn't exist yet
    // This will be implemented when token tracking is added to the database
    console.log('⚠️ user_token_holdings table not implemented yet, returning empty tokens');
    
    const tokens: any[] = [];

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
