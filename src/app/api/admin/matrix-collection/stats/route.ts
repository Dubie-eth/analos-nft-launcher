import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * GET MATRIX COLLECTION STATS
 * Returns statistics about the Matrix NFT collection
 */

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization (you can add proper auth here)
    
    if (!isSupabaseConfigured()) {
      // Return mock data if Supabase is not configured
      return NextResponse.json({
        stats: {
          totalMinted: 0,
          normalMints: 0,
          matrixHackers: 0,
          neoVariants: 0,
          oracleChosen: 0,
          totalRevenue: 0,
          last24Hours: 0,
          uniqueHolders: 0
        },
        config: {
          minUsernameLength: 4
        }
      });
    }

    // Fetch profile NFTs from database
    const { data: nfts, error } = await supabaseAdmin
      .from('profile_nfts')
      .select('*');

    if (error) {
      console.error('Error fetching NFTs:', error);
      return NextResponse.json({
        stats: {
          totalMinted: 0,
          normalMints: 0,
          matrixHackers: 0,
          neoVariants: 0,
          oracleChosen: 0,
          totalRevenue: 0,
          last24Hours: 0,
          uniqueHolders: 0
        },
        config: {
          minUsernameLength: 4
        }
      });
    }

    // Calculate stats
    const totalMinted = nfts?.length || 0;
    const uniqueHolders = new Set(nfts?.map(nft => nft.wallet_address) || []).size;
    
    // Count variants
    let normalMints = 0;
    let matrixHackers = 0;
    let neoVariants = 0;
    let oracleChosen = 0;

    nfts?.forEach(nft => {
      const metadata = typeof nft.nft_metadata === 'string' 
        ? JSON.parse(nft.nft_metadata) 
        : nft.nft_metadata;
      
      const variant = metadata?.attributes?.find(
        (attr: any) => attr.trait_type === 'Matrix Variant'
      )?.value || 'normal';

      if (variant === 'matrix_hacker') matrixHackers++;
      else if (variant === 'neo_variant') neoVariants++;
      else if (variant === 'oracle_chosen') oracleChosen++;
      else normalMints++;
    });

    // Calculate last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last24Hours = nfts?.filter(nft => nft.created_at > oneDayAgo).length || 0;

    // Calculate revenue (4.20 LOS per mint)
    const totalRevenue = totalMinted * 4.20;

    return NextResponse.json({
      stats: {
        totalMinted,
        normalMints,
        matrixHackers,
        neoVariants,
        oracleChosen,
        totalRevenue,
        last24Hours,
        uniqueHolders
      },
      config: {
        minUsernameLength: 4
      }
    });

  } catch (error) {
    console.error('Error fetching collection stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection stats' },
      { status: 500 }
    );
  }
}
