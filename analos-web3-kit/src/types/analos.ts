/**
 * Analos-specific types and constants
 */

export const ANALOS_CONFIG = {
  // Analos RPC endpoints
  RPC_ENDPOINTS: {
    MAINNET: 'https://rpc.analos.io',
    DEVNET: 'https://devnet-rpc.analos.io',
    TESTNET: 'https://testnet-rpc.analos.io'
  },
  
  // Analos WebSocket endpoints
  WEBSOCKET_ENDPOINTS: {
    MAINNET: 'wss://rpc.analos.io',
    DEVNET: 'wss://devnet-rpc.analos.io', 
    TESTNET: 'wss://testnet-rpc.analos.io'
  },
  
  // Analos-specific constants
  NATIVE_MINT: 'So11111111111111111111111111111111111111112',
  NATIVE_MINT_ACCOUNT: 'So11111111111111111111111111111111111111113',
  
  // Analos token program IDs
  TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  
  // Analos-specific program IDs (these would be the actual Analos program IDs)
  METADATA_PROGRAM_ID: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  SYSTEM_PROGRAM_ID: '11111111111111111111111111111111',
  
  // Analos explorer URLs
  EXPLORER_URLS: {
    MAINNET: 'https://explorer.analos.io',
    DEVNET: 'https://devnet-explorer.analos.io',
    TESTNET: 'https://testnet-explorer.analos.io'
  },
  
  // Analos-specific commitment levels
  COMMITMENT_LEVELS: {
    PROCESSED: 'processed',
    CONFIRMED: 'confirmed', 
    FINALIZED: 'finalized'
  } as const,
  
  // Analos network configurations
  NETWORKS: {
    MAINNET: {
      name: 'Analos Mainnet',
      rpc: 'https://rpc.analos.io',
      ws: 'wss://rpc.analos.io',
      explorer: 'https://explorer.analos.io'
    },
    DEVNET: {
      name: 'Analos Devnet', 
      rpc: 'https://devnet-rpc.analos.io',
      ws: 'wss://devnet-rpc.analos.io',
      explorer: 'https://devnet-explorer.analos.io'
    },
    TESTNET: {
      name: 'Analos Testnet',
      rpc: 'https://testnet-rpc.analos.io', 
      ws: 'wss://testnet-rpc.analos.io',
      explorer: 'https://testnet-explorer.analos.io'
    }
  }
};

export type AnalosNetwork = keyof typeof ANALOS_CONFIG.NETWORKS;
export type AnalosCommitment = typeof ANALOS_CONFIG.COMMITMENT_LEVELS[keyof typeof ANALOS_CONFIG.COMMITMENT_LEVELS];

export interface AnalosConnectionConfig {
  network?: AnalosNetwork;
  rpcUrl?: string;
  wsUrl?: string;
  commitment?: AnalosCommitment;
  confirmTransactionInitialTimeout?: number;
  disableRetryOnRateLimit?: boolean;
  httpHeaders?: Record<string, string>;
}

export interface AnalosClusterInfo {
  name: string;
  rpc: string;
  ws: string;
  explorer: string;
  commitment?: AnalosCommitment;
}

export interface AnalosWebSocketConfig {
  url: string;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
}
