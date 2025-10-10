/**
 * Ultra Simple Server for Railway
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes with specific origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://analos-nft-launcher-9cxc.vercel.app',
    'https://analos-nft-launcher.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
}));

// Parse JSON bodies
app.use(express.json());

console.log('🚀 Starting Ultra Simple Server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend (Ultra Simple)',
    version: '1.0.0',
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.json({
    message: 'Analos NFT Launcher Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// API endpoints for frontend
app.get('/api/health', (req, res) => {
  console.log('API health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend API',
    version: '1.0.0',
    port: PORT
  });
});

// Collections backup endpoint (mock)
app.get('/api/collections/backup', (req, res) => {
  console.log('Collections backup requested');
  res.json({
    success: true,
    collections: [],
    timestamp: new Date().toISOString()
  });
});

// Mint stats endpoint (mock)
app.get('/api/mint-stats/:collectionName', (req, res) => {
  const { collectionName } = req.params;
  console.log(`Mint stats requested for: ${collectionName}`);
  res.json({
    success: true,
    collectionName: collectionName,
    totalMinted: 0,
    totalSupply: 1000,
    mintPrice: 0.1,
    timestamp: new Date().toISOString()
  });
});

// Blockchain-first collection endpoint (mock)
app.get('/api/blockchain-first/collection/:collectionName', (req, res) => {
  const { collectionName } = req.params;
  console.log(`Blockchain-first collection requested for: ${collectionName}`);
  res.json({
    success: true,
    collectionName: collectionName,
    data: {
      name: collectionName,
      totalSupply: 1000,
      currentSupply: 0,
      mintPrice: 0.1,
      isActive: true,
      mintingEnabled: true
    },
    timestamp: new Date().toISOString()
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
