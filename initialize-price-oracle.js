const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

// Configuration
const ANALOS_RPC_URL = 'https://rpc.analos.io';
const PRICE_ORACLE_PROGRAM_ID = new PublicKey('BRfEFQEPZbPfm4sKkeLfuPDCS1dH1npJaYz9ZQa8UxYw');

async function initializePriceOracle() {
  console.log('🚀 Initializing Price Oracle on Analos\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Load the authority keypair (program owner)
    const keypairData = JSON.parse(fs.readFileSync('new-price-oracle-keypair.json', 'utf8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log('📍 Authority:', authority.publicKey.toString());
    console.log('📍 Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());
    
    // Create connection and provider
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {});
    
    // Load IDL
    const idl = JSON.parse(fs.readFileSync('analos-price-oracle-idl-NEW.json', 'utf8'));
    const program = new Program(idl, PRICE_ORACLE_PROGRAM_ID, provider);
    
    console.log('✅ IDL and program loaded successfully');
    
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
    const initialMarketCap = 984300; // $984,300 USD
    
    console.log(`\n🚀 Initializing Price Oracle with market cap: $${initialMarketCap.toLocaleString()} USD`);
    
    const tx = await program.methods
      .initializeOracle(new anchor.BN(initialMarketCap))
      .accounts({
        priceOracle: priceOraclePda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Transaction successful!');
    console.log('📝 Transaction signature:', tx);
    console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${tx}`);
    
    // Verify initialization
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation
    
    const newOracleAccount = await connection.getAccountInfo(priceOraclePda);
    if (newOracleAccount) {
      console.log('\n🎉 Price Oracle successfully initialized!');
      console.log('📍 Oracle Account:', priceOraclePda.toString());
      console.log('💰 Market Cap:', `$${initialMarketCap.toLocaleString()} USD`);
    }
    
  } catch (error) {
    console.error('❌ Error initializing oracle:', error.message);
    if (error.logs) {
      console.log('📝 Transaction logs:', error.logs);
    }
  }
}

initializePriceOracle();
