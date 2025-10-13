const { Connection, PublicKey } = require('@solana/web3.js');

async function testOracleDeployment() {
  console.log('🔍 Testing Oracle Deployment Status\n');
  
  const ANALOS_RPC_URL = 'https://rpc.analos.io';
  const PRICE_ORACLE_PROGRAM_ID = new PublicKey('B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D');
  
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
  
  try {
    // Check if program exists
    const programAccount = await connection.getAccountInfo(PRICE_ORACLE_PROGRAM_ID);
    
    if (!programAccount) {
      console.log('❌ Program not found on blockchain');
      return;
    }
    
    console.log('✅ Program found on blockchain');
    console.log('📍 Program ID:', PRICE_ORACLE_PROGRAM_ID.toString());
    console.log('📊 Program Account Data Length:', programAccount.data.length);
    console.log('🔑 Program Owner:', programAccount.owner.toString());
    console.log('💾 Program Executable:', programAccount.executable);
    
    // Calculate PDA
    const [priceOraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price_oracle')],
      PRICE_ORACLE_PROGRAM_ID
    );
    
    console.log('\n📍 Price Oracle PDA:', priceOraclePda.toString());
    
    // Check if PDA account exists
    const oracleAccount = await connection.getAccountInfo(priceOraclePda);
    
    if (oracleAccount) {
      console.log('⚠️  Oracle already initialized');
      console.log('📊 Oracle Account Data Length:', oracleAccount.data.length);
      console.log('🔑 Oracle Owner:', oracleAccount.owner.toString());
    } else {
      console.log('✅ Oracle not yet initialized - ready for initialization');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOracleDeployment();
