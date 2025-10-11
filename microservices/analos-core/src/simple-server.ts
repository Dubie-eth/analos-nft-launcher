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
import { analosLaunchpadService } from './analos-program-service.js';
import { MintTrackingService } from './mint-tracking-service.js';
import { TickerRegistryService } from './ticker-registry-service.js';
import './initialize-recovery.js'; // Initialize recovery system on startup
import './initialize-los-bros-collection.js'; // Initialize Los Bros collection
import './init-price-oracle-automation.js'; // Initialize price oracle automation
import './init-keypair-rotation.js'; // Initialize keypair rotation with 2FA
import priceOracleAutomationRoutes from './routes/price-oracle-automation.js';
import keypairRotationRoutes from './routes/keypair-rotation.js';
// import testRoute from './test-route.js';

// Initialize services
const mintTrackingService = new MintTrackingService();
const tickerRegistryService = new TickerRegistryService();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration - use environment variable if available
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://analos-nft-launcher-9cxc.vercel.app',
      'https://analos-nft-launcher.vercel.app',
      'https://analosnftfrontendminimal.vercel.app',
      'https://*.vercel.app'
    ];

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'x-api-key']
}));

console.log('🌐 CORS Origins configured:', corsOrigins);
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
// COLLECTIONS API ENDPOINTS (for data persistence service)
// =============================================================================

// Collections backup endpoint
app.post('/api/collections/backup', (req, res) => {
  try {
    const { collections, timestamp, version } = req.body;
    
    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({
        success: false,
        error: 'Collections array is required'
      });
    }
    
    // For now, just acknowledge receipt - in a real system you'd save to database
    console.log(`📦 Received collections backup: ${collections.length} collections, version ${version}, timestamp ${timestamp}`);
    
    res.json({
      success: true,
      message: `Collections backup received: ${collections.length} collections`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error handling collections backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process collections backup'
    });
  }
});

// =============================================================================
// VERIFICATION API ENDPOINTS
// =============================================================================

// Get verification status for a collection
app.get('/api/verification/status/:collectionId', (req, res) => {
  try {
    const { collectionId } = req.params;
    
    if (!collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Collection ID is required'
      });
    }
    
    // For now, return a default verification status
    // In a real system, this would check actual verification data
    res.json({
      success: true,
      collectionId,
      isVerified: false,
      verificationData: {
        twitter: { verified: false, followers: 0 },
        telegram: { verified: false, members: 0 },
        discord: { verified: false, members: 0 }
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status'
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

// Get real-time mint statistics
app.get('/api/mint-stats/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    
    if (collectionName === 'Los Bros' || collectionName === 'los-bros' || collectionName === 'The LosBros') {
      console.log(`📊 Getting mint statistics for: ${collectionName}`);
      
      // Force refresh and get latest stats
      const stats = await mintTrackingService.forceRefresh();
      
      res.json({
        success: true,
        stats: {
          totalMinted: stats.totalMinted,
          totalSupply: stats.totalSupply,
          mintingProgress: (stats.totalMinted / stats.totalSupply * 100).toFixed(2),
          lastUpdated: stats.lastUpdated,
          recentMints: stats.mintedTokens.slice(0, 5) // Last 5 mints
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }
  } catch (error) {
    console.error('❌ Error getting mint statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mint statistics'
    });
  }
});

// Ticker Registry API Endpoints

// Check if a ticker is available
app.get('/api/ticker/check/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const availability = tickerRegistryService.isTickerAvailable(symbol);
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      available: availability.available,
      reason: availability.reason || null
    });
  } catch (error) {
    console.error('❌ Error checking ticker availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check ticker availability'
    });
  }
});

// Register a new ticker
app.post('/api/ticker/register', express.json(), (req, res) => {
  try {
    const { symbol, collectionName, collectionAddress, creatorWallet } = req.body;
    
    if (!symbol || !collectionName || !creatorWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, collectionName, creatorWallet'
      });
    }
    
    const result = tickerRegistryService.registerTicker(
      symbol,
      collectionName,
      collectionAddress || '',
      creatorWallet
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        symbol: symbol.toUpperCase()
      });
    } else {
      res.status(409).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error registering ticker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register ticker'
    });
  }
});

