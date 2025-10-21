/**
 * BACKFILL NFT METADATA SCRIPT
 * Creates Metaplex metadata for NFTs that were minted before metadata integration
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '../src/config/analos-programs';
import { metadataService } from '../src/lib/metadata-service';
import { blockchainService } from '../src/lib/blockchain-service';
import * as fs from 'fs';
import * as path from 'path';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '';
const AUTHORITY_KEYPAIR_PATH = process.env.AUTHORITY_KEYPAIR_PATH || '.secure-keypairs/deployer-keypair.json';

async function backfillMetadata() {
  console.log('🔄 Starting NFT Metadata Backfill...');
  console.log('═══════════════════════════════════════\n');

  if (!WALLET_ADDRESS) {
    console.error('❌ Error: WALLET_ADDRESS environment variable not set');
    console.log('Usage: WALLET_ADDRESS=<your-wallet> npm run backfill-metadata');
    process.exit(1);
  }

  try {
    // 1. Get all NFTs for the wallet
    console.log(`📊 Fetching NFTs for wallet: ${WALLET_ADDRESS}`);
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    
    // Get all token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(WALLET_ADDRESS),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    // Filter for NFTs (amount = 1, decimals = 0)
    const nfts = tokenAccounts.value.filter((account) => {
      const tokenData = account.account.data.parsed.info;
      return (
        tokenData.tokenAmount.decimals === 0 &&
        tokenData.tokenAmount.amount === '1'
      );
    });

    console.log(`✅ Found ${nfts.length} NFT(s)\n`);

    if (nfts.length === 0) {
      console.log('ℹ️ No NFTs found. Nothing to backfill.');
      return;
    }

    // 2. Get all collections to match NFTs
    console.log('📦 Loading collections...');
    const collections = await blockchainService.getAllCollections();
    console.log(`✅ Found ${collections.length} collection(s)\n`);

    // 3. Process each NFT
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < nfts.length; i++) {
      const nft = nfts[i];
      const mintAddress = nft.account.data.parsed.info.mint;
      
      console.log(`\n[${i + 1}/${nfts.length}] Processing NFT: ${mintAddress}`);
      
      try {
        // Check if metadata already exists
        const existingMetadata = await metadataService.getMetadata(mintAddress);
        
        if (existingMetadata) {
          console.log('  ⏭️  Metadata already exists, skipping');
          skipCount++;
          continue;
        }

        // Find matching collection (use first one as default)
        const collection = collections[0] || {
          collectionName: 'Analos NFT',
          collectionSymbol: 'ANALOS',
          placeholderUri: 'https://arweave.net/placeholder'
        };

        console.log(`  📝 Creating metadata for ${collection.collectionName}...`);

        // Create metadata
        const result = await metadataService.createNFTMetadata(
          new PublicKey(mintAddress),
          collection.collectionName,
          collection.collectionSymbol,
          i + 1, // Use index as mint number
          [
            { trait_type: 'Mint Number', value: `${i + 1}` },
            { trait_type: 'Collection', value: collection.collectionName },
            { trait_type: 'Backfilled', value: 'true' },
            { trait_type: 'Original Mint', value: 'Early Adopter' },
          ],
          collection.placeholderUri
        );

        if (result.success) {
          console.log(`  ✅ Metadata created!`);
          console.log(`  📍 URI: ${result.metadataURI}`);
          successCount++;
        } else {
          console.log(`  ⚠️  Failed: ${result.message}`);
          errorCount++;
        }

      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      if (i < nfts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 4. Summary
    console.log('\n═══════════════════════════════════════');
    console.log('📊 BACKFILL SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Success:  ${successCount}`);
    console.log(`⏭️  Skipped:  ${skipCount}`);
    console.log(`❌ Errors:   ${errorCount}`);
    console.log(`📦 Total:    ${nfts.length}`);
    console.log('═══════════════════════════════════════\n');

    if (successCount > 0) {
      console.log('🎉 Metadata backfill completed successfully!');
      console.log('   Your NFTs now have proper metadata and will show in wallets.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillMetadata()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

