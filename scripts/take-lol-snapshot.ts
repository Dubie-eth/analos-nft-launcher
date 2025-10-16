/**
 * LOL TOKEN HOLDER SNAPSHOT SCRIPT
 * Takes snapshot of LOL token holders with 1M+ tokens
 * Stores first 100 eligible holders in database
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// Configuration
const LOL_TOKEN_MINT = process.env.LOL_TOKEN_MINT || 'YOUR_LOL_TOKEN_MINT_HERE';
const MIN_LOL_BALANCE = 1_000_000; // 1 million LOL
const MAX_WHITELIST_SPOTS = 100;

const ANALOS_RPC = 'https://rpc.analos.io';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface LOLHolder {
  wallet_address: string;
  lol_balance: number;
  eligible: boolean;
  snapshot_time: string;
}

async function getLOLHoldersFromHelius(): Promise<LOLHolder[]> {
  console.log('🔍 Fetching LOL token holders from Helius...');
  
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${LOL_TOKEN_MINT}/balances?api-key=${HELIUS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter holders with 1M+ LOL and sort by balance
    const eligibleHolders: LOLHolder[] = data.balances
      .filter((holder: any) => holder.amount >= MIN_LOL_BALANCE * 10 ** 9) // Adjust for decimals
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, MAX_WHITELIST_SPOTS)
      .map((holder: any) => ({
        wallet_address: holder.address,
        lol_balance: Math.floor(holder.amount / 10 ** 9), // Convert to human-readable
        eligible: true,
        snapshot_time: new Date().toISOString()
      }));

    console.log(`✅ Found ${eligibleHolders.length} eligible holders`);
    return eligibleHolders;

  } catch (error) {
    console.error('❌ Error fetching from Helius:', error);
    throw error;
  }
}

async function getLOLHoldersFromRPC(): Promise<LOLHolder[]> {
  console.log('🔍 Fetching LOL token holders from RPC (fallback)...');
  
  const connection = new Connection(ANALOS_RPC, 'confirmed');
  const tokenMint = new PublicKey(LOL_TOKEN_MINT);

  try {
    // Get all token accounts for this mint
    const accounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      {
        filters: [
          {
            dataSize: 165, // Size of token account
          },
          {
            memcmp: {
              offset: 0,
              bytes: tokenMint.toBase58(),
            },
          },
        ],
      }
    );

    console.log(`📊 Found ${accounts.length} total token accounts`);

    // Parse accounts and extract balances
    const holders: { address: string; balance: number }[] = [];

    for (const account of accounts) {
      try {
        // Token account layout: https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/state.rs
        const data = account.account.data;
        
        // Owner is at offset 32 (32 bytes)
        const owner = new PublicKey(data.slice(32, 64));
        
        // Amount is at offset 64 (8 bytes, little-endian)
        const amount = Number(
          data.readBigUInt64LE(64)
        );

        if (amount >= MIN_LOL_BALANCE * 10 ** 9) {
          holders.push({
            address: owner.toBase58(),
            balance: Math.floor(amount / 10 ** 9)
          });
        }
      } catch (parseError) {
        console.error('Error parsing account:', parseError);
        continue;
      }
    }

    // Sort by balance and take top 100
    const eligibleHolders: LOLHolder[] = holders
      .sort((a, b) => b.balance - a.balance)
      .slice(0, MAX_WHITELIST_SPOTS)
      .map(holder => ({
        wallet_address: holder.address,
        lol_balance: holder.balance,
        eligible: true,
        snapshot_time: new Date().toISOString()
      }));

    console.log(`✅ Found ${eligibleHolders.length} eligible holders`);
    return eligibleHolders;

  } catch (error) {
    console.error('❌ Error fetching from RPC:', error);
    throw error;
  }
}

async function storeSnapshot(holders: LOLHolder[]): Promise<void> {
  console.log('💾 Storing snapshot in Supabase...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Clear existing snapshot (optional - remove if you want to keep history)
    // await supabase.from('lol_whitelist').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new snapshot
    const { data, error } = await supabase
      .from('lol_whitelist')
      .upsert(holders, { onConflict: 'wallet_address' });

    if (error) {
      throw error;
    }

    console.log(`✅ Stored ${holders.length} holders in database`);

    // Print summary
    console.log('\n📊 WHITELIST SUMMARY:');
    console.log('═══════════════════════════════════════════');
    holders.slice(0, 10).forEach((holder, index) => {
      console.log(
        `#${index + 1}: ${holder.wallet_address.slice(0, 8)}... - ${holder.lol_balance.toLocaleString()} LOL`
      );
    });
    if (holders.length > 10) {
      console.log(`... and ${holders.length - 10} more holders`);
    }
    console.log('═══════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error storing snapshot:', error);
    throw error;
  }
}

async function exportWhitelist(holders: LOLHolder[]): Promise<void> {
  console.log('📄 Exporting whitelist to CSV...');

  const csv = [
    'Wallet Address,LOL Balance,Eligible,Snapshot Time',
    ...holders.map(h => 
      `${h.wallet_address},${h.lol_balance},${h.eligible},${h.snapshot_time}`
    )
  ].join('\n');

  const fs = require('fs');
  const path = require('path');
  
  const outputPath = path.join(process.cwd(), 'lol-whitelist.csv');
  fs.writeFileSync(outputPath, csv);

  console.log(`✅ Whitelist exported to: ${outputPath}`);
}

async function main() {
  console.log('🚀 LOL Token Holder Snapshot Tool');
  console.log('═══════════════════════════════════════════\n');

  console.log('Configuration:');
  console.log(`  LOL Token Mint: ${LOL_TOKEN_MINT}`);
  console.log(`  Min Balance: ${MIN_LOL_BALANCE.toLocaleString()} LOL`);
  console.log(`  Max Spots: ${MAX_WHITELIST_SPOTS}`);
  console.log('');

  // Validate configuration
  if (!LOL_TOKEN_MINT || LOL_TOKEN_MINT === 'YOUR_LOL_TOKEN_MINT_HERE') {
    console.error('❌ Error: LOL_TOKEN_MINT not configured');
    console.error('Set environment variable: LOL_TOKEN_MINT=your_token_mint_address');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase not configured');
    console.error('Set environment variables:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_key');
    process.exit(1);
  }

  try {
    let holders: LOLHolder[];

    // Try Helius first (faster and more reliable)
    if (HELIUS_API_KEY) {
      try {
        holders = await getLOLHoldersFromHelius();
      } catch (heliusError) {
        console.log('⚠️ Helius failed, falling back to RPC...');
        holders = await getLOLHoldersFromRPC();
      }
    } else {
      console.log('⚠️ No Helius API key, using RPC (slower)...');
      holders = await getLOLHoldersFromRPC();
    }

    if (holders.length === 0) {
      console.error('❌ No eligible holders found!');
      process.exit(1);
    }

    // Store in database
    await storeSnapshot(holders);

    // Export to CSV for backup
    await exportWhitelist(holders);

    console.log('\n✅ Snapshot complete!');
    console.log(`Total eligible holders: ${holders.length}`);
    console.log('\n🎯 Next steps:');
    console.log('1. Review the whitelist in Supabase');
    console.log('2. Announce to LOL holders');
    console.log('3. Prepare for launch!');

  } catch (error) {
    console.error('\n❌ Snapshot failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { getLOLHoldersFromHelius, getLOLHoldersFromRPC, storeSnapshot };
