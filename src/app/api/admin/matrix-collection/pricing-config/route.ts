import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentPricingConfig, 
  setCurrentPricingConfig, 
  PricingConfig 
} from '@/lib/pricing-config-utils';
import { recordPricingChange } from '@/lib/pricing-history';
import { recordPricingChange } from '@/lib/pricing-history';

/**
 * PRICING CONFIGURATION API
 * Manages character-based pricing tiers and minting controls
 */

export async function GET(request: NextRequest) {
  try {
    const config = getCurrentPricingConfig();
    return NextResponse.json({
      success: true,
      config
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
    const updatedConfig: PricingConfig = {
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

    setCurrentPricingConfig(updatedConfig);

    // Record pricing change for history/analytics (best-effort)
    try {
      const adminActor = request.headers.get('x-admin-wallet') || undefined;
      await recordPricingChange(updatedConfig, adminActor || undefined);
    } catch (e) {
      console.warn('Failed to record pricing change history:', e);
    }

    // Record pricing change for history/analytics
    try {
      const adminActor = request.headers.get('x-admin-wallet') || undefined;
      await recordPricingChange(updatedConfig, adminActor || undefined);
    } catch (e) {
      console.warn('Failed to record pricing change history:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully',
      config: updatedConfig
    });

  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing configuration' },
      { status: 500 }
    );
  }
}
