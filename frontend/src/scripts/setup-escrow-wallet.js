/**
 * Setup Escrow Wallet Script
 * Initializes secure escrow wallet for The LosBros collection
 * Run this once to generate the escrow wallet configuration
 */

const { SecureEscrowWalletManager } = require('../lib/secure-escrow-wallet-manager');

async function setupEscrowWallet() {
  console.log('🔐 Setting up escrow wallet for The LosBros collection...');
  
  try {
    const escrowManager = new SecureEscrowWalletManager();
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_1 || '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
    
    // Generate escrow wallet
    const escrowConfig = await escrowManager.generateEscrowWallet(
      'collection_the_losbros',
      'The LosBros',
      adminWallet
    );
    
    console.log('✅ Escrow wallet setup complete!');
    console.log('📋 Escrow Configuration:');
    console.log(`   Collection ID: ${escrowConfig.collectionId}`);
    console.log(`   Collection Name: ${escrowConfig.collectionName}`);
    console.log(`   Escrow Address: ${escrowConfig.escrowAddress}`);
    console.log(`   Token Mint Address: ${escrowConfig.tokenMintAddress}`);
    console.log(`   Status: ${escrowConfig.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`   Access Level: ${escrowConfig.accessLevel}`);
    console.log(`   Created: ${escrowConfig.createdAt}`);
    
    // Test retrieval
    const retrievedConfig = await escrowManager.getEscrowWallet('collection_the_losbros', adminWallet);
    if (retrievedConfig) {
      console.log('✅ Escrow wallet retrieval test passed');
    } else {
      console.log('❌ Escrow wallet retrieval test failed');
    }
    
  } catch (error) {
    console.error('❌ Error setting up escrow wallet:', error);
  }
}

// Run the setup
setupEscrowWallet();
