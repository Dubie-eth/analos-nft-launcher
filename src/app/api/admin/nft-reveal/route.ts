import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

// Collection founder wallet (you)
const COLLECTION_FOUNDER = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, tokenIds, revealType = 'batch' } = body;

    // Verify founder access
    if (!walletAddress || walletAddress.toLowerCase() !== COLLECTION_FOUNDER.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized - Collection founder only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    if (revealType === 'batch' && Array.isArray(tokenIds)) {
      // Batch reveal multiple NFTs
      const { data, error } = await supabase
        .from('profile_nfts')
        .update({
          nft_metadata: supabase.raw(`
            COALESCE(nft_metadata, '{}') || 
            '{"is_revealed": true, "revealed_at": "${new Date().toISOString()}", "revealed_by": "${walletAddress}"}'::jsonb
          `)
        })
        .in('los_bros_token_id', tokenIds)
        .select('los_bros_token_id, nft_metadata');

      if (error) {
        console.error('Error batch revealing NFTs:', error);
        return NextResponse.json({ error: 'Failed to reveal NFTs' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        revealed: data?.length || 0,
        tokenIds: data?.map(nft => nft.los_bros_token_id) || []
      });

    } else if (revealType === 'all') {
      // Reveal all unrevealed NFTs
      const { data, error } = await supabase
        .from('profile_nfts')
        .update({
          nft_metadata: supabase.raw(`
            COALESCE(nft_metadata, '{}') || 
            '{"is_revealed": true, "revealed_at": "${new Date().toISOString()}", "revealed_by": "${walletAddress}"}'::jsonb
          `)
        })
        .not('los_bros_token_id', 'is', null)
        .or(`nft_metadata->>'is_revealed'.is.null,nft_metadata->>'is_revealed'.eq.false`)
        .select('los_bros_token_id');

      if (error) {
        console.error('Error revealing all NFTs:', error);
        return NextResponse.json({ error: 'Failed to reveal all NFTs' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        revealed: data?.length || 0,
        message: `Revealed ${data?.length || 0} NFTs`
      });

    } else {
      return NextResponse.json({ error: 'Invalid reveal type or token IDs' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ NFT reveal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Get reveal status for NFTs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const collectionId = searchParams.get('collectionId') || 'los-bros';

    // Verify founder access
    if (!walletAddress || walletAddress.toLowerCase() !== COLLECTION_FOUNDER.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized - Collection founder only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Get reveal status for all NFTs
    const { data: nfts, error } = await supabase
      .from('profile_nfts')
      .select('los_bros_token_id, nft_metadata, mint_date')
      .not('los_bros_token_id', 'is', null)
      .order('los_bros_token_id', { ascending: true });

    if (error) {
      console.error('Error fetching NFT reveal status:', error);
      return NextResponse.json({ error: 'Failed to fetch reveal status' }, { status: 500 });
    }

    const revealStats = {
      total: nfts?.length || 0,
      revealed: 0,
      unrevealed: 0,
      nfts: nfts?.map(nft => ({
        tokenId: nft.los_bros_token_id,
        isRevealed: nft.nft_metadata?.is_revealed === true,
        revealedAt: nft.nft_metadata?.revealed_at,
        revealedBy: nft.nft_metadata?.revealed_by,
        mintDate: nft.mint_date
      })) || []
    };

    revealStats.revealed = revealStats.nfts.filter(nft => nft.isRevealed).length;
    revealStats.unrevealed = revealStats.total - revealStats.revealed;

    return NextResponse.json({
      success: true,
      stats: revealStats
    });

  } catch (error: any) {
    console.error('❌ NFT reveal status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
