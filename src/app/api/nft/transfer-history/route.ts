import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/nft/transfer-history?mint=xxx
 * Get complete transfer history for an NFT (provenance chain)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nftMint = searchParams.get('mint');
    const wallet = searchParams.get('wallet'); // Optional: filter by wallet

    if (!nftMint && !wallet) {
      return NextResponse.json({
        success: false,
        error: 'Either mint address or wallet address is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('nft_transfers')
      .select('*')
      .order('transferred_at', { ascending: false });

    // Filter by NFT mint
    if (nftMint) {
      query = query.eq('nft_mint', nftMint);
    }

    // Filter by wallet (sent or received)
    if (wallet) {
      query = query.or(`from_wallet.eq.${wallet},to_wallet.eq.${wallet}`);
    }

    const { data: transfers, error } = await (query as any);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.warn('⚠️ nft_transfers table does not exist yet');
        return NextResponse.json({
          success: true,
          transfers: [],
          message: 'Transfer tracking table not yet created'
        });
      }

      console.error('❌ Error fetching transfer history:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transfer history',
        details: error.message
      }, { status: 500 });
    }

    // Enrich transfers with additional data
    const enrichedTransfers = (transfers || []).map((transfer: any, index: number) => ({
      ...transfer,
      hop: index + 1,
      direction: wallet && transfer.from_wallet === wallet ? 'SENT' : 'RECEIVED',
      counterparty: wallet && transfer.from_wallet === wallet ? transfer.to_wallet : transfer.from_wallet
    }));

    return NextResponse.json({
      success: true,
      transfers: enrichedTransfers,
      totalTransfers: enrichedTransfers.length,
      nftMint,
      wallet
    });

  } catch (error: any) {
    console.error('❌ Error in transfer-history API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

