// Analos SDK Wrapper to handle CommonJS/ESM compatibility issues
import { Connection, PublicKey } from '@solana/web3.js';

// Dynamic imports to handle ES modules
let CpAmm: any;
let DynamicBondingCurve: any;

// Initialize SDKs with dynamic imports
export async function initializeAnalosSDKs() {
  try {
    // Import ES modules dynamically
    const dammSDK = await import('@analosfork/damm-sdk');
    const bondingCurveSDK = await import('@analosfork/dynamic-bonding-curve-sdk');
    
    console.log('📦 Damm SDK exports:', Object.keys(dammSDK));
    console.log('📦 Bonding Curve SDK exports:', Object.keys(bondingCurveSDK));
    
    // Extract the actual classes/functions - these SDKs export different structures
    CpAmm = dammSDK.default || dammSDK;
    DynamicBondingCurve = bondingCurveSDK.default || bondingCurveSDK;
    
    console.log('✅ Analos SDKs initialized successfully');
    console.log('📦 CpAmm:', !!CpAmm);
    console.log('📦 DynamicBondingCurve:', !!DynamicBondingCurve);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Analos SDKs:', error);
    return false;
  }
}

export class AnalosSDKWrapper {
  private connection: Connection;
  private cpAmm: any;
  private dynamicBondingCurve: any;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async initialize() {
    const success = await initializeAnalosSDKs();
    if (!success) {
      throw new Error('Failed to initialize Analos SDKs');
    }

    try {
      // Initialize SDKs - these might be functions or classes
      if (typeof CpAmm === 'function') {
        this.cpAmm = new CpAmm(this.connection);
      } else {
        this.cpAmm = CpAmm;
      }
      
      if (typeof DynamicBondingCurve === 'function') {
        this.dynamicBondingCurve = new DynamicBondingCurve(this.connection, 'confirmed');
      } else {
        this.dynamicBondingCurve = DynamicBondingCurve;
      }
      
      console.log('✅ Analos SDK instances created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create SDK instances:', error);
      throw error;
    }
  }

  async deployNFTCollection(collectionData: {
    name: string;
    description: string;
    image: string;
    price: number;
    maxSupply: number;
    feePercentage: number;
    feeRecipient: string;
    symbol: string;
    externalUrl: string;
  }) {
    try {
      console.log('🚀 Deploying NFT collection with Analos SDKs...');
      console.log('📊 Collection data:', {
        name: collectionData.name,
        price: collectionData.price,
        maxSupply: collectionData.maxSupply,
        symbol: collectionData.symbol
      });

      // Use DynamicBondingCurve to create the collection
      const deployResult = await this.dynamicBondingCurve.createCollection({
        name: collectionData.name,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: collectionData.image,
        maxSupply: collectionData.maxSupply,
        price: collectionData.price,
        feeRecipient: collectionData.feeRecipient,
        externalUrl: collectionData.externalUrl
      });

      console.log('✅ Collection deployed successfully:', deployResult);
      return {
        success: true,
        collectionId: deployResult.collectionId,
        poolAddress: deployResult.poolAddress,
        mintAddress: deployResult.mintAddress,
        transactionSignature: deployResult.signature
      };
    } catch (error) {
      console.error('❌ Failed to deploy collection:', error);
      throw error;
    }
  }

  async mintNFT(collectionId: string, quantity: number, userWallet: string) {
    try {
      console.log('🎨 Minting NFT with Analos SDKs...');
      console.log('📊 Mint data:', {
        collectionId,
        quantity,
        userWallet
      });

      // Use DynamicBondingCurve to mint NFTs
      const mintResult = await this.dynamicBondingCurve.mint({
        collectionId,
        quantity,
        userWallet
      });

      console.log('✅ NFT minted successfully:', mintResult);
      
      // Return transaction for wallet signing
      return {
        success: true,
        requiresWalletSigning: true,
        transaction: mintResult.transaction, // Base64 encoded transaction
        totalCost: mintResult.totalCost,
        nfts: mintResult.nfts
      };
    } catch (error) {
      console.error('❌ Failed to mint NFT:', error);
      throw error;
    }
  }

  async getCollectionInfo(collectionId: string) {
    try {
      console.log('📊 Getting collection info for:', collectionId);
      
      const collectionInfo = await this.dynamicBondingCurve.getCollectionInfo(collectionId);
      
      console.log('✅ Collection info retrieved:', collectionInfo);
      return collectionInfo;
    } catch (error) {
      console.error('❌ Failed to get collection info:', error);
      throw error;
    }
  }
}
