/**
 * Ultra Simple Server for Railway Deployment
 * Pure JavaScript - no TypeScript dependencies
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

console.log('🚀 Starting Ultra Simple Analos NFT Launcher Backend Server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 ANALOS_RPC_URL: ${process.env.ANALOS_RPC_URL || 'https://rpc.analos.io'}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend (Ultra Simple)',
    version: '2.0.4',
    environment: {
      port: PORT,
      analosRpcUrl: process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend API',
    version: '2.0.4'
  });
});

// NFT Launchpad endpoints (placeholder)
app.get('/api/nft-launchpad/status', (req, res) => {
  res.json({
    success: true,
    message: 'NFT Launchpad service is running',
    programId: process.env.NFT_LAUNCHPAD_PROGRAM_ID || 'FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Analos NFT Launcher Backend is running!',
    timestamp: new Date().toISOString(),
    version: '2.0.4'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra Simple Analos NFT Launcher Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