// Reserve a ticker temporarily
app.post('/api/ticker/reserve', express.json(), (req, res) => {
  try {
    const { symbol, creatorWallet } = req.body;
    
    if (!symbol || !creatorWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, creatorWallet'
      });
    }
    
    const result = tickerRegistryService.reserveTicker(symbol, creatorWallet);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        symbol: symbol.toUpperCase()
      });
    } else {
      res.status(409).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error reserving ticker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve ticker'
    });
  }
});

// Get ticker information
app.get('/api/ticker/info/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const tickerInfo = tickerRegistryService.getTickerInfo(symbol);
    
    if (tickerInfo) {
      res.json({
        success: true,
        ticker: tickerInfo
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Ticker not found'
      });
    }
  } catch (error) {
    console.error('❌ Error getting ticker info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ticker information'
    });
  }
});

// Search tickers
app.get('/api/ticker/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing search query parameter "q"'
      });
    }
    
    const results = tickerRegistryService.searchTickers(q);
    
    res.json({
      success: true,
      query: q,
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('❌ Error searching tickers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tickers'
    });
  }
});

// Get all registered tickers
app.get('/api/ticker/all', (req, res) => {
  try {
    const allTickers = tickerRegistryService.getAllTickers();
    const stats = tickerRegistryService.getStats();
    
    res.json({
      success: true,
      tickers: allTickers,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error getting all tickers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tickers'
    });
  }
});

// Get collection data
app.get('/api/blockchain-first/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    
    // For "Los Bros" collection, use mint tracking service for real-time data
    if (collectionName === 'Los Bros' || collectionName === 'los-bros' || collectionName === 'The LosBros') {
      console.log(`🔍 Fetching real-time mint data for: ${collectionName}`);
      
      // Scan for new mints and get current stats
      await mintTrackingService.scanForNewMints();
      const mintStats = mintTrackingService.getCollectionStats();
      
      // Create collection data with real-time mint count
      const realTimeCollectionData = {
        collectionName: 'Los Bros',
        totalSupply: mintStats.totalSupply,
        currentSupply: mintStats.totalMinted,
        mintPrice: 4200.69, // Your mint price in LOS
        paymentToken: 'LOS',
        creatorWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        isActive: true,
        mintingEnabled: mintStats.totalMinted < mintStats.totalSupply,
        phases: [],
        deployedAt: Date.now(),
        lastUpdated: mintStats.lastUpdated,
        mintedTokens: mintStats.mintedTokens.slice(0, 10) // Show last 10 mints
      };
      
      console.log(`✅ Real-time mint data: ${mintStats.totalMinted}/${mintStats.totalSupply} minted`);
      return res.json({
        success: true,
        collection: realTimeCollectionData
      });
    }
    
    // Fallback to cached data if blockchain fetch fails or for other collections
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

// =============================================================================
// ANALOS LAUNCHPAD PROGRAM API ENDPOINTS
// =============================================================================

// Get program information
app.get('/api/launchpad/info', (req, res) => {
  try {
    const info = analosLaunchpadService.getProgramInfo();
    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    console.error('❌ Error getting program info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get program info'
    });
  }
});

// Initialize a new collection (Admin only)
app.post('/api/launchpad/initialize', async (req, res) => {
  try {
    const {
      maxSupply,
      priceLamports,
      revealThreshold,
      collectionName,
      collectionSymbol,
      placeholderUri
    } = req.body;

    if (!maxSupply || !priceLamports || !revealThreshold || !collectionName || !collectionSymbol || !placeholderUri) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    const result = await analosLaunchpadService.initializeCollection({
      maxSupply,
      priceLamports,
      revealThreshold,
      collectionName,
      collectionSymbol,
      placeholderUri
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error initializing collection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize collection'
    });
  }
});

// Get collection configuration
app.get('/api/launchpad/collection/:authority', async (req, res) => {
  try {
    const { authority } = req.params;

    if (!authority) {
      return res.status(400).json({
        success: false,
        error: 'Authority address is required'
      });
    }

    const config = await analosLaunchpadService.getCollectionConfig(authority);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('❌ Error getting collection config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get collection config'
    });
  }
});

// Build mint instruction data
app.post('/api/launchpad/build-mint', async (req, res) => {
  try {
    const { payer, authority } = req.body;

    if (!payer || !authority) {
      return res.status(400).json({
        success: false,
        error: 'Payer and authority addresses are required'
      });
    }

    const result = await analosLaunchpadService.buildMintPlaceholderInstruction({
      payer,
      authority
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error building mint instruction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to build mint instruction'
    });
  }
});

