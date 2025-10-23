import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function checkWalletBlock(walletAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_wallets')
      .select('*')
      .eq('walletAddress', walletAddress)
      .eq('isActive', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking wallet block:', error);
      return false; // Don't block on error
    }

    return !!data; // Return true if wallet is blocked
  } catch (error) {
    console.error('Error in wallet block check:', error);
    return false; // Don't block on error
  }
}

export async function getBlockReason(walletAddress: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('blocked_wallets')
      .select('reason')
      .eq('walletAddress', walletAddress)
      .eq('isActive', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting block reason:', error);
      return null;
    }

    return data?.reason || null;
  } catch (error) {
    console.error('Error in get block reason:', error);
    return null;
  }
}
