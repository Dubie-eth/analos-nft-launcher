import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

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

    // TODO: Replace with actual blockchain data fetching
    // For now, return mock data that simulates real profile NFTs
    const mockProfileNFTs: ProfileNFTMetadata[] = Array.from({ length: limit }, (_, i) => {
      const index = offset + i + 1;
      return {
        id: `profile-nft-${index}`,
        name: `Analos Profile #${String(index).padStart(3, '0')}`,
        image: `/api/placeholder/400/400?text=${index}`,
        description: `Analos Profile NFT #${index} - A unique digital identity for the Analos ecosystem`,
        owner: `AnalosUser...${String(index).padStart(4, '0')}`,
        mintNumber: index,
        floorPrice: 0.5 + (index * 0.1),
        volume: 1.2 + (index * 0.05),
        marketCap: 1000.0,
        topOffer: 0.48 + (index * 0.1),
        floorChange1d: (Math.random() - 0.5) * 20,
        volumeChange1d: (Math.random() - 0.5) * 30,
        sales1d: Math.floor(Math.random() * 10),
        listed: Math.floor(Math.random() * 5),
        listedPercentage: 0.5,
        owners: Math.floor(Math.random() * 50) + 10,
        ownersPercentage: 5.0,
        lastSale: {
          price: 0.5 + (index * 0.1),
          time: `${Math.floor(Math.random() * 24)}h ago`
        },
        attributes: {
          background: ['Matrix Drip', 'Galaxy', 'LOS Drip', 'Neon'][index % 4],
          rarity: ['Legendary', 'Mythic', 'Rare', 'Uncommon'][index % 4],
          tier: ['Diamond', 'Gold', 'Silver', 'Bronze'][index % 4],
          core: ['Analos Core', 'Matrix Core', 'LOS Core'][index % 3],
          dripGrade: ['A+', 'A', 'B+', 'B'][index % 4],
          dripScore: String(Math.floor(Math.random() * 100)),
          earring: ['Gold Hoop', 'Diamond Stud', 'Silver Chain'][index % 3],
          eyeColor: ['Blue', 'Green', 'Purple', 'Red'][index % 4],
          eyes: ['Laser Eyes', 'Normal', 'Glowing'][index % 3],
          faceDecoration: ['Tattoo', 'Scar', 'None'][index % 3],
          glasses: ['Sunglasses', 'Reading Glasses', 'None'][index % 3]
        },
        verified: true,
        chain: 'Analos',
        rank: index
      };
    });

    // Apply search filter
    let filteredNFTs = mockProfileNFTs;
    if (search) {
      filteredNFTs = mockProfileNFTs.filter(nft => 
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

    // Get collection stats
    const totalSupply = 1000; // This should come from the actual collection
    const totalListed = filteredNFTs.reduce((sum, nft) => sum + nft.listed, 0);
    const totalOwners = filteredNFTs.reduce((sum, nft) => sum + nft.owners, 0);
    const totalVolume = filteredNFTs.reduce((sum, nft) => sum + nft.volume, 0);
    const floorPrice = Math.min(...filteredNFTs.map(nft => nft.floorPrice));
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
          total: 1000, // This should come from actual data
          hasMore: offset + limit < 1000
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
