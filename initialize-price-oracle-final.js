const { Connection, PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction } = require('@solana/web3.js');
const fs = require('fs');

// Configuration
const ANALOS_RPC_URL = 'https://rpc.analos.io';
const PRICE_ORACLE_PROGRAM_ID = new PublicKey('B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D');

async function initializePriceOracleFinal() {
  console.log('🚀 Initializing Price Oracle (Final Deployment)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Load the authority keypair (program owner)
    const keypairData = JSON.parse(fs.readFileSync('price-oracle-correct-keypair.json', 'utf8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log('📍 Authority:', authority.publicKey.toString());
    console.log('📍 Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());
    
    // Create connection
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    
    // Calculate PDA
    const [priceOraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price_oracle')],
      PRICE_ORACLE_PROGRAM_ID
    );
    
    console.log('📍 Price Oracle PDA:', priceOraclePda.toString());
    
    // Check if already initialized
    const oracleAccount = await connection.getAccountInfo(priceOraclePda);
    if (oracleAccount) {
      console.log('⚠️  Oracle already initialized!');
      return;
    }
    
    // Check authority balance
    const balance = await connection.getBalance(authority.publicKey);
    console.log('💰 Authority balance:', balance / 1e9, 'SOL');
    
    if (balance < 0.01 * 1e9) {
      console.log('❌ Insufficient balance for initialization');
      return;
    }
    
    // Initialize with the specified market cap
    const initialMarketCap = 982800; // $982,800 USD
    
    // Anchor discriminator for initialize_oracle (8 bytes)
    const discriminator = Buffer.from([144, 223, 131, 120, 196, 253, 181, 99]);
    
    // Market cap as u64 little-endian (8 bytes)
    const marketCapBuffer = Buffer.alloc(8);
    marketCapBuffer.writeUInt32LE(initialMarketCap, 0);
    
    // Combine instruction data
    const instructionData = Buffer.concat([discriminator, marketCapBuffer]);
    
    console.log(`\n🚀 Initializing with market cap: $${initialMarketCap.toLocaleString()} USD`);
    console.log('📝 Instruction data length:', instructionData.length);
    
    // Create the instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: priceOraclePda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PRICE_ORACLE_PROGRAM_ID,
      data: instructionData,
    });
    
    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authority.publicKey;
    
    // Sign transaction
    transaction.sign(authority);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('✅ Transaction sent!');
    console.log('📝 Transaction signature:', signature);
    console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);
    
    // Confirm transaction
    console.log('⏳ Confirming transaction...');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      console.error('❌ Transaction failed:', confirmation.value.err);
    } else {
      console.log('🎉 Transaction confirmed!');
      
      // Verify initialization
      const newOracleAccount = await connection.getAccountInfo(priceOraclePda);
      if (newOracleAccount) {
        console.log('\n🎉 Price Oracle successfully initialized!');
        console.log('📍 Oracle Account:', priceOraclePda.toString());
        console.log('💰 Market Cap:', `$${initialMarketCap.toLocaleString()} USD`);
        console.log('📊 Account Data Length:', newOracleAccount.data.length, 'bytes');
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing oracle:', error.message);
    if (error.logs) {
      console.log('📝 Transaction logs:', error.logs);
    }
  }
}

initializePriceOracleFinal();
