import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.network';
const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

interface ProfileNFTMetadata {
  id: string;
  name: string;
  image: string;
  description: string;
  owner: string;
  mintNumber: number;
  floorPrice: number;
  volume: number;
  marketCap: number;
  topOffer: number;
  floorChange1d: number;
  volumeChange1d: number;
  sales1d: number;
  listed: number;
  listedPercentage: number;
  owners: number;
  ownersPercentage: number;
  lastSale: {
    price: number;
    time: string;
  };
  attributes: {
    background: string;
    rarity: string;
    tier: string;
    core: string;
    dripGrade: string;
    dripScore: string;
    earring: string;
    eyeColor: string;
    eyes: string;
    faceDecoration: string;
    glasses: string;
  };
  verified: boolean;
  chain: string;
  rank?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'mintNumber';
    const order = searchParams.get('order') || 'asc';

    // Fetch REAL Profile NFTs from database
    let realProfileNFTs: ProfileNFTMetadata[] = [];
    
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured - marketplace will be empty');
      return NextResponse.json({
        success: true,
        data: {
          nfts: [],
          collection: {
            name: 'Analos Profile NFTs',
            description: 'Unique profile NFTs for the Analos ecosystem',
            floorPrice: 0,
            volume24h: 0,
            sales24h: 0,
            listed: 0,
            supply: 0,
            owners: 0
          },
          pagination: { limit, offset, total: 0, hasMore: false }
        }
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Fetch Profile NFTs from database with pagination
    const { data: profileNFTs, error, count } = await (supabase
      .from('profile_nfts') as any)
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching Profile NFTs:', error);
      throw error;
    }

    console.log(`✅ Fetched ${profileNFTs?.length || 0} Profile NFTs from database`);

    // Transform database records to marketplace format
    realProfileNFTs = (profileNFTs || []).map((nft: any) => ({
      id: nft.id || nft.mint_address,
      name: `@${nft.username}`,
      image: `/api/profile-nft/generate-image?username=${encodeURIComponent(nft.username)}&tier=${nft.tier || 'basic'}&displayName=${encodeURIComponent(nft.display_name || nft.username)}&referralCode=${nft.username.toUpperCase().slice(0, 8)}&losBrosTokenId=${nft.los_bros_token_id || ''}&discordHandle=${encodeURIComponent(nft.discord_handle || '')}&telegramHandle=${encodeURIComponent(nft.telegram_handle || '')}`,
      description: `Profile NFT for @${nft.username} - ${nft.tier || 'basic'} tier${nft.los_bros_rarity ? ` with ${nft.los_bros_rarity} Los Bros` : ''}`,
      owner: nft.wallet_address,
      mintNumber: nft.mint_number || 0,
      floorPrice: 0, // Will be calculated from active listings
      volume: 0, // Will be calculated from sales
      marketCap: 0,
      topOffer: 0, // Will be calculated from offers
      floorChange1d: 0,
      volumeChange1d: 0,
      sales1d: 0,
      listed: 0, // Will be set if NFT has active listing
      listedPercentage: 0,
      owners: 1,
      ownersPercentage: 100,
      lastSale: {
        price: nft.mint_price || 0,
        time: nft.created_at ? new Date(nft.created_at).toLocaleDateString() : 'N/A'
      },
      attributes: {
        background: nft.tier || 'Standard',
        rarity: nft.los_bros_rarity || 'Standard',
        tier: nft.tier || 'basic',
        core: 'Analos Core',
        dripGrade: nft.los_bros_rarity ? 'A+' : 'A',
        dripScore: nft.los_bros_rarity ? '95' : '75',
        earring: 'None',
        eyeColor: 'Matrix Green',
        eyes: 'Matrix',
        faceDecoration: nft.discord_handle ? 'Discord' : 'None',
        glasses: nft.telegram_handle ? 'Connected' : 'None'
      },
      verified: true,
      chain: 'Analos',
      rank: nft.mint_number
    }));

    // Apply search filter
    let filteredNFTs = realProfileNFTs;
    if (search) {
      filteredNFTs = realProfileNFTs.filter(nft => 
        nft.name.toLowerCase().includes(search.toLowerCase()) ||
        nft.description.toLowerCase().includes(search.toLowerCase()) ||
        nft.attributes.rarity.toLowerCase().includes(search.toLowerCase()) ||
        nft.attributes.tier.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    filteredNFTs.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'floorPrice':
          aValue = a.floorPrice;
          bValue = b.floorPrice;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'mintNumber':
        default:
          aValue = a.mintNumber;
          bValue = b.mintNumber;
          break;
      }

      if (order === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    // Get collection stats from real data
    const totalSupply = count || 0; // Actual minted count from database
    const totalListed = filteredNFTs.reduce((sum, nft) => sum + nft.listed, 0);
    const totalOwners = filteredNFTs.length; // Each NFT has unique owner
    const totalVolume = filteredNFTs.reduce((sum, nft) => sum + nft.volume, 0);
    const floorPrice = filteredNFTs.length > 0 ? Math.min(...filteredNFTs.map(nft => nft.floorPrice)) : 0;
    const marketCap = filteredNFTs.reduce((sum, nft) => sum + nft.marketCap, 0);

    const collectionStats = {
      name: 'Analos Profile NFTs',
      description: 'Unique profile NFTs for the Analos ecosystem',
      image: '/api/placeholder/200/200',
      verified: true,
      floorPrice,
      floorChange1d: 5.2,
      topOffer: Math.max(...filteredNFTs.map(nft => nft.topOffer)),
      volume24h: totalVolume,
      sales24h: filteredNFTs.reduce((sum, nft) => sum + nft.sales1d, 0),
      volumeAll: totalVolume * 10, // Simulate all-time volume
      marketCap: marketCap * 0.0018, // Convert to USD
      listed: totalListed,
      supply: totalSupply,
      owners: totalOwners,
      socialLinks: {
        twitter: 'https://twitter.com/analos',
        discord: 'https://discord.gg/analos',
        website: 'https://analos.fun'
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        nfts: filteredNFTs,
        collection: collectionStats,
        pagination: {
          limit,
          offset,
          total: count || 0, // Actual count from database
          hasMore: offset + limit < (count || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profile NFTs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch profile NFTs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nftId } = body;

    if (!walletAddress || !nftId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // TODO: Implement actual NFT purchase logic
    // This would involve:
    // 1. Verifying the NFT exists and is for sale
    // 2. Creating a transaction to transfer the NFT
    // 3. Handling payment in LOS tokens
    // 4. Updating ownership records

    return NextResponse.json({
      success: true,
      message: 'NFT purchase initiated',
      transactionId: 'mock-transaction-id'
    });

  } catch (error) {
    console.error('Error processing NFT purchase:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process NFT purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
