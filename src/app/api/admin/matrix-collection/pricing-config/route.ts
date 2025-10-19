import { NextRequest, NextResponse } from 'next/server';

/**
 * PRICING CONFIGURATION API
 * Manages character-based pricing tiers and minting controls
 */

interface PricingConfig {
  enabled: boolean;
  pricingTiers: {
    tier5Plus: number;    // 5+ characters
    tier4: number;        // 4 characters  
    tier3: number;        // 3 characters
    tier2: number;        // 2 characters (reserved)
    tier1: number;        // 1 character (reserved)
  };
  reservedTiers: {
    tier2: boolean;       // 2 characters disabled
    tier1: boolean;       // 1 characters disabled
  };
}

// Default configuration
const DEFAULT_CONFIG: PricingConfig = {
  enabled: true,
  pricingTiers: {
    tier5Plus: 4.20,    // 5+ characters
    tier4: 42,          // 4 characters  
    tier3: 420,         // 3 characters
    tier2: 4200,        // 2 characters (reserved)
    tier1: 42000,       // 1 character (reserved)
  },
  reservedTiers: {
    tier2: true,        // 2 characters disabled
    tier1: true,        // 1 characters disabled
  }
};

// In-memory storage (in production, use a database)
let currentConfig: PricingConfig = DEFAULT_CONFIG;

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      config: currentConfig
    });
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    // Validate configuration
    if (!config || typeof config.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid configuration data' },
        { status: 400 }
      );
    }

    // Validate pricing tiers
    const requiredTiers = ['tier5Plus', 'tier4', 'tier3', 'tier2', 'tier1'];
    for (const tier of requiredTiers) {
      if (typeof config.pricingTiers?.[tier] !== 'number' || config.pricingTiers[tier] < 0) {
        return NextResponse.json(
          { error: `Invalid pricing for ${tier}` },
          { status: 400 }
        );
      }
    }

    // Validate reserved tiers
    if (typeof config.reservedTiers?.tier2 !== 'boolean' || 
        typeof config.reservedTiers?.tier1 !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid reserved tier configuration' },
        { status: 400 }
      );
    }

    // Update configuration
    currentConfig = {
      enabled: config.enabled,
      pricingTiers: {
        tier5Plus: config.pricingTiers.tier5Plus,
        tier4: config.pricingTiers.tier4,
        tier3: config.pricingTiers.tier3,
        tier2: config.pricingTiers.tier2,
        tier1: config.pricingTiers.tier1,
      },
      reservedTiers: {
        tier2: config.reservedTiers.tier2,
        tier1: config.reservedTiers.tier1,
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully',
      config: currentConfig
    });

  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing configuration' },
      { status: 500 }
    );
  }
}

// Export function to get current config (for use in other modules)
export function getCurrentPricingConfig(): PricingConfig {
  return currentConfig;
}

// Export function to calculate price based on username length
export function calculateMintPrice(username: string): { price: number; tier: string; available: boolean } {
  const length = username.length;
  
  if (length >= 5) {
    return {
      price: currentConfig.pricingTiers.tier5Plus,
      tier: '5+ Characters (Common)',
      available: currentConfig.enabled
    };
  } else if (length === 4) {
    return {
      price: currentConfig.pricingTiers.tier4,
      tier: '4 Characters (Premium)',
      available: currentConfig.enabled
    };
  } else if (length === 3) {
    return {
      price: currentConfig.pricingTiers.tier3,
      tier: '3 Characters (Ultra Premium)',
      available: currentConfig.enabled
    };
  } else if (length === 2) {
    return {
      price: currentConfig.pricingTiers.tier2,
      tier: '2 Characters (Reserved)',
      available: currentConfig.enabled && !currentConfig.reservedTiers.tier2
    };
  } else if (length === 1) {
    return {
      price: currentConfig.pricingTiers.tier1,
      tier: '1 Character (Reserved)',
      available: currentConfig.enabled && !currentConfig.reservedTiers.tier1
    };
  } else {
    return {
      price: 0,
      tier: 'Invalid',
      available: false
    };
  }
}
