import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/platform/activity
 * Get unified activity feed (mints, transfers, sales, listings)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const collectionType = searchParams.get('collection'); // 'losbros' or 'profile'
    const activityType = searchParams.get('type'); // 'mint', 'transfer', 'sale', 'list'

    const supabase = getSupabaseAdmin();
    const activities: any[] = [];

    // Fetch transfers (includes P2P and sales)
    try {
      let transferQuery = supabase
        .from('nft_transfers')
        .select('*')
        .order('transferred_at', { ascending: false })
        .limit(limit);

      if (collectionType) {
        transferQuery = transferQuery.eq('collection_type', collectionType);
      }

      const { data: transfers } = await (transferQuery as any);
      
      if (transfers) {
        transfers.forEach((t: any) => {
          activities.push({
            id: t.id,
            type: t.transfer_type || 'transfer',
            nftMint: t.nft_mint,
            tokenId: t.token_id,
            collectionType: t.collection_type,
            fromWallet: t.from_wallet,
            toWallet: t.to_wallet,
            price: t.sale_price,
            timestamp: t.transferred_at,
            transactionSignature: t.transaction_signature
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch transfers:', error);
    }

    // Fetch recent mints from profile_nfts
    try {
      let mintsQuery = supabase
        .from('profile_nfts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2));

      const { data: mints } = await (mintsQuery as any);
      
      if (mints) {
        mints.forEach((m: any) => {
          const isLosBros = m.los_bros_token_id != null;
          activities.push({
            id: m.id,
            type: 'mint',
            nftMint: m.mint_address,
            tokenId: isLosBros ? m.los_bros_token_id : null,
            collectionType: isLosBros ? 'losbros' : 'profile',
            toWallet: m.wallet_address,
            timestamp: m.created_at,
            transactionSignature: m.transaction_signature
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch mints:', error);
    }

    // Fetch recent listings from marketplace_listings
    try {
      let listingsQuery = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('listed_at', { ascending: false })
        .limit(Math.floor(limit / 4));

      const { data: listings } = await (listingsQuery as any);
      
      if (listings) {
        listings.forEach((l: any) => {
          activities.push({
            id: l.id,
            type: 'list',
            nftMint: l.nft_mint,
            collectionType: 'unknown', // Can be enriched
            fromWallet: l.seller_wallet,
            price: l.list_price,
            timestamp: l.listed_at,
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch listings:', error);
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit after combining
    const limitedActivities = activities.slice(0, limit);

    // Filter by activity type if specified
    const filteredActivities = activityType
      ? limitedActivities.filter(a => a.type === activityType)
      : limitedActivities;

    return NextResponse.json({
      success: true,
      activities: filteredActivities,
      totalActivities: filteredActivities.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching platform activity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activity',
      details: error.message
    }, { status: 500 });
  }
}

