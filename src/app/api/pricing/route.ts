/**
 * PRICING API
 * Manages dynamic pricing for Profile NFTs based on username length
 * Pricing is controlled from admin panel
 */

import { NextRequest, NextResponse } from 'next/server';

// Default pricing structure (can be updated from admin panel)
const DEFAULT_PRICING = {
  '3-digit': 420,    // 420 LOS for 3-digit usernames
  '4-digit': 42,      // 42 LOS for 4-digit usernames  
  '5-plus': 4.20     // 4.20 LOS for 5+ digit usernames
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
    let tier: string;
    let price: number;

    if (usernameLength <= 3) {
      tier = '3-digit';
      price = currentPricing['3-digit'];
    } else if (usernameLength === 4) {
      tier = '4-digit';
      price = currentPricing['4-digit'];
    } else {
      tier = '5-plus';
      price = currentPricing['5-plus'];
    }

    return NextResponse.json({
      success: true,
      username: username,
      length: usernameLength,
      tier: tier,
      price: price,
      currency: 'LOS',
      message: `Pricing for ${username}: ${price} LOS (${tier} tier)`
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
