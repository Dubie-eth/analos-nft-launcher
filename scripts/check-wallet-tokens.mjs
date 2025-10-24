#!/usr/bin/env node
/**
 * Check all token accounts for a wallet
 * Usage: node scripts/check-wallet-tokens.mjs <WALLET_ADDRESS>
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const RPC_URL = 'https://rpc.analos.io';
const wallet = process.argv[2];

if (!wallet) {
  console.error('❌ Usage: node scripts/check-wallet-tokens.mjs <WALLET_ADDRESS>');
  process.exit(1);
}

async function checkWalletTokens() {
  console.log('🔍 Checking tokens for wallet:', wallet);
  console.log('🔗 RPC:', RPC_URL);
  console.log('');

  const connection = new Connection(RPC_URL, 'confirmed');
  const walletPubkey = new PublicKey(wallet);

  try {
    // Get all token accounts owned by this wallet
    console.log('📡 Fetching token accounts...');
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { programId: TOKEN_PROGRAM_ID }
    );

    console.log(`✅ Found ${tokenAccounts.value.length} token accounts\n`);

    if (tokenAccounts.value.length === 0) {
      console.log('❌ No tokens found in this wallet');
      return;
    }

    // Display each token
    tokenAccounts.value.forEach((account, i) => {
      const parsedInfo = account.account.data.parsed.info;
      const mint = parsedInfo.mint;
      const balance = parsedInfo.tokenAmount.uiAmount;
      const decimals = parsedInfo.tokenAmount.decimals;
      const rawBalance = parsedInfo.tokenAmount.amount;

      console.log(`Token #${i + 1}:`);
      console.log(`  Mint Address: ${mint}`);
      console.log(`  Balance: ${balance?.toLocaleString() || '0'}`);
      console.log(`  Decimals: ${decimals}`);
      console.log(`  Raw Balance: ${rawBalance}`);
      console.log(`  Token Account: ${account.pubkey.toString()}`);
      console.log('');
    });

    // Try to identify $LOL token
    console.log('🔍 Looking for $LOL token...');
    const lolToken = tokenAccounts.value.find(account => {
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
      return balance >= 1000000; // Looking for 1M+ balance
    });

    if (lolToken) {
      const mint = lolToken.account.data.parsed.info.mint;
      const balance = lolToken.account.data.parsed.info.tokenAmount.uiAmount;
      console.log('✅ Likely $LOL token found:');
      console.log(`   Mint: ${mint}`);
      console.log(`   Balance: ${balance?.toLocaleString()}`);
      console.log('');
      console.log('📋 Use this mint address in your config!');
    } else {
      console.log('❌ No token with 1M+ balance found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkWalletTokens();

