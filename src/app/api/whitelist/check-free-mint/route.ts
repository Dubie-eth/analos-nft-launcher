import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

const supabase = getSupabaseAdmin();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet address is required' 
      }, { status: 400 });
    }

    // Check if wallet has used their free mint
    const { data, error } = await supabase
      .from('free_mint_usage')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking free mint usage:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check free mint usage' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      hasUsedFreeMint: !!data 
    });
  } catch (error) {
    console.error('Error in check-free-mint GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
