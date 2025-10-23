import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

const supabase = getSupabaseAdmin();

const WHITELIST_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    // Get current whitelist count
    const { count: whitelistCount, error: countError } = await supabase
      .from('whitelist_registry')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting whitelist count:', countError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get whitelist status' 
      }, { status: 500 });
    }

    // Get free mints claimed count
    const { count: freeMintsClaimed, error: freeMintsError } = await supabase
      .from('free_mint_usage')
      .select('*', { count: 'exact', head: true });

    if (freeMintsError) {
      console.error('Error getting free mints count:', freeMintsError);
    }

    const isPublicLaunch = (whitelistCount || 0) >= WHITELIST_LIMIT;
    const whitelistSlotsRemaining = Math.max(0, WHITELIST_LIMIT - (whitelistCount || 0));

    let isWhitelisted = false;
    let whitelistPosition = null;

    if (walletAddress) {
      // Check if wallet is whitelisted
      const { data: whitelistEntry, error: whitelistError } = await (supabase
        .from('whitelist_registry') as any)
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (whitelistError && whitelistError.code !== 'PGRST116') {
        console.error('Error checking whitelist entry:', whitelistError);
      } else if (whitelistEntry) {
        isWhitelisted = true;
        whitelistPosition = whitelistEntry.position;
      }
    }

    return NextResponse.json({ 
      success: true,
      isWhitelisted,
      isPublicLaunch,
      whitelistPosition,
      whitelistSlotsRemaining,
      totalWhitelisted: whitelistCount || 0,
      freeMintsClaimed: freeMintsClaimed || 0,
      whitelistLimit: WHITELIST_LIMIT
    });
  } catch (error) {
    console.error('Error in whitelist status GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet address is required' 
      }, { status: 400 });
    }

    // Check if wallet is already whitelisted
    const { data: existingEntry } = await supabase
      .from('whitelist_registry')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingEntry) {
      return NextResponse.json({ 
        success: true, 
        message: 'Wallet already whitelisted',
        position: existingEntry.position,
        isWhitelisted: true
      });
    }

    // Get current whitelist count
    const { count: currentCount } = await supabase
      .from('whitelist_registry')
      .select('*', { count: 'exact', head: true });

    const position = (currentCount || 0) + 1;

    if (position > WHITELIST_LIMIT) {
      return NextResponse.json({ 
        success: false, 
        error: 'Whitelist is full. Public launch will begin soon!',
        isPublicLaunch: true
      }, { status: 400 });
    }

    // Add wallet to whitelist
    const { data, error } = await supabase
      .from('whitelist_registry')
      .insert({
        wallet_address: walletAddress,
        position: position,
        added_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to whitelist:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add to whitelist' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      position,
      isWhitelisted: true,
      message: `Successfully added to whitelist! Position #${position}`
    });
  } catch (error) {
    console.error('Error in whitelist status POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
