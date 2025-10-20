/**
 * BLOCKCHAIN TEST API
 * Test real Analos blockchain transactions with small amounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

// Initialize connection to Analos
const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Analos blockchain connection...');

    // Test 1: Check blockchain health
    const healthCheck = await testBlockchainHealth();
    
    // Test 2: Check recent block data
    const blockData = await testBlockData();
    
    // Test 3: Check program accounts
    const programData = await testProgramAccounts();

    return NextResponse.json({
      success: true,
      message: 'Analos blockchain tests completed',
      results: {
        health: healthCheck,
        blocks: blockData,
        programs: programData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Blockchain test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType, walletAddress } = await request.json();
    
    console.log(`🧪 Running blockchain test: ${testType}`);

    switch (testType) {
      case 'health':
        const health = await testBlockchainHealth();
        return NextResponse.json({ success: true, health });

      case 'balance':
        if (!walletAddress) {
          return NextResponse.json(
            { error: 'Wallet address required for balance test' },
            { status: 400 }
          );
        }
        const balance = await testWalletBalance(walletAddress);
        return NextResponse.json({ success: true, balance });

      case 'transaction':
        if (!walletAddress) {
          return NextResponse.json(
            { error: 'Wallet address required for transaction test' },
            { status: 400 }
          );
        }
        const txResult = await testTransaction(walletAddress);
        return NextResponse.json({ success: true, transaction: txResult });

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: health, balance, or transaction' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Blockchain test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function testBlockchainHealth() {
  try {
    const slot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(slot);
    const version = await connection.getVersion();
    
    return {
      connected: true,
      slot,
      blockTime,
      version: version['solana-core'],
      rpcUrl: ANALOS_RPC_URL
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testBlockData() {
  try {
    const latestSlot = await connection.getSlot();
    const block = await connection.getBlock(latestSlot);
    
    return {
      latestSlot,
      blockHeight: (block as any)?.blockHeight || null,
      transactionCount: block?.transactions?.length || 0,
      timestamp: block?.blockTime || null
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testProgramAccounts() {
  try {
    // Test our deployed programs
    const programs = [
      'H423wLPdU2ut7JBJmq7Y9V6whXVTtHyRY3wvqypwfgfm', // NFT Launchpad Core
      'B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D', // Price Oracle
      'C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5'  // Rarity Oracle
    ];

    const results = [];
    
    for (const programId of programs) {
      try {
        const programPubkey = new PublicKey(programId);
        const accountInfo = await connection.getAccountInfo(programPubkey);
        
        results.push({
          programId,
          exists: !!accountInfo,
          executable: accountInfo?.executable || false,
          owner: accountInfo?.owner?.toString() || null,
          dataLength: accountInfo?.data?.length || 0
        });
      } catch (error) {
        results.push({
          programId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testWalletBalance(walletAddress: string) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    
    return {
      wallet: walletAddress,
      balance: balance / LAMPORTS_PER_SOL, // Convert lamports to SOL
      balanceLamports: balance,
      exists: balance > 0
    };
  } catch (error) {
    return {
      wallet: walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testTransaction(walletAddress: string) {
  try {
    // Create a simple test transaction (doesn't actually send)
    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(walletAddress); // Send to self for testing
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 1 // 1 lamport (tiny amount)
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Simulate the transaction (don't actually send)
    const simulation = await connection.simulateTransaction(transaction);
    
    return {
      wallet: walletAddress,
      simulation: {
        success: !simulation.value.err,
        error: simulation.value.err,
        logs: simulation.value.logs,
        unitsConsumed: simulation.value.unitsConsumed
      },
      transactionSize: transaction.serialize().length,
      estimatedFee: simulation.value.unitsConsumed * 0.000005 // Rough estimate
    };
  } catch (error) {
    return {
      wallet: walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
