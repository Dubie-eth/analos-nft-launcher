/**
 * UNIFIED MARKETPLACE API
 * Shows ALL collections from the launchpad: Profile NFTs, Los Bros, and future collections
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const collectionType = searchParams.get('type') || 'all'; // 'all', 'profile', 'losbros', 'future'
    const search = searchParams.get('search') || '';

    console.log('🛒 Loading unified marketplace:', { limit, collectionType, search });

    const supabase = getSupabaseAdmin();

    // Build query based on collection type
    let query = supabase
      .from('profile_nfts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply collection type filter
    if (collectionType === 'profile') {
      query = query.is('los_bros_token_id', null);
    } else if (collectionType === 'losbros') {
      query = query.not('los_bros_token_id', 'is', null);
    }
    // 'all' shows everything

    // Apply search filter
    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data: nfts, error } = await query;

    if (error) {
      console.error('❌ Error fetching marketplace NFTs:', error);
      return NextResponse.json({
        success: true,
        nfts: [],
        collections: [],
        stats: { total: 0, profile: 0, losbros: 0 }
      });
    }

    // Transform NFTs for marketplace display
    const marketplaceNFTs = (nfts || []).map((nft: any) => {
      if (nft.los_bros_token_id) {
        // Los Bros NFT
        return {
          id: nft.mint_address,
          mint: nft.mint_address,
          name: `Los Bros #${nft.los_bros_token_id}`,
          image: `/api/los-bros/generate-image?tokenId=${nft.los_bros_token_id}`,
          description: `Los Bros #${nft.los_bros_token_id} - ${nft.los_bros_rarity} rarity PFP`,
          collection: 'Los Bros',
          collectionType: 'losbros',
          type: 'losbros',
          rarity: nft.los_bros_rarity,
          rarityScore: nft.los_bros_rarity_score,
          tier: nft.los_bros_tier,
          traits: nft.los_bros_traits || [],
          owner: nft.wallet_address,
          floorPrice: 0, // TODO: Add floor price logic
          volume: 0, // TODO: Add volume tracking
          marketCap: 0, // TODO: Add market cap calculation
          topOffer: 0, // TODO: Add offer system
          floorChange1d: 0, // TODO: Add price change tracking
          volumeChange1d: 0, // TODO: Add volume change tracking
          sales1d: 0, // TODO: Add sales tracking
          listed: 0, // TODO: Add listing status
          listedPercentage: 0, // TODO: Add listing percentage
          owners: 1, // TODO: Add unique owners count
          ownersPercentage: 0, // TODO: Add ownership percentage
          lastSale: null, // TODO: Add last sale tracking
          attributes: {
            background: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Background')?.value || 'Unknown',
            rarity: nft.los_bros_rarity,
            tier: nft.los_bros_tier,
            core: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Core')?.value || 'Unknown',
            dripGrade: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Drip Grade')?.value || 'Unknown',
            dripScore: nft.los_bros_rarity_score?.toString() || '0',
            earring: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Earring')?.value || 'None',
            eyeColor: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Eye Color')?.value || 'Unknown',
            eyes: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Eyes')?.value || 'Unknown',
            glasses: nft.los_bros_traits?.find((t: any) => t.trait_type === 'Glasses')?.value || 'None'
          },
          verified: true,
          chain: 'Analos',
          createdAt: nft.created_at
        };
      } else {
        // Profile NFT
        return {
          id: nft.mint_address,
          mint: nft.mint_address,
          name: `@${nft.username}`,
          image: `/api/profile-nft/generate-image?username=${nft.username}`,
          description: `Profile NFT for @${nft.username}`,
          collection: 'Analos Profiles',
          collectionType: 'profile',
          type: 'profile',
          username: nft.username,
          displayName: nft.display_name,
          bio: nft.bio,
          referralCode: nft.referral_code,
          owner: nft.wallet_address,
          floorPrice: 0, // TODO: Add floor price logic
          volume: 0, // TODO: Add volume tracking
          marketCap: 0, // TODO: Add market cap calculation
          topOffer: 0, // TODO: Add offer system
          floorChange1d: 0, // TODO: Add price change tracking
          volumeChange1d: 0, // TODO: Add volume change tracking
          sales1d: 0, // TODO: Add sales tracking
          listed: 0, // TODO: Add listing status
          listedPercentage: 0, // TODO: Add listing percentage
          owners: 1, // TODO: Add unique owners count
          ownersPercentage: 0, // TODO: Add ownership percentage
          lastSale: null, // TODO: Add last sale tracking
          attributes: {
            background: 'Profile',
            rarity: 'Unique',
            tier: nft.tier || 'COMMON',
            core: 'Username',
            dripGrade: 'Profile',
            dripScore: '100',
            earring: 'None',
            eyeColor: 'Profile',
            eyes: 'Profile',
            glasses: 'None'
          },
          verified: true,
          chain: 'Analos',
          createdAt: nft.created_at
        };
      }
    });

    // Calculate collection stats
    const profileCount = marketplaceNFTs.filter(nft => nft.type === 'profile').length;
    const losBrosCount = marketplaceNFTs.filter(nft => nft.type === 'losbros').length;

    // Group by collection
    const collections = [
      {
        name: 'Analos Profiles',
        type: 'profile',
        count: profileCount,
        floorPrice: 0, // TODO: Calculate actual floor price
        volume: 0, // TODO: Calculate actual volume
        change: 0 // TODO: Calculate actual change
      },
      {
        name: 'Los Bros',
        type: 'losbros',
        count: losBrosCount,
        floorPrice: 0, // TODO: Calculate actual floor price
        volume: 0, // TODO: Calculate actual volume
        change: 0 // TODO: Calculate actual change
      }
    ];

    console.log(`✅ Loaded ${marketplaceNFTs.length} NFTs (${profileCount} Profile + ${losBrosCount} Los Bros)`);

    return NextResponse.json({
      success: true,
      nfts: marketplaceNFTs,
      collections,
      stats: {
        total: marketplaceNFTs.length,
        profile: profileCount,
        losbros: losBrosCount
      },
      filters: {
        type: collectionType,
        search,
        limit
      }
    });

  } catch (error: any) {
    console.error('❌ Error in unified marketplace API:', error);
    return NextResponse.json({
      success: true,
      nfts: [],
      collections: [],
      stats: { total: 0, profile: 0, losbros: 0 }
    });
  }
}
