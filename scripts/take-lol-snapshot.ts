/**
 * LOL TOKEN SNAPSHOT SCRIPT
 * Takes snapshot of LOL token holders for whitelist
 * Finds first 100 wallets with 1M+ LOL tokens
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';

// Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.analos.io';
const LOL_TOKEN_MINT = process.env.LOL_TOKEN_MINT || '';
const MIN_LOL_BALANCE = 1000000; // 1M LOL tokens
const WHITELIST_SPOTS = 100;

interface LOLHolder {
  walletAddress: string;
  lolBalance: number;
  eligible: boolean;
  claimOrder?: number;
}

async function takeLOLSnapshot(): Promise<void> {
  console.log('🔍 Taking LOL token holder snapshot...');
  
  if (!LOL_TOKEN_MINT) {
    throw new Error('LOL_TOKEN_MINT environment variable not set!');
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  const lolMint = new PublicKey(LOL_TOKEN_MINT);
  
  console.log(`📊 Scanning LOL token: ${LOL_TOKEN_MINT}`);
  console.log(`🎯 Looking for holders with ${MIN_LOL_BALANCE.toLocaleString()}+ LOL tokens`);
  console.log(`🏆 Whitelist spots available: ${WHITELIST_SPOTS}`);

  try {
    // Get all token accounts for LOL token
    console.log('⏳ Fetching all token accounts...');
    const tokenAccounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program
      {
        filters: [
          {
            dataSize: 165, // Token account size
          },
          {
            memcmp: {
              offset: 0, // Mint address offset
              bytes: lolMint.toBase58(),
            },
          },
        ],
      }
    );

    console.log(`📈 Found ${tokenAccounts.length} LOL token accounts`);

    // Process each account
    const holders: LOLHolder[] = [];
    
    for (const { pubkey, account } of tokenAccounts) {
      try {
        const tokenAccount = await getAccount(connection, pubkey);
        const balance = Number(tokenAccount.amount);
        
        if (balance >= MIN_LOL_BALANCE) {
          holders.push({
            walletAddress: tokenAccount.owner.toBase58(),
            lolBalance: balance,
            eligible: true
          });
        }
      } catch (error) {
        // Skip invalid accounts
        continue;
      }
    }

    // Sort by balance (highest first)
    holders.sort((a, b) => b.lolBalance - a.lolBalance);

    // Take first 100 for whitelist
    const whitelist = holders.slice(0, WHITELIST_SPOTS);
    
    // Add claim order
    whitelist.forEach((holder, index) => {
      holder.claimOrder = index + 1;
    });

    console.log('\n🎉 LOL SNAPSHOT COMPLETE!');
    console.log(`📊 Total eligible holders: ${holders.length}`);
    console.log(`🏆 Whitelist spots filled: ${whitelist.length}`);
    console.log(`💰 Total LOL in whitelist: ${whitelist.reduce((sum, h) => sum + h.lolBalance, 0).toLocaleString()}`);

    // Display top 10
    console.log('\n🥇 TOP 10 WHITELIST HOLDERS:');
    whitelist.slice(0, 10).forEach((holder, index) => {
      console.log(`${index + 1}. ${holder.walletAddress.slice(0, 8)}...${holder.walletAddress.slice(-4)} - ${holder.lolBalance.toLocaleString()} LOL`);
    });

    // Save to CSV
    const csvContent = [
      'Wallet Address,LOL Balance,Claim Order,Eligible',
      ...whitelist.map(h => `${h.walletAddress},${h.lolBalance},${h.claimOrder},${h.eligible}`)
    ].join('\n');

    const fs = require('fs');
    fs.writeFileSync('lol-whitelist.csv', csvContent);
    console.log('\n💾 Whitelist saved to: lol-whitelist.csv');

    // Save to JSON for database import
    const jsonContent = {
      snapshotDate: new Date().toISOString(),
      lolTokenMint: LOL_TOKEN_MINT,
      minBalance: MIN_LOL_BALANCE,
      whitelistSpots: WHITELIST_SPOTS,
      totalEligible: holders.length,
      whitelist: whitelist
    };

    fs.writeFileSync('lol-whitelist.json', JSON.stringify(jsonContent, null, 2));
    console.log('💾 Full data saved to: lol-whitelist.json');

    // Database import instructions
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Review lol-whitelist.csv');
    console.log('2. Import to Supabase database');
    console.log('3. Deploy smart contracts with whitelist');
    console.log('4. Launch whitelist phase!');

    // Display SQL for database import
    console.log('\n🗄️  SQL FOR DATABASE IMPORT:');
    console.log('-- Run this in Supabase SQL Editor:');
    console.log(`
INSERT INTO lol_whitelist (wallet_address, lol_balance, eligible, claim_order, token_allocation)
VALUES
${whitelist.map(h => `('${h.walletAddress}', ${h.lolBalance}, true, ${h.claimOrder}, 1000)`).join(',\n')}
ON CONFLICT (wallet_address) DO UPDATE SET
  lol_balance = EXCLUDED.lol_balance,
  eligible = EXCLUDED.eligible,
  claim_order = EXCLUDED.claim_order,
  token_allocation = EXCLUDED.token_allocation;
    `);

  } catch (error) {
    console.error('❌ Error taking LOL snapshot:', error);
    throw error;
  }
}

// Run the snapshot
if (require.main === module) {
  takeLOLSnapshot()
    .then(() => {
      console.log('\n✅ LOL snapshot completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ LOL snapshot failed:', error);
      process.exit(1);
    });
}

export { takeLOLSnapshot };