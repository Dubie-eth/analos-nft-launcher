/**
 * Clean Analos NFT Launcher Backend Server
 * Focused on blockchain-first NFT system
 */

import express from 'express';
import cors from 'cors';
import { nftTrackingService } from './nft-tracking-service.js';
import type { MintedNFT } from './nft-tracking-service.js';
import { blockchainRecoveryService } from './blockchain-recovery-service.js';
import { blockchainFirstNFTService } from './blockchain-first-nft-service.js';
import './initialize-recovery.js'; // Initialize recovery system on startup
import './initialize-los-bros-collection.js'; // Initialize Los Bros collection

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

console.log('🚀 Starting Analos NFT Launcher Backend Server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 ANALOS_RPC_URL: ${ANALOS_RPC_URL}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend',
    version: '2.0.4'
  });
});

// =============================================================================
// NFT TRACKING API ENDPOINTS
// =============================================================================

// Track a newly minted NFT
app.post('/api/nft/track', (req, res) => {
  try {
    const nft: MintedNFT = req.body;
    
    if (!nft.id || !nft.collectionName || !nft.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, collectionName, walletAddress'
      });
    }
    
    nftTrackingService.trackMintedNFT(nft);
    
    res.json({
      success: true,
      message: 'NFT tracked successfully'
    });
  } catch (error) {
    console.error('❌ Error tracking NFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track NFT'
    });
  }
});

// Get user's NFTs and statistics
app.get('/api/nft/user/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }
    
    const nfts = nftTrackingService.getUserNFTs(walletAddress);
    const stats = nftTrackingService.getUserStats(walletAddress);
    
    res.json({
      success: true,
      walletAddress,
      nfts,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting user NFTs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user NFTs'
    });
  }
});

// Get collection's NFTs and statistics
app.get('/api/nft/collection/:collectionName', (req, res) => {
  try {
    const { collectionName } = req.params;
    
    if (!collectionName) {
      return res.status(400).json({
        success: false,
        error: 'Collection name is required'
      });
    }
    
    const nfts = nftTrackingService.getCollectionNFTs(collectionName);
    const stats = nftTrackingService.getCollectionStats(collectionName);
    
    res.json({
      success: true,
      collectionName,
      nfts,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting collection NFTs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection NFTs'
    });
  }
});

// Get next token ID for a collection
app.get('/api/nft/next-token-id/:collectionName', (req, res) => {
  try {
    const { collectionName } = req.params;
    
    if (!collectionName) {
      return res.status(400).json({
        success: false,
        error: 'Collection name is required'
      });
    }
    
    const nextTokenId = nftTrackingService.generateNextTokenId(collectionName);
    
    res.json({
      success: true,
      collectionName,
      nextTokenId
    });
  } catch (error) {
    console.error('❌ Error getting next token ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next token ID'
    });
  }
});

// Get overall NFT statistics (admin function)
app.get('/api/nft/stats', (req, res) => {
  try {
    const allNFTs = nftTrackingService.getAllNFTs();
    const allUserStats = nftTrackingService.getAllUserStats();
    const allCollectionStats = nftTrackingService.getAllCollectionStats();
    
    res.json({
      success: true,
      stats: {
        totalNFTs: allNFTs.length,
        totalUsers: Object.keys(allUserStats).length,
        totalCollections: Object.keys(allCollectionStats).length,
        users: allUserStats,
        collections: allCollectionStats
      }
    });
  } catch (error) {
    console.error('❌ Error getting NFT stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT statistics'
    });
  }
});

// Create backup of all NFT data (admin function)
app.get('/api/nft/backup', (req, res) => {
  try {
    const backup = nftTrackingService.backupData();
    
    res.json({
      success: true,
      backup,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
});

// Restore NFT data from backup (admin function)
app.post('/api/nft/restore', (req, res) => {
  try {
    const { backup } = req.body;
    
    if (!backup) {
      return res.status(400).json({
        success: false,
        error: 'Backup data is required'
      });
    }
    
    nftTrackingService.restoreData(backup);
    
    res.json({
      success: true,
      message: 'Data restored successfully'
    });
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore data'
    });
  }
});

// =============================================================================
// BLOCKCHAIN RECOVERY API ENDPOINTS
// =============================================================================

// Add known mint addresses for scanning
app.post('/api/recovery/add-mints', (req, res) => {
  try {
    const { mints } = req.body;
    
    if (!mints || !Array.isArray(mints)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mints array is required' 
      });
    }
    
    blockchainRecoveryService.addKnownMints(mints);
    
    res.json({ 
      success: true, 
      message: `Added ${mints.length} mint addresses for scanning`,
      mints
    });
  } catch (error) {
    console.error('❌ Error adding mints for recovery:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add mints' 
    });
  }
});

