/**
 * Blockchain Data Service
 * Handles all interactions with Analos blockchain and smart contracts
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { backendAPI } from './backend-api';

// Collection data types
export interface CollectionOnChain {
  address: string;
  authority: string;
  collectionName: string;
  totalSupply: number;
  mintedCount: number;
  mintPriceUSD: number;
  isWhitelistOnly: boolean;
  isPaused: boolean;
  revealTimestamp: number | null;
  programId: string;
}

export interface NFTMetadata {
  mint: string;
  owner: string;
  collectionConfig: string;
  mintNumber: number;
  isRevealed: boolean;
  rarityScore: number;
  tier: number;
}

export interface PriceOracleData {
  losMarketCapUSD: number;
  losPriceUSD: number;
  lastUpdate: number;
  isActive: boolean;
}

/**
 * Blockchain Service Class
 */
export class BlockchainService {
  private connection: Connection;
  private programIds: typeof ANALOS_PROGRAMS;

  constructor() {
    // Use backend RPC proxy for rate limiting
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    this.programIds = ANALOS_PROGRAMS;
    
    console.log('⛓️ Blockchain Service initialized');
    console.log('🔗 RPC URL:', ANALOS_RPC_URL);
  }

  /**
   * Get all collections from NFT Launchpad program
   */
  async getAllCollections(): Promise<CollectionOnChain[]> {
    try {
      console.log('📦 Loading collections from blockchain...');
      console.log('🔗 NFT Launchpad Program:', this.programIds.NFT_LAUNCHPAD.toString());

      // Use backend RPC proxy for rate limiting
      const result = await backendAPI.getProgramAccounts(
        this.programIds.NFT_LAUNCHPAD.toString(),
        {
          encoding: 'jsonParsed',
          filters: [
            // Add filters here when you know the account structure
            // For now, we'll get all accounts
          ],
        }
      );

      if (!result.success || !result.data) {
        console.warn('⚠️ No collections found or RPC call failed');
        return [];
      }

      // TODO: Parse account data based on your program's account structure
      // For now, return empty array - this will be filled when program structure is known
      console.log('📊 Raw program accounts:', result.data);
      
      return [];
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      return [];
    }
  }

  /**
   * Get collection data by address
   */
  async getCollectionByAddress(address: string): Promise<CollectionOnChain | null> {
    try {
      console.log('🔍 Loading collection:', address);

      const result = await backendAPI.getAccountInfo(address);

      if (!result.success || !result.data) {
        console.warn('⚠️ Collection not found');
        return null;
      }

      // TODO: Parse account data based on your program's account structure
      console.log('📊 Raw collection data:', result.data);
      
      return null;
    } catch (error) {
      console.error('❌ Error loading collection:', error);
      return null;
    }
  }

  /**
   * Get Price Oracle data
   */
  async getPriceOracleData(): Promise<PriceOracleData | null> {
    try {
      console.log('💰 Loading Price Oracle data...');
      console.log('🔗 Price Oracle Program:', this.programIds.PRICE_ORACLE.toString());

      // Get the oracle account
      // TODO: You'll need to know the oracle account PDA derivation
      // For now, we'll try to get program accounts
      const result = await backendAPI.getProgramAccounts(
        this.programIds.PRICE_ORACLE.toString(),
        {
          encoding: 'jsonParsed',
        }
      );

      if (!result.success || !result.data) {
        console.warn('⚠️ Price Oracle data not found');
        return null;
      }

      // TODO: Parse oracle account data based on your program's structure
      console.log('📊 Raw oracle data:', result.data);
      
      // For now, return a default value
      return {
        losMarketCapUSD: 1000000,
        losPriceUSD: 0.10,
        lastUpdate: Date.now(),
        isActive: true,
      };
    } catch (error) {
      console.error('❌ Error loading Price Oracle data:', error);
      return null;
    }
  }

