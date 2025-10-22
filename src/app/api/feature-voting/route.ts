import { NextRequest, NextResponse } from 'next/server';

interface FeatureVote {
  featureId: string;
  walletAddress: string;
  tokenBalance: number;
  voteWeight: number;
  timestamp: string;
}

interface FeatureRequest {
  id: string;
  name: string;
  description: string;
  targetThreshold: number; // LOL tokens needed to trigger development
  currentVotes: number;
  totalWeight: number;
  status: 'active' | 'funded' | 'in_development' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for demo (replace with database in production)
let featureRequests: FeatureRequest[] = [
  {
    id: 'profile-nft',
    name: 'Profile NFTs',
    description: 'Mint unique profile NFTs with custom avatars and metadata',
    targetThreshold: 100000000, // 100M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'Buy and sell NFTs with advanced filtering and analytics',
    targetThreshold: 150000000, // 150M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'collection-launcher',
    name: 'Collection Launcher',
    description: 'Launch your own NFT collections with custom metadata',
    targetThreshold: 200000000, // 200M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'staking-rewards',
    name: 'NFT Staking',
    description: 'Stake your NFTs to earn rewards and passive income',
    targetThreshold: 120000000, // 120M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'referral-system',
    name: 'Referral System',
    description: 'Earn rewards for referring new users to the platform',
    targetThreshold: 80000000, // 80M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'token-swap',
    name: 'Token Swap',
    description: 'Swap tokens directly on the Analos blockchain',
    targetThreshold: 180000000, // 180M LOL tokens
    currentVotes: 0,
    totalWeight: 0,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let userVotes: FeatureVote[] = [];

// Mock function to get user's LOL token balance
async function getUserTokenBalance(walletAddress: string): Promise<number> {
  // In a real implementation, this would query the blockchain
  // For demo purposes, return a random balance between 1000 and 10000000
  return Math.floor(Math.random() * 9900000) + 1000;
}

// Calculate vote weight based on token balance
function calculateVoteWeight(tokenBalance: number): number {
  // Weighted voting: users with more tokens have more voting power
  // But with diminishing returns to prevent whale dominance
  return Math.floor(Math.sqrt(tokenBalance) * 100);
}

export async function GET() {
  try {
    // Calculate current vote totals
    const updatedFeatures = featureRequests.map(feature => {
      const featureVotes = userVotes.filter(vote => vote.featureId === feature.id);
      const totalWeight = featureVotes.reduce((sum, vote) => sum + vote.voteWeight, 0);
      const currentVotes = featureVotes.length;
      
      return {
        ...feature,
        currentVotes,
        totalWeight,
        progress: Math.min((totalWeight / feature.targetThreshold) * 100, 100),
        status: totalWeight >= feature.targetThreshold ? 'funded' : 'active'
      };
    });

    return NextResponse.json({
      success: true,
      features: updatedFeatures,
      totalVoters: userVotes.length,
      totalWeight: userVotes.reduce((sum, vote) => sum + vote.voteWeight, 0)
    });

  } catch (error) {
    console.error('Error fetching feature voting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, featureIds } = await request.json();
    
    if (!walletAddress || !Array.isArray(featureIds)) {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    // Get user's token balance
    const tokenBalance = await getUserTokenBalance(walletAddress);
    const voteWeight = calculateVoteWeight(tokenBalance);

    // Remove existing votes for this user
    userVotes = userVotes.filter(vote => vote.walletAddress !== walletAddress);

    // Add new votes
    const newVotes = featureIds.map((featureId: string) => ({
      featureId,
      walletAddress,
      tokenBalance,
      voteWeight,
      timestamp: new Date().toISOString()
    }));

    userVotes.push(...newVotes);

    // Update feature totals
    const updatedFeatures = featureRequests.map(feature => {
      const featureVotes = userVotes.filter(vote => vote.featureId === feature.id);
      const totalWeight = featureVotes.reduce((sum, vote) => sum + vote.voteWeight, 0);
      const currentVotes = featureVotes.length;
      
      return {
        ...feature,
        currentVotes,
        totalWeight,
        progress: Math.min((totalWeight / feature.targetThreshold) * 100, 100),
        status: totalWeight >= feature.targetThreshold ? 'funded' : 'active'
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Votes submitted successfully',
      userBalance: tokenBalance,
      voteWeight,
      features: updatedFeatures,
      totalVoters: userVotes.length,
      totalWeight: userVotes.reduce((sum, vote) => sum + vote.voteWeight, 0)
    });

  } catch (error) {
    console.error('Error processing feature votes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to update feature requests
export async function PUT(request: NextRequest) {
  try {
    const { featureId, updates } = await request.json();
    
    if (!featureId || !updates) {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    const featureIndex = featureRequests.findIndex(f => f.id === featureId);
    if (featureIndex === -1) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Update the feature
    featureRequests[featureIndex] = {
      ...featureRequests[featureIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully',
      feature: featureRequests[featureIndex]
    });

  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
