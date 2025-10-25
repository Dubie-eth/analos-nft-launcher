import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/marketplace/delist
 * Delist (cancel) an NFT listing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftMint, seller } = body;

    if (!nftMint || !seller) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: nftMint, seller' 
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update listing status to 'cancelled'
    const { data, error } = await (supabase
      .from('marketplace_listings') as any)
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('nft_mint', nftMint)
      .eq('seller_wallet', seller)
      .eq('status', 'active')
      .select();

    if (error) {
      console.error('❌ Error delisting NFT:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delist NFT',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active listing found for this NFT'
      }, { status: 404 });
    }

    console.log('✅ NFT delisted successfully:', nftMint);

    return NextResponse.json({
      success: true,
      message: 'NFT delisted successfully',
      listing: data[0]
    });

  } catch (error: any) {
    console.error('❌ Error in delist API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

