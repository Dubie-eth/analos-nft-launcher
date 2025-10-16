/**
 * FEATURE FLAGS SYSTEM
 * Enables staged rollouts and A/B testing for marketing-driven deployments
 */

export interface FeatureFlags {
  // Marketing Pages
  NEW_LANDING_PAGE: boolean;
  ENHANCED_PROFILE: boolean;
  SOCIAL_FEATURES: boolean;
  LEADERBOARD: boolean;
  
  // Experimental Features
  BETA_ONBOARDING: boolean;
  ADVANCED_ANALYTICS: boolean;
  MOBILE_OPTIMIZATIONS: boolean;
  
  // Core Features (Always true - never disable)
  WALLET_CONNECTION: boolean;
  NFT_MINTING: boolean;
  MARKETPLACE: boolean;
  WHITELIST: boolean;
}

/**
 * Get feature flags from environment variables
 * Allows gradual rollout and A/B testing
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Marketing Pages - can be toggled for campaigns
    NEW_LANDING_PAGE: process.env.NEXT_PUBLIC_NEW_LANDING === 'true',
    ENHANCED_PROFILE: process.env.NEXT_PUBLIC_ENHANCED_PROFILE === 'true' || true, // Default true
    SOCIAL_FEATURES: process.env.NEXT_PUBLIC_SOCIAL_FEATURES === 'true' || true,
    LEADERBOARD: process.env.NEXT_PUBLIC_LEADERBOARD === 'true' || true,
    
    // Experimental Features - for testing
    BETA_ONBOARDING: process.env.NEXT_PUBLIC_BETA_ONBOARDING === 'true',
    ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ADVANCED_ANALYTICS === 'true',
    MOBILE_OPTIMIZATIONS: process.env.NEXT_PUBLIC_MOBILE_OPTIMIZATIONS === 'true' || true,
    
    // Core Features - NEVER disable these
    WALLET_CONNECTION: true,
    NFT_MINTING: true,
    MARKETPLACE: true,
    WHITELIST: true,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Get user-specific feature flags (for A/B testing)
 * Can be extended to include user segments, geographic location, etc.
 */
export function getUserFeatureFlags(userWallet?: string): FeatureFlags {
  const baseFlags = getFeatureFlags();
  
  // Example: A/B test based on wallet address
  if (userWallet) {
    const isTestGroup = userWallet.slice(-1) === '0' || userWallet.slice(-1) === '1';
    
    return {
      ...baseFlags,
      // Example: Show new landing page to 20% of users
      NEW_LANDING_PAGE: isTestGroup ? true : baseFlags.NEW_LANDING_PAGE,
    };
  }
  
  return baseFlags;
}

/**
 * Hook for React components to use feature flags
 */
export function useFeatureFlags(userWallet?: string) {
  return getUserFeatureFlags(userWallet);
}

/**
 * Server-side feature flag check (for SSR)
 */
export function getServerFeatureFlags(): FeatureFlags {
  return getFeatureFlags();
}
