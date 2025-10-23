/**
 * PRICING API
 * Manages dynamic pricing for Profile NFTs based on username length
 * Pricing is controlled from admin panel
 */

import { NextRequest, NextResponse } from 'next/server';

// Default pricing structure (can be updated from admin panel)
// Balanced pricing aligns with established revenue model:
// - 30% to LOS Stakers (automatic distribution)
// - 70% to Platform (40% Treasury, 20% Development, 10% Marketing)
// At LOS = $0.0018 USD, covers all operational costs + sustainable profit margin
const DEFAULT_PRICING = {
  '3-digit': 15000,   // 15,000 LOS (~$27 USD) - Ultra Premium tier
  '4-digit': 6000,    // 6,000 LOS (~$10.80 USD) - Premium tier
  '5-plus': 2500      // 2,500 LOS (~$4.50 USD) - Standard tier
};

// Platform fee (6.9% on top of base price)
const PLATFORM_FEE_PERCENTAGE = 0.069;

// Revenue distribution (for transparency)
const REVENUE_DISTRIBUTION = {
  losStakers: 0.30,    // 30% to LOS stakers
  treasury: 0.40,      // 40% to treasury
  development: 0.20,   // 20% to development
  marketing: 0.10      // 10% to marketing
};

// In-memory pricing (in production, this would be stored in database)
let currentPricing = { ...DEFAULT_PRICING };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: true,
        pricing: currentPricing,
        message: 'Current pricing structure'
      });
    }

    // Determine pricing tier based on username length
    const usernameLength = username.length;
    
    // Minimum username length is 3 characters
    if (usernameLength < 3) {
      return NextResponse.json({
        success: false,
        error: 'Username must be at least 3 characters long',
        message: 'Minimum username length is 3 characters'
      }, { status: 400 });
    }
    
    let tier: string;
    let price: number;

    if (usernameLength === 3) {
      tier = '3-digit';
      price = currentPricing['3-digit'];
    } else if (usernameLength === 4) {
      tier = '4-digit';
      price = currentPricing['4-digit'];
    } else {
      tier = '5-plus';
      price = currentPricing['5-plus'];
    }

    // Calculate platform fee
    const platformFee = Math.ceil(price * PLATFORM_FEE_PERCENTAGE);
    const totalPrice = price + platformFee;

    // Calculate revenue distribution (for transparency)
    const revenueBreakdown = {
      losStakers: Math.floor(price * REVENUE_DISTRIBUTION.losStakers),
      treasury: Math.floor(price * REVENUE_DISTRIBUTION.treasury),
      development: Math.floor(price * REVENUE_DISTRIBUTION.development),
      marketing: Math.floor(price * REVENUE_DISTRIBUTION.marketing)
    };

    return NextResponse.json({
      success: true,
      username: username,
      length: usernameLength,
      tier: tier,
      basePrice: price,
      platformFee: platformFee,
      totalPrice: totalPrice,
      currency: 'LOS',
      breakdown: {
        base: price,
        fee: platformFee,
        total: totalPrice,
        feePercentage: `${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(1)}%`
      },
      revenueDistribution: {
        description: 'How your payment supports the ecosystem',
        losStakers: {
          amount: revenueBreakdown.losStakers,
          percentage: '30%',
          description: 'Distributed to LOS token stakers'
        },
        treasury: {
          amount: revenueBreakdown.treasury,
          percentage: '40%',
          description: 'Platform sustainability & operations'
        },
        development: {
          amount: revenueBreakdown.development,
          percentage: '20%',
          description: 'New features & improvements'
        },
        marketing: {
          amount: revenueBreakdown.marketing,
          percentage: '10%',
          description: 'Community growth & adoption'
        }
      },
      message: `Pricing for ${username}: ${totalPrice} LOS total (${price} base + ${platformFee} fee)`
    });

  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pricing'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pricing } = body;

    // Check if user is admin (in production, add proper authentication)
    const isAdmin = true; // TODO: Add proper admin authentication

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Admin access required'
      }, { status: 401 });
    }

    if (action === 'update-pricing') {
      // Update pricing structure
      if (pricing && typeof pricing === 'object') {
        currentPricing = {
          '3-digit': pricing['3-digit'] || currentPricing['3-digit'],
          '4-digit': pricing['4-digit'] || currentPricing['4-digit'],
          '5-plus': pricing['5-plus'] || currentPricing['5-plus']
        };

        return NextResponse.json({
          success: true,
          pricing: currentPricing,
          message: 'Pricing updated successfully'
        });
      }
    }

    if (action === 'reset-pricing') {
      // Reset to default pricing
      currentPricing = { ...DEFAULT_PRICING };
      
      return NextResponse.json({
        success: true,
        pricing: currentPricing,
        message: 'Pricing reset to defaults'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update pricing'
    }, { status: 500 });
  }
}
