/**
 * Minimal server for debugging route mounting issues
 */

import express from 'express';
import cors from 'cors';
import testRoute from './test-route.js';

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting Minimal Debug Server...');

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Minimal Debug Server',
    version: '1.0.0'
  });
});

// Test route
app.use('/api/test', testRoute);
console.log('🧪 Test Route API mounted at /api/test');

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Minimal Debug Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test route: http://localhost:${PORT}/api/test/test`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});