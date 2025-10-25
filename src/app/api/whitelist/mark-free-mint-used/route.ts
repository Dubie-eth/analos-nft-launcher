import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json();
    const { walletAddress, usedAt } = body;

    if (!walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet address is required' 
      }, { status: 400 });
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('free_mint_usage')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Free mint already marked as used' 
      });
    }

    // Mark free mint as used
    const { data, error } = await (supabase
      .from('free_mint_usage') as any)
      .insert({
        wallet_address: walletAddress,
        used_at: usedAt || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking free mint as used:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to mark free mint as used' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Free mint marked as used successfully' 
    });
  } catch (error) {
    console.error('Error in mark-free-mint-used POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
