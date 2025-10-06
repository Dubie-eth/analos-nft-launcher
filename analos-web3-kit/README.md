# @analos/web3-kit

Analos-specific web3.js fork optimized for Analos blockchain with proper WebSocket handling and network-specific optimizations.

## Features

- 🔗 **Analos-Optimized Connection**: Custom Connection class with proper WebSocket endpoints
- 🌐 **Network-Specific Configuration**: Pre-configured endpoints for Analos Mainnet, Devnet, and Testnet
- 🔌 **WebSocket Support**: Proper WebSocket handling for real-time subscriptions
- 🛠️ **Analos Utilities**: Helper functions for Analos-specific operations
- 📊 **Explorer Integration**: Built-in support for Analos explorer URLs
- 🔄 **Retry Logic**: Network-specific retry mechanisms
- ⚡ **Performance Optimized**: Optimized for Analos network characteristics

## Installation

```bash
npm install @analos/web3-kit
```

## Quick Start

```typescript
import { Analos, AnalosConnection } from '@analos/web3-kit';

// Create a connection to Analos Mainnet
const connection = Analos.createConnection('MAINNET');

// Or create with custom configuration
const customConnection = new AnalosConnection('https://rpc.analos.io', {
  network: 'MAINNET',
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000
});

// Initialize WebSocket for real-time subscriptions
await connection.initializeWebSocket();

// Get network information
const networkInfo = connection.getClusterInfo();
console.log('Connected to:', networkInfo.name);

// Get account info
const accountInfo = await connection.getAccountInfo(publicKey);

// Create and send transactions
const transaction = Analos.Utils.createAnalosTransaction();
// ... add instructions
const signature = await connection.sendTransaction(transaction, [signer]);

// Get explorer URL for transaction
const explorerUrl = connection.getExplorerUrl(signature);
console.log('View transaction:', explorerUrl);
```

## Network Configuration

### Available Networks

- **MAINNET**: Production Analos network
- **DEVNET**: Development network for testing
- **TESTNET**: Test network for integration testing

### Network Endpoints

```typescript
import { ANALOS_CONFIG } from '@analos/web3-kit';

// RPC Endpoints
console.log(ANALOS_CONFIG.RPC_ENDPOINTS.MAINNET);   // https://rpc.analos.io
console.log(ANALOS_CONFIG.RPC_ENDPOINTS.DEVNET);    // https://devnet-rpc.analos.io
console.log(ANALOS_CONFIG.RPC_ENDPOINTS.TESTNET);   // https://testnet-rpc.analos.io

// WebSocket Endpoints
console.log(ANALOS_CONFIG.WEBSOCKET_ENDPOINTS.MAINNET);   // wss://rpc.analos.io
console.log(ANALOS_CONFIG.WEBSOCKET_ENDPOINTS.DEVNET);    // wss://devnet-rpc.analos.io
console.log(ANALOS_CONFIG.WEBSOCKET_ENDPOINTS.TESTNET);   // wss://testnet-rpc.analos.io
```

## WebSocket Subscriptions

```typescript
import { AnalosConnection } from '@analos/web3-kit';

const connection = new AnalosConnection();

// Initialize WebSocket
await connection.initializeWebSocket();

// Subscribe to account changes
const subscriptionId = connection.onAccountChange(
  publicKey,
  (accountInfo) => {
    console.log('Account changed:', accountInfo);
  }
);

// Subscribe to logs
const logsSubscriptionId = connection.onLogs(
  programId,
  (logs) => {
    console.log('New logs:', logs);
  }
);

// Clean up subscriptions
connection.removeAccountChangeListener(subscriptionId);
connection.removeLogsListener(logsSubscriptionId);
```

## Utilities

```typescript
import { AnalosUtils } from '@analos/web3-kit';

// Validate Analos address
const isValid = AnalosUtils.isValidAnalosAddress('So11111111111111111111111111111111111111112');

// Format amounts
const formattedAmount = AnalosUtils.formatAnalosAmount(1000000000); // "1.000000000"
const lamports = AnalosUtils.parseAnalosAmount('1.5'); // 1500000000

// Validate transaction
const validation = AnalosUtils.validateAnalosTransaction(transaction);
if (!validation.isValid) {
  console.error('Transaction validation errors:', validation.errors);
}

// Retry operations with Analos-specific logic
const result = await AnalosUtils.retryAnalosOperation(async () => {
  return await connection.getAccountInfo(publicKey);
});
```

## Error Handling

```typescript
import { AnalosUtils } from '@analos/web3-kit';

try {
  await connection.sendTransaction(transaction, [signer]);
} catch (error) {
  const analosError = AnalosUtils.getAnalosErrorMessage(error);
  console.error('Analos transaction failed:', analosError);
}
```

## Migration from @solana/web3.js

```typescript
// Before (using @solana/web3.js)
import { Connection } from '@solana/web3.js';
const connection = new Connection('https://rpc.analos.io');

// After (using @analos/web3-kit)
import { AnalosConnection } from '@analos/web3-kit';
const connection = new AnalosConnection('https://rpc.analos.io');
// or
import { Analos } from '@analos/web3-kit';
const connection = Analos.createConnection('MAINNET');
```

## API Reference

### AnalosConnection

Extends the standard Solana Connection class with Analos-specific features.

#### Constructor

```typescript
new AnalosConnection(endpoint?: string, config?: AnalosConnectionConfig)
```

#### Methods

- `getClusterInfo(): AnalosClusterInfo` - Get network information
- `getNetwork(): AnalosNetwork` - Get current network
- `getWebSocketUrl(): string` - Get WebSocket URL
- `initializeWebSocket(): Promise<void>` - Initialize WebSocket connection
- `getExplorerUrl(signature: string): string` - Get transaction explorer URL
- `getAccountExplorerUrl(publicKey: string): string` - Get account explorer URL

### AnalosUtils

Utility functions for Analos-specific operations.

#### Methods

- `isValidAnalosAddress(address: string): boolean`
- `createAnalosTransaction(): Transaction`
- `formatAnalosAmount(lamports: number): string`
- `parseAnalosAmount(sol: string): number`
- `validateAnalosTransaction(transaction: Transaction): ValidationResult`
- `getAnalosErrorMessage(error: any): string`
- `retryAnalosOperation<T>(operation: () => Promise<T>): Promise<T>`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/analos/analos-web3-kit/issues)
- Documentation: [Full API documentation](https://docs.analos.io/web3-kit)
- Discord: [Join our community](https://discord.gg/analos)
