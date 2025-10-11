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
import { NFTTrackingService } from './nft-tracking-service.js';
import { MintTrackingService } from './mint-tracking-service.js';
import { TickerRegistryService } from './ticker-registry-service.js';

// Initialize services
const nftTrackingService = new NFTTrackingService();
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
      'https://analosnftfrontendminimal.vercel.app',
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
    const nfts = nftTrackingService.getAllNFTs();
    res.json({ success: true, nfts });
  } catch (error: any) {
    console.error('Error fetching all NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const nfts = nftTrackingService.getCollectionNFTs(collectionName);
    res.json({ success: true, collection: collectionName, nfts });
  } catch (error: any) {
    console.error('Error fetching collection NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const nfts = nftTrackingService.getUserNFTs(walletAddress);
    res.json({ success: true, walletAddress, nfts });
  } catch (error: any) {
    console.error('Error fetching user NFTs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/stats/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const stats = nftTrackingService.getUserStats(walletAddress);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/nft/stats/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const stats = nftTrackingService.getCollectionStats(collectionName);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching collection stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/nft/track', async (req, res) => {
  try {
    const nft = req.body;
    nftTrackingService.trackMintedNFT(nft);
    res.json({ success: true, message: 'NFT tracked successfully' });
  } catch (error: any) {
    console.error('Error tracking NFT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MINT STATS API
// ============================================================================

app.get('/api/mint-stats/:collectionAddress', async (req, res) => {
  try {
    const { collectionAddress } = req.params;
    const stats = mintTrackingService.getCollectionStats();
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
    
    const isAvailable = tickerRegistryService.isTickerAvailable(ticker);
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
    
    const result = tickerRegistryService.reserveTicker(ticker, walletAddress);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error reserving ticker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RPC PROXY (Basic implementation)
// ============================================================================

app.post('/api/rpc/proxy', async (req, res) => {
  try {
    const response = await fetch(ANALOS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error proxying RPC request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos Core Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 NFT Tracking API: http://localhost:${PORT}/api/nft/`);
  console.log(`📈 Mint Stats API: http://localhost:${PORT}/api/mint-stats/`);
  console.log(`🏷️  Ticker Registry API: http://localhost:${PORT}/api/ticker/`);
  console.log(`🔗 RPC Proxy API: http://localhost:${PORT}/api/rpc/proxy`);
  
  // Start mint monitoring
  console.log(`🔍 Starting mint monitoring service...`);
  mintTrackingService.startMonitoring(30000);
  
  // Start ticker registry cleanup
  console.log(`🏷️  Starting ticker registry cleanup...`);
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
