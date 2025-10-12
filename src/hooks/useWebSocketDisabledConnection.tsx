import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';

export function useWebSocketDisabledConnection(endpoint: string) {
  return useMemo(() => {
    // Create connection with WebSocket explicitly disabled and extended timeout
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 180000, // 3 minutes for extra safety
      wsEndpoint: undefined, // Explicitly disable WebSocket
    });

    return connection;
  }, [endpoint]);
}