// Scan specific mint for NFTs
app.get('/api/recovery/scan-mint/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    if (!mintAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mint address is required' 
      });
    }
    
    const nfts = await blockchainRecoveryService.scanMintForNFTs(mintAddress);
    
    res.json({ 
      success: true, 
      mintAddress,
      nfts,
      count: nfts.length
    });
  } catch (error) {
    console.error('❌ Error scanning mint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to scan mint' 
    });
  }
});

// Scan wallet for NFTs
app.get('/api/recovery/scan-wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    const nfts = await blockchainRecoveryService.scanWalletForNFTs(walletAddress);
    
    res.json({ 
      success: true, 
      walletAddress,
      nfts,
      count: nfts.length
    });
  } catch (error) {
    console.error('❌ Error scanning wallet:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to scan wallet' 
    });
  }
});

// Start full blockchain recovery scan
app.post('/api/recovery/scan-all', async (req, res) => {
  try {
    console.log('🚀 Starting full blockchain recovery scan...');
    
    const result = await blockchainRecoveryService.scanAllKnownMints();
    
    res.json({ 
      success: true, 
      message: 'Blockchain recovery scan completed',
      ...result
    });
  } catch (error) {
    console.error('❌ Error during blockchain recovery scan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete blockchain recovery scan' 
    });
  }
});

// Recover and save NFTs to backend
app.post('/api/recovery/save-nfts', async (req, res) => {
  try {
    const { nfts } = req.body;
    
    if (!nfts || !Array.isArray(nfts)) {
      return res.status(400).json({ 
        success: false, 
        error: 'NFTs array is required' 
      });
    }
    
    await blockchainRecoveryService.recoverAndSaveNFTs(nfts);
    
    res.json({ 
      success: true, 
      message: `Recovered and saved ${nfts.length} NFTs to backend`
    });
  } catch (error) {
    console.error('❌ Error saving recovered NFTs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save recovered NFTs' 
    });
  }
});

// Get recovery report
app.get('/api/recovery/report', async (req, res) => {
  try {
    const report = await blockchainRecoveryService.getRecoveryReport();
    
    res.json({ 
      success: true, 
      report
    });
  } catch (error) {
    console.error('❌ Error getting recovery report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get recovery report' 
    });
  }
});

// Full recovery process (scan + save)
app.post('/api/recovery/full-recovery', async (req, res) => {
  try {
    console.log('🚀 Starting full blockchain recovery process...');
    
    // Step 1: Scan all known mints
    const scanResult = await blockchainRecoveryService.scanAllKnownMints();
    
    // Step 2: Save recovered NFTs
    if (scanResult.nfts.length > 0) {
      await blockchainRecoveryService.recoverAndSaveNFTs(scanResult.nfts);
    }
    
    // Step 3: Get final report
    const finalReport = await blockchainRecoveryService.getRecoveryReport();
    
    res.json({ 
      success: true, 
      message: 'Full blockchain recovery completed',
      scanResults: scanResult,
      finalReport
    });
  } catch (error) {
    console.error('❌ Error during full blockchain recovery:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete full blockchain recovery' 
    });
  }
});

// =============================================================================
// BLOCKCHAIN-FIRST NFT API ENDPOINTS
// =============================================================================

// Create NFT with full blockchain metadata
app.post('/api/blockchain-first/create-nft', async (req, res) => {
  try {
    const {
      collectionName,
      tokenId,
      ownerWallet,
      mintPhase,
      mintPrice,
      paymentToken,
      creatorWallet,
      customAttributes
    } = req.body;

    if (!collectionName || !tokenId || !ownerWallet || !mintPhase) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: collectionName, tokenId, ownerWallet, mintPhase'
      });
    }

    const result = await blockchainFirstNFTService.createNFTWithFullMetadata(
      collectionName,
      tokenId,
      ownerWallet,
      mintPhase,
      mintPrice || 0,
      paymentToken || 'LOS',
      creatorWallet || ownerWallet,
      customAttributes || []
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error creating blockchain-first NFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NFT with blockchain metadata'
    });
  }
});

