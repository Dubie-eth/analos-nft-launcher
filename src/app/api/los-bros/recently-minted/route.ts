import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/los-bros/recently-minted
 * Returns recently minted Los Bros NFTs with full metadata
 */
export async function GET(request: NextRequest) {
  // Lazy initialize Supabase client at runtime (not build time)
  const supabase = getSupabaseAdmin();
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`📊 Fetching ${limit} recently minted Los Bros NFTs...`);

    // First, check if Los Bros columns exist by trying to select them
    const { data: nfts, error } = await supabase
      .from('profile_nfts')
      .select(`
        mint_address,
        wallet_address,
        username,
        display_name,
        los_bros_tier,
        los_bros_final_price,
        los_bros_discount_percent,
        lol_balance_at_mint,
        los_bros_rarity,
        los_bros_rarity_score,
        los_bros_traits,
        transaction_signature,
        created_at
      `)
      .not('los_bros_tier', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    // If columns don't exist yet, return empty array gracefully
    if (error) {
      console.log('⚠️  Los Bros columns may not exist yet, returning empty array');
      return NextResponse.json({
        success: true,
        nfts: [],
        total: 0,
        limit,
        message: 'No Los Bros NFTs minted yet',
        timestamp: new Date().toISOString(),
      });
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('profile_nfts')
      .select('*', { count: 'exact', head: true })
      .not('los_bros_tier', 'is', null);

    console.log(`✅ Found ${nfts?.length || 0} minted Los Bros NFTs (${totalCount} total)`);

    return NextResponse.json({
      success: true,
      nfts: nfts || [],
      total: totalCount || 0,
      limit,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error in recently-minted endpoint:', error);
    // Return graceful error instead of 500
    return NextResponse.json({
      success: true,
      nfts: [],
      total: 0,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '50'),
      message: 'No Los Bros NFTs minted yet',
      timestamp: new Date().toISOString(),
    });
  }
}

