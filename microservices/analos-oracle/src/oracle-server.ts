/**
 * Analos Price Oracle Automation Service
 * Microservice 2 of 3: Automated price updates
 * 
 * Responsibilities:
 * - Fetch LOS price from multiple sources
 * - Automatically update on-chain oracle
 * - Price automation management
 */

import express from 'express';
import cors from 'cors';
import { Connection, Keypair } from '@solana/web3.js';
import priceOracleAutomationRoutes from './routes/price-oracle-automation.js';
import { PriceOracleAutomation } from './services/price-oracle-automation.js';

const app = express();
const PORT = process.env.PORT || 8081;

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*']; // Allow all for service-to-service communication

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('🤖 Starting Analos Price Oracle Automation Service...');
console.log(`📡 PORT: ${PORT}`);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Analos Price Oracle Automation',
    version: '1.0.0'
  });
});

// ============================================================================
// PRICE ORACLE AUTOMATION ROUTES
// ============================================================================

app.use('/api/oracle/automation', priceOracleAutomationRoutes);
console.log('🤖 Price Oracle Automation API mounted at /api/oracle/automation');

// ============================================================================
// INITIALIZE AUTOMATION
// ============================================================================

const ENABLED = process.env.PRICE_ORACLE_AUTOMATION_ENABLED === 'true';
const PROGRAM_ID = process.env.PRICE_ORACLE_PROGRAM_ID || 'ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn';
const CHECK_INTERVAL = parseInt(process.env.PRICE_ORACLE_CHECK_INTERVAL || '60000');
const UPDATE_THRESHOLD = parseFloat(process.env.PRICE_ORACLE_UPDATE_THRESHOLD || '1.0');
const COOLDOWN = parseInt(process.env.PRICE_ORACLE_COOLDOWN || '300000');
const RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

console.log('🤖 Price Oracle Configuration:');
console.log('   Enabled:', ENABLED);
console.log('   Program ID:', PROGRAM_ID);
console.log('   Check Interval:', CHECK_INTERVAL / 1000, 'seconds');
console.log('   Update Threshold:', UPDATE_THRESHOLD + '%');
console.log('   Cooldown:', COOLDOWN / 1000, 'seconds');

let automation: PriceOracleAutomation | null = null;

try {
  let authorityKeypair: Keypair;

  if (process.env.PRICE_ORACLE_AUTHORITY_SECRET_KEY) {
    const secretKey = JSON.parse(process.env.PRICE_ORACLE_AUTHORITY_SECRET_KEY);
    authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    console.log('✅ Authority keypair loaded from environment');
    console.log('   Public Key:', authorityKeypair.publicKey.toString());
    
    // Initialize automation
    automation = new PriceOracleAutomation({
      enabled: ENABLED,
      checkIntervalMs: CHECK_INTERVAL,
      updateThresholdPercent: UPDATE_THRESHOLD,
      programId: PROGRAM_ID,
      authorityKeypair,
      rpcUrl: RPC_URL,
      minTimeBetweenUpdates: COOLDOWN,
    });

    console.log('✅ Price Oracle automation initialized');

    if (ENABLED) {
      automation.start();
      console.log('🚀 Price Oracle automation started automatically');
    }
  } else {
    console.log('⚠️  No authority keypair configured');
    console.log('   Set PRICE_ORACLE_AUTHORITY_SECRET_KEY environment variable');
  }
} catch (error: any) {
  console.error('❌ Failed to initialize Price Oracle automation:', error.message);
}

// Export for routes
export function getPriceOracleAutomation() {
  return automation;
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Analos Oracle Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Automation API: http://localhost:${PORT}/api/oracle/automation`);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

