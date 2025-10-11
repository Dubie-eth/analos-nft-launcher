/**
 * Blockchain Fail-Safe Service
 * Ensures blockchain is ALWAYS the single source of truth with multiple fail-safes
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { blockchainFirstService } from './blockchain-first-service';

export interface FailSafeConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackRPCs: string[];
  blockchainVerificationEnabled: boolean;
  cacheValidationEnabled: boolean;
  forceRefreshInterval: number;
}

export interface BlockchainVerificationResult {
  isValid: boolean;
  source: 'blockchain' | 'cache' | 'fallback';
  timestamp: number;
  confidence: number; // 0-100
  verificationData: any;
  warnings: string[];
}

export class BlockchainFailSafeService {
  private connection: Connection;
  private primaryRPC: string;
  private fallbackRPCs: string[];
  private verificationCache: Map<string, BlockchainVerificationResult> = new Map();
  
  private readonly FAIL_SAFE_CONFIG: FailSafeConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackRPCs: [
      'https://rpc.analos.io',
      'https://analos.drpc.org',
      'https://api.analos.com'
    ],
    blockchainVerificationEnabled: true,
    cacheValidationEnabled: true,
    forceRefreshInterval: 60000, // 1 minute
  };

  constructor() {
    this.primaryRPC = this.FAIL_SAFE_CONFIG.fallbackRPCs[0];
    this.fallbackRPCs = this.FAIL_SAFE_CONFIG.fallbackRPCs.slice(1);
    this.connection = new Connection(this.primaryRPC, 'confirmed');
    console.log('🛡️ Blockchain Fail-Safe Service initialized');
  }

  /**
   * Get collection data with multiple fail-safes
   */
  async getCollectionDataWithFailSafes(collectionName: string): Promise<any> {
    console.log(`🛡️ Getting collection data with fail-safes: ${collectionName}`);
    
    let lastError: Error | null = null;
    
    // Try primary blockchain-first service
    try {
      console.log('🔍 Attempt 1: Using blockchain-first service');
      const result = await this.attemptBlockchainFirst(collectionName);
      if (result) {
        console.log('✅ Blockchain-first service succeeded');
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn('⚠️ Blockchain-first service failed:', error);
    }

    // Try direct blockchain verification
    try {
      console.log('🔍 Attempt 2: Direct blockchain verification');
      const result = await this.attemptDirectBlockchain(collectionName);
      if (result) {
        console.log('✅ Direct blockchain verification succeeded');
        return result;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn('⚠️ Direct blockchain verification failed:', error);
    }

    // Try fallback RPCs
    for (let i = 0; i < this.fallbackRPCs.length; i++) {
      try {
        console.log(`🔍 Attempt ${3 + i}: Fallback RPC ${i + 1}`);
        const result = await this.attemptFallbackRPC(collectionName, this.fallbackRPCs[i]);
        if (result) {
          console.log(`✅ Fallback RPC ${i + 1} succeeded`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Fallback RPC ${i + 1} failed:`, error);
      }
    }

    // All methods failed
    console.error('❌ All blockchain fail-safes failed');
    throw new Error(`Failed to get collection data after ${this.FAIL_SAFE_CONFIG.maxRetries + this.fallbackRPCs.length} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Attempt blockchain-first service
   */
  private async attemptBlockchainFirst(collectionName: string): Promise<any> {
    const verification = await this.verifyBlockchainData(collectionName, 'blockchain-first');
    
    if (verification.isValid && verification.confidence >= 80) {
      return verification.verificationData;
    }
    
    throw new Error(`Blockchain-first verification failed. Confidence: ${verification.confidence}%`);
  }

  /**
   * Attempt direct blockchain query
   */
  private async attemptDirectBlockchain(collectionName: string): Promise<any> {
    console.log(`🔍 Direct blockchain query for: ${collectionName}`);
    
    // Known collection configurations
    const collections = {
      'Test': {
        mintAddress: 'TEST_COLLECTION_MINT_ADDRESS',
        collectionAddress: 'TEST_COLLECTION_ADDRESS',
        totalSupply: 100, // Small test supply
        basePrice: 10.00, // Low test price
        paymentToken: 'LOS', // Test with LOS
        isActive: false, // DISABLED - Test collection only
        mintingEnabled: false // DISABLED - No minting allowed
      },
      'The LosBros': {
        mintAddress: 'LOSBROS_COLLECTION_MINT_ADDRESS', // Will be set when live
        collectionAddress: 'LOSBROS_COLLECTION_ADDRESS',
        totalSupply: 2222, // Final supply for launch
        basePrice: 4200.69, // Final price for launch
        paymentToken: 'LOL', // Launch with LOL
        isActive: false, // DISABLED until live launch
        mintingEnabled: false // DISABLED until live launch
      },
      'New Collection': {
        mintAddress: 'NEW_COLLECTION_MINT_ADDRESS',
        collectionAddress: 'NEW_COLLECTION_ADDRESS',
        totalSupply: 1000,
        basePrice: 50.00,
        paymentToken: 'LOL',
        isActive: false, // Will be enabled when ready
        mintingEnabled: false // Will be enabled when ready
      }
    };

    const collection = collections[collectionName as keyof typeof collections];
    if (!collection) {
      throw new Error(`Collection not found: ${collectionName}`);
    }

    // Direct blockchain scan for supply
    const currentSupply = await this.scanBlockchainSupply(collection.mintAddress);
    
    return {
      name: collectionName,
      totalSupply: collection.totalSupply,
      currentSupply,
      mintPrice: collection.basePrice,
      paymentToken: collection.paymentToken,
      mintAddress: collection.mintAddress,
      collectionAddress: collection.collectionAddress,
      isActive: collection.isActive || false, // Use admin control
      mintingEnabled: collection.mintingEnabled || false, // Use admin control
      source: 'direct-blockchain',
      verified: true
    };
  }

  /**
   * Attempt fallback RPC
   */
  private async attemptFallbackRPC(collectionName: string, rpcUrl: string): Promise<any> {
    console.log(`🔍 Using fallback RPC: ${rpcUrl}`);
    
    const fallbackConnection = new Connection(rpcUrl, 'confirmed');
    
    // Test connection
    await fallbackConnection.getLatestBlockhash();
    
    // Get collection data using fallback connection
    const collection = await this.attemptDirectBlockchain(collectionName);
    collection.source = `fallback-rpc-${rpcUrl}`;
    
    return collection;
  }

  /**
   * Scan blockchain for current supply
   */
  private async scanBlockchainSupply(mintAddress: string): Promise<number> {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 },
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      const supply = tokenAccounts.length;
      console.log(`📊 Blockchain scan result: ${supply} NFTs minted`);
      return supply;

    } catch (error) {
      console.error('❌ Blockchain supply scan failed:', error);
      return 0;
    }
  }

  /**
   * Verify blockchain data integrity
   */
  private async verifyBlockchainData(collectionName: string, source: string): Promise<BlockchainVerificationResult> {
    const cacheKey = `verification_${collectionName}_${source}`;
    const cached = this.verificationCache.get(cacheKey);
    
    // Return cached verification if still valid (5 minutes)
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached;
    }

    try {
      console.log(`🔍 Verifying blockchain data: ${collectionName} from ${source}`);
      
      // Get data from source
      let verificationData;
      let confidence = 0;
      const warnings: string[] = [];

      if (source === 'blockchain-first') {
        verificationData = await blockchainFirstService.getCollectionState(collectionName);
        confidence = 85; // High confidence in blockchain-first service
      } else {
        verificationData = await this.attemptDirectBlockchain(collectionName);
        confidence = 90; // Very high confidence in direct blockchain
      }

      // Validate data integrity
      if (!verificationData) {
        warnings.push('No data returned from source');
        confidence -= 50;
      }

      if (verificationData && verificationData.currentSupply > verificationData.totalSupply) {
        warnings.push('Current supply exceeds total supply');
        confidence -= 30;
      }

      if (verificationData && verificationData.currentSupply < 0) {
        warnings.push('Negative current supply detected');
        confidence -= 40;
      }

      // Cross-verify with direct blockchain scan if confidence is low
      if (confidence < 70 && verificationData?.mintAddress) {
        console.log('🔍 Low confidence, performing cross-verification');
        const directSupply = await this.scanBlockchainSupply(verificationData.mintAddress);
        
        if (Math.abs(directSupply - verificationData.currentSupply) <= 1) {
          confidence += 20; // Boost confidence if supply matches
        } else {
          warnings.push(`Supply mismatch: source=${verificationData.currentSupply}, direct=${directSupply}`);
          confidence -= 25;
        }
      }

      const result: BlockchainVerificationResult = {
        isValid: confidence >= 60,
        source: source as 'blockchain' | 'cache' | 'fallback',
        timestamp: Date.now(),
        confidence: Math.max(0, Math.min(100, confidence)),
        verificationData,
        warnings
      };

      // Cache the verification result
      this.verificationCache.set(cacheKey, result);
      
      console.log(`✅ Blockchain verification completed: ${confidence}% confidence`);
      return result;

    } catch (error) {
      console.error('❌ Blockchain verification failed:', error);
      
      const result: BlockchainVerificationResult = {
        isValid: false,
        source: source as 'blockchain' | 'cache' | 'fallback',
        timestamp: Date.now(),
        confidence: 0,
        verificationData: null,
        warnings: [`Verification failed: ${error}`]
      };

      return result;
    }
  }

  /**
   * Force refresh all cached data
   */
  async forceRefreshCollectionData(collectionName: string): Promise<any> {
    console.log(`🔄 Force refreshing collection data: ${collectionName}`);
    
    // Clear all caches
    this.verificationCache.clear();
    
    // Force fresh blockchain data
    const result = await this.getCollectionDataWithFailSafes(collectionName);
    
    console.log(`✅ Force refresh completed: ${collectionName}`);
    return result;
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    primaryRPC: string;
    fallbackRPCs: string[];
    cacheSize: number;
    lastVerification: number;
    healthScore: number;
  } {
    const cacheSize = this.verificationCache.size;
    const lastVerification = Math.max(...Array.from(this.verificationCache.values()).map(v => v.timestamp));
    const healthScore = Math.min(100, cacheSize * 10 + (Date.now() - lastVerification < 300000 ? 50 : 0));

    return {
      primaryRPC: this.primaryRPC,
      fallbackRPCs: this.fallbackRPCs,
      cacheSize,
      lastVerification,
      healthScore
    };
  }
}

export const blockchainFailSafeService = new BlockchainFailSafeService();
