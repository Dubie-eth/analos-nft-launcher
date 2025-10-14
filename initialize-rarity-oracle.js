const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

// Configuration
const ANALOS_RPC_URL = 'https://rpc.analos.io';
const RARITY_ORACLE_PROGRAM_ID = new PublicKey('C2YCPD3ZR5mWC7q1TMh2KqN43XWzCsdnbPgswGsFTDr5');

async function initializeRarityOracle() {
  console.log('🚀 Initializing Rarity Oracle\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Load the authority keypair
    const keypairData = JSON.parse(fs.readFileSync('rarity-oracle-keypair.json', 'utf8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    console.log('📍 Authority:', authority.publicKey.toString());
    console.log('📍 Program ID:', RARITY_ORACLE_PROGRAM_ID.toString());
    
    // Create connection and provider
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {});
    
    // Load IDL
    const idl = JSON.parse(fs.readFileSync('analos-rarity-oracle-idl-new.json', 'utf8'));
    const program = new Program(idl, RARITY_ORACLE_PROGRAM_ID, provider);
    
    console.log('✅ IDL and program loaded successfully');
    
    // Create a dummy collection config for initialization
    const collectionConfig = Keypair.generate();
    
    // Calculate PDA for rarity config
    const [rarityConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('rarity_config'), collectionConfig.publicKey.toBuffer()],
      RARITY_ORACLE_PROGRAM_ID
    );
    
    console.log('📍 Collection Config:', collectionConfig.publicKey.toString());
    console.log('📍 Rarity Config PDA:', rarityConfigPda.toString());
    
    // Check if already initialized
    const configAccount = await connection.getAccountInfo(rarityConfigPda);
    if (configAccount) {
      console.log('⚠️  Rarity config already initialized for this collection!');
      return;
    }
    
    // Check authority balance
    const balance = await connection.getBalance(authority.publicKey);
    console.log('💰 Authority balance:', balance / 1e9, 'SOL');
    
    if (balance < 0.01 * 1e9) {
      console.log('❌ Insufficient balance for initialization');
      return;
    }
    
    console.log('\n🚀 Initializing Rarity Oracle...');
    
    const tx = await program.methods
      .initializeRarityConfig()
      .accounts({
        rarityConfig: rarityConfigPda,
        collectionConfig: collectionConfig.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
    
    console.log('✅ Transaction successful!');
    console.log('📝 Transaction signature:', tx);
    console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${tx}`);
    
    // Verify initialization
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation
    
    const newConfigAccount = await connection.getAccountInfo(rarityConfigPda);
    if (newConfigAccount) {
      console.log('\n🎉 Rarity Oracle successfully initialized!');
      console.log('📍 Rarity Config Account:', rarityConfigPda.toString());
      console.log('📍 Collection Config:', collectionConfig.publicKey.toString());
      console.log('📊 Account Data Length:', newConfigAccount.data.length, 'bytes');
    }
    
  } catch (error) {
    console.error('❌ Error initializing rarity oracle:', error.message);
    if (error.logs) {
      console.log('📝 Transaction logs:', error.logs);
    }
  }
}

initializeRarityOracle();
