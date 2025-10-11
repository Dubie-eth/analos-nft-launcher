/**
 * Initialize Keypair Rotation Service
 */

import { initializeKeypairRotation } from './services/keypair-rotation-service.js';
import { initializeTwoFactorAuth } from './services/two-factor-auth-service.js';
import * as path from 'path';

const ENABLED = process.env.KEYPAIR_ROTATION_ENABLED === 'true';
const ENCRYPTION_KEY = process.env.KEYPAIR_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const BACKUP_DIR = process.env.KEYPAIR_BACKUP_DIR || './keypair-backups';

console.log('🔐 Keypair Rotation Configuration:');
console.log('   Enabled:', ENABLED);
console.log('   Backup Directory:', BACKUP_DIR);

// Initialize services only if enabled, otherwise export null
export let twoFactorService: any = null;
export let rotationService: any = null;

try {
  // Always initialize 2FA Service (lightweight, no dependencies)
  twoFactorService = initializeTwoFactorAuth({
    issuer: 'Analos NFT Launchpad',
    accountName: 'Admin Panel',
  });
  console.log('✅ 2FA Service initialized');

  // Initialize Keypair Rotation Service only if enabled
  if (ENABLED) {
    rotationService = initializeKeypairRotation({
      currentKeypairPath: path.join(process.cwd(), 'payer-wallet.json'),
      backupDirectory: BACKUP_DIR,
      encryptionKey: ENCRYPTION_KEY,
      rpcUrl: process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
      minBalanceToKeep: 0.01, // Keep 0.01 SOL in old wallet
    });
    console.log('✅ Keypair Rotation Service initialized');
  } else {
    console.log('ℹ️  Keypair Rotation is disabled');
    console.log('   To enable, set KEYPAIR_ROTATION_ENABLED=true');
  }
} catch (error: any) {
  console.error('❌ Error initializing Keypair Security services:', error.message);
  console.error('   Services will not be available, but server will continue');
}

