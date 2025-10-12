import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';

export function useWebSocketDisabledConnection(endpoint: string) {
  return useMemo(() => {
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes
    });

    // Disable WebSocket completely
    const originalSend = connection.send.bind(connection);
    connection.send = async (method: string, ...args: any[]) => {
      // Force HTTP-only requests
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: args,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message || 'RPC Error');
      }

      return result.result;
    };

    // Disable WebSocket subscription methods
    connection.onAccountChange = () => {
      throw new Error('Account change subscriptions disabled - WebSocket not supported');
    };

    connection.onProgramAccountChange = () => {
      throw new Error('Program account change subscriptions disabled - WebSocket not supported');
    };

    connection.onSlotChange = () => {
      throw new Error('Slot change subscriptions disabled - WebSocket not supported');
    };

    connection.onSlotUpdate = () => {
      throw new Error('Slot update subscriptions disabled - WebSocket not supported');
    };

    return connection;
  }, [endpoint]);
}
