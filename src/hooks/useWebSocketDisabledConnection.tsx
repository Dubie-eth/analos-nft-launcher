import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';

/**
 * SECURITY: Secure WebSocket-disabled connection hook
 * Simplified and hardened for production use
 */
export function useWebSocketDisabledConnection(endpoint: string) {
  return useMemo(() => {
    // SECURITY: Create secure connection with WebSocket explicitly disabled
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true, // Disable retry to prevent resource exhaustion
      confirmTransactionInitialTimeout: 60000, // 1 minute timeout (reduced from 3 minutes)
      wsEndpoint: undefined, // Explicitly disable WebSocket connections
      httpHeaders: {
        'User-Agent': 'Analos-NFT-Launchpad/1.0',
      },
    });

    return connection;
  }, [endpoint]);
}
