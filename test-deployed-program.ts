/**
 * Test script to understand the deployed Price Oracle program
 * This will help us figure out the correct instruction format
 */

import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import crypto from 'crypto';

const ANALOS_RPC_URL = 'https://rpc.analos.io';
const PRICE_ORACLE_PROGRAM_ID = new PublicKey('ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn');

async function testDeployedProgram() {
  console.log('🔍 Testing Deployed Price Oracle Program\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

  // Test 1: Check if program exists
  console.log('1️⃣ Checking if program exists...');
  try {
    const programInfo = await connection.getAccountInfo(PRICE_ORACLE_PROGRAM_ID);
    if (programInfo && programInfo.executable) {
      console.log('✅ Program exists and is executable');
      console.log('   Owner:', programInfo.owner.toString());
      console.log('   Data Length:', programInfo.data.length, 'bytes');
    } else {
      console.log('❌ Program not found or not executable');
      return;
    }
  } catch (error) {
    console.log('❌ Error checking program:', error);
    return;
  }

  // Test 2: Try different discriminators
  console.log('\n2️⃣ Testing different instruction discriminators...');
  
  const discriminators = [
    {
      name: 'Anchor global:initialize_oracle',
      discriminator: crypto.createHash('sha256').update('global:initialize_oracle').digest().slice(0, 8)
    },
    {
      name: 'Anchor global:initialize',
      discriminator: crypto.createHash('sha256').update('global:initialize').digest().slice(0, 8)
    },
    {
      name: 'Simple zero',
      discriminator: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    },
    {
      name: 'Simple one',
      discriminator: Buffer.from([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    }
  ];

  for (const { name, discriminator } of discriminators) {
    console.log(`\n   Testing: ${name}`);
    console.log(`   Discriminator: ${discriminator.toString('hex')}`);
    
    try {
      // Create a test instruction
      const instructionData = Buffer.alloc(16);
      instructionData.set(discriminator, 0);
      instructionData.writeBigUInt64LE(BigInt(1000000), 8); // Market cap
      
      const testInstruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: true },
          { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PRICE_ORACLE_PROGRAM_ID,
        data: instructionData,
      });

      // Try to simulate the instruction
      const transaction = new Transaction().add(testInstruction);
      const simulation = await connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        console.log(`   ❌ Failed: ${JSON.stringify(simulation.value.err)}`);
      } else {
        console.log(`   ✅ Success! This discriminator works!`);
        console.log(`   Logs:`, simulation.value.logs);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 3: Check program accounts
  console.log('\n3️⃣ Checking program accounts...');
  try {
    const accounts = await connection.getProgramAccounts(PRICE_ORACLE_PROGRAM_ID);
    console.log(`   Found ${accounts.length} accounts`);
    
    if (accounts.length > 0) {
      console.log('   Sample account data:');
      const sampleAccount = accounts[0];
      console.log('   Address:', sampleAccount.pubkey.toString());
      console.log('   Data length:', sampleAccount.account.data.length);
      console.log('   First 32 bytes:', sampleAccount.account.data.slice(0, 32).toString('hex'));
    }
  } catch (error) {
    console.log('   ❌ Error getting program accounts:', error);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Program analysis complete!');
}

// Run the test
testDeployedProgram().catch(console.error);
