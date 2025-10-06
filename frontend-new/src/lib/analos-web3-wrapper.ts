/**
 * Official Analos Web3 Integration
 * Built with official Analos SDKs from @analosfork
 * 
 * This module provides a comprehensive interface to the Analos blockchain
 * using the official SDKs for DAMM (Decentralized Automated Market Maker)
 * and Dynamic Bonding Curve functionality.
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { 
  AmmProgram, 
  CP_AMM_PROGRAM_ID,
  type CpAmm,
  type CreatePoolParams,
  type AddLiquidityParams,
  type GetQuoteParams
} from '@analosfork/damm-sdk';
import {
  DynamicBondingCurveProgram,
  DYNAMIC_BONDING_CURVE_PROGRAM_ID,
  type DynamicBondingCurve,
  type CreatePoolParam,
  type BuyParam,
  type SellParam,
  type ClaimCreatorTradingFeeParam
} from '@analosfork/dynamic-bonding-curve-sdk';

// Analos Network Configuration
export const ANALOS_CONFIG = {
  RPC_ENDPOINT: 'https://rpc.analos.io',
  WS_ENDPOINT: 'wss://rpc.analos.io',
  NETWORK: 'MAINNET',
  COMMITMENT: 'confirmed' as const,
  CONFIRM_TRANSACTION_TIMEOUT: 120000, // 2 minutes for Analos blockchain
  PROGRAM_IDS: {
    DAMM: CP_AMM_PROGRAM_ID,
    BONDING_CURVE: DYNAMIC_BONDING_CURVE_PROGRAM_ID
  }
} as const;

/**
 * Enhanced Analos Connection
 * Extends Solana Connection with Analos-specific functionality
 */
export class AnalosConnection extends Connection {
  private ammProgram: AmmProgram;
  private bondingCurveProgram: DynamicBondingCurveProgram;
  private isInitialized: boolean = false;

  constructor(endpoint: string = ANALOS_CONFIG.RPC_ENDPOINT, options?: any) {
    super(endpoint, options?.commitment || ANALOS_CONFIG.COMMITMENT);
    
    // Initialize Analos programs
    this.ammProgram = new AmmProgram(this);
    this.bondingCurveProgram = new DynamicBondingCurveProgram(this);
  }

  /**
   * Initialize Analos-specific functionality
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔗 Initializing Analos Connection...');
    console.log('🌐 RPC URL:', this.rpcEndpoint);
    console.log('🔌 WebSocket URL:', this.getWebSocketUrl());
    
    try {
      // Test connection
      await this.getLatestBlockhash();
      console.log('✅ Analos Connection established');
      
      // Initialize WebSocket for real-time subscriptions
      await this.initializeWebSocket();
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('⚠️ Analos Connection initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket URL for real-time subscriptions
   */
  getWebSocketUrl(): string {
    return this.rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  /**
   * Initialize WebSocket connection with timeout and graceful fallback
   */
  async initializeWebSocket(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    console.log('🔌 Initializing Analos WebSocket connection...');
    
    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('🔌 WebSocket URL:', wsUrl);
      
      // Test WebSocket connection with timeout
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          console.warn('⚠️ WebSocket connection timeout, continuing with HTTP-only mode');
          resolve();
        }, 5000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Analos WebSocket connection established');
          ws.close(); // Close test connection
          resolve();
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('⚠️ WebSocket connection failed, continuing with HTTP-only mode:', error);
          resolve();
        };
        
