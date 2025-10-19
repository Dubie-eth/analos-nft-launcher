import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * EXPORT MATRIX COLLECTION DATA
 * Exports all NFT data for analysis
 */

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        nfts: []
      });
    }

    // Fetch all profile NFTs
    const { data: nfts, error } = await supabaseAdmin
      .from('profile_nfts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching NFTs:', error);
      return NextResponse.json({ nfts: [] });
    }

    // Format data for export
    const exportData = nfts?.map(nft => {
      const metadata = typeof nft.nft_metadata === 'string' 
        ? JSON.parse(nft.nft_metadata) 
        : nft.nft_metadata;
      
      const variant = metadata?.attributes?.find(
        (attr: any) => attr.trait_type === 'Matrix Variant'
      )?.value || 'normal';

      return {
        username: nft.username,
        displayName: nft.display_name,
        walletAddress: nft.wallet_address,
        variant,
        twitterVerified: nft.twitter_verified ? 'Yes' : 'No',
        mintPrice: nft.mint_price,
        mintSignature: nft.mint_signature,
        explorerUrl: nft.explorer_url,
        createdAt: nft.created_at
      };
    }) || [];

    return NextResponse.json({
      nfts: exportData,
      count: exportData.length
    });

  } catch (error) {
    console.error('Error exporting collection data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
