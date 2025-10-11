// ES Module wrapper for Analos SDKs
// This file uses .mjs extension to ensure it's treated as an ES module

import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Dynamic imports for Analos SDKs (ES modules)
let CpAmm, DynamicBondingCurveClient;

async function loadSDKs() {
  try {
    const dammModule = await import('@analosfork/damm-sdk');
    const bondingCurveModule = await import('@analosfork/dynamic-bonding-curve-sdk');
    
    CpAmm = dammModule.CpAmm;
    DynamicBondingCurveClient = bondingCurveModule.DynamicBondingCurveClient;
    
    console.log('✅ Analos SDKs loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load Analos SDKs:', error);
    return false;
  }
}

export class AnalosSDKWrapper {
  constructor(connection, walletKeypair) {
    this.connection = connection;
    this.walletKeypair = walletKeypair;
    this.sdksLoaded = false;
  }

  async initialize() {
    this.sdksLoaded = await loadSDKs();
    if (this.sdksLoaded) {
      console.log('🔧 Analos SDK Wrapper initialized with real SDKs');
      console.log('🔑 Wallet:', this.walletKeypair.publicKey.toBase58());
    } else {
      console.log('⚠️  Analos SDK Wrapper initialized in fallback mode');
    }
  }

  async createNFTCollection(collectionData) {
    try {
      if (!this.sdksLoaded) {
        throw new Error('SDKs not loaded');
      }

      console.log('🚀 Creating NFT collection with real Analos SDKs...');
      
      // Create Dynamic Bonding Curve client
      const bondingCurveClient = new DynamicBondingCurveClient(
        this.connection,
        'confirmed'
      );

      // Create collection using the SDK
      const result = await bondingCurveClient.createCollection({
        name: collectionData.name,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: collectionData.image,
        maxSupply: collectionData.maxSupply,
        mintPrice: collectionData.mintPrice,
        feePercentage: collectionData.feePercentage,
        feeRecipient: new PublicKey(collectionData.feeRecipient),
        externalUrl: collectionData.externalUrl
      });

      console.log('✅ NFT collection created successfully with real SDK');
      return {
        success: true,
        configKey: result.configKey.toBase58(),
        poolAddress: result.poolAddress.toBase58(),
        transactionSignature: result.signature,
        explorerUrl: `https://explorer.analos.io/tx/${result.signature}`,
        collection: collectionData
      };

    } catch (error) {
      console.error('❌ Error creating NFT collection with real SDK:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async mintNFTs(poolAddress, quantity, userWallet) {
    try {
      if (!this.sdksLoaded) {
        throw new Error('SDKs not loaded');
      }

      console.log(`🎨 Minting ${quantity} NFTs with real Analos SDKs...`);
      
      const bondingCurveClient = new DynamicBondingCurveClient(
        this.connection,
        'confirmed'
      );

      const result = await bondingCurveClient.mint({
        poolAddress: new PublicKey(poolAddress),
        quantity: quantity,
        userWallet: new PublicKey(userWallet)
      });

      console.log('✅ NFTs minted successfully with real SDK');
      return {
        success: true,
        transactionSignature: result.signature,
        explorerUrl: `https://explorer.analos.io/tx/${result.signature}`,
        quantity,
        totalCost: result.totalCost,
        currency: 'LOS',
        nfts: result.nfts
      };

    } catch (error) {
      console.error('❌ Error minting NFTs with real SDK:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCollectionInfo(poolAddress) {
    try {
      if (!this.sdksLoaded) {
        throw new Error('SDKs not loaded');
      }

      const bondingCurveClient = new DynamicBondingCurveClient(
        this.connection,
        'confirmed'
      );

      const poolInfo = await bondingCurveClient.getPoolInfo(new PublicKey(poolAddress));
      
      return {
        success: true,
        poolAddress,
        currentPrice: poolInfo.currentPrice,
        totalSupply: poolInfo.totalSupply,
        currentSupply: poolInfo.currentSupply,
        isActive: poolInfo.isActive,
        configKey: poolInfo.configKey.toBase58(),
        authority: poolInfo.authority.toBase58()
      };

    } catch (error) {
      console.error('❌ Error getting collection info with real SDK:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
