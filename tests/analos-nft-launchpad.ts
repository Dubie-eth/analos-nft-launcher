import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AnalosNftLaunchpad } from "../target/types/analos_nft_launchpad";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  createAllocTreeIx,
  ValidDepthSizePair,
} from "@solana/spl-account-compression";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";

// Metaplex Bubblegum Program ID
const BUBBLEGUM_PROGRAM_ID = new PublicKey(
  "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"
);

// Tree configuration (depth 14, buffer 64 = 16,384 NFTs max)
const MAX_DEPTH = 14;
const MAX_BUFFER_SIZE = 64;

describe("analos-nft-launchpad", () => {
  // Configure the client to use Analos mainnet or local
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnalosNftLaunchpad as Program<AnalosNftLaunchpad>;
  const authority = provider.wallet as anchor.Wallet;

  // Test accounts
  let collectionConfigPDA: PublicKey;
  let collectionConfigBump: number;
  let merkleTree: Keypair;
  let treeAuthority: PublicKey;
  let collectionMint: Keypair;
  let user1: Keypair;
  let user2: Keypair;

  // Collection parameters
  const MAX_SUPPLY = 100;
  const MINT_PRICE = 0.1 * LAMPORTS_PER_SOL; // 0.1 LOS
  const REVEAL_THRESHOLD = 50; // 50% of max supply
  const COLLECTION_NAME = "Analos Mystery Collection";
  const COLLECTION_SYMBOL = "ANAL";
  const PLACEHOLDER_URI = "https://arweave.net/placeholder-mystery.json";
  const REVEALED_BASE_URI = "https://arweave.net/revealed/";

  before(async () => {
    // Initialize test users
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Airdrop SOL to test users
    const airdropAmount = 2 * LAMPORTS_PER_SOL;
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, airdropAmount)
    );

    console.log("✅ Test users initialized and funded");
  });

  it("Initializes the collection with Merkle tree", async () => {
    // Derive collection config PDA
    [collectionConfigPDA, collectionConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), authority.publicKey.toBuffer()],
      program.programId
    );

    // Generate Merkle tree keypair
    merkleTree = Keypair.generate();

    // Derive tree authority PDA (controlled by Bubblegum)
    [treeAuthority] = PublicKey.findProgramAddressSync(
      [merkleTree.publicKey.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );

    // Generate collection mint
    collectionMint = Keypair.generate();

    // Calculate space needed for the tree
    const spaceRequirement = 1024 + (MAX_DEPTH * MAX_BUFFER_SIZE * 32);
    const rentExemption = await provider.connection.getMinimumBalanceForRentExemption(
      spaceRequirement
    );

    // Create the tree account
    const allocTreeTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: authority.publicKey,
        newAccountPubkey: merkleTree.publicKey,
        lamports: rentExemption,
        space: spaceRequirement,
        programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
    );

    await provider.sendAndConfirm(allocTreeTx, [merkleTree]);

    console.log("🌳 Merkle tree account created:", merkleTree.publicKey.toString());

    // Initialize the collection
    const tx = await program.methods
      .initializeCollection(
        new BN(MAX_SUPPLY),
        new BN(MINT_PRICE),
        new BN(REVEAL_THRESHOLD),
        COLLECTION_NAME,
        COLLECTION_SYMBOL,
        PLACEHOLDER_URI
      )
      .accounts({
        collectionConfig: collectionConfigPDA,
        merkleTree: merkleTree.publicKey,
        treeAuthority: treeAuthority,
        collectionMint: collectionMint.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([collectionMint])
      .rpc();

    console.log("✅ Collection initialized. Transaction:", tx);

    // Verify collection config
    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    assert.equal(config.maxSupply.toNumber(), MAX_SUPPLY);
    assert.equal(config.priceLamports.toNumber(), MINT_PRICE);
    assert.equal(config.revealThreshold.toNumber(), REVEAL_THRESHOLD);
    assert.equal(config.currentSupply.toNumber(), 0);
    assert.equal(config.isRevealed, false);
    assert.equal(config.isPaused, false);
    assert.equal(config.collectionName, COLLECTION_NAME);
    assert.equal(config.collectionSymbol, COLLECTION_SYMBOL);

    console.log("📊 Collection Config:", {
      authority: config.authority.toString(),
      maxSupply: config.maxSupply.toNumber(),
      currentSupply: config.currentSupply.toNumber(),
      price: config.priceLamports.toNumber() / LAMPORTS_PER_SOL + " LOS",
      revealThreshold: config.revealThreshold.toNumber(),
    });
  });

  it("Mints placeholder NFTs (mystery boxes)", async () => {
    const numMints = 5;

    for (let i = 0; i < numMints; i++) {
      const minter = i % 2 === 0 ? user1 : user2;

      try {
        const tx = await program.methods
          .mintPlaceholder()
          .accounts({
            collectionConfig: collectionConfigPDA,
            merkleTree: merkleTree.publicKey,
            treeAuthority: treeAuthority,
            payer: minter.publicKey,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            logWrapper: SPL_NOOP_PROGRAM_ID,
            compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([minter])
          .rpc();

        console.log(`✅ Minted NFT #${i}. Transaction:`, tx);
      } catch (error) {
        console.error(`❌ Failed to mint NFT #${i}:`, error);
        throw error;
      }
    }

    // Verify current supply
    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    assert.equal(config.currentSupply.toNumber(), numMints);

    console.log(`📦 Total minted: ${config.currentSupply.toNumber()}/${MAX_SUPPLY}`);
  });

  it("Prevents minting when paused", async () => {
    // Pause the collection
    await program.methods
      .setPause(true)
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("⏸️  Collection paused");

    // Try to mint (should fail)
    try {
      await program.methods
        .mintPlaceholder()
        .accounts({
          collectionConfig: collectionConfigPDA,
          merkleTree: merkleTree.publicKey,
          treeAuthority: treeAuthority,
          payer: user1.publicKey,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      assert.fail("Should have failed due to paused collection");
    } catch (error) {
      assert.include(error.toString(), "CollectionPaused");
      console.log("✅ Mint correctly blocked when paused");
    }

    // Unpause
    await program.methods
      .setPause(false)
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("▶️  Collection unpaused");
  });

  it("Updates collection config", async () => {
    const newPrice = 0.2 * LAMPORTS_PER_SOL;

    await program.methods
      .updateConfig(new BN(newPrice), null)
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();

    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    assert.equal(config.priceLamports.toNumber(), newPrice);

    console.log("✅ Price updated to:", newPrice / LAMPORTS_PER_SOL, "LOS");

    // Reset price
    await program.methods
      .updateConfig(new BN(MINT_PRICE), null)
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();
  });

  it("Mints more NFTs to reach reveal threshold", async () => {
    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    const currentSupply = config.currentSupply.toNumber();
    const neededMints = REVEAL_THRESHOLD - currentSupply;

    console.log(`🎯 Need ${neededMints} more mints to reach threshold`);

    for (let i = 0; i < neededMints; i++) {
      const minter = i % 2 === 0 ? user1 : user2;

      await program.methods
        .mintPlaceholder()
        .accounts({
          collectionConfig: collectionConfigPDA,
          merkleTree: merkleTree.publicKey,
          treeAuthority: treeAuthority,
          payer: minter.publicKey,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([minter])
        .rpc();
    }

    const updatedConfig = await program.account.collectionConfig.fetch(collectionConfigPDA);
    console.log(
      `✅ Reached reveal threshold: ${updatedConfig.currentSupply.toNumber()}/${REVEAL_THRESHOLD}`
    );
  });

  it("Reveals the collection", async () => {
    const tx = await program.methods
      .revealCollection(REVEALED_BASE_URI)
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("🎉 Collection revealed! Transaction:", tx);

    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    assert.equal(config.isRevealed, true);
    assert.equal(config.collectionUri, REVEALED_BASE_URI);

    console.log("✅ Collection is now revealed");
  });

  it("Updates NFT metadata post-reveal (simulated)", async () => {
    // Note: In production, you'd need actual Merkle proofs from the tree
    // This demonstrates the instruction interface

    console.log("📝 Update metadata instruction available for batch processing");
    console.log("   Use off-chain indexer to fetch proofs and batch update all NFTs");
    console.log("   Each NFT will receive randomized traits based on mint index");

    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
    
    // Simulate trait generation for display
    for (let i = 0; i < 5; i++) {
      const mockHash = Buffer.from(config.globalSeed);
      const rarityScore = mockHash[i % 32] % 100;
      const rarity =
        rarityScore <= 4
          ? "Legendary"
          : rarityScore <= 19
          ? "Epic"
          : rarityScore <= 49
          ? "Rare"
          : "Common";

      console.log(`   NFT #${i}: ${rarity} (score: ${rarityScore})`);
    }
  });

  it("Withdraws funds from collection", async () => {
    const configBefore = await program.account.collectionConfig.fetch(collectionConfigPDA);
    const configInfo = await provider.connection.getAccountInfo(collectionConfigPDA);
    const balanceBefore = configInfo.lamports;

    const withdrawAmount = MINT_PRICE * 10; // Withdraw 10 mint fees

    const tx = await program.methods
      .withdrawFunds(new BN(withdrawAmount))
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
      })
      .rpc();

    console.log("💰 Funds withdrawn. Transaction:", tx);

    const configInfoAfter = await provider.connection.getAccountInfo(collectionConfigPDA);
    const balanceAfter = configInfoAfter.lamports;

    assert.equal(
      balanceBefore - balanceAfter,
      withdrawAmount,
      "Withdrawn amount should match"
    );

    console.log("✅ Withdrawal successful:", withdrawAmount / LAMPORTS_PER_SOL, "LOS");
  });

  it("Displays final collection stats", async () => {
    const config = await program.account.collectionConfig.fetch(collectionConfigPDA);

    console.log("\n📊 Final Collection Statistics:");
    console.log("================================");
    console.log("Collection Name:", config.collectionName);
    console.log("Symbol:", config.collectionSymbol);
    console.log("Total Minted:", config.currentSupply.toNumber());
    console.log("Max Supply:", config.maxSupply.toNumber());
    console.log("Mint Price:", config.priceLamports.toNumber() / LAMPORTS_PER_SOL, "LOS");
    console.log("Revealed:", config.isRevealed ? "Yes ✅" : "No ❌");
    console.log("Merkle Tree:", config.merkleTree.toString());
    console.log("Collection Mint:", config.collectionMint.toString());
    console.log("================================\n");
  });
});