        ws.onclose = () => {
          clearTimeout(timeout);
        };
      });
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed, continuing with HTTP-only mode:', error);
    }
  }

  /**
   * Get Analos cluster information
   */
  getClusterInfo() {
    return {
      name: 'Analos Mainnet',
      rpc: this.rpcEndpoint,
      ws: this.getWebSocketUrl(),
      network: ANALOS_CONFIG.NETWORK,
      commitment: ANALOS_CONFIG.COMMITMENT,
      programIds: ANALOS_CONFIG.PROGRAM_IDS
    };
  }

  // DAMM (Decentralized Automated Market Maker) Methods
  
  /**
   * Get DAMM Program instance
   */
  getAmmProgram(): AmmProgram {
    return this.ammProgram;
  }

  /**
   * Create a new liquidity pool
   */
  async createPool(params: CreatePoolParams): Promise<Transaction> {
    console.log('🏊 Creating DAMM pool...', params);
    
    try {
      const transaction = await this.ammProgram.createPool(params);
      console.log('✅ DAMM pool creation transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to create DAMM pool:', error);
      throw error;
    }
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(params: AddLiquidityParams): Promise<Transaction> {
    console.log('💧 Adding liquidity to pool...', params);
    
    try {
      const transaction = await this.ammProgram.addLiquidity(params);
      console.log('✅ Add liquidity transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to add liquidity:', error);
      throw error;
    }
  }

  /**
   * Get quote for trading
   */
  async getQuote(params: GetQuoteParams): Promise<any> {
    console.log('💰 Getting quote...', params);
    
    try {
      const quote = await this.ammProgram.getQuote(params);
      console.log('✅ Quote retrieved:', quote);
      return quote;
    } catch (error) {
      console.error('❌ Failed to get quote:', error);
      throw error;
    }
  }

  // Dynamic Bonding Curve Methods
  
  /**
   * Get Dynamic Bonding Curve Program instance
   */
  getBondingCurveProgram(): DynamicBondingCurveProgram {
    return this.bondingCurveProgram;
  }

  /**
   * Create a new bonding curve pool
   */
  async createBondingCurvePool(params: CreatePoolParam): Promise<Transaction> {
    console.log('📈 Creating bonding curve pool...', params);
    
    try {
      const transaction = await this.bondingCurveProgram.createPool(params);
      console.log('✅ Bonding curve pool creation transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to create bonding curve pool:', error);
      throw error;
    }
  }

  /**
   * Buy tokens from bonding curve
   */
  async buyFromBondingCurve(params: BuyParam): Promise<Transaction> {
    console.log('🛒 Buying from bonding curve...', params);
    
    try {
      const transaction = await this.bondingCurveProgram.buy(params);
      console.log('✅ Buy transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to buy from bonding curve:', error);
      throw error;
    }
  }

  /**
   * Sell tokens to bonding curve
   */
  async sellToBondingCurve(params: SellParam): Promise<Transaction> {
    console.log('💸 Selling to bonding curve...', params);
    
    try {
      const transaction = await this.bondingCurveProgram.sell(params);
      console.log('✅ Sell transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to sell to bonding curve:', error);
      throw error;
    }
  }

  /**
   * Claim creator trading fees
   */
  async claimCreatorTradingFee(params: ClaimCreatorTradingFeeParam): Promise<Transaction> {
    console.log('💎 Claiming creator trading fees...', params);
    
    try {
      const transaction = await this.bondingCurveProgram.claimCreatorTradingFee(params);
      console.log('✅ Claim creator fee transaction prepared');
      return transaction;
    } catch (error) {
      console.error('❌ Failed to claim creator trading fee:', error);
      throw error;
    }
  }

  // Enhanced account change listener with better error handling
  async onAccountChange(
    publicKey: PublicKey,
    callback: (accountInfo: any) => void,
    commitment?: string
  ): Promise<number> {
    try {
      return await super.onAccountChange(publicKey, callback, commitment);
    } catch (error) {
      console.warn('⚠️ Account change listener failed, using fallback:', error);
      // Return a mock subscription ID
      return Math.random();
    }
  }

  // Remove account change listener
  async removeAccountChangeListener(subscriptionId: number): Promise<void> {
    try {
      await super.removeAccountChangeListener(subscriptionId);
    } catch (error) {
      console.warn('⚠️ Failed to remove account change listener:', error);
    }
  }
}

/**
 * Analos Utilities
 */
export const AnalosUtils = {
  /**
   * Get formatted error message from Analos blockchain
   */
  getAnalosErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown Analos blockchain error';
  },

  /**
   * Validate Analos address format
   */
  isValidAnalosAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Format Analos address for display
   */
  formatAddress(address: string, length: number = 8): string {
    if (!this.isValidAnalosAddress(address)) {
      return 'Invalid Address';
    }
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  },

  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number): number {
    return lamports / 1_000_000_000;
  },

  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * 1_000_000_000);
  }
};

/**
 * Main Analos export object
 */
export const Analos = {
  Connection: AnalosConnection,
  Utils: AnalosUtils,
  Config: ANALOS_CONFIG,
  
  // Program IDs for easy access
  ProgramIds: ANALOS_CONFIG.PROGRAM_IDS,
  
  // SDK instances (will be created per connection)
  getAmmProgram: (connection: AnalosConnection) => connection.getAmmProgram(),
  getBondingCurveProgram: (connection: AnalosConnection) => connection.getBondingCurveProgram()
};

// Export default
export default Analos;