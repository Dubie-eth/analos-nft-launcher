const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');

// Configuration
const ANALOS_RPC_URL = 'https://rpc.analos.io';
const PRICE_ORACLE_PROGRAM_ID = new PublicKey('BRfEFQEPZbPfm4sKkeLfuPDCS1dH1npJaYz9ZQa8UxYw');

async function testPriceOracleInitialization() {
  console.log('🔍 Testing Price Oracle Initialization on Analos\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Load the keypair
    const keypairData = JSON.parse(fs.readFileSync('new-price-oracle-keypair.json', 'utf8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log('📍 Authority (Program Owner):', authority.publicKey.toString());
    console.log('📍 Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());
    
    // Create connection and provider
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {});
    
    // Load IDL
    const idl = JSON.parse(fs.readFileSync('analos-price-oracle-idl-NEW.json', 'utf8'));
    const program = new Program(idl, PRICE_ORACLE_PROGRAM_ID, provider);
    
    console.log('✅ IDL loaded successfully');
    console.log('✅ Program instance created');
    
    // Check if program is deployed
    const programInfo = await connection.getAccountInfo(PRICE_ORACLE_PROGRAM_ID);
    if (!programInfo) {
      throw new Error('Program not found on Analos blockchain');
    }
    
    console.log('✅ Program is deployed on Analos');
    
    // Check if oracle is already initialized
    const [priceOraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price_oracle')],
      PRICE_ORACLE_PROGRAM_ID
    );
    
    console.log('📍 Price Oracle PDA:', priceOraclePda.toString());
    
    const oracleAccount = await connection.getAccountInfo(priceOraclePda);
    if (oracleAccount) {
      console.log('⚠️  Oracle already initialized!');
      console.log('📍 Oracle Account Data Length:', oracleAccount.data.length);
    } else {
      console.log('📝 Oracle not initialized - ready to initialize');
      
      // Test initialization (commented out to avoid actual transaction)
      console.log('\n🧪 Would initialize with:');
      console.log('   - Market Cap: $1,000,000 USD');
      console.log('   - Authority:', authority.publicKey.toString());
      console.log('   - PDA:', priceOraclePda.toString());
    }
    
    console.log('\n✅ All checks passed! Ready for initialization.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPriceOracleInitialization();
