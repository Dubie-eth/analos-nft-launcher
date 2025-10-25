import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function checkWalletBlock(walletAddress: string): Promise<boolean> {
  // Lazy initialize Supabase client at runtime (not build time)
  const supabase = getSupabaseAdmin();
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
  // Lazy initialize Supabase client at runtime (not build time)
  const supabase = getSupabaseAdmin();
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

    if (!data) {
      return null;
    }

    return data.reason || null;
  } catch (error) {
    console.error('Error in get block reason:', error);
    return null;
  }
}
