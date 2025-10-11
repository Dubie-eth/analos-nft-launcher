/**
 * Analos Core NFT Launchpad Service
 * Microservice 1 of 3: Core NFT functionality
 * 
 * Responsibilities:
 * - NFT minting & collections
 * - Marketplace
 * - User profiles  
 * - IPFS uploads
 * - RPC proxy
 */

import express from 'express';
import cors from 'cors';
import { nftTrackingService } from './nft-tracking-service.js';
import { blockchainRecoveryService } from './blockchain-recovery-service.js';
import { blockchainFirstNFTService } from './blockchain-first-nft-service.js';
import { analosLaunchpadService } from './analos-program-service.js';
import { MintTrackingService } from './mint-tracking-service.js';
import { TickerRegistryService } from './ticker-registry-service.js';
import './initialize-recovery.js';
import './initialize-los-bros-collection.js';

// Initialize services
const mintTrackingService = new MintTrackingService();
const tickerRegistryService = new TickerRegistryService();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://analos-nft-launcher-9cxc.vercel.app',
      'https://analos-nft-launcher.vercel.app',
      'https://*.vercel.app'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
}));

console.log('🌐 CORS Origins configured:', corsOrigins);
app.use(express.json());

const ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

console.log('🚀 Starting Analos Core NFT Launchpad Service...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 ANALOS_RPC_URL: ${ANALOS_RPC_URL}`);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos Core NFT Launchpad',
    version: '1.0.0'
  });
});

// ============================================================================
// NFT TRACKING API
// ============================================================================

app.get('/api/nft/all', async (req, res) => {
  try {
    const nfts = await nftTrackingService.getAllNFTs();
    res.json({ success: true, nfts });
  } catch (error: any) {
    console.error('Error fetching all NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const nfts = await nftTrackingService.getNFTsByCollection(collectionName);
    res.json({ success: true, collection: collectionName, nfts });
  } catch (error: any) {
    console.error('Error fetching collection NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    const nft = await nftTrackingService.getNFT(mintAddress);
    
    if (!nft) {
      return res.status(404).json({ success: false, error: 'NFT not found' });
    }
    
    res.json({ success: true, nft });
  } catch (error: any) {
    console.error('Error fetching NFT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RECOVERY API  
// ============================================================================

app.post('/api/recovery/scan', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }
    
    const result = await blockchainRecoveryService.scanWallet(walletAddress);
    res.json(result);
  } catch (error: any) {
    console.error('Error scanning wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/recovery/recover', async (req, res) => {
  try {
    const { walletAddress, collections } = req.body;
    
    if (!walletAddress || !collections) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const result = await blockchainRecoveryService.recoverCollections(walletAddress, collections);
    res.json(result);
  } catch (error: any) {
    console.error('Error recovering collections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BLOCKCHAIN-FIRST API
// ============================================================================

app.get('/api/blockchain-first/nfts', async (req, res) => {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }
    
    const nfts = await blockchainFirstNFTService.fetchWalletNFTs(wallet as string);
    res.json({ success: true, nfts });
  } catch (error: any) {
    console.error('Error fetching blockchain NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LAUNCHPAD API
// ============================================================================

app.get('/api/launchpad/collections', async (req, res) => {
  try {
    const collections = await analosLaunchpadService.getAllCollections();
    res.json({ success: true, collections });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/launchpad/collection/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const collection = await analosLaunchpadService.getCollection(address);
    
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    
    res.json({ success: true, collection });
  } catch (error: any) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MINT STATS API
// ============================================================================

app.get('/api/mint-stats/:collectionAddress', async (req, res) => {
  try {
    const { collectionAddress } = req.params;
    const stats = await mintTrackingService.getCollectionStats(collectionAddress);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching mint stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TICKER REGISTRY API
// ============================================================================

app.post('/api/ticker/check', async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ success: false, error: 'Ticker required' });
    }
    
    const isAvailable = await tickerRegistryService.isTickerAvailable(ticker);
    res.json({ success: true, available: isAvailable });
  } catch (error: any) {
    console.error('Error checking ticker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ticker/reserve', async (req, res) => {
  try {
    const { ticker, walletAddress } = req.body;
    
    if (!ticker || !walletAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const result = await tickerRegistryService.reserveTicker(ticker, walletAddress);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error reserving ticker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos Core Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 NFT Tracking API: http://localhost:${PORT}/api/nft/`);
  console.log(`🔍 Recovery API: http://localhost:${PORT}/api/recovery/`);
  console.log(`🔗 Blockchain-First API: http://localhost:${PORT}/api/blockchain-first/`);
  console.log(`🎯 Launchpad API: http://localhost:${PORT}/api/launchpad/`);
  console.log(`📈 Mint Stats API: http://localhost:${PORT}/api/mint-stats/`);
  
  // Start mint monitoring
  console.log(`🔍 Starting mint monitoring service...`);
  mintTrackingService.startMonitoring(30000);
  
  // Start ticker registry cleanup
  console.log(`🏷️ Starting ticker registry cleanup...`);
  setInterval(() => {
    tickerRegistryService.cleanupExpiredReservations();
  }, 5 * 60 * 1000);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

