# Migration Guide: From @solana/web3.js to @analos/web3-kit

This guide will help you migrate your Analos NFT Platform from using the standard Solana web3.js library to the Analos-specific web3.js fork that properly handles Analos network characteristics and WebSocket connections.

## Overview

The Analos Web3 Kit provides:
- ✅ **Proper WebSocket endpoints** for Analos network
- ✅ **Network-specific optimizations** for Analos blockchain
- ✅ **Analos-specific error handling** and retry logic
- ✅ **Built-in explorer URL generation** for Analos
- ✅ **Compatibility layer** with existing Solana web3.js code

## Step 1: Install the Analos Web3 Kit

```bash
# In your main application directory
cd ../frontend-new
npm install ../analos-web3-kit
```

Or if you publish it to npm:
```bash
npm install @analos/web3-kit
```

## Step 2: Update Imports

### Before (using @solana/web3.js):
```typescript
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
```

### After (using @analos/web3-kit):
```typescript
import { AnalosConnection, PublicKey, Transaction, Analos } from '@analos/web3-kit';
// or
import { Analos } from '@analos/web3-kit';
```

## Step 3: Update Connection Creation

### Before:
```typescript
const connection = new Connection('https://rpc.analos.io', 'confirmed');
```

### After:
```typescript
// Option 1: Using Analos factory method
const connection = Analos.createConnection('MAINNET');

// Option 2: Using direct constructor
const connection = new AnalosConnection('https://rpc.analos.io', {
  network: 'MAINNET',
  commitment: 'confirmed'
});

// Option 3: With custom configuration
const connection = new AnalosConnection('https://rpc.analos.io', {
  network: 'MAINNET',
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  httpHeaders: {
    'User-Agent': 'Analos-NFT-Platform'
  }
});
```

## Step 4: Update WebSocket Subscriptions

### Before:
```typescript
// This would fail with WebSocket connection errors
const subscriptionId = connection.onAccountChange(
  publicKey,
  (accountInfo) => {
    console.log('Account changed:', accountInfo);
  }
);
```

### After:
```typescript
// Initialize WebSocket first
await connection.initializeWebSocket();

// Use Analos-specific subscription methods
const subscriptionId = connection.onAnalosAccountChange(
  publicKey,
  (accountInfo) => {
    console.log('Account changed:', accountInfo);
  }
);
```

## Step 5: Update Error Handling

### Before:
```typescript
try {
  await connection.sendTransaction(transaction, [signer]);
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

### After:
```typescript
try {
  await connection.sendTransaction(transaction, [signer]);
} catch (error) {
  const analosError = Analos.Utils.getAnalosErrorMessage(error);
  console.error('Analos transaction failed:', analosError);
}
```

## Step 6: Update Explorer URLs

### Before:
```typescript
const explorerUrl = `https://explorer.analos.io/tx/${signature}`;
```

### After:
```typescript
// Built-in explorer URL generation
const explorerUrl = connection.getExplorerUrl(signature);
const accountUrl = connection.getAccountExplorerUrl(publicKey.toString());
```

## Step 7: Update Utility Functions

### Before:
```typescript
const isValid = PublicKey.isOnCurve(address);
const formattedAmount = (lamports / 1e9).toFixed(9);
```

### After:
```typescript
const isValid = Analos.Utils.isValidAnalosAddress(address);
const formattedAmount = Analos.Utils.formatAnalosAmount(lamports);
```

## Step 8: Update Transaction Validation

### Before:
```typescript
// No built-in validation
const transaction = new Transaction();
// ... add instructions
await connection.sendTransaction(transaction, [signer]);
```

### After:
```typescript
const transaction = Analos.Utils.createAnalosTransaction();
// ... add instructions

// Validate before sending
const validation = Analos.Utils.validateAnalosTransaction(transaction);
if (!validation.isValid) {
  console.error('Transaction validation errors:', validation.errors);
  return;
}

await connection.sendTransaction(transaction, [signer]);
```

## Step 9: Update Retry Logic

### Before:
```typescript
// Manual retry logic
let retries = 0;
while (retries < 3) {
  try {
    await connection.getAccountInfo(publicKey);
    break;
  } catch (error) {
    retries++;
    if (retries === 3) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
  }
}
```

### After:
```typescript
// Built-in Analos-specific retry logic
const accountInfo = await Analos.Utils.retryAnalosOperation(async () => {
  return await connection.getAccountInfo(publicKey);
});
```

## Files to Update

Here are the key files in your application that should be updated:

### 1. Wallet Provider
**File:** `frontend-new/src/app/components/WalletProvider.tsx`
```typescript
// Update RPC endpoint configuration
import { Analos } from '@analos/web3-kit';

const connection = Analos.createConnection('MAINNET');
```

### 2. NFT Contract Service
**File:** `frontend-new/src/lib/analos-nft-contract-service.ts`
```typescript
import { AnalosConnection, Analos } from '@analos/web3-kit';

const connection = new AnalosConnection('https://rpc.analos.io', {
  network: 'MAINNET',
  commitment: 'confirmed'
});
```

### 3. Blockchain Services
**Files:** All files in `frontend-new/src/lib/blockchain/`
```typescript
import { AnalosConnection, Analos } from '@analos/web3-kit';

// Replace Connection imports with AnalosConnection
// Add proper error handling with Analos.Utils.getAnalosErrorMessage
```

### 4. Market Data Service
**File:** `frontend-new/src/lib/market-data-service.ts`
```typescript
import { AnalosConnection } from '@analos/web3-kit';

const connection = new AnalosConnection('https://rpc.analos.io');
```

## Testing the Migration

### 1. Test Connection
```typescript
import { Analos } from '@analos/web3-kit';

const connection = Analos.createConnection('MAINNET');
console.log('Connected to:', connection.getClusterInfo().name);
```

### 2. Test WebSocket
```typescript
await connection.initializeWebSocket();
console.log('WebSocket initialized successfully');
```

### 3. Test Error Handling
```typescript
try {
  await connection.getAccountInfo(new PublicKey('invalid-address'));
} catch (error) {
  const analosError = Analos.Utils.getAnalosErrorMessage(error);
  console.log('Analos error:', analosError);
}
```

## Benefits After Migration

1. **✅ No more WebSocket connection errors** - Proper Analos endpoints
2. **✅ Better error messages** - Analos-specific error handling
3. **✅ Improved reliability** - Network-specific retry logic
4. **✅ Built-in utilities** - Explorer URLs, validation, formatting
5. **✅ Future-proof** - Easy to add Analos-specific features

## Rollback Plan

If you need to rollback, simply:
1. Revert the import statements back to `@solana/web3.js`
2. Change `AnalosConnection` back to `Connection`
3. Remove the Analos-specific method calls

The core functionality will work the same, but you'll lose the WebSocket fixes and Analos optimizations.

## Next Steps

After migration:
1. **Test thoroughly** - Verify all functionality works
2. **Monitor WebSocket connections** - Check browser console for connection errors
3. **Update documentation** - Update any API docs or README files
4. **Consider publishing** - Publish the Analos Web3 Kit to npm for others to use

## Support

If you encounter issues during migration:
1. Check the browser console for specific error messages
2. Verify all imports are updated correctly
3. Test with the basic usage example in the kit
4. Create an issue in the Analos Web3 Kit repository

---

**Ready to migrate?** Start with the Wallet Provider and work your way through the other files systematically.
