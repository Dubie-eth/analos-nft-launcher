import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const supabase = getSupabaseAdmin();

    // Determine collection type
    const isLosBros = collectionId === 'los-bros';
    
    // Get total minted count
    const { count: totalMinted, error: countError } = await supabase
      .from('profile_nfts')
      .select('*', { count: 'exact', head: true })
      .not(isLosBros ? 'los_bros_token_id' : 'username', 'is', null);

    if (countError) {
      console.error('Error counting NFTs:', countError);
    }

    // Get unique owners count
    const { data: owners, error: ownersError } = await (supabase as any)
      .from('profile_nfts')
      .select('wallet_address')
      .not(isLosBros ? 'los_bros_token_id' : 'username', 'is', null);

    const uniqueOwners = owners ? new Set(owners.map((o: any) => o.wallet_address)).size : 0;

    // Get marketplace listings for floor price and listed count
    const { data: listings, error: listingsError } = await supabase
      .from('marketplace_listings')
      .select('list_price, nft_mint')
      .eq('status', 'active');

    // Filter listings by collection type
    // For now, assume all listings (we'll need to add collection type to listings table)
    const activeListings: any[] = listings || [];
    const floorPrice = activeListings.length > 0 
      ? Math.min(...activeListings.map((l: any) => l.list_price))
      : 0;

    // Get recent sales (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: sales, error: salesError } = await supabase
      .from('marketplace_sales')
      .select('sale_price, created_at')
      .gte('created_at', oneDayAgo);

    const sales24h = sales?.length || 0;
    const volume24h = sales?.reduce((sum: number, sale: any) => sum + sale.sale_price, 0) || 0;
    const avgSalePrice = sales24h > 0 ? volume24h / sales24h : 0;

    // Get total volume (all-time)
    const { data: allSales, error: allSalesError } = await supabase
      .from('marketplace_sales')
      .select('sale_price');

    const volumeTotal = allSales?.reduce((sum: number, sale: any) => sum + sale.sale_price, 0) || 0;

    // Calculate market cap (floor price * total minted)
    const marketCap = floorPrice * (totalMinted || 0);

    // Mock data for changes (would need historical data)
    const floorChange24h = 0; // TODO: Calculate from historical data
    const volumeChange24h = 0; // TODO: Calculate from historical data

    // Total supply
    const totalSupply = isLosBros ? 2222 : 2222; // Los Bros: 2222, Profile NFTs: 2222

    // Calculate stats
    const stats = {
      totalSupply,
      totalMinted: totalMinted || 0,
      floorPrice,
      volume24h,
      volumeTotal,
      marketCap,
      floorChange24h,
      volumeChange24h,
      uniqueOwners,
      listedCount: activeListings.length,
      listedPercentage: totalMinted ? (activeListings.length / totalMinted) * 100 : 0,
      sales24h,
      avgSalePrice
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching collection stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch collection stats' 
      },
      { status: 500 }
    );
  }
}