  /**
   * Get user NFTs
   */
  async getUserNFTs(walletAddress: string): Promise<NFTMetadata[]> {
    try {
      console.log('🎨 Loading user NFTs for:', walletAddress);

      // Get all token accounts owned by the user
      const result = await backendAPI.proxyRPCRequest('getTokenAccountsByOwner', [
        walletAddress,
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
        },
        {
          encoding: 'jsonParsed',
        },
      ]);

      if (result.error || !result.result) {
        console.warn('⚠️ No NFTs found or RPC call failed');
        return [];
      }

      // Filter for NFTs (tokens with amount = 1 and decimals = 0)
      const nfts = result.result.value.filter((account: any) => {
        const tokenData = account.account.data.parsed.info;
        return (
          tokenData.tokenAmount.decimals === 0 &&
          tokenData.tokenAmount.amount === '1'
        );
      });

      console.log(`📊 Found ${nfts.length} NFTs for user`);

      // TODO: For each NFT, get metadata from your program
      // This would involve querying the metadata accounts

      return [];
    } catch (error) {
      console.error('❌ Error loading user NFTs:', error);
      return [];
    }
  }

  /**
   * Get recent transactions for a program
   */
  async getRecentProgramTransactions(
    programId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      console.log('📜 Loading recent transactions for program:', programId);

      const result = await backendAPI.proxyRPCRequest('getSignaturesForAddress', [
        programId,
        {
          limit,
        },
      ]);

      if (result.error || !result.result) {
        console.warn('⚠️ No transactions found');
        return [];
      }

      return result.result;
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(signature: string): Promise<any | null> {
    try {
      console.log('🔍 Loading transaction:', signature);

      const result = await backendAPI.getTransaction(signature);

      if (!result.success || !result.data) {
        console.warn('⚠️ Transaction not found');
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error loading transaction:', error);
      return null;
    }
  }

  /**
   * Calculate LOS amount needed for USD price
   * Uses Price Oracle data
   */
  async calculateLOSForUSD(usdAmount: number): Promise<number> {
    try {
      const oracleData = await this.getPriceOracleData();
      
      if (!oracleData || oracleData.losPriceUSD === 0) {
        console.warn('⚠️ Using fallback LOS price');
        // Fallback price
        return usdAmount / 0.10;
      }

      const losAmount = usdAmount / oracleData.losPriceUSD;
      console.log(`💱 ${usdAmount} USD = ${losAmount.toFixed(2)} LOS`);
      
      return losAmount;
    } catch (error) {
      console.error('❌ Error calculating LOS amount:', error);
      // Fallback calculation
      return usdAmount / 0.10;
    }
  }

  /**
   * Check if an address is a valid Solana public key
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current slot (for monitoring)
   */
  async getCurrentSlot(): Promise<number | null> {
    try {
      const result = await backendAPI.proxyRPCRequest('getSlot', []);
      
      if (result.error || result.result === undefined) {
        return null;
      }

      return result.result;
    } catch (error) {
      console.error('❌ Error getting current slot:', error);
      return null;
    }
  }

  /**
   * Get blockchain health status
   */
  async getBlockchainHealth(): Promise<{
    healthy: boolean;
    slot: number | null;
    blockTime: number | null;
  }> {
    try {
      const slot = await this.getCurrentSlot();
      
      if (slot === null) {
        return { healthy: false, slot: null, blockTime: null };
      }

      const result = await backendAPI.proxyRPCRequest('getBlockTime', [slot]);
      const blockTime = result.error ? null : result.result;

      return {
        healthy: true,
        slot,
        blockTime,
      };
    } catch (error) {
      console.error('❌ Error checking blockchain health:', error);
      return { healthy: false, slot: null, blockTime: null };
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Export convenience functions
export const getAllCollections = () => blockchainService.getAllCollections();
export const getCollectionByAddress = (address: string) => 
  blockchainService.getCollectionByAddress(address);
export const getPriceOracleData = () => blockchainService.getPriceOracleData();
export const getUserNFTs = (walletAddress: string) => 
  blockchainService.getUserNFTs(walletAddress);
export const getRecentProgramTransactions = (programId: string, limit?: number) => 
  blockchainService.getRecentProgramTransactions(programId, limit);
export const getTransactionDetails = (signature: string) => 
  blockchainService.getTransactionDetails(signature);
export const calculateLOSForUSD = (usdAmount: number) => 
  blockchainService.calculateLOSForUSD(usdAmount);
export const isValidAddress = (address: string) => 
  blockchainService.isValidAddress(address);
export const getCurrentSlot = () => blockchainService.getCurrentSlot();
export const getBlockchainHealth = () => blockchainService.getBlockchainHealth();

