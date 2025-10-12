import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  console.log("🚀 Simple Initialization Test\n");

  try {
    // Configure provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    const wallet = provider.wallet as anchor.Wallet;
    console.log(`✅ Wallet: ${wallet.publicKey.toString()}`);
    console.log(`✅ Cluster: ${provider.connection.rpcEndpoint}`);
    
    // Check wallet balance
    const balance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`✅ Balance: ${balance / 1e9} SOL\n`);
    
    if (balance === 0) {
      console.error("❌ Wallet has no SOL! Please add SOL to your wallet first.");
      process.exit(1);
    }
    
    // Test Price Oracle
    const priceOracleId = new PublicKey("5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD");
    console.log("📍 Price Oracle Program:", priceOracleId.toString());
    
    try {
      const idl = await Program.fetchIdl(priceOracleId, provider);
      if (idl) {
        console.log("✅ Price Oracle IDL found!");
        const program = new Program(idl, priceOracleId, provider);
        
        // Derive PDA
        const [priceOraclePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("price_oracle")],
          priceOracleId
        );
        
        console.log("📍 Price Oracle PDA:", priceOraclePda.toString());
        
        // Try to fetch account
        try {
          const account = await program.account.priceOracle.fetch(priceOraclePda);
          console.log("✅ Price Oracle ALREADY INITIALIZED!");
          console.log("   Data:", JSON.stringify(account, null, 2));
        } catch (e) {
          console.log("⏳ Price Oracle NOT initialized yet");
          console.log("   Initializing now...");
          
          // Initialize
          const initialMarketCap = new BN(1_000_000); // $1M
          
          const tx = await program.methods
            .initializeOracle(initialMarketCap)
            .accounts({
              priceOracle: priceOraclePda,
              authority: wallet.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          
          console.log("✅ Price Oracle initialized!");
          console.log("   Transaction:", tx);
        }
      } else {
        console.log("❌ No IDL found for Price Oracle");
      }
    } catch (e: any) {
      console.error("❌ Error with Price Oracle:", e.message || e);
    }
    
    console.log("\n✅ Initialization test complete!");
    
  } catch (e: any) {
    console.error("\n❌ Error:", e.message || e);
    console.error("\nFull error:", e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });

