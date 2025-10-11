/**
 * Simple test route to debug routing issues
 */

import * as express from 'express';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working!',
    timestamp: new Date().toISOString(),
    service: 'Analos NFT Launcher Backend'
  });
});

// Health check for routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Routes are mounted and working',
    timestamp: new Date().toISOString()
  });
});

export default router;
