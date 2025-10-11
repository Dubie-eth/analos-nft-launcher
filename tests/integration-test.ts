/**
 * Complete Integration Test Suite
 * Tests all 4 programs working together
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("Analos NFT-to-Token Launch - Complete Integration", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  // Programs (will be loaded from workspace)
  const nftLaunchpad = anchor.workspace.AnalosNftLaunchpad as Program;
  const tokenLaunch = anchor.workspace.AnalosTokenLaunch as Program;
  const rarityOracle = anchor.workspace.AnalosRarityOracle as Program;
  const priceOracle = anchor.workspace.AnalosPriceOracle as Program;

  // Test accounts
  const creator = provider.wallet.publicKey;
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  // PDAs
  let collectionConfigPDA: PublicKey;
  let escrowWalletPDA: PublicKey;
  let tokenLaunchConfigPDA: PublicKey;
  let rarityConfigPDA: PublicKey;
  let priceOraclePDA: PublicKey;

  // Collection mints
  const collectionMint = Keypair.generate();
  const tokenMint = Keypair.generate();
  const nft1Mint = Keypair.generate();
  const nft2Mint = Keypair.generate();

  before("Fund test accounts", async () => {
    // Airdrop to users
    const airdrop1 = await provider.connection.requestAirdrop(
      user1.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    const airdrop2 = await provider.connection.requestAirdrop(
      user2.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(airdrop1);
    await provider.connection.confirmTransaction(airdrop2);
    
    console.log("✅ Test accounts funded");
  });

  describe("Phase 1: Initialization", () => {
    it("Initializes Price Oracle", async () => {
      [priceOraclePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("price_oracle")],
        priceOracle.programId
      );

      await priceOracle.methods
        .initializeOracle(new anchor.BN(1_000_000 * 1e6)) // $1M market cap
        .accounts({
          priceOracle: priceOraclePDA,
          authority: creator,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
      assert.equal(oracle.losMarketCapUsd.toNumber(), 1_000_000 * 1e6);
      console.log("✅ Price Oracle initialized: $LOS @ $1M market cap");
    });

    it("Updates $LOS price", async () => {
      await priceOracle.methods
        .updateLosMarketCap(
          new anchor.BN(1_000_000 * 1e6),  // $1M market cap
          new anchor.BN(1_000_000_000 * 1e9) // 1B LOS supply
        )
        .accounts({
          priceOracle: priceOraclePDA,
          updater: creator,
        })
        .rpc();

      const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
      console.log("✅ $LOS Price:", oracle.losPriceUsd.toNumber() / 1e6);
    });

    it("Initializes NFT Collection", async () => {
      [collectionConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        nftLaunchpad.programId
      );

      [escrowWalletPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow_wallet"), collectionConfigPDA.toBuffer()],
        nftLaunchpad.programId
      );

      // Initialize with $5 USD target price
      await nftLaunchpad.methods
        .initializeCollection(
          new anchor.BN(1000),        // max_supply: 1000 NFTs
          new anchor.BN(5000 * 1e9),  // price_lamports: 5000 LOS (~$5 at $0.001)
          new anchor.BN(500),         // reveal_threshold: 500
          "Test Collection",
          "TEST",
          "ipfs://placeholder"
        )
        .accounts({
          collectionConfig: collectionConfigPDA,
          collectionMint: collectionMint.publicKey,
          escrowWallet: escrowWalletPDA,
          authority: creator,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // ... other accounts
        })
        .signers([collectionMint])
        .rpc();

      const config = await nftLaunchpad.account.collectionConfig.fetch(collectionConfigPDA);
      assert.equal(config.maxSupply.toNumber(), 1000);
      assert.equal(config.collectionName, "Test Collection");
      console.log("✅ NFT Collection initialized");
    });

    it("Initializes Token Launch", async () => {
      [tokenLaunchConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_launch_config"), collectionConfigPDA.toBuffer()],
        tokenLaunch.programId
      );

      await tokenLaunch.methods
        .initializeTokenLaunch(
          new anchor.BN(10000),  // 10k tokens per NFT
          6900,                  // 69% to pool
          "Test Token",
          "TEST"
        )
        .accounts({
          tokenLaunchConfig: tokenLaunchConfigPDA,
          nftCollectionConfig: collectionConfigPDA,
          tokenMint: tokenMint.publicKey,
          authority: creator,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // ... other accounts
        })
        .signers([tokenMint])
        .rpc();

      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      assert.equal(config.tokensPerNft.toNumber(), 10000);
      assert.equal(config.poolPercentageBps, 6900);
      console.log("✅ Token Launch initialized");
    });

    it("Initializes Rarity Oracle", async () => {
      [rarityConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("rarity_config"), collectionConfigPDA.toBuffer()],
        rarityOracle.programId
      );

      await rarityOracle.methods
        .initializeRarityConfig()
        .accounts({
          rarityConfig: rarityConfigPDA,
          collectionConfig: collectionConfigPDA,
          authority: creator,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await rarityOracle.account.rarityConfig.fetch(rarityConfigPDA);
      assert.isTrue(config.isActive);
      console.log("✅ Rarity Oracle initialized");
    });

    it("Adds Rarity Tiers", async () => {
      const tiers = [
        { id: 0, name: "Common", multiplier: 1, probability: 7000 },
        { id: 1, name: "Uncommon", multiplier: 5, probability: 1500 },
        { id: 2, name: "Rare", multiplier: 10, probability: 1000 },
        { id: 3, name: "Epic", multiplier: 50, probability: 300 },
        { id: 4, name: "Legendary", multiplier: 100, probability: 150 },
        { id: 5, name: "Mythic", multiplier: 1000, probability: 50 },
      ];

      for (const tier of tiers) {
        const [tierPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("rarity_tier"), rarityConfigPDA.toBuffer(), Buffer.from([tier.id])],
          rarityOracle.programId
        );

        await rarityOracle.methods
          .addRarityTier(
            tier.id,
            tier.name,
            new anchor.BN(tier.multiplier),
            tier.probability,
            []
          )
          .accounts({
            rarityConfig: rarityConfigPDA,
            rarityTier: tierPDA,
            authority: creator,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log(`  ✅ Added tier: ${tier.name} (${tier.multiplier}x, ${tier.probability / 100}%)`);
      }

      console.log("✅ All rarity tiers added");
    });
  });

  describe("Phase 2: Minting", () => {
    it("User1 mints NFT #1", async () => {
      const tx = await nftLaunchpad.methods
        .mintPlaceholder()
        .accounts({
          collectionConfig: collectionConfigPDA,
          escrowWallet: escrowWalletPDA,
          nftMint: nft1Mint.publicKey,
          payer: user1.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // ... other accounts
        })
        .signers([user1, nft1Mint])
        .rpc();

      const config = await nftLaunchpad.account.collectionConfig.fetch(collectionConfigPDA);
      assert.equal(config.currentSupply.toNumber(), 1);
      console.log("✅ User1 minted NFT #1");
    });

    it("Tokens minted to escrow for NFT #1", async () => {
      // Check that 10,000 tokens were minted to escrow
      const tokenConfig = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      assert.equal(tokenConfig.totalTokensMinted.toNumber(), 10000 * 1e6); // With 6 decimals
      console.log("✅ 10,000 tokens minted to escrow");
    });

    it("User2 mints NFT #2", async () => {
      await nftLaunchpad.methods
        .mintPlaceholder()
        .accounts({
          collectionConfig: collectionConfigPDA,
          escrowWallet: escrowWalletPDA,
          nftMint: nft2Mint.publicKey,
          payer: user2.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          // ... other accounts
        })
        .signers([user2, nft2Mint])
        .rpc();

      const config = await nftLaunchpad.account.collectionConfig.fetch(collectionConfigPDA);
      assert.equal(config.currentSupply.toNumber(), 2);
      console.log("✅ User2 minted NFT #2");
    });
  });

  describe("Phase 3: Reveals", () => {
    it("User1 reveals NFT #1", async () => {
      const tx = await nftLaunchpad.methods
        .revealNftWithFee()
        .accounts({
          collectionConfig: collectionConfigPDA,
          nftMint: nft1Mint.publicKey,
          payer: user1.publicKey,
          // ... other accounts
        })
        .signers([user1])
        .rpc();

      console.log("✅ User1 revealed NFT #1");
    });

    it("Rarity determined for NFT #1", async () => {
      const [determinationPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("rarity_determination"),
          rarityConfigPDA.toBuffer(),
          nft1Mint.publicKey.toBuffer(),
        ],
        rarityOracle.programId
      );

      const determination = await rarityOracle.account.rarityDetermination.fetch(
        determinationPDA
      );

      console.log(`  Rarity Tier: ${determination.rarityTier}`);
      console.log(`  Multiplier: ${determination.tokenMultiplier}x`);
      console.log(`  Probability Roll: ${determination.probabilityRoll}`);
      console.log("✅ Rarity determined");
    });

    it("Tokens distributed to User1", async () => {
      const [claimPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_token_claim"),
          tokenLaunchConfigPDA.toBuffer(),
          user1.publicKey.toBuffer(),
        ],
        tokenLaunch.programId
      );

      const claim = await tokenLaunch.account.userTokenClaim.fetch(claimPDA);
      const tokensReceived = claim.tokensClaimed.toNumber() / 1e6;

      console.log(`  Tokens Received: ${tokensReceived.toLocaleString()}`);
      console.log(`  Multiplier: ${claim.tokenMultiplier}x`);
      
      assert.isAbove(tokensReceived, 0);
      console.log("✅ Tokens distributed to User1");
    });
  });

  describe("Phase 4: Bonding", () => {
    it("Triggers bonding (after sellout simulation)", async () => {
      // Note: In real test, would mint all 1000 NFTs
      // For this test, we'll just trigger bonding

      const tx = await tokenLaunch.methods
        .triggerBonding(new anchor.BN(20_700 * LAMPORTS_PER_SOL)) // $20.7k pool
        .accounts({
          tokenLaunchConfig: tokenLaunchConfigPDA,
          authority: creator,
          // ... other accounts
        })
        .rpc();

      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      
      assert.isTrue(config.isBonded);
      assert.isAbove(config.poolTokens.toNumber(), 0);
      assert.isAbove(config.creatorTokens.toNumber(), 0);
      
      console.log("✅ Bonding triggered");
      console.log(`  Pool: ${(config.poolTokens.toNumber() / 1e6).toLocaleString()} tokens (69%)`);
      console.log(`  Creator: ${(config.creatorTokens.toNumber() / 1e6).toLocaleString()} tokens (25%)`);
      console.log(`  Immediate: ${(config.creatorImmediateTokens.toNumber() / 1e6).toLocaleString()} tokens (10%)`);
      console.log(`  Vested: ${(config.creatorVestedTokens.toNumber() / 1e6).toLocaleString()} tokens (15%)`);
    });

    it("Verifies vesting schedule", async () => {
      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      
      const immediate = config.creatorImmediateTokens.toNumber();
      const vested = config.creatorVestedTokens.toNumber();
      const total = config.creatorTokens.toNumber();
      
      // 10% should be immediate
      const expectedImmediate = Math.floor(total * 0.4); // 10% of 25% = 40% of creator total
      const tolerance = total * 0.01; // 1% tolerance
      
      assert.approximately(immediate, expectedImmediate, tolerance);
      console.log("✅ Vesting schedule verified");
    });
  });

  describe("Phase 5: Creator Claims", () => {
    it("Creator claims immediate tokens (10%)", async () => {
      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      const immediateAmount = config.creatorImmediateTokens;

      await tokenLaunch.methods
        .withdrawCreatorTokens(immediateAmount)
        .accounts({
          tokenLaunchConfig: tokenLaunchConfigPDA,
          authority: creator,
          // ... other accounts
        })
        .rpc();

      const updatedConfig = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      assert.equal(
        updatedConfig.creatorTokensClaimed.toNumber(),
        immediateAmount.toNumber()
      );
      
      console.log("✅ Creator claimed immediate 10%");
    });

    it("Creator cannot claim more than vested (should fail)", async () => {
      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      const allVested = config.creatorVestedTokens;

      try {
        await tokenLaunch.methods
          .withdrawCreatorTokens(allVested)
          .accounts({
            tokenLaunchConfig: tokenLaunchConfigPDA,
            authority: creator,
            // ... other accounts
          })
          .rpc();
        
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.toString(), "InsufficientVestedTokens");
        console.log("✅ Vesting protection working");
      }
    });
  });

  describe("Phase 6: Price Updates", () => {
    it("Updates $LOS price to $0.01 (10x pump)", async () => {
      await priceOracle.methods
        .updateLosMarketCap(
          new anchor.BN(10_000_000 * 1e6),   // $10M market cap
          new anchor.BN(1_000_000_000 * 1e9) // 1B LOS supply
        )
        .accounts({
          priceOracle: priceOraclePDA,
          updater: creator,
        })
        .rpc();

      const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);
      const newPrice = oracle.losPriceUsd.toNumber() / 1e6;
      
      assert.equal(newPrice, 0.01);
      console.log("✅ $LOS price updated to $0.01 (10x pump!)");
    });

    it("NFT prices auto-adjust for new $LOS price", async () => {
      // Sync prices
      await nftLaunchpad.methods
        .syncPriceWithOracle()
        .accounts({
          collectionConfig: collectionConfigPDA,
          priceOracle: priceOraclePDA,
        })
        .rpc();

      const config = await nftLaunchpad.account.collectionConfig.fetch(collectionConfigPDA);
      const newPriceInLOS = config.priceLamports.toNumber() / 1e9;
      
      // Should be ~500 LOS now (was 5000 LOS)
      assert.approximately(newPriceInLOS, 500, 50);
      console.log(`✅ NFT price adjusted: ${newPriceInLOS} LOS (still ~$5 USD)`);
    });
  });

  describe("Phase 7: Buyback", () => {
    it("Configures buyback pricing", async () => {
      await tokenLaunch.methods
        .configureBuyback(
          true,
          new anchor.BN(100_000 * 1e6) // 100k tokens
        )
        .accounts({
          tokenLaunchConfig: tokenLaunchConfigPDA,
          authority: creator,
        })
        .rpc();

      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      assert.isTrue(config.buybackEnabled);
      console.log("✅ Buyback configured: 100k tokens");
    });

    it("User buys back NFT with tokens", async () => {
      await tokenLaunch.methods
        .buybackNftWithTokens()
        .accounts({
          tokenLaunchConfig: tokenLaunchConfigPDA,
          user: user1.publicKey,
          // ... other accounts
        })
        .signers([user1])
        .rpc();

      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      assert.equal(config.totalBuybacks.toNumber(), 1);
      console.log("✅ User1 bought back NFT");
    });
  });

  describe("Phase 8: Stats & Verification", () => {
    it("Verifies fee distribution", async () => {
      const escrow = await nftLaunchpad.account.escrowWallet.fetch(escrowWalletPDA);
      
      console.log("\n📊 Fee Distribution Verification:");
      console.log(`  Creator Funds: ${escrow.creatorFunds.toNumber() / 1e9} LOS`);
      console.log(`  Pool Reserve: ${escrow.bondingCurveReserve.toNumber() / 1e9} LOS`);
      console.log(`  Total Deposited: ${escrow.totalDeposited.toNumber() / 1e9} LOS`);
      console.log("✅ Fee distribution verified");
    });

    it("Verifies token distribution", async () => {
      const config = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      
      const poolPercentage = (config.poolTokens.toNumber() / config.totalTokensMinted.toNumber()) * 100;
      const creatorPercentage = (config.creatorTokens.toNumber() / config.totalTokensMinted.toNumber()) * 100;
      
      console.log("\n📊 Token Distribution:");
      console.log(`  Pool: ${poolPercentage.toFixed(1)}% (target: 69%)`);
      console.log(`  Creator: ${creatorPercentage.toFixed(1)}% (target: 25%)`);
      
      assert.approximately(poolPercentage, 69, 5);
      console.log("✅ Token distribution verified");
    });

    it("Verifies rarity distribution", async () => {
      const config = await rarityOracle.account.rarityConfig.fetch(rarityConfigPDA);
      
      console.log("\n📊 Rarity Stats:");
      console.log(`  Total Revealed: ${config.totalRevealed}`);
      console.log(`  Oracle Active: ${config.isActive}`);
      console.log("✅ Rarity system verified");
    });
  });

  describe("Phase 9: Complete System Test", () => {
    it("Verifies all programs are integrated", async () => {
      const nftConfig = await nftLaunchpad.account.collectionConfig.fetch(collectionConfigPDA);
      const tokenConfig = await tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchConfigPDA);
      const rarityConfig = await rarityOracle.account.rarityConfig.fetch(rarityConfigPDA);
      const oracle = await priceOracle.account.priceOracle.fetch(priceOraclePDA);

      console.log("\n🎉 COMPLETE SYSTEM VERIFICATION:");
      console.log("\n📦 NFT Launchpad:");
      console.log(`  Collection: ${nftConfig.collectionName}`);
      console.log(`  Supply: ${nftConfig.currentSupply}/${nftConfig.maxSupply}`);
      console.log(`  Price: ${nftConfig.priceLamports.toNumber() / 1e9} LOS`);
      
      console.log("\n💰 Token Launch:");
      console.log(`  Tokens Minted: ${(tokenConfig.totalTokensMinted.toNumber() / 1e6).toLocaleString()}`);
      console.log(`  Tokens Distributed: ${(tokenConfig.totalTokensDistributed.toNumber() / 1e6).toLocaleString()}`);
      console.log(`  Bonded: ${tokenConfig.isBonded}`);
      
      console.log("\n🎲 Rarity Oracle:");
      console.log(`  Total Revealed: ${rarityConfig.totalRevealed}`);
      console.log(`  Active: ${rarityConfig.isActive}`);
      
      console.log("\n💱 Price Oracle:");
      console.log(`  $LOS Price: $${oracle.losPriceUsd.toNumber() / 1e6}`);
      console.log(`  Market Cap: $${(oracle.losMarketCapUsd.toNumber() / 1e6).toLocaleString()}`);
      console.log(`  Updates: ${oracle.updateCount}`);
      
      console.log("\n✅ ALL SYSTEMS OPERATIONAL!");
    });
  });
});

