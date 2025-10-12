/**
 * Test script for Price Oracle initialization
 * This script tests the Price Oracle initialization on Analos blockchain
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';

// Configuration
const ANALOS_RPC_URL = 'https://rpc.analos.io';
const PRICE_ORACLE_PROGRAM_ID = new PublicKey('5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD');

async function testPriceOracleInitialization() {
  console.log('🔍 Testing Price Oracle Initialization\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create connection
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
  console.log('✅ Connected to:', ANALOS_RPC_URL);

  // Derive the Price Oracle PDA
  console.log('\n📍 Deriving Price Oracle PDA...');
  const [priceOraclePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('price_oracle')],
    PRICE_ORACLE_PROGRAM_ID
  );
  
  console.log('   PDA Address:', priceOraclePda.toString());
  console.log('   Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());

  // Check if account exists
  console.log('\n🔍 Checking if Price Oracle is initialized...');
  try {
    const accountInfo = await connection.getAccountInfo(priceOraclePda);
    
    if (accountInfo) {
      console.log('✅ Price Oracle is INITIALIZED!');
      console.log('\n📊 Account Details:');
      console.log('   Owner:', accountInfo.owner.toString());
      console.log('   Lamports:', accountInfo.lamports);
      console.log('   Data Length:', accountInfo.data.length, 'bytes');
      console.log('   Executable:', accountInfo.executable);
      console.log('   Rent Epoch:', accountInfo.rentEpoch);

      // Try to parse account data
      if (accountInfo.data.length >= 8) {
        console.log('\n📋 Account Data (raw):');
        console.log('   First 32 bytes (hex):', accountInfo.data.slice(0, 32).toString('hex'));
        
        // Parse discriminator (first 8 bytes)
        const discriminator = accountInfo.data.slice(0, 8);
        console.log('   Discriminator:', discriminator.toString('hex'));
        
        // Try to parse authority (next 32 bytes for Pubkey)
        if (accountInfo.data.length >= 40) {
          const authorityBytes = accountInfo.data.slice(8, 40);
          try {
            const authority = new PublicKey(authorityBytes);
            console.log('   Authority:', authority.toString());
          } catch (e) {
            console.log('   Authority: (unable to parse)');
          }
        }

        // Try to parse market cap (next 8 bytes, u64)
        if (accountInfo.data.length >= 48) {
          const marketCapBytes = accountInfo.data.slice(40, 48);
          const marketCapBigInt = marketCapBytes.readBigUInt64LE(0);
          console.log('   Market Cap (USD):', '$' + marketCapBigInt.toLocaleString());
        }

        // Try to parse LOS price (next 8 bytes, u64)
        if (accountInfo.data.length >= 56) {
          const losPriceBytes = accountInfo.data.slice(48, 56);
          const losPriceBigInt = losPriceBytes.readBigUInt64LE(0);
          console.log('   LOS Price (USD):', '$' + (Number(losPriceBigInt) / 1_000_000).toFixed(6));
        }
      }

      console.log('\n✅ Price Oracle is ready to use!');
      return true;
    } else {
      console.log('⚠️  Price Oracle is NOT initialized yet');
      console.log('\n💡 To initialize:');
      console.log('   1. Go to the admin panel: http://localhost:3000/admin');
      console.log('   2. Find the "Price Oracle Initializer" component');
      console.log('   3. Connect your wallet (must be the program authority)');
      console.log('   4. Enter the LOS market cap in USD (e.g., 1000000 for $1M)');
      console.log('   5. Click "Initialize Price Oracle"');
      console.log('   6. Sign the transaction in your wallet');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error checking Price Oracle:', error.message);
    return false;
  }
}

async function checkProgramDeployment() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Verifying Program Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

  try {
    const accountInfo = await connection.getAccountInfo(PRICE_ORACLE_PROGRAM_ID);
    
    if (accountInfo && accountInfo.executable) {
      console.log('✅ Price Oracle program is deployed!');
      console.log('   Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());
      console.log('   Owner:', accountInfo.owner.toString());
      console.log('   Data Length:', accountInfo.data.length, 'bytes');
      return true;
    } else {
      console.log('❌ Price Oracle program is NOT deployed or not executable');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error checking program:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ANALOS PRICE ORACLE TEST SUITE      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Check program deployment
    const programDeployed = await checkProgramDeployment();
    
    if (!programDeployed) {
      console.log('\n⚠️  Program not found. Please deploy the Price Oracle program first.');
      process.exit(1);
    }

    // Step 2: Check initialization
    const isInitialized = await testPriceOracleInitialization();

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   Program Deployed: ${programDeployed ? '✅' : '❌'}`);
    console.log(`   Oracle Initialized: ${isInitialized ? '✅' : '⚠️'}`);
    console.log('');

    if (programDeployed && isInitialized) {
      console.log('🎉 All checks passed! Price Oracle is ready to use!\n');
      process.exit(0);
    } else if (programDeployed && !isInitialized) {
      console.log('⚠️  Program is deployed but not initialized yet.\n');
      process.exit(0);
    } else {
      console.log('❌ Some checks failed. Please review the output above.\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testPriceOracleInitialization, checkProgramDeployment };

