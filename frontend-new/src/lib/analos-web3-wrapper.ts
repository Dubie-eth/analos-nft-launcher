// Analos Web3 Wrapper - Direct import to avoid module resolution issues
// This file provides a direct path to the Analos Web3 Kit

// For now, let's create a simple wrapper that uses the regular Solana web3.js
// but with Analos-specific configuration
import { Connection } from '@solana/web3.js';

export class AnalosConnection extends Connection {
  constructor(endpoint: string, options?: any) {
    super(endpoint, options?.commitment || 'confirmed');
    
    // Store Analos-specific configuration
    this.analosConfig = {
      network: options?.network || 'MAINNET',
      commitment: options?.commitment || 'confirmed',
      confirmTransactionInitialTimeout: options?.confirmTransactionInitialTimeout || 60000
    };
  }

  // Analos-specific configuration
  private analosConfig: {
    network: string;
    commitment: string;
    confirmTransactionInitialTimeout: number;
  };

  // Get cluster information (Analos-specific)
  getClusterInfo() {
    return {
      name: 'Analos Mainnet',
      rpc: this.rpcEndpoint,
      ws: this.rpcEndpoint.replace('https://', 'wss://'),
      network: this.analosConfig.network,
      commitment: this.analosConfig.commitment
    };
  }

  // Initialize WebSocket connection (Analos-specific)
  async initializeWebSocket(): Promise<void> {
    console.log('🔌 Initializing Analos WebSocket connection...');
    
    try {
      const wsUrl = this.rpcEndpoint.replace('https://', 'wss://');
      console.log('🔌 WebSocket URL:', wsUrl);
      
      // Test WebSocket connection with timeout
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          console.warn('⚠️ WebSocket connection timeout, continuing with HTTP-only mode');
          resolve(); // Don't reject, just continue without WebSocket
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
          resolve(); // Don't reject, just continue without WebSocket
        };
        
        ws.onclose = () => {
          clearTimeout(timeout);
        };
      });
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed, continuing with HTTP-only mode:', error);
      // Don't throw, just continue without WebSocket
    }
  }

  // Enhanced account change listener with better error handling
  async onAccountChange(
    publicKey: any,
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

// Export utilities for error handling
export const AnalosUtils = {
  getAnalosErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown Analos blockchain error';
  }
};

// Export the main Analos object
export const Analos = {
  Utils: AnalosUtils,
  Connection: AnalosConnection
};
