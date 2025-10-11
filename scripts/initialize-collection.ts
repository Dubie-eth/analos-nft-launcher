/**
 * Script to initialize a new NFT collection on Analos
 * Run with: ts-node scripts/initialize-collection.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import * as fs from "fs";
import * as path from "path";

// Configuration
const CONFIG = {
  rpcUrl: process.env.RPC_URL || "https://rpc.analos.io",
  walletPath: process.env.WALLET || `${process.env.HOME}/.config/analos/id.json`,
  
  // Collection parameters
  maxSupply: 10000,
  mintPrice: 0.1 * LAMPORTS_PER_SOL, // 0.1 LOS
  revealThreshold: 5000, // 50%
  collectionName: "Analos Mystery Collection",
  collectionSymbol: "ANAL",
  placeholderUri: "https://arweave.net/placeholder-mystery.json",
  
  // Merkle tree config
  maxDepth: 14,
  maxBufferSize: 64,
};

const BUBBLEGUM_PROGRAM_ID = new PublicKey(
  "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"
);

async function main() {
  console.log("🌳 Initializing Analos NFT Collection");
  console.log("=====================================\n");

  // Load wallet
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(CONFIG.walletPath, "utf-8")))
  );
  console.log("Wallet:", walletKeypair.publicKey.toString());

  // Connect to Analos
  const connection = new anchor.web3.Connection(
    CONFIG.rpcUrl,
    "confirmed"
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} LOS`);
  
  if (balance < 1 * LAMPORTS_PER_SOL) {
    throw new Error("Insufficient balance. Need at least 1 LOS");
  }

  // Load program
  const programId = new PublicKey(
    JSON.parse(fs.readFileSync("./deployment-info.json", "utf-8")).programId
  );
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/analos_nft_launchpad.json", "utf-8")
  );
  const program = new Program(idl, programId, provider);

  console.log("Program ID:", programId.toString());

  // Derive PDAs
  const [collectionConfigPDA, collectionConfigBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), walletKeypair.publicKey.toBuffer()],
      programId
    );

  console.log("\nCollection Config PDA:", collectionConfigPDA.toString());

  // Generate keypairs
  const merkleTree = Keypair.generate();
  const collectionMint = Keypair.generate();

  console.log("Merkle Tree:", merkleTree.publicKey.toString());
  console.log("Collection Mint:", collectionMint.publicKey.toString());

  // Derive tree authority
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [merkleTree.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );

  console.log("Tree Authority:", treeAuthority.toString());

  // Create Merkle tree account
  console.log("\n📦 Creating Merkle tree account...");
  const spaceRequirement = 1024 + (CONFIG.maxDepth * CONFIG.maxBufferSize * 32);
  const rentExemption = await connection.getMinimumBalanceForRentExemption(
    spaceRequirement
  );

  const allocTreeTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: walletKeypair.publicKey,
      newAccountPubkey: merkleTree.publicKey,
      lamports: rentExemption,
      space: spaceRequirement,
      programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
  );

  const allocSig = await provider.sendAndConfirm(allocTreeTx, [merkleTree]);
  console.log("✅ Tree account created:", allocSig);

  // Initialize collection
  console.log("\n🎨 Initializing collection...");
  console.log("Name:", CONFIG.collectionName);
  console.log("Symbol:", CONFIG.collectionSymbol);
  console.log("Max Supply:", CONFIG.maxSupply);
  console.log("Mint Price:", CONFIG.mintPrice / LAMPORTS_PER_SOL, "LOS");
  console.log("Reveal Threshold:", CONFIG.revealThreshold);

  try {
    const tx = await program.methods
      .initializeCollection(
        new BN(CONFIG.maxSupply),
        new BN(CONFIG.mintPrice),
        new BN(CONFIG.revealThreshold),
        CONFIG.collectionName,
        CONFIG.collectionSymbol,
        CONFIG.placeholderUri
      )
      .accounts({
        collectionConfig: collectionConfigPDA,
        merkleTree: merkleTree.publicKey,
        treeAuthority: treeAuthority,
        collectionMint: collectionMint.publicKey,
        authority: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([collectionMint])
      .rpc();

    console.log("✅ Collection initialized!");
    console.log("Transaction:", tx);

    // Verify
    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    console.log("\n📊 Collection Configuration:");
    console.log("============================");
    console.log("Authority:", config.authority.toString());
    console.log("Max Supply:", config.maxSupply.toString());
    console.log("Current Supply:", config.currentSupply.toString());
    console.log("Price:", config.priceLamports.toNumber() / LAMPORTS_PER_SOL, "LOS");
    console.log("Reveal Threshold:", config.revealThreshold.toString());
    console.log("Is Revealed:", config.isRevealed);
    console.log("Is Paused:", config.isPaused);
    console.log("Merkle Tree:", config.merkleTree.toString());
    console.log("Collection Mint:", config.collectionMint.toString());

    // Save collection info
    const collectionInfo = {
      programId: programId.toString(),
      collectionConfigPda: collectionConfigPDA.toString(),
      merkleTree: merkleTree.publicKey.toString(),
      treeAuthority: treeAuthority.toString(),
      collectionMint: collectionMint.publicKey.toString(),
      authority: walletKeypair.publicKey.toString(),
      config: {
        name: CONFIG.collectionName,
        symbol: CONFIG.collectionSymbol,
        maxSupply: CONFIG.maxSupply,
        mintPrice: CONFIG.mintPrice,
        revealThreshold: CONFIG.revealThreshold,
        placeholderUri: CONFIG.placeholderUri,
      },
      initializedAt: new Date().toISOString(),
      network: "analos-mainnet",
      explorerUrl: `https://explorer.analos.io/address/${collectionConfigPDA.toString()}`,
    };

    fs.writeFileSync(
      "collection-info.json",
      JSON.stringify(collectionInfo, null, 2)
    );

    console.log("\n✅ Collection info saved to collection-info.json");
    console.log("\n🎉 Collection ready for minting!");
    console.log(`\nView on explorer: ${collectionInfo.explorerUrl}`);

  } catch (error) {
    console.error("❌ Error initializing collection:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

