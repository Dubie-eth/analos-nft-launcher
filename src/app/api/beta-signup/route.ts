import { NextRequest, NextResponse } from 'next/server';

interface BetaSignupData {
  walletAddress: string;
  requestedFeatures: string[];
  timestamp: string;
}

// In-memory storage for demo (replace with database in production)
let betaSignups: BetaSignupData[] = [];
let featureVotes: Record<string, number> = {};

export async function POST(request: NextRequest) {
  try {
    const data: BetaSignupData = await request.json();
    
    // Validate the data
    if (!data.walletAddress || !data.requestedFeatures || !Array.isArray(data.requestedFeatures)) {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    // Check if wallet already signed up
    const existingSignup = betaSignups.find(signup => signup.walletAddress === data.walletAddress);
    
    if (existingSignup) {
      // Update existing signup
      existingSignup.requestedFeatures = data.requestedFeatures;
      existingSignup.timestamp = data.timestamp;
    } else {
      // Add new signup
      betaSignups.push(data);
    }

    // Update feature votes
    data.requestedFeatures.forEach(feature => {
      featureVotes[feature] = (featureVotes[feature] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      message: 'Beta signup submitted successfully',
      totalSignups: betaSignups.length,
      featureVotes
    });

  } catch (error) {
    console.error('Error processing beta signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return current stats
    const totalSignups = betaSignups.length;
    const uniqueFeatures = Object.keys(featureVotes);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalSignups,
        featureVotes,
        uniqueFeatures,
        recentSignups: betaSignups.slice(-10) // Last 10 signups
      }
    });

  } catch (error) {
    console.error('Error fetching beta signup stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
