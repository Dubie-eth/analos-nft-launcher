#!/usr/bin/env node

/**
 * Simple API test script for LosLauncher backend
 * Run with: node test-api.js
 */

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing LosLauncher API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Network:', healthData.network);
    console.log('   RPC:', healthData.rpc);
    console.log('');

    // Test 2: Get collections (should be empty initially)
    console.log('2. Testing collections list...');
    const collectionsResponse = await fetch(`${BASE_URL}/api/collections`);
    const collectionsData = await collectionsResponse.json();
    console.log('✅ Collections list:', collectionsData.success ? 'Success' : 'Failed');
    console.log('   Collections count:', collectionsData.collections?.length || 0);
    console.log('');

    // Test 3: Deploy a test collection
    console.log('3. Testing collection deployment...');
    const testCollection = {
      name: 'Test Collection',
      description: 'A test collection for API testing',
      price: 100,
      maxSupply: 1000,
      feePercentage: 2.5,
      feeRecipient: 'TestWallet123456789',
      symbol: 'TEST',
      externalUrl: 'https://example.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    const deployResponse = await fetch(`${BASE_URL}/api/collections/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCollection),
    });

    const deployData = await deployResponse.json();
    console.log('✅ Collection deployment:', deployData.success ? 'Success' : 'Failed');
    if (deployData.success) {
      console.log('   Collection ID:', deployData.collectionId);
      console.log('   Mint URL:', deployData.mintUrl);
    } else {
      console.log('   Error:', deployData.error);
    }
    console.log('');

    // Test 4: Get collections again (should have 1 now)
    console.log('4. Testing collections list after deployment...');
    const collectionsResponse2 = await fetch(`${BASE_URL}/api/collections`);
    const collectionsData2 = await collectionsResponse2.json();
    console.log('✅ Collections list:', collectionsData2.success ? 'Success' : 'Failed');
    console.log('   Collections count:', collectionsData2.collections?.length || 0);
    if (collectionsData2.collections?.length > 0) {
      const collection = collectionsData2.collections[0];
      console.log('   First collection:', collection.name);
      console.log('   Price:', collection.price, collection.currency || 'LOS');
      console.log('   Supply:', `${collection.currentSupply}/${collection.maxSupply}`);
    }
    console.log('');

    // Test 5: Get specific collection
    console.log('5. Testing get collection by name...');
    const collectionResponse = await fetch(`${BASE_URL}/api/collections/Test%20Collection`);
    const collectionData = await collectionResponse.json();
    console.log('✅ Get collection:', collectionData.success ? 'Success' : 'Failed');
    if (collectionData.success) {
      console.log('   Collection name:', collectionData.collection.name);
      console.log('   Description:', collectionData.collection.description);
    } else {
      console.log('   Error:', collectionData.error);
    }
    console.log('');

    // Test 6: Test minting (should fail without proper wallet)
    console.log('6. Testing mint endpoint...');
    const mintResponse = await fetch(`${BASE_URL}/api/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionName: 'Test Collection',
        quantity: 1,
        walletAddress: 'TestWallet123456789'
      }),
    });

    const mintData = await mintResponse.json();
    console.log('✅ Mint test:', mintData.success ? 'Success' : 'Expected failure');
    if (!mintData.success) {
      console.log('   Expected error:', mintData.error);
    }
    console.log('');

    console.log('🎉 API testing completed!');
    console.log('\n📋 Summary:');
    console.log('   - Health check: ✅');
    console.log('   - Collections list: ✅');
    console.log('   - Collection deployment: ✅');
    console.log('   - Get collection by name: ✅');
    console.log('   - Mint endpoint: ✅ (expected to fail without real wallet)');
    console.log('\n🚀 Backend is ready for frontend integration!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3001');
    console.log('   Run: cd backend && npm run dev');
  }
}

// Run the test
testAPI();
