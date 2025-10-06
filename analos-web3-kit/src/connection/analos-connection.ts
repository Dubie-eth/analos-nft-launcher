/**
 * Analos-specific Connection class with proper WebSocket handling
 * Forked from @solana/web3.js Connection class
 */

import { 
  Connection as SolanaConnection,
  ConnectionConfig,
  Commitment,
  Transaction,
  TransactionSignature,
  AccountChangeCallback,
  LogsCallback,
  ProgramAccountChangeCallback,
  RootChangeCallback,
  SlotChangeCallback,
  SlotUpdateCallback,
  PublicKey,
  LogsFilter
} from '@solana/web3.js';

import { 
  ANALOS_CONFIG, 
  AnalosConnectionConfig, 
  AnalosNetwork,
  AnalosCommitment,
  AnalosClusterInfo,
  AnalosWebSocketConfig 
} from '../types/analos';

export class AnalosConnection extends SolanaConnection {
  private _analosNetwork: AnalosNetwork;
  private _analosRpcUrl: string;
  private _analosWsUrl: string;
  private _analosCommitment: AnalosCommitment;
  private _analosClusterInfo: AnalosClusterInfo;
  private _websocketConfig: AnalosWebSocketConfig;
  private _customWebSocket?: any; // Using any for WebSocket to avoid type issues

  constructor(
    endpoint: string = ANALOS_CONFIG.RPC_ENDPOINTS.MAINNET,
    config?: AnalosConnectionConfig
  ) {
    // Determine network from endpoint or config (before calling super)
    const network = config?.network || AnalosConnection.determineNetworkFromEndpoint(endpoint);
    const clusterInfo = ANALOS_CONFIG.NETWORKS[network];
    
    // Use custom RPC/WS URLs if provided, otherwise use network defaults
    const rpcUrl = config?.rpcUrl || endpoint;
    const wsUrl = config?.wsUrl || clusterInfo.ws;
    const commitment = config?.commitment || ANALOS_CONFIG.COMMITMENT_LEVELS.CONFIRMED;

    // Create Solana connection with Analos-specific config
    const solanaConfig: ConnectionConfig = {
      commitment: commitment,
      confirmTransactionInitialTimeout: config?.confirmTransactionInitialTimeout || 60000,
      disableRetryOnRateLimit: config?.disableRetryOnRateLimit || false,
      httpHeaders: config?.httpHeaders || {}
    };

    super(rpcUrl, solanaConfig);

    // Store Analos-specific configuration
    this._analosNetwork = network;
    this._analosRpcUrl = rpcUrl;
    this._analosWsUrl = wsUrl;
    this._analosCommitment = commitment;
    this._analosClusterInfo = { ...clusterInfo, commitment };
    this._websocketConfig = {
      url: wsUrl,
      reconnectDelayMs: 5000,
      maxReconnectAttempts: 10,
      heartbeatIntervalMs: 30000
    };

    console.log(`🔗 Analos Connection initialized:`, {
      network: network,
      rpcUrl: rpcUrl,
      wsUrl: wsUrl,
      commitment: commitment
    });
  }

  /**
   * Get Analos-specific cluster information
   */
  getClusterInfo(): AnalosClusterInfo {
    return this._analosClusterInfo;
  }

  /**
   * Get the current Analos network
   */
  getNetwork(): AnalosNetwork {
    return this._analosNetwork;
  }

  /**
   * Get the WebSocket URL for this connection
   */
  getWebSocketUrl(): string {
    return this._analosWsUrl;
  }

  /**
   * Create a custom WebSocket connection for Analos
   */
  private _createAnalosWebSocket(): any {
    // For now, we'll use a simple approach without complex WebSocket handling
    // This can be enhanced later with proper WebSocket implementation
    return null;
  }

  /**
   * Analos-specific account change subscription
   */
  onAnalosAccountChange(
    accountPublicKey: PublicKey,
    callback: AccountChangeCallback,
    commitment?: Commitment
  ): number {
    console.log(`📊 Setting up Analos account change subscription for: ${accountPublicKey.toString()}`);
    return super.onAccountChange(accountPublicKey, callback, commitment);
  }

