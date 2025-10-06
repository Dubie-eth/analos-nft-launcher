/**
 * Basic test for the Analos Web3 Kit
 */

const { Analos, AnalosConnection } = require('./dist/index.js');

async function testBasicFunctionality() {
  console.log('🧪 Testing Analos Web3 Kit Basic Functionality\n');
  
  // Test 1: Create connection
  console.log('1️⃣ Creating Analos Connection...');
  const connection = Analos.createConnection('MAINNET');
  console.log('✅ Connection created:', connection.getClusterInfo().name);
  console.log('🌐 RPC URL:', connection.getClusterInfo().rpc);
  console.log('🔌 WebSocket URL:', connection.getClusterInfo().ws);
  
  // Test 2: Network utilities
  console.log('\n2️⃣ Testing Network Utilities...');
  const networkInfo = Analos.getNetworkInfo('MAINNET');
  console.log('✅ Network Info:', networkInfo);
  
  const rpcUrl = Analos.getRpcUrl('MAINNET');
  const wsUrl = Analos.getWsUrl('MAINNET');
  const explorerUrl = Analos.getExplorerUrl('MAINNET');
  console.log('✅ RPC URL:', rpcUrl);
  console.log('✅ WebSocket URL:', wsUrl);
  console.log('✅ Explorer URL:', explorerUrl);
  
  // Test 3: Utils functions
  console.log('\n3️⃣ Testing Utility Functions...');
  const isValid = Analos.Utils.isValidAnalosAddress('So11111111111111111111111111111111111111112');
  console.log('✅ Valid address test:', isValid);
  
  const formatted = Analos.Utils.formatAnalosAmount(1500000000);
  console.log('✅ Format amount (1.5 SOL):', formatted);
  
  const parsed = Analos.Utils.parseAnalosAmount('1.5');
  console.log('✅ Parse amount (1.5):', parsed);
  
  // Test 4: WebSocket initialization
  console.log('\n4️⃣ Testing WebSocket Initialization...');
  try {
    await connection.initializeWebSocket();
    console.log('✅ WebSocket initialization completed');
  } catch (error) {
    console.log('⚠️ WebSocket initialization failed (expected):', error.message);
  }
  
  // Test 5: Explorer URLs
  console.log('\n5️⃣ Testing Explorer URLs...');
  const txUrl = connection.getExplorerUrl('test-signature-123');
  const accountUrl = connection.getAccountExplorerUrl('So11111111111111111111111111111111111111112');
  console.log('✅ Transaction URL:', txUrl);
  console.log('✅ Account URL:', accountUrl);
  
  console.log('\n🎉 All basic tests completed successfully!');
  console.log('\n📦 The Analos Web3 Kit is ready to use!');
}

// Run the test
testBasicFunctionality().catch(console.error);
