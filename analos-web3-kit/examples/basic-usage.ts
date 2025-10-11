/**
 * Basic usage example for @analos/web3-kit
 */

import { Analos, AnalosConnection, PublicKey } from '@analos/web3-kit';

async function basicExample() {
  console.log('🚀 Analos Web3 Kit Basic Example');
  
  // Create connection to Analos Mainnet
  const connection = Analos.createConnection('MAINNET');
  
  console.log('📡 Connected to:', connection.getClusterInfo().name);
  console.log('🌐 RPC URL:', connection.getClusterInfo().rpc);
  console.log('🔌 WebSocket URL:', connection.getClusterInfo().ws);
  
  try {
    // Initialize WebSocket connection
    await connection.initializeWebSocket();
    console.log('✅ WebSocket initialized successfully');
  } catch (error) {
    console.warn('⚠️ WebSocket initialization failed:', error);
    console.log('📡 Continuing with HTTP-only mode...');
  }
  
  // Get network version
  try {
    const version = await connection.getVersion();
    console.log('📊 Network version:', version);
  } catch (error) {
    console.error('❌ Failed to get network version:', error);
  }
  
  // Get recent blockhash
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('🔗 Latest blockhash:', blockhash);
  } catch (error) {
    console.error('❌ Failed to get blockhash:', error);
  }
  
  // Test account info (using a known address)
  try {
    const testAddress = new PublicKey('So11111111111111111111111111111111111111112');
    const accountInfo = await connection.getAccountInfo(testAddress);
    
    if (accountInfo) {
      console.log('👤 Account info retrieved:', {
        owner: accountInfo.owner.toString(),
        executable: accountInfo.executable,
        lamports: accountInfo.lamports
      });
    } else {
      console.log('👤 Account not found or empty');
    }
  } catch (error) {
    console.error('❌ Failed to get account info:', error);
  }
  
  // Test WebSocket subscription (if WebSocket is available)
  try {
    const testAddress = new PublicKey('So11111111111111111111111111111111111111112');
    
    const subscriptionId = connection.onAccountChange(
      testAddress,
      (accountInfo, context) => {
        console.log('📊 Account changed:', {
          slot: context.slot,
          lamports: accountInfo?.lamports
        });
      }
    );
    
    console.log('📡 Account change subscription created:', subscriptionId);
    
    // Clean up after 5 seconds
    setTimeout(() => {
      connection.removeAccountChangeListener(subscriptionId);
      console.log('🧹 Subscription cleaned up');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to create subscription:', error);
  }
  
  console.log('✅ Basic example completed');
}

// Utility functions example
function utilityExample() {
  console.log('\n🛠️ Utility Functions Example');
  
  // Test address validation
  const validAddress = 'So11111111111111111111111111111111111111112';
  const invalidAddress = 'invalid-address';
  
  console.log('✅ Valid address:', Analos.Utils.isValidAnalosAddress(validAddress));
  console.log('❌ Invalid address:', Analos.Utils.isValidAnalosAddress(invalidAddress));
  
  // Test amount formatting
  const lamports = 1500000000; // 1.5 SOL/LOS
  const formatted = Analos.Utils.formatAnalosAmount(lamports);
  const parsed = Analos.Utils.parseAnalosAmount('1.5');
  
  console.log('💰 Format amount:', lamports, '→', formatted);
  console.log('💰 Parse amount:', '1.5', '→', parsed);
  
  // Test network info
  const networkInfo = Analos.Utils.getNetworkDisplayInfo('MAINNET');
  console.log('🌐 Network info:', networkInfo);
  
  console.log('✅ Utility example completed');
}

// Error handling example
async function errorHandlingExample() {
  console.log('\n🚨 Error Handling Example');
  
  const connection = Analos.createConnection('MAINNET');
  
  try {
    // This should fail with an invalid address
    const invalidAddress = new PublicKey('invalid-address');
    await connection.getAccountInfo(invalidAddress);
  } catch (error) {
    const analosError = Analos.Utils.getAnalosErrorMessage(error);
    console.log('🔍 Original error:', error);
    console.log('🔍 Analos error message:', analosError);
  }
  
  // Test retry logic
  try {
    const result = await Analos.Utils.retryAnalosOperation(async () => {
      // Simulate a potentially failing operation
      const random = Math.random();
      if (random < 0.7) {
        throw new Error('Simulated network error');
      }
      return 'Success!';
    }, 3, 500);
    
    console.log('🔄 Retry operation result:', result);
  } catch (error) {
    console.log('🔄 Retry operation failed after all attempts:', error);
  }
  
  console.log('✅ Error handling example completed');
}

// Main execution
async function main() {
  try {
    await basicExample();
    utilityExample();
    await errorHandlingExample();
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { basicExample, utilityExample, errorHandlingExample };
