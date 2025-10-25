import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/nft/holders
 * Get NFT holders ranked by holdings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const collectionType = searchParams.get('collection') || 'all'; // 'losbros', 'profile', 'all'

    const supabase = getSupabaseAdmin();

    // Build query based on collection type
    let query = supabase
      .from('profile_nfts')
      .select('wallet_address, los_bros_token_id');

    if (collectionType === 'losbros') {
      query = query.not('los_bros_token_id', 'is', null);
    } else if (collectionType === 'profile') {
      query = query.is('los_bros_token_id', null);
    }

    const { data: nfts, error } = await (query as any);

    if (error) {
      console.error('❌ Error fetching NFTs for holders:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch holders',
        details: error.message
      }, { status: 500 });
    }

    // Count NFTs per wallet
    const holderMap = new Map<string, number>();
    
    (nfts || []).forEach((nft: any) => {
      const wallet = nft.wallet_address;
      if (wallet) {
        holderMap.set(wallet, (holderMap.get(wallet) || 0) + 1);
      }
    });

    // Convert to array and sort
    const holders = Array.from(holderMap.entries())
      .map(([wallet, count]) => ({
        wallet,
        nftCount: count
      }))
      .sort((a, b) => b.nftCount - a.nftCount);

    // Calculate stats
    const totalNFTs = nfts?.length || 0;
    const totalHolders = holders.length;
    const avgPerHolder = totalHolders > 0 ? totalNFTs / totalHolders : 0;
    const topHolderPercentage = totalNFTs > 0 && holders.length > 0 
      ? (holders[0].nftCount / totalNFTs) * 100 
      : 0;

    // Add rank and percentage to each holder
    const rankedHolders = holders.slice(0, limit).map((holder, index) => ({
      ...holder,
      rank: index + 1,
      percentage: totalNFTs > 0 ? (holder.nftCount / totalNFTs) * 100 : 0
    }));

    // Optionally enrich with floor price data for total value
    // This would require joining with marketplace data

    return NextResponse.json({
      success: true,
      holders: rankedHolders,
      stats: {
        totalHolders,
        totalNFTs,
        avgPerHolder,
        topHolderPercentage
      }
    });

  } catch (error: any) {
    console.error('❌ Error in holders API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

