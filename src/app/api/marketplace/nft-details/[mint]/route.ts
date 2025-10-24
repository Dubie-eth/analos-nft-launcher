import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/nft-details/[mint]
 * Get marketplace details for a specific NFT (listings, offers, sales history)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mint: string }> }
) {
  try {
    const params = await context.params;
    const { mint } = params;

    if (!mint) {
      return NextResponse.json({
        success: false,
        error: 'NFT mint address required'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        data: {
          nftMint: mint,
          activeListing: null,
          pendingOffers: [],
          salesHistory: [],
          stats: {
            totalSales: 0,
            totalVolume: 0,
            highestSale: 0,
            lowestSale: 0,
            averageSale: 0
          }
        }
      });
    }

    const supabase = getSupabaseAdmin();

    // Fetch active listing
    const { data: activeListing } = await (supabase
      .from('nft_listings') as any)
      .select('*')
      .eq('nft_mint', mint)
      .eq('status', 'active')
      .single();

    // Fetch pending offers
    const { data: pendingOffers } = await (supabase
      .from('nft_offers') as any)
      .select('*')
      .eq('nft_mint', mint)
      .eq('status', 'pending')
      .order('offer_price', { ascending: false });

    // Fetch sales history
    const { data: salesHistory } = await (supabase
      .from('nft_sales') as any)
      .select('*')
      .eq('nft_mint', mint)
      .order('sold_at', { ascending: false })
      .limit(10);

    // Calculate stats
    const totalSales = salesHistory?.length || 0;
    const totalVolume = salesHistory?.reduce((sum: number, sale: any) => sum + parseFloat(sale.sale_price), 0) || 0;
    const prices = salesHistory?.map((sale: any) => parseFloat(sale.sale_price)) || [];
    const highestSale = prices.length > 0 ? Math.max(...prices) : 0;
    const lowestSale = prices.length > 0 ? Math.min(...prices) : 0;
    const averageSale = totalSales > 0 ? totalVolume / totalSales : 0;

    console.log(`📊 NFT Details for ${mint}:`);
    console.log(`  Active Listing: ${activeListing ? 'Yes' : 'No'}`);
    console.log(`  Pending Offers: ${pendingOffers?.length || 0}`);
    console.log(`  Sales History: ${totalSales}`);

    return NextResponse.json({
      success: true,
      data: {
        nftMint: mint,
        activeListing: activeListing || null,
        pendingOffers: pendingOffers || [],
        salesHistory: salesHistory || [],
        stats: {
          totalSales,
          totalVolume,
          highestSale,
          lowestSale,
          averageSale
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching NFT details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch NFT details',
      details: error.message
    }, { status: 500 });
  }
}

