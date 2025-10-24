/**
 * Script to Add Metadata to Existing Profile NFT
 * 
 * This script adds on-chain Metaplex metadata to an already-minted Profile NFT
 * Run this to make your NFT show up properly in explorers and wallets
 * 
 * Usage:
 * npx ts-node scripts/add-metadata-to-nft.ts
 */

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import * as bs58 from 'bs58';

// Configuration
const RPC_URL = 'https://rpc.analos.io';
const METADATA_PROGRAM_ID = new PublicKey('8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL');

// Your NFT Details
const NFT_MINT = new PublicKey('5rink7q3ejuzguX53QGgUzMwLnf5RAQJSLhC9nyNrqio');
const METADATA_URI = 'https://gateway.pinata.cloud/ipfs/QmZsW61J7AA8rQrJz6v44C2RjXHjvP4B2Wb9UX7sBtaCAF';
const NFT_NAME = '@Dubie';
const NFT_SYMBOL = 'APROFILE';

// IMPORTANT: You'll need to provide your wallet's private key
// Get this from your wallet (NEVER commit this to git!)
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || '';

async function addMetadataToNFT() {
  try {
    console.log('🚀 Starting metadata addition process...');
    console.log('🔗 RPC URL:', RPC_URL);
    console.log('🎨 NFT Mint:', NFT_MINT.toString());
    console.log('📝 Metadata URI:', METADATA_URI);

    // Initialize connection
    const connection = new Connection(RPC_URL, 'confirmed');

    // Load wallet keypair
    if (!WALLET_PRIVATE_KEY) {
      throw new Error('WALLET_PRIVATE_KEY environment variable not set!');
    }

    const walletKeypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY));
    const walletPublicKey = walletKeypair.publicKey;
    console.log('👤 Wallet:', walletPublicKey.toString());

    // Check wallet balance
    const balance = await connection.getBalance(walletPublicKey);
    console.log('💰 Wallet balance:', balance / 1e9, 'LOS');

    if (balance < 0.01 * 1e9) {
      throw new Error('Insufficient balance! Need at least 0.01 LOS for transaction fees');
    }

    // Derive metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        NFT_MINT.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    console.log('📋 Metadata PDA:', metadataPDA.toString());

    // Check if metadata account already exists
    const metadataAccountInfo = await connection.getAccountInfo(metadataPDA);
    if (metadataAccountInfo) {
      console.log('⚠️ Metadata account already exists!');
      console.log('✅ Your NFT already has on-chain metadata.');
      return;
    }

    console.log('📝 Creating metadata account...');

    // Derive master edition PDA
    const [masterEditionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        NFT_MINT.toBuffer(),
        Buffer.from('edition'),
      ],
      METADATA_PROGRAM_ID
    );

    console.log('📋 Master Edition PDA:', masterEditionPDA.toString());

    // Create metadata instruction
    const createMetadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: NFT_MINT,
        mintAuthority: walletPublicKey,
        payer: walletPublicKey,
        updateAuthority: walletPublicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            uri: METADATA_URI,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    // Create master edition instruction
    const createMasterEditionIx = createCreateMasterEditionV3Instruction(
      {
        edition: masterEditionPDA,
        mint: NFT_MINT,
        updateAuthority: walletPublicKey,
        mintAuthority: walletPublicKey,
        payer: walletPublicKey,
        metadata: metadataPDA,
      },
      {
        createMasterEditionArgs: {
          maxSupply: 0,
        },
      }
    );

    // Build transaction
    const transaction = new Transaction();
    
    // Add compute budget
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 })
    );

    transaction.add(createMetadataIx, createMasterEditionIx);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('✍️ Signing and sending transaction...');

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletKeypair],
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    );

    console.log('✅ Metadata added successfully!');
    console.log('📝 Transaction signature:', signature);
    console.log('🔗 View on explorer:', `https://explorer.analos.io/tx/${signature}`);
    console.log('');
    console.log('🎉 Your NFT now has on-chain metadata!');
    console.log('🔄 Refresh the explorer to see:');
    console.log('   - Name: @Dubie');
    console.log('   - Symbol: APROFILE');
    console.log('   - Image and attributes from IPFS');
    
  } catch (error) {
    console.error('❌ Error adding metadata:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
addMetadataToNFT();

