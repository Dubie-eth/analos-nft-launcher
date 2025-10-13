const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

async function initializeOracleSimple() {
  console.log('🚀 Simple Oracle Initialization\n');
  
  try {
    // Load keypair
    const keypairData = JSON.parse(fs.readFileSync('price-oracle-correct-keypair.json', 'utf8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    const connection = new Connection('https://rpc.analos.io', 'confirmed');
    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {});
    
    // Load IDL
    const idl = JSON.parse(fs.readFileSync('analos-price-oracle-idl-new.json', 'utf8'));
    const program = new Program(idl, new PublicKey('B26WiDKnjeQtZTGB6BqSyFMaejXJfkxm1CKu1CYQF1D'), provider);
    
    // Get PDA
    const [priceOraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price_oracle')],
      program.programId
    );
    
    console.log('📍 Authority:', authority.publicKey.toString());
    console.log('📍 Program ID:', program.programId.toString());
    console.log('📍 Oracle PDA:', priceOraclePda.toString());
    
    // Try initialization with minimal accounts
    const tx = await program.methods
      .initializeOracle(new anchor.BN(982800))
      .accounts({
        priceOracle: priceOraclePda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    
    console.log('✅ Success! Transaction:', tx);
    console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${tx}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.logs) {
      console.log('📝 Logs:', error.logs);
    }
  }
}

initializeOracleSimple();
