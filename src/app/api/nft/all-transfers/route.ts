import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/nft/all-transfers
 * Get all NFT transfers across the platform (admin view)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const collectionType = searchParams.get('collection'); // 'losbros' or 'profile'

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('nft_transfers')
      .select('*')
      .order('transferred_at', { ascending: false })
      .limit(limit);

    if (collectionType) {
      query = query.eq('collection_type', collectionType);
    }

    const { data: transfers, error } = await (query as any);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.warn('⚠️ nft_transfers table does not exist yet');
        return NextResponse.json({
          success: true,
          transfers: [],
          message: 'Transfer tracking table not yet created. Run scripts/create-nft-transfers-table.sql'
        });
      }

      console.error('❌ Error fetching all transfers:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transfers',
        details: error.message
      }, { status: 500 });
    }

    // Calculate stats
    const totalTransfers = transfers?.length || 0;
    const p2pCount = transfers?.filter((t: any) => t.transfer_type === 'p2p').length || 0;
    const salesCount = transfers?.filter((t: any) => t.transfer_type === 'sale').length || 0;
    const mintsCount = transfers?.filter((t: any) => t.transfer_type === 'mint').length || 0;
    
    const totalVolume = transfers?.reduce((sum: number, t: any) => {
      return sum + (t.sale_price || 0);
    }, 0) || 0;

    const uniqueWallets = new Set();
    transfers?.forEach((t: any) => {
      uniqueWallets.add(t.from_wallet);
      uniqueWallets.add(t.to_wallet);
    });

    return NextResponse.json({
      success: true,
      transfers: transfers || [],
      stats: {
        totalTransfers,
        p2pTransfers: p2pCount,
        salesTransfers: salesCount,
        mintsTransfers: mintsCount,
        uniqueWallets: uniqueWallets.size,
        totalVolume
      }
    });

  } catch (error: any) {
    console.error('❌ Error in all-transfers API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

