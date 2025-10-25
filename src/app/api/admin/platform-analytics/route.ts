import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/admin/platform-analytics
 * Returns comprehensive platform analytics including revenue from all sources
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all'; // all, 24h, 7d, 30d

    console.log(`📊 Fetching platform analytics (range: ${range})...`);

    const supabase = getSupabaseAdmin();

    // Calculate date filter based on range
    let dateFilter: string | null = null;
    if (range === '24h') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      dateFilter = yesterday;
    } else if (range === '7d') {
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      dateFilter = week;
    } else if (range === '30d') {
      const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      dateFilter = month;
    }

    // Fetch all NFTs (both Profile and Los Bros)
    let query = (supabase as any)
      .from('profile_nfts')
      .select('*');

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data: allNFTs, error } = await query;

    if (error) {
      console.error('❌ Error fetching NFTs:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log(`📊 Found ${allNFTs?.length || 0} total mints in range ${range}`);

    // Separate Profile NFTs from Los Bros NFTs
    const profileNFTs = (allNFTs || []).filter((nft: any) => !nft.los_bros_token_id);
    const losBrosNFTs = (allNFTs || []).filter((nft: any) => nft.los_bros_token_id);

    // Calculate Los Bros revenue
    const losBrosRevenue = losBrosNFTs.reduce((total: number, nft: any) => {
      return total + (parseFloat(nft.los_bros_final_price) || 0);
    }, 0);

    const losBrosPlatformFees = losBrosNFTs.reduce((total: number, nft: any) => {
      return total + (parseFloat(nft.los_bros_platform_fee) || 0);
    }, 0);

    // Profile NFTs don't have pricing yet (TODO)
    const profileRevenue = 0;
    const profilePlatformFees = 0;

    // Get marketplace sales (TODO: Need marketplace_sales table)
    const marketplaceFees = 0; // Placeholder

    // Get launchpad fees (TODO: Need launchpad_launches table)
    const launchpadFees = 0; // Placeholder

    // Calculate totals
    const totalRevenue = losBrosRevenue + profileRevenue;
    const totalPlatformFees = losBrosPlatformFees + profilePlatformFees + marketplaceFees + launchpadFees;

    // Get unique users
    const uniqueUsers = new Set(allNFTs?.map((nft: any) => nft.wallet_address)).size;

    // Get last 24h mints for comparison
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent24h } = await (supabase as any)
      .from('profile_nfts')
      .select('*')
      .gte('created_at', last24h);

    // Build collection breakdown
    const collections = [
      {
        name: 'Los Bros',
        mints: losBrosNFTs.length,
        revenue: losBrosRevenue,
        platformFees: losBrosPlatformFees,
        avgPrice: losBrosNFTs.length > 0 ? losBrosRevenue / losBrosNFTs.length : 0,
      },
      {
        name: 'Profile NFTs',
        mints: profileNFTs.length,
        revenue: profileRevenue,
        platformFees: profilePlatformFees,
        avgPrice: 0, // Profile NFTs are free (for now)
      }
    ];

    // Get recent mints for activity feed
    const recentMints = [...losBrosNFTs, ...profileNFTs]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map((nft: any) => ({
        collection: nft.los_bros_token_id ? 'Los Bros' : 'Profile NFT',
        tokenId: nft.los_bros_token_id || nft.username || nft.mint_address.slice(0, 8),
        minter: nft.wallet_address,
        price: parseFloat(nft.los_bros_final_price) || 0,
        platformFee: parseFloat(nft.los_bros_platform_fee) || 0,
        date: nft.created_at,
      }));

    const analytics = {
      totalMints: allNFTs?.length || 0,
      last24hMints: recent24h?.length || 0,
      totalRevenue,
      platformFees: totalPlatformFees,
      uniqueUsers,
      collections,
      fees: {
        mint: losBrosPlatformFees + profilePlatformFees,
        marketplace: marketplaceFees,
        launchpad: launchpadFees,
      },
      recentMints,
      range,
    };

    console.log('✅ Platform analytics calculated:', analytics);

    return NextResponse.json({
      success: true,
      analytics,
    });

  } catch (error: any) {
    console.error('❌ Error in platform analytics API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

