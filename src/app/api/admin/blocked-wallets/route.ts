import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { data: blockedWallets, error } = await supabase
      .from('blocked_wallets')
      .select('*')
      .order('blockedAt', { ascending: false });

    if (error) {
      console.error('Error fetching blocked wallets:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch blocked wallets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      blockedWallets: blockedWallets || [] 
    });
  } catch (error) {
    console.error('Error in blocked wallets GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, reason, severity, notes } = body;

    if (!walletAddress || !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet address and reason are required' 
      }, { status: 400 });
    }

    // Check if wallet is already blocked
    const { data: existing } = await supabase
      .from('blocked_wallets')
      .select('*')
      .eq('walletAddress', walletAddress)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'This wallet is already blocked' 
      }, { status: 400 });
    }

    // Add new block
    const { data, error } = await supabase
      .from('blocked_wallets')
      .insert([
        {
          walletAddress,
          reason,
          severity: severity || 'medium',
          notes: notes || null,
          blockedBy: 'admin', // TODO: Get from authenticated admin session
          blockedAt: new Date().toISOString(),
          isActive: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error blocking wallet:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to block wallet' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      blockedWallet: data 
    });
  } catch (error) {
    console.error('Error in blocked wallets POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
