/**
 * Analos NFT-to-Token Launch SDK
 * Complete client library for all 4 programs
 */

import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  getCollectionConfigPDA,
  getTokenLaunchConfigPDA,
  getRarityConfigPDA,
  getPriceOraclePDA,
  getBondingCurveTierPDA,
  getUserTokenClaimPDA,
  calculateLosAmountForUsd,
  formatUSD,
  formatLOS,
} from "./types";

export class AnalosLaunchSDK {
  connection: Connection;
  provider: AnchorProvider;
  nftLaunchpad: Program;
  tokenLaunch: Program;
  rarityOracle: Program;
  priceOracle: Program;

  constructor(
    connection: Connection,
    wallet: any,
    programIds: {
      nftLaunchpad: PublicKey;
      tokenLaunch: PublicKey;
      rarityOracle: PublicKey;
      priceOracle: PublicKey;
    }
  ) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, {});
    
    // Initialize programs (would load IDLs in production)
    // this.nftLaunchpad = new Program(nftLaunchpadIDL, programIds.nftLaunchpad, this.provider);
    // this.tokenLaunch = new Program(tokenLaunchIDL, programIds.tokenLaunch, this.provider);
    // this.rarityOracle = new Program(rarityOracleIDL, programIds.rarityOracle, this.provider);
    // this.priceOracle = new Program(priceOracleIDL, programIds.priceOracle, this.provider);
  }

  // ========== PRICE ORACLE METHODS ==========

  async getCurrentLOSPrice(): Promise<{ priceUSD: number; marketCap: number }> {
    const [priceOraclePDA] = getPriceOraclePDA(this.priceOracle.programId);
    const oracle = await this.priceOracle.account.priceOracle.fetch(priceOraclePDA);
    
    return {
      priceUSD: oracle.losPriceUsd.toNumber() / 1e6,
      marketCap: oracle.losMarketCapUsd.toNumber() / 1e6,
    };
  }

  async calculateNFTPriceInLOS(targetUSD: number): Promise<number> {
    const { priceUSD } = await this.getCurrentLOSPrice();
    return targetUSD / priceUSD;
  }

  // ========== NFT LAUNCHPAD METHODS ==========

  async initializeCollection(params: {
    maxSupply: number;
    targetPriceUsd: number;
    revealThreshold: number;
    collectionName: string;
    collectionSymbol: string;
    placeholderUri: string;
  }) {
    const authority = this.provider.wallet.publicKey;
    const [collectionConfigPDA] = getCollectionConfigPDA(authority, this.nftLaunchpad.programId);
    
    // Get current LOS price
    const losPrice = await this.calculateNFTPriceInLOS(params.targetPriceUsd);
    
    const tx = await this.nftLaunchpad.methods
      .initializeCollection(
        new anchor.BN(params.maxSupply),
        new anchor.BN(losPrice * 1e9),
        new anchor.BN(params.revealThreshold),
        params.collectionName,
        params.collectionSymbol,
        params.placeholderUri
      )
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority,
        // ... other accounts
      })
      .rpc();
    
    return { tx, collectionConfig: collectionConfigPDA };
  }

  async mintNFT(collectionConfig: PublicKey) {
    const user = this.provider.wallet.publicKey;
    const nftMint = Keypair.generate();
    
    const tx = await this.nftLaunchpad.methods
      .mintPlaceholder()
      .accounts({
        collectionConfig,
        nftMint: nftMint.publicKey,
        payer: user,
        // ... other accounts
      })
      .signers([nftMint])
      .rpc();
    
    return { tx, nftMint: nftMint.publicKey };
  }

  async revealNFT(collectionConfig: PublicKey, nftMint: PublicKey) {
    const user = this.provider.wallet.publicKey;
    
    const tx = await this.nftLaunchpad.methods
      .revealNftWithFee()
      .accounts({
        collectionConfig,
        nftMint,
        payer: user,
        // ... other accounts
      })
      .rpc();
    
    return { tx };
  }

  // ========== TOKEN LAUNCH METHODS ==========

  async initializeTokenLaunch(params: {
    nftCollectionConfig: PublicKey;
    tokensPerNft: number;
    poolPercentageBps: number;
    tokenName: string;
    tokenSymbol: string;
  }) {
    const authority = this.provider.wallet.publicKey;
    const [tokenLaunchConfigPDA] = getTokenLaunchConfigPDA(
      params.nftCollectionConfig,
      this.tokenLaunch.programId
    );
    
    const tokenMint = Keypair.generate();
    
    const tx = await this.tokenLaunch.methods
      .initializeTokenLaunch(
        new anchor.BN(params.tokensPerNft),
        params.poolPercentageBps,
        params.tokenName,
        params.tokenSymbol
      )
      .accounts({
        tokenLaunchConfig: tokenLaunchConfigPDA,
        nftCollectionConfig: params.nftCollectionConfig,
        tokenMint: tokenMint.publicKey,
        authority,
        // ... other accounts
      })
      .signers([tokenMint])
      .rpc();
    
    return { tx, tokenLaunchConfig: tokenLaunchConfigPDA, tokenMint: tokenMint.publicKey };
  }

  async getTokenClaim(tokenLaunchConfig: PublicKey, user: PublicKey) {
    const [claimPDA] = getUserTokenClaimPDA(
      tokenLaunchConfig,
      user,
      this.tokenLaunch.programId
    );
    
    try {
      const claim = await this.tokenLaunch.account.userTokenClaim.fetch(claimPDA);
      return claim;
    } catch {
      return null; // Not claimed yet
    }
  }

  async triggerBonding(tokenLaunchConfig: PublicKey, solAmount: number) {
    const authority = this.provider.wallet.publicKey;
    
    const tx = await this.tokenLaunch.methods
      .triggerBonding(new anchor.BN(solAmount * 1e9))
      .accounts({
        tokenLaunchConfig,
        authority,
        // ... other accounts
      })
      .rpc();
    
    return { tx };
  }

  async withdrawCreatorTokens(tokenLaunchConfig: PublicKey, amount: number) {
    const creator = this.provider.wallet.publicKey;
    
    const tx = await this.tokenLaunch.methods
      .withdrawCreatorTokens(new anchor.BN(amount))
      .accounts({
        tokenLaunchConfig,
        creator,
        // ... other accounts
      })
      .rpc();
    
    return { tx };
  }

  async creatorPrebuyTokens(
    tokenLaunchConfig: PublicKey,
    amountTokens: number,
    paymentSol: number
  ) {
    const creator = this.provider.wallet.publicKey;
    
    const tx = await this.tokenLaunch.methods
      .creatorPrebuyTokens(
        new anchor.BN(amountTokens),
        new anchor.BN(paymentSol * 1e9)
      )
      .accounts({
        tokenLaunchConfig,
        creator,
        // ... other accounts
      })
      .rpc();
    
    return { tx };
  }

  // ========== RARITY ORACLE METHODS ==========

  async initializeRarityConfig(collectionConfig: PublicKey) {
    const authority = this.provider.wallet.publicKey;
    const [rarityConfigPDA] = getRarityConfigPDA(
      collectionConfig,
      this.rarityOracle.programId
    );
    
    const tx = await this.rarityOracle.methods
      .initializeRarityConfig()
      .accounts({
        rarityConfig: rarityConfigPDA,
        collectionConfig,
        authority,
        // ... other accounts
      })
      .rpc();
    
    return { tx, rarityConfig: rarityConfigPDA };
  }

  async addRarityTier(params: {
    rarityConfig: PublicKey;
    tierId: number;
    tierName: string;
    tokenMultiplier: number;
    probabilityBps: number;
  }) {
    const authority = this.provider.wallet.publicKey;
    const [tierPDA] = getRarityTierPDA(
      params.rarityConfig,
      params.tierId,
      this.rarityOracle.programId
    );
    
    const tx = await this.rarityOracle.methods
      .addRarityTier(
        params.tierId,
        params.tierName,
        new anchor.BN(params.tokenMultiplier),
        params.probabilityBps,
        []
      )
      .accounts({
        rarityConfig: params.rarityConfig,
        rarityTier: tierPDA,
        authority,
        // ... other accounts
      })
      .rpc();
    
    return { tx, rarityTier: tierPDA };
  }

  async getRarityDetermination(rarityConfig: PublicKey, nftMint: PublicKey) {
    const [determinationPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rarity_determination"),
        rarityConfig.toBuffer(),
        nftMint.toBuffer(),
      ],
      this.rarityOracle.programId
    );
    
    try {
      const determination = await this.rarityOracle.account.rarityDetermination.fetch(
        determinationPDA
      );
      return determination;
    } catch {
      return null; // Not determined yet
    }
  }

  // ========== HELPER METHODS ==========

  async getCollectionStats(collectionConfig: PublicKey) {
    const config = await this.nftLaunchpad.account.collectionConfig.fetch(collectionConfig);
    const [escrowPDA] = getEscrowWalletPDA(collectionConfig, this.nftLaunchpad.programId);
    const escrow = await this.nftLaunchpad.account.escrowWallet.fetch(escrowPDA);
    
    const [tokenLaunchPDA] = getTokenLaunchConfigPDA(
      collectionConfig,
      this.tokenLaunch.programId
    );
    const tokenConfig = await this.tokenLaunch.account.tokenLaunchConfig.fetch(tokenLaunchPDA);
    
    const [priceOraclePDA] = getPriceOraclePDA(this.priceOracle.programId);
    const oracle = await this.priceOracle.account.priceOracle.fetch(priceOraclePDA);
    
    return {
      collection: {
        name: config.collectionName,
        symbol: config.collectionSymbol,
        maxSupply: config.maxSupply.toNumber(),
        currentSupply: config.currentSupply.toNumber(),
        isRevealed: config.isRevealed,
        isPaused: config.isPaused,
      },
      pricing: {
        targetUSD: config.targetPriceUsd ? config.targetPriceUsd.toNumber() / 1e6 : 0,
        currentLOS: config.priceLamports.toNumber() / 1e9,
        losPrice: oracle.losPriceUsd.toNumber() / 1e6,
      },
      escrow: {
        creatorFunds: escrow.creatorFunds.toNumber() / 1e9,
        poolReserve: escrow.bondingCurveReserve.toNumber() / 1e9,
        totalDeposited: escrow.totalDeposited.toNumber() / 1e9,
      },
      tokens: {
        totalMinted: tokenConfig.totalTokensMinted.toString(),
        totalDistributed: tokenConfig.totalTokensDistributed.toString(),
        poolTokens: tokenConfig.poolTokens.toString(),
        creatorTokens: tokenConfig.creatorTokens.toString(),
        isBonded: tokenConfig.isBonded,
      },
    };
  }

  async getUserStats(collectionConfig: PublicKey, user: PublicKey) {
    const [tokenLaunchPDA] = getTokenLaunchConfigPDA(
      collectionConfig,
      this.tokenLaunch.programId
    );
    
    const claim = await this.getTokenClaim(tokenLaunchPDA, user);
    
    return {
      hasClaimedTokens: claim !== null,
      tokensClaimed: claim ? claim.tokensClaimed.toString() : "0",
      rarityTier: claim ? claim.rarityTier : null,
      tokenMultiplier: claim ? claim.tokenMultiplier.toNumber() : null,
    };
  }
}

