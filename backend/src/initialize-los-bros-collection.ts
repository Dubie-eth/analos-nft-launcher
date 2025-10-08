/**
 * Initialize Los Bros Collection in Blockchain-First System
 * Sets up the existing deployed collection for blockchain-first tracking
 */

import { blockchainFirstNFTService } from './blockchain-first-nft-service.js';

export function initializeLosBrosCollection() {
  console.log('🚀 Initializing Los Bros Collection in Blockchain-First System...');
  
  // Los Bros collection configuration
  const losBrosConfig = {
    collectionName: 'Los Bros',
    totalSupply: 2222,
    currentSupply: 0, // Will be updated as NFTs are minted
    mintPrice: 4200.69, // Base price in LOS
    paymentToken: 'LOS',
    creatorWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    isActive: true,
    mintingEnabled: true,
    phases: [
      {
        name: 'OGs Phase',
        price: 0, // Free for whitelist
        supply: 500,
        startTime: Date.now(),
        endTime: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        name: 'Whitelist Phase',
        price: 2100.35, // 50% discount
        supply: 1000,
        startTime: Date.now() + (30 * 24 * 60 * 60 * 1000),
        endTime: Date.now() + (60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        name: 'Public Phase',
        price: 4200.69, // Full price
        supply: 722,
        startTime: Date.now() + (60 * 24 * 60 * 60 * 1000),
        endTime: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    ],
    deployedAt: Date.now()
  };
  
  try {
    // Add the collection to blockchain-first tracking
    blockchainFirstNFTService.addKnownCollection(losBrosConfig);
    
    console.log('✅ Los Bros Collection initialized successfully');
    console.log('📊 Collection Details:');
    console.log(`   Name: ${losBrosConfig.collectionName}`);
    console.log(`   Total Supply: ${losBrosConfig.totalSupply}`);
    console.log(`   Base Price: ${losBrosConfig.mintPrice} ${losBrosConfig.paymentToken}`);
    console.log(`   Creator: ${losBrosConfig.creatorWallet}`);
    console.log(`   Phases: ${losBrosConfig.phases.length}`);
    console.log(`   Contract: 883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP`);
    
    return losBrosConfig;
  } catch (error) {
    console.error('❌ Error initializing Los Bros Collection:', error);
    throw error;
  }
}

// Auto-initialize on import
initializeLosBrosCollection();
