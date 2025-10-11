/**
 * Price Oracle Automation Initialization
 * 
 * This file initializes the automated price oracle update system.
 * Set environment variables to configure the automation.
 */

import { Keypair } from '@solana/web3.js';
import { initializePriceOracleAutomation } from './services/price-oracle-automation';
import fs from 'fs';
import path from 'path';

// Configuration from environment variables
const ENABLED = process.env.PRICE_ORACLE_AUTOMATION_ENABLED === 'true';
const PROGRAM_ID = process.env.PRICE_ORACLE_PROGRAM_ID || 'ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn';
const KEYPAIR_PATH = process.env.PRICE_ORACLE_AUTHORITY_KEYPAIR_PATH;
const CHECK_INTERVAL = parseInt(process.env.PRICE_ORACLE_CHECK_INTERVAL || '60000');
const UPDATE_THRESHOLD = parseFloat(process.env.PRICE_ORACLE_UPDATE_THRESHOLD || '1.0');
const COOLDOWN = parseInt(process.env.PRICE_ORACLE_COOLDOWN || '300000');
const RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

let automation: any = null;

export function initializePriceOracle() {
  console.log('🤖 Price Oracle Automation Configuration:');
  console.log('   Enabled:', ENABLED);
  console.log('   Program ID:', PROGRAM_ID);
  console.log('   Check Interval:', CHECK_INTERVAL / 1000, 'seconds');
  console.log('   Update Threshold:', UPDATE_THRESHOLD + '%');
  console.log('   Cooldown:', COOLDOWN / 1000, 'seconds');

  if (!ENABLED) {
    console.log('ℹ️  Price Oracle automation is disabled.');
    console.log('   To enable, set PRICE_ORACLE_AUTOMATION_ENABLED=true in environment');
    return null;
  }

  if (!KEYPAIR_PATH) {
    console.log('⚠️  PRICE_ORACLE_AUTHORITY_KEYPAIR_PATH not set');
    console.log('   Automation will be initialized but not started');
    console.log('   Set this variable to the path of your authority keypair JSON file');
  }

  try {
    let authorityKeypair: Keypair;

    if (KEYPAIR_PATH && fs.existsSync(KEYPAIR_PATH)) {
      // Load keypair from file
      const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
      authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      console.log('✅ Authority keypair loaded from:', KEYPAIR_PATH);
      console.log('   Public Key:', authorityKeypair.publicKey.toString());
    } else if (process.env.PRICE_ORACLE_AUTHORITY_SECRET_KEY) {
      // Load from environment variable (for Railway/Vercel)
      const secretKey = JSON.parse(process.env.PRICE_ORACLE_AUTHORITY_SECRET_KEY);
      authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      console.log('✅ Authority keypair loaded from environment variable');
      console.log('   Public Key:', authorityKeypair.publicKey.toString());
    } else {
      console.log('⚠️  No authority keypair configured');
      console.log('   Set either:');
      console.log('   - PRICE_ORACLE_AUTHORITY_KEYPAIR_PATH (file path)');
      console.log('   - PRICE_ORACLE_AUTHORITY_SECRET_KEY (JSON array)');
      
      // Create dummy automation for API endpoints
      automation = initializePriceOracleAutomation({
        enabled: false,
        checkIntervalMs: CHECK_INTERVAL,
        updateThresholdPercent: UPDATE_THRESHOLD,
        programId: PROGRAM_ID,
        authorityKeypair: Keypair.generate(), // Dummy keypair
        rpcUrl: RPC_URL,
        minTimeBetweenUpdates: COOLDOWN,
      });
      
      return automation;
    }

    // Initialize automation
    automation = initializePriceOracleAutomation({
      enabled: ENABLED,
      checkIntervalMs: CHECK_INTERVAL,
      updateThresholdPercent: UPDATE_THRESHOLD,
      programId: PROGRAM_ID,
      authorityKeypair,
      rpcUrl: RPC_URL,
      minTimeBetweenUpdates: COOLDOWN,
    });

    console.log('✅ Price Oracle automation initialized');

    // Auto-start if enabled
    if (ENABLED && authorityKeypair) {
      automation.start();
      console.log('🚀 Price Oracle automation started automatically');
    }

    return automation;

  } catch (error: any) {
    console.error('❌ Failed to initialize Price Oracle automation:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

// Initialize on module load
if (ENABLED) {
  try {
    automation = initializePriceOracle();
  } catch (error: any) {
    console.error('❌ Error during initialization:', error);
  }
}

export { automation };

