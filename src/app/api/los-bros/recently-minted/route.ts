import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/los-bros/recently-minted
 * Returns recently minted Los Bros NFTs with full metadata
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log(`📊 Fetching ${limit} recently minted Los Bros NFTs...`);

    // Get recently minted Los Bros NFTs (only query columns that exist)
    const { data: nfts, error } = await supabase
      .from('profile_nfts')
      .select(`
        mint_address,
        wallet_address,
        username,
        display_name,
        los_bros_token_id,
        los_bros_tier,
        los_bros_final_price,
        los_bros_discount_percent,
        lol_balance_at_mint,
        image_url,
        metadata_uri,
        transaction_signature,
        created_at
      `)
      .not('los_bros_token_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching minted NFTs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('profile_nfts')
      .select('*', { count: 'exact', head: true })
      .not('los_bros_token_id', 'is', null);

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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

