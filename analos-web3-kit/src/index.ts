/**
 * @analos/web3-kit
 * Analos-specific web3.js fork optimized for Analos blockchain
 */

// Re-export all Solana web3.js types and functions
export * from '@solana/web3.js';

// Export Analos-specific classes and utilities
export { AnalosConnection } from './connection/analos-connection';
export { AnalosUtils } from './utils/analos-utils';

// Export Analos-specific types and constants
export {
  ANALOS_CONFIG,
  type AnalosNetwork,
  type AnalosCommitment,
  type AnalosConnectionConfig,
  type AnalosClusterInfo,
  type AnalosWebSocketConfig
} from './types/analos';

// Import the classes for the convenience object
import { AnalosConnection } from './connection/analos-connection';
import { AnalosUtils } from './utils/analos-utils';
import { ANALOS_CONFIG, type AnalosNetwork, type AnalosConnectionConfig } from './types/analos';

// Convenience exports for common use cases
export const Analos = {
  Connection: AnalosConnection,
  Utils: AnalosUtils,
  Config: ANALOS_CONFIG,
  
  // Quick connection factory methods
  createConnection: (network: AnalosNetwork = 'MAINNET', config?: AnalosConnectionConfig) => {
    const endpoint = ANALOS_CONFIG.RPC_ENDPOINTS[network];
    return new AnalosConnection(endpoint, { network, ...config });
  },
  
  // Network utilities
  getNetworkInfo: (network: AnalosNetwork) => ANALOS_CONFIG.NETWORKS[network],
  getRpcUrl: (network: AnalosNetwork) => ANALOS_CONFIG.RPC_ENDPOINTS[network],
  getWsUrl: (network: AnalosNetwork) => ANALOS_CONFIG.WEBSOCKET_ENDPOINTS[network],
  getExplorerUrl: (network: AnalosNetwork) => ANALOS_CONFIG.EXPLORER_URLS[network]
};

// Default export for easy importing
export default Analos;
