/**
 * Blockchain Event Listener Service
 * 
 * Listens for events from the Analos NFT program
 * Tracks mints, reveals, and other important events
 */

import { Connection, PublicKey, Logs, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface MintEvent {
  signature: string;
  mint: string;
  collection: string;
  owner: string;
  timestamp: number;
  slot: number;
}

export interface RevealEvent {
  signature: string;
  collection: string;
  revealed: number;
  timestamp: number;
  slot: number;
}

export type EventCallback = (event: MintEvent | RevealEvent) => void;

export class EventListenerService {
  private connection: Connection;
  private programId: PublicKey;
  private subscriptionId: number | null = null;
  private mintCallbacks: EventCallback[] = [];
  private revealCallbacks: EventCallback[] = [];
  private isListening: boolean = false;

  constructor() {
    const rpcUrl = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';
    const programIdStr = process.env.ANALOS_PROGRAM_ID || '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk';

    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    });
    
    this.programId = new PublicKey(programIdStr);

    console.log(`✅ Event Listener initialized for program: ${programIdStr}`);
  }

  /**
   * Start listening for events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.warn('⚠️ Event listener already running');
      return;
    }

    try {
      console.log('🎧 Starting event listener...');

      // Subscribe to program logs
      this.subscriptionId = this.connection.onLogs(
        this.programId,
        (logs: Logs, context) => {
          this.handleLogs(logs, context);
        },
        'confirmed'
      );

      this.isListening = true;
      console.log('✅ Event listener started');

    } catch (error) {
      console.error('❌ Error starting event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  async stopListening(): Promise<void> {
    if (!this.isListening || this.subscriptionId === null) {
      console.warn('⚠️ Event listener not running');
      return;
    }

    try {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      this.isListening = false;
      console.log('✅ Event listener stopped');
    } catch (error) {
      console.error('❌ Error stopping event listener:', error);
    }
  }

  /**
   * Handle incoming logs
   */
  private async handleLogs(logs: Logs, context: any): Promise<void> {
    try {
      const signature = logs.signature;
      const slot = context.slot;

      // Check if this is a mint or reveal event
      const logMessages = logs.logs.join(' ');

      if (logMessages.includes('MintNFT')) {
        await this.handleMintEvent(signature, slot);
      } else if (logMessages.includes('RevealCollection')) {
        await this.handleRevealEvent(signature, slot);
      }

    } catch (error) {
      console.error('❌ Error handling logs:', error);
    }
  }

  /**
   * Handle mint event
   */
  private async handleMintEvent(signature: string, slot: number): Promise<void> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx) {
        console.warn('⚠️ Transaction not found:', signature);
        return;
      }

      // Parse mint event from transaction
      // Note: This is simplified - you'll need to parse the actual instruction data
      const mintEvent: MintEvent = {
        signature,
        mint: 'TBD', // Parse from instruction data
        collection: 'TBD', // Parse from instruction data
        owner: 'TBD', // Parse from instruction data
        timestamp: Date.now(),
        slot
      };

      console.log('🎨 Mint event detected:', signature);

      // Notify callbacks
      this.mintCallbacks.forEach(callback => {
        try {
          callback(mintEvent);
        } catch (error) {
          console.error('❌ Error in mint callback:', error);
        }
      });

    } catch (error) {
      console.error('❌ Error handling mint event:', error);
    }
  }

  /**
   * Handle reveal event
   */
  private async handleRevealEvent(signature: string, slot: number): Promise<void> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx) {
        console.warn('⚠️ Transaction not found:', signature);
        return;
      }

      // Parse reveal event from transaction
      const revealEvent: RevealEvent = {
        signature,
        collection: 'TBD', // Parse from instruction data
        revealed: 0, // Parse from instruction data
        timestamp: Date.now(),
        slot
      };

      console.log('👁️ Reveal event detected:', signature);

      // Notify callbacks
      this.revealCallbacks.forEach(callback => {
        try {
          callback(revealEvent);
        } catch (error) {
          console.error('❌ Error in reveal callback:', error);
        }
      });

    } catch (error) {
      console.error('❌ Error handling reveal event:', error);
    }
  }

  /**
   * Register mint event callback
   */
  onMint(callback: EventCallback): void {
    this.mintCallbacks.push(callback);
  }

  /**
   * Register reveal event callback
   */
  onReveal(callback: EventCallback): void {
    this.revealCallbacks.push(callback);
  }

  /**
   * Get recent events by scanning signatures
   */
  async getRecentEvents(limit: number = 100): Promise<MintEvent[]> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.programId,
        { limit }
      );

      const events: MintEvent[] = [];

      for (const sig of signatures) {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });

          if (tx) {
            // Parse events from transaction
            // This is simplified - implement actual parsing
            const logMessages = tx.meta?.logMessages?.join(' ') || '';
            
            if (logMessages.includes('MintNFT')) {
              events.push({
                signature: sig.signature,
                mint: 'TBD',
                collection: 'TBD',
                owner: 'TBD',
                timestamp: (sig.blockTime || 0) * 1000,
                slot: sig.slot
              });
            }
          }
        } catch (error) {
          console.warn('⚠️ Error parsing transaction:', sig.signature);
        }
      }

      return events;

    } catch (error) {
      console.error('❌ Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get listener status
   */
  getStatus(): { isListening: boolean; programId: string; subscriptionId: number | null } {
    return {
      isListening: this.isListening,
      programId: this.programId.toBase58(),
      subscriptionId: this.subscriptionId
    };
  }
}

// Export singleton instance
export const eventListenerService = new EventListenerService();

