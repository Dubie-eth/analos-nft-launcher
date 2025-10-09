/**
 * Initialize Blockchain Recovery System
 * Adds known mint addresses and prepares for NFT recovery
 */

import { blockchainRecoveryService } from './blockchain-recovery-service.js';

export function initializeRecoverySystem() {
  console.log('🚀 Initializing Blockchain Recovery System...');
  
  // Known mint addresses from the platform
  const knownMints = [
    '3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB', // Original recovery mint
    '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP', // Los Bros collection
    // Add more mint addresses as they are deployed
  ];
  
  // Add known mints to the recovery service
  blockchainRecoveryService.addKnownMints(knownMints);
  
  console.log(`✅ Recovery system initialized with ${knownMints.length} known mints`);
  console.log('📝 Known mints:', knownMints);
  
  return knownMints;
}

// Auto-initialize when this module is imported
initializeRecoverySystem();