// Add known collection for tracking
app.post('/api/blockchain-first/add-collection', (req, res) => {
  try {
    const {
      collectionName,
      totalSupply,
      currentSupply,
      mintPrice,
      paymentToken,
      creatorWallet,
      isActive,
      mintingEnabled,
      phases,
      deployedAt
    } = req.body;

    if (!collectionName || !creatorWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: collectionName, creatorWallet'
      });
    }

    blockchainFirstNFTService.addKnownCollection({
      collectionName,
      totalSupply: totalSupply || 0,
      currentSupply: currentSupply || 0,
      mintPrice: mintPrice || 0,
      paymentToken: paymentToken || 'LOS',
      creatorWallet,
      isActive: isActive !== false,
      mintingEnabled: mintingEnabled !== false,
      phases: phases || [],
      deployedAt: deployedAt || Date.now()
    });

    res.json({
      success: true,
      message: `Collection ${collectionName} added to blockchain-first tracking`
    });
  } catch (error) {
    console.error('❌ Error adding collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add collection'
    });
  }
});

// Get next token ID for collection
app.get('/api/blockchain-first/next-token-id/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const nextTokenId = await blockchainFirstNFTService.getNextTokenId(collectionName);
    
    res.json({
      success: true,
      collectionName,
      nextTokenId
    });
  } catch (error) {
    console.error('❌ Error getting next token ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next token ID'
    });
  }
});

// Rebuild database from blockchain
app.post('/api/blockchain-first/rebuild-database', async (req, res) => {
  try {
    console.log('🚀 Starting blockchain-first database rebuild...');
    
    const result = await blockchainFirstNFTService.rebuildDatabaseFromBlockchain();
    
    res.json({
      message: 'Blockchain-first database rebuild completed',
      ...result
    });
  } catch (error) {
    console.error('❌ Error rebuilding database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild database from blockchain'
    });
  }
});

// Verify NFT ownership
app.get('/api/blockchain-first/verify-ownership/:mintAddress/:walletAddress', async (req, res) => {
  try {
    const { mintAddress, walletAddress } = req.params;
    
    const isOwner = await blockchainFirstNFTService.verifyNFTOwnership(mintAddress, walletAddress);
    
    res.json({
      success: true,
      mintAddress,
      walletAddress,
      isOwner
    });
  } catch (error) {
    console.error('❌ Error verifying NFT ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify NFT ownership'
    });
  }
});

// Get tracked collections
app.get('/api/blockchain-first/collections', (req, res) => {
  try {
    const collections = blockchainFirstNFTService.getTrackedCollections();
    
    res.json({
      success: true,
      collections,
      count: collections.length
    });
  } catch (error) {
    console.error('❌ Error getting tracked collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tracked collections'
    });
  }
});

// Get collection data
app.get('/api/blockchain-first/collection/:collectionName', (req, res) => {
  try {
    const { collectionName } = req.params;
    const collectionData = blockchainFirstNFTService.getCollectionData(collectionName);
    
    if (!collectionData) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }
    
    res.json({
      success: true,
      collection: collectionData
    });
  } catch (error) {
    console.error('❌ Error getting collection data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection data'
    });
  }
});

// Update collection data
app.put('/api/blockchain-first/collection/:collectionName', (req, res) => {
  try {
    const { collectionName } = req.params;
    const updates = req.body;
    
    blockchainFirstNFTService.updateCollectionData(collectionName, updates);
    
    res.json({
      success: true,
      message: `Collection ${collectionName} updated successfully`
    });
  } catch (error) {
    console.error('❌ Error updating collection data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update collection data'
    });
  }
});

// Scan collection for NFTs
app.get('/api/blockchain-first/scan-collection/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    const nfts = await blockchainFirstNFTService.scanCollectionForNFTs(mintAddress);
    
    res.json({
      success: true,
      mintAddress,
      nfts,
      count: nfts.length
    });
  } catch (error) {
    console.error('❌ Error scanning collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan collection'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos NFT Launcher Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 NFT Tracking API: http://localhost:${PORT}/api/nft/`);
  console.log(`🔍 Recovery API: http://localhost:${PORT}/api/recovery/`);
  console.log(`🔗 Blockchain-First API: http://localhost:${PORT}/api/blockchain-first/`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