// ========== EXAMPLE USAGE ==========

export async function exampleUsage() {
  const connection = new Connection("https://rpc.analos.io");
  const wallet = window.solana; // Phantom wallet
  
  const sdk = new AnalosLaunchSDK(connection, wallet, {
    nftLaunchpad: new PublicKey("7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk"),
    tokenLaunch: new PublicKey("[token_launch_id]"),
    rarityOracle: new PublicKey("[rarity_oracle_id]"),
    priceOracle: new PublicKey("[price_oracle_id]"),
  });
  
  // Get current $LOS price
  const { priceUSD, marketCap } = await sdk.getCurrentLOSPrice();
  console.log(`$LOS: $${priceUSD} (MCap: $${marketCap.toLocaleString()})`);
  
  // Initialize collection
  const { collectionConfig } = await sdk.initializeCollection({
    maxSupply: 1000,
    targetPriceUsd: 5,
    revealThreshold: 500,
    collectionName: "Analos Pioneers",
    collectionSymbol: "PION",
    placeholderUri: "ipfs://...",
  });
  
  // Mint NFT
  const { nftMint } = await sdk.mintNFT(collectionConfig);
  console.log("NFT minted:", nftMint.toString());
  
  // Reveal NFT
  await sdk.revealNFT(collectionConfig, nftMint);
  console.log("NFT revealed!");
  
  // Check tokens received
  const userStats = await sdk.getUserStats(collectionConfig, wallet.publicKey);
  console.log("Tokens received:", userStats.tokensClaimed);
  console.log("Multiplier:", userStats.tokenMultiplier);
  
  // Get collection stats
  const stats = await sdk.getCollectionStats(collectionConfig);
  console.log("Collection stats:", stats);
}

