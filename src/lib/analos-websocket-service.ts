/**
 * ANALOS WEBSOCKET SERVICE
 * Real-time connection to Analos blockchain for live updates
 * Uses Analos RPC endpoints for blockchain monitoring
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

export class AnalosWebSocketService {
  private connection: Connection;
  private subscriptions: Map<string, number> = new Map();
  private isConnected: boolean = false;

  constructor() {
    // Use WebSocket endpoint for real-time updates on Analos blockchain
    const wsUrl = ANALOS_RPC_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    this.connection = new Connection(wsUrl, 'confirmed');
    console.log('🔌 Analos WebSocket Service initialized');
    console.log('🌐 WebSocket URL:', wsUrl);
    console.log('⛓️ Blockchain: Analos Mainnet');
  }

  /**
   * Subscribe to account changes for real-time updates
   */
  async subscribeToAccount(
    accountAddress: PublicKey,
    callback: (accountInfo: any) => void,
    subscriptionId?: string
  ): Promise<string> {
    try {
      const id = subscriptionId || `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscriptionId_num = this.connection.onAccountChange(
        accountAddress,
        (accountInfo) => {
          console.log(`📡 Account update received for ${accountAddress.toString()}`);
          callback(accountInfo);
        },
        'confirmed'
      );

      this.subscriptions.set(id, subscriptionId_num);
      this.isConnected = true;
      
      console.log(`✅ Subscribed to account ${accountAddress.toString()} with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to subscribe to account:', error);
      throw error;
    }
  }

  /**
   * Subscribe to program account changes
   */
  async subscribeToProgramAccounts(
    programId: PublicKey,
    callback: (accountInfo: any, accountId: PublicKey) => void,
    subscriptionId?: string
  ): Promise<string> {
    try {
      const id = subscriptionId || `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscriptionId_num = this.connection.onProgramAccountChange(
        programId,
        (keyedAccountInfo, context) => {
          console.log(`📡 Program account update received for ${keyedAccountInfo.accountId.toString()}`);
          callback(keyedAccountInfo.accountInfo, keyedAccountInfo.accountId);
        },
        'confirmed'
      );

      this.subscriptions.set(id, subscriptionId_num);
      this.isConnected = true;
      
      console.log(`✅ Subscribed to program ${programId.toString()} with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to subscribe to program accounts:', error);
      throw error;
    }
  }

  /**
   * Subscribe to signature status for transaction monitoring
   */
  async subscribeToSignature(
    signature: string,
    callback: (status: any) => void,
    subscriptionId?: string
  ): Promise<string> {
    try {
      const id = subscriptionId || `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscriptionId_num = this.connection.onSignature(
        signature,
        (result, context) => {
          console.log(`📡 Signature status update for ${signature}:`, result);
          callback({ result, context });
        },
        'confirmed'
      );

      this.subscriptions.set(id, subscriptionId_num);
      this.isConnected = true;
      
      console.log(`✅ Subscribed to signature ${signature} with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to subscribe to signature:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): boolean {
    try {
      const subscriptionId_num = this.subscriptions.get(subscriptionId);
      if (subscriptionId_num !== undefined) {
        this.connection.removeAccountChangeListener(subscriptionId_num);
        this.subscriptions.delete(subscriptionId);
        console.log(`✅ Unsubscribed from ${subscriptionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    try {
      for (const [id, subscriptionId_num] of this.subscriptions) {
        this.connection.removeAccountChangeListener(subscriptionId_num);
        console.log(`✅ Unsubscribed from ${id}`);
      }
      this.subscriptions.clear();
      this.isConnected = false;
      console.log('✅ All subscriptions cleared');
    } catch (error) {
      console.error('❌ Failed to unsubscribe all:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; subscriptionCount: number } {
    return {
      isConnected: this.isConnected,
      subscriptionCount: this.subscriptions.size
    };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Singleton instance
let websocketService: AnalosWebSocketService | null = null;

export function getAnalosWebSocketService(): AnalosWebSocketService {
  if (!websocketService) {
    websocketService = new AnalosWebSocketService();
  }
  return websocketService;
}

export default AnalosWebSocketService;
