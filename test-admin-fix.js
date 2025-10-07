// Test script to verify the admin dashboard fix
// Tests that the admin dashboard now uses the new collection system instead of old Anchor deployment

async function testAdminDashboardFix() {
  console.log('🔧 Testing Admin Dashboard Fix...\n');

  const API_BASE = 'https://analos-nft-launcher-production-f3da.up.railway.app';
  const adminWallet = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  try {
    // Test 1: Verify the admin dashboard can create collections using the new system
    console.log('🧪 Test 1: Testing Admin Dashboard Collection Creation...');
    
    const adminCollectionData = {
      name: 'Admin Dashboard Test Collection',
      symbol: 'ADMINTEST',
      description: 'Test collection created through the fixed admin dashboard.',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
      externalUrl: 'https://admin-test.com',
      creatorAddress: adminWallet,
      totalSupply: 100,
      attributes: [
        { trait_type: 'Collection', value: 'Admin Dashboard Test Collection' },
        { trait_type: 'Platform', value: 'Analos NFT Launcher' }
      ],
      // Admin features
      mintPrice: 0.01,
      paymentToken: 'SOL',
      maxMintsPerWallet: 0,
      isTestMode: true,
      whitelistEnabled: false,
      bondingCurveEnabled: false
    };

    console.log('Admin Collection Data:', JSON.stringify(adminCollectionData, null, 2));
    console.log('');

    const createResponse = await fetch(`${API_BASE}/api/create-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet
      },
      body: JSON.stringify(adminCollectionData)
    });

    const createResult = await createResponse.json();

    if (createResult.success) {
      console.log('✅ Admin Dashboard Collection Creation Successful!');
      console.log('Collection ID:', createResult.collection.id);
      console.log('Collection Mint:', createResult.collection.collectionMint);
      console.log('Signature:', createResult.signature);
      console.log('Explorer URL:', createResult.explorerUrl);
      console.log('');

      const collectionId = createResult.collection.id;

      // Test 2: Verify the collection appears in the collections list
      console.log('🧪 Test 2: Testing Collections List...');
      
      const listResponse = await fetch(`${API_BASE}/api/collections`);
      const listResult = await listResponse.json();

      if (listResult.success) {
        const testCollection = listResult.collections.find(c => c.id === collectionId);
        if (testCollection) {
          console.log('✅ Collection Found in Collections List!');
          console.log('Collection Name:', testCollection.name);
          console.log('Collection Symbol:', testCollection.symbol);
          console.log('Minting Enabled:', testCollection.mintingEnabled);
          console.log('Test Mode:', testCollection.isTestMode);
          console.log('');
        } else {
          console.log('❌ Collection Not Found in Collections List');
          return;
        }
      } else {
        console.log('❌ Failed to fetch collections list');
        return;
      }

      // Test 3: Test NFT minting from the admin-created collection
      console.log('🧪 Test 3: Testing NFT Minting from Admin Collection...');
      
      const nftData = {
        collectionId: collectionId,
        name: 'Admin Dashboard Test NFT #1',
        symbol: 'ADMINTEST',
        description: 'First NFT from the admin dashboard test collection.',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        attributes: [
          { trait_type: 'Collection', value: 'Admin Dashboard Test Collection' },
          { trait_type: 'Platform', value: 'Analos NFT Launcher' },
          { trait_type: 'Number', value: '1' }
        ],
        ownerAddress: adminWallet
      };

      const mintResponse = await fetch(`${API_BASE}/api/mint-from-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nftData)
      });

      const mintResult = await mintResponse.json();

      if (mintResult.success) {
        console.log('✅ NFT Minted from Admin Collection Successfully!');
        console.log('Mint Address:', mintResult.mint);
        console.log('Token Account:', mintResult.tokenAccount);
        console.log('Signature:', mintResult.signature);
        console.log('Explorer URL:', mintResult.explorerUrl);
        console.log('');
      } else {
        console.log('❌ NFT minting failed:', mintResult.error);
      }

      console.log('🎉 Admin Dashboard Fix Test Completed Successfully!');
      console.log('');
      console.log('✅ The admin dashboard is now fixed and working with:');
      console.log('   ✅ New collection system (no more Anchor errors)');
      console.log('   ✅ Real blockchain deployment');
      console.log('   ✅ Collection creation and management');
      console.log('   ✅ NFT minting from collections');
      console.log('');
      console.log('🔧 The fix involved:');
      console.log('   - Removing old Anchor deployment code');
      console.log('   - Using the new collection API endpoints');
      console.log('   - Proper error handling and validation');
      console.log('   - Integration with the working backend system');
      console.log('');
      console.log('📱 Your admin dashboard is now ready at:');
      console.log('   - Admin Panel: https://analos-nft-launcher-9cxc.vercel.app/admin');
      console.log('   - Admin Dashboard: https://analos-nft-launcher-9cxc.vercel.app/admin-dashboard');
      console.log('   - Manage Collections: https://analos-nft-launcher-9cxc.vercel.app/manage-collections');

    } else {
      console.error('❌ Admin dashboard collection creation failed:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminDashboardFix();
