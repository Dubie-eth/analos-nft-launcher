/**
 * Analos Keypair Security Service
 * Microservice 3 of 3: 2FA & Keypair Management
 * 
 * Responsibilities:
 * - Google 2FA management
 * - Secure keypair rotation
 * - Encrypted backups
 * - Security audits
 */

import express from 'express';
import cors from 'cors';
import keypairRotationRoutes from './routes/keypair-rotation.js';
import { initializeKeypairRotation } from './services/keypair-rotation-service.js';
import { initializeTwoFactorAuth } from './services/two-factor-auth-service.js';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 8082;

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('🔐 Starting Analos Keypair Security Service...');
console.log(`📡 PORT: ${PORT}`);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos Keypair Security',
    version: '1.0.0'
  });
});

// ============================================================================
// INITIALIZE SECURITY SERVICES
// ============================================================================

const ENABLED = process.env.KEYPAIR_ROTATION_ENABLED === 'true';
const ENCRYPTION_KEY = process.env.KEYPAIR_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const BACKUP_DIR = process.env.KEYPAIR_BACKUP_DIR || './keypair-backups';

console.log('🔐 Keypair Rotation Configuration:');
console.log('   Enabled:', ENABLED);
console.log('   Backup Directory:', BACKUP_DIR);

export let twoFactorService: any = null;
export let rotationService: any = null;

try {
  // Initialize 2FA Service
  twoFactorService = initializeTwoFactorAuth({
    issuer: 'Analos NFT Launchpad',
    accountName: 'Admin Panel',
  });
  console.log('✅ 2FA Service initialized');

  // Initialize Keypair Rotation Service
  if (ENABLED) {
    rotationService = initializeKeypairRotation({
      currentKeypairPath: path.join(process.cwd(), 'payer-wallet.json'),
      backupDirectory: BACKUP_DIR,
      encryptionKey: ENCRYPTION_KEY,
      rpcUrl: process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
      minBalanceToKeep: 0.01,
    });
    console.log('✅ Keypair Rotation Service initialized');
  } else {
    console.log('ℹ️  Keypair Rotation is disabled');
    console.log('   To enable, set KEYPAIR_ROTATION_ENABLED=true');
  }
} catch (error: any) {
  console.error('❌ Error initializing Security services:', error.message);
  console.error('   Services will not be available, but server will continue');
}

// ============================================================================
// KEYPAIR ROTATION ROUTES
// ============================================================================

app.use('/api/admin/keypair', keypairRotationRoutes);
console.log('🔐 Keypair Rotation API mounted at /api/admin/keypair');

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos Security Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Keypair API: http://localhost:${PORT}/api/admin/keypair`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

