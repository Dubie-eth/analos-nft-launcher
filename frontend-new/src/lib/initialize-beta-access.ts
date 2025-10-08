/**
 * Initialize Beta Access
 * Add initial beta users and configure the system
 */

import { betaAccessService } from './beta-access-service';

export function initializeBetaAccess() {
  // Add the collection creator as the first beta user
  const creatorWallet = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
  
  // Check if already initialized
  const whitelist = betaAccessService.getBetaWhitelist();
  if (whitelist.length > 0) {
    console.log('✅ Beta access already initialized');
    return;
  }

  // Add creator to beta whitelist
  const success = betaAccessService.addToBetaWhitelist(creatorWallet, 'system', 'Collection creator - initial beta access');
  
  if (success) {
    console.log('✅ Initialized beta access with creator wallet:', creatorWallet);
  } else {
    console.log('⚠️ Failed to initialize beta access');
  }

  // Set initial configuration
  betaAccessService.updateBetaAccessConfig({
    isPublicAccessEnabled: false,
    maxBetaUsers: 50,
    currentBetaUsers: 1
  });

  console.log('✅ Beta access system initialized');
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  initializeBetaAccess();
}
