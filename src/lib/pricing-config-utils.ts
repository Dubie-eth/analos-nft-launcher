/**
 * PRICING CONFIGURATION UTILITIES
 * Helper functions for pricing configuration management
 */

export interface PricingConfig {
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
export const DEFAULT_CONFIG: PricingConfig = {
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

// Export function to get current config
export function getCurrentPricingConfig(): PricingConfig {
  return currentConfig;
}

// Export function to set current config
export function setCurrentPricingConfig(config: PricingConfig): void {
  currentConfig = config;
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
