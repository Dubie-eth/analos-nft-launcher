/**
 * Clean Analos NFT Launcher Backend Server
 * Simple, working server for Railway deployment
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
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
app.use(express.json());

console.log('🚀 Starting Clean Analos NFT Launcher Backend Server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 ANALOS_RPC_URL: ${process.env.ANALOS_RPC_URL || 'https://rpc.analos.io'}`);
console.log(`🔑 PROGRAM_ID: ${process.env.NFT_LAUNCHPAD_PROGRAM_ID || 'FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo'}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend (Clean)',
    version: '1.0.0',
    environment: {
      port: PORT,
      analosRpcUrl: process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
      programId: process.env.NFT_LAUNCHPAD_PROGRAM_ID || 'FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend API (Clean)',
    version: '1.0.0'
  });
});

// NFT Launchpad status
app.get('/api/nft-launchpad/status', (req, res) => {
  res.json({
    success: true,
    message: 'NFT Launchpad service is running (Clean)',
    programId: process.env.NFT_LAUNCHPAD_PROGRAM_ID || 'FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo',
    rpcUrl: process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Clean backend is working correctly!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Analos NFT Launcher Backend (Clean) is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      nftStatus: '/api/nft-launchpad/status',
      test: '/api/test'
    }
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clean Analos NFT Launcher Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🎯 NFT Launchpad: http://localhost:${PORT}/api/nft-launchpad/status`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