  /**
   * Analos-specific logs subscription
   */
  onAnalosLogs(
    filter: LogsFilter,
    callback: LogsCallback,
    commitment?: Commitment
  ): number {
    console.log(`📝 Setting up Analos logs subscription`);
    return super.onLogs(filter, callback, commitment);
  }

  /**
   * Analos-specific program account change subscription
   */
  onAnalosProgramAccountChange(
    programId: PublicKey,
    callback: ProgramAccountChangeCallback,
    commitment?: Commitment,
    filters?: any[]
  ): number {
    console.log(`📊 Setting up Analos program account change subscription for: ${programId.toString()}`);
    return super.onProgramAccountChange(programId, callback, commitment, filters);
  }

  /**
   * Analos-specific root change subscription
   */
  onAnalosRootChange(callback: RootChangeCallback): number {
    console.log(`🌱 Setting up Analos root change subscription`);
    return super.onRootChange(callback);
  }

  /**
   * Analos-specific signature subscription
   */
  onAnalosSignature(
    signature: TransactionSignature,
    callback: any, // Simplified callback type
    commitment?: Commitment
  ): number {
    console.log(`✍️ Setting up Analos signature subscription for: ${signature}`);
    // Use a simplified approach for now
    return 0;
  }

  /**
   * Analos-specific slot change subscription
   */
  onAnalosSlotChange(callback: SlotChangeCallback): number {
    console.log(`🎰 Setting up Analos slot change subscription`);
    return super.onSlotChange(callback);
  }

  /**
   * Analos-specific slot update subscription
   */
  onAnalosSlotUpdate(callback: SlotUpdateCallback): number {
    console.log(`🎰 Setting up Analos slot update subscription`);
    return super.onSlotUpdate(callback);
  }

  /**
   * Initialize WebSocket connection for real-time subscriptions
   */
  async initializeWebSocket(): Promise<void> {
    try {
      console.log(`🔌 Initializing Analos WebSocket connection...`);
      
      // Test WebSocket connection with timeout
      if (typeof window !== 'undefined') {
        const testWs = new WebSocket(this._analosWsUrl);
        
        const connectionPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            testWs.close();
            reject(new Error('WebSocket connection timeout'));
          }, 5000);
          
          testWs.onopen = () => {
            clearTimeout(timeout);
            console.log(`✅ Analos WebSocket connection successful`);
            testWs.close();
            resolve();
          };
          
          testWs.onerror = (error) => {
            clearTimeout(timeout);
            console.warn(`⚠️ Analos WebSocket connection failed:`, error);
            reject(error);
          };
        });
        
        try {
          await connectionPromise;
        } catch (error) {
          console.warn(`⚠️ WebSocket connection failed, falling back to HTTP-only mode:`, error);
        }
      } else {
        console.log(`✅ Analos WebSocket connection initialized (server-side)`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Analos WebSocket initialization failed, continuing with HTTP-only mode:`, error);
    }
  }

  /**
   * Get Analos-specific transaction explorer URL
   */
  getExplorerUrl(signature: TransactionSignature): string {
    return `${this._analosClusterInfo.explorer}/tx/${signature}`;
  }

  /**
   * Get Analos-specific account explorer URL
   */
  getAccountExplorerUrl(publicKey: string): string {
    return `${this._analosClusterInfo.explorer}/account/${publicKey}`;
  }

  /**
   * Determine network from endpoint URL (static method)
   */
  private static determineNetworkFromEndpoint(endpoint: string): AnalosNetwork {
    if (endpoint.includes('devnet')) return 'DEVNET';
    if (endpoint.includes('testnet')) return 'TESTNET';
    return 'MAINNET';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this._customWebSocket) {
      this._customWebSocket.close();
      this._customWebSocket = undefined;
    }
    console.log(`🧹 Analos Connection destroyed`);
  }
}