// Reveal collection (Admin only)
app.post('/api/launchpad/reveal', async (req, res) => {
  try {
    const { authority, revealedBaseUri } = req.body;

    if (!authority || !revealedBaseUri) {
      return res.status(400).json({
        success: false,
        error: 'Authority and revealed base URI are required'
      });
    }

    const result = await analosLaunchpadService.revealCollection({
      authority,
      revealedBaseUri
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error revealing collection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reveal collection'
    });
  }
});

// Pause/unpause collection (Admin only)
app.post('/api/launchpad/pause', async (req, res) => {
  try {
    const { authority, paused } = req.body;

    if (!authority || typeof paused !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Authority and paused state are required'
      });
    }

    const result = await analosLaunchpadService.setPause({
      authority,
      paused
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error setting pause state:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set pause state'
    });
  }
});

// Update collection config (Admin only)
app.post('/api/launchpad/update-config', async (req, res) => {
  try {
    const { authority, newPrice, newRevealThreshold } = req.body;

    if (!authority) {
      return res.status(400).json({
        success: false,
        error: 'Authority address is required'
      });
    }

    const result = await analosLaunchpadService.updateConfig({
      authority,
      newPrice,
      newRevealThreshold
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error updating config:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update config'
    });
  }
});

// Withdraw funds (Admin only)
app.post('/api/launchpad/withdraw', async (req, res) => {
  try {
    const { authority, amount } = req.body;

    if (!authority || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Authority and amount are required'
      });
    }

    const result = await analosLaunchpadService.withdrawFunds({
      authority,
      amount
    });

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error withdrawing funds:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to withdraw funds'
    });
  }
});

// Get mint record
app.get('/api/launchpad/mint/:collectionConfig/:mintIndex', async (req, res) => {
  try {
    const { collectionConfig, mintIndex } = req.params;

    if (!collectionConfig || !mintIndex) {
      return res.status(400).json({
        success: false,
        error: 'Collection config and mint index are required'
      });
    }

    const mintRecord = await analosLaunchpadService.getMintRecord(
      collectionConfig,
      parseInt(mintIndex)
    );

    if (!mintRecord) {
      return res.status(404).json({
        success: false,
        error: 'Mint record not found'
      });
    }

    // Get rarity tier
    const rarityTier = analosLaunchpadService.getRarityTier(mintRecord.rarityScore);

    res.json({
      success: true,
      mintRecord,
      rarityTier
    });
  } catch (error: any) {
    console.error('❌ Error getting mint record:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get mint record'
    });
  }
});

// =============================================================================
// PRICE ORACLE AUTOMATION API ENDPOINTS
// =============================================================================

// =============================================================================
// TEST ROUTE (FOR DEBUGGING)
// =============================================================================

app.get('/api/test/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working!',
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend'
  });
});

app.get('/api/test/health', (req, res) => {
  res.json({
    success: true,
    message: 'Test routes are mounted and working',
    timestamp: new Date().toISOString()
  });
});

console.log('🧪 Test Routes API mounted at /api/test');

// =============================================================================
// PRICE ORACLE AUTOMATION API ENDPOINTS
// =============================================================================

app.use('/api/oracle/automation', priceOracleAutomationRoutes);
console.log('🤖 Price Oracle Automation API mounted at /api/oracle/automation');

// =============================================================================
// SECURE KEYPAIR ROTATION API ENDPOINTS (2FA PROTECTED)
// =============================================================================

app.use('/api/admin/keypair', keypairRotationRoutes);
console.log('🔐 Keypair Rotation API mounted at /api/admin/keypair');

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos NFT Launcher Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 NFT Tracking API: http://localhost:${PORT}/api/nft/`);
  console.log(`🔍 Recovery API: http://localhost:${PORT}/api/recovery/`);
  console.log(`🔗 Blockchain-First API: http://localhost:${PORT}/api/blockchain-first/`);
  console.log(`🎯 Analos Launchpad API: http://localhost:${PORT}/api/launchpad/`);
  console.log(`📈 Mint Stats API: http://localhost:${PORT}/api/mint-stats/`);
  
  // Start mint monitoring service
  console.log(`🔍 Starting mint monitoring service...`);
  mintTrackingService.startMonitoring(30000); // Check every 30 seconds
  
  // Start ticker registry cleanup (every 5 minutes)
  console.log(`🏷️ Starting ticker registry cleanup...`);
  setInterval(() => {
    tickerRegistryService.cleanupExpiredReservations();
  }, 5 * 60 * 1000); // 5 minutes
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
