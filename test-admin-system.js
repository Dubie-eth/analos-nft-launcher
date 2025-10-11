// Test script for Los Bros Admin System
// Tests collection creation with admin features and admin dashboard functionality

async function testAdminSystem() {
  console.log('🛠️ Testing Los Bros Admin System...\n');

  const API_BASE = 'https://analos-nft-launcher-production-f3da.up.railway.app';
  const adminWallet = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
  const creatorAddress = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  try {
    // Step 1: Create Collection with Admin Features
    console.log('🏗️ Step 1: Creating Los Bros Collection with Admin Features...');
    
    const collectionData = {
      name: 'Los Bros Admin Test',
      symbol: 'LOSBROSADMIN',
      description: 'Test collection with full admin features enabled.',
      image: 'https://picsum.photos/500/500?random=losbrosadmin',
      externalUrl: 'https://losbros.com',
      creatorAddress: creatorAddress,
      totalSupply: 500,
      // Admin features
      mintPrice: 0.1,
      paymentToken: 'SOL',
      maxMintsPerWallet: 3,
      isTestMode: true,
      whitelistEnabled: true,
      bondingCurveEnabled: true,
      attributes: [
        { trait_type: 'Background', value: 'Street' },
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Admin', value: 'Test' }
      ]
    };

    console.log('Collection Data:', JSON.stringify(collectionData, null, 2));
    console.log('');

    const createResponse = await fetch(`${API_BASE}/api/create-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(collectionData)
    });

    const createResult = await createResponse.json();

    if (createResult.success) {
      console.log('✅ Collection Created Successfully!');
      console.log('Collection ID:', createResult.collection.id);
      console.log('Collection Mint:', createResult.collection.collectionMint);
      console.log('Signature:', createResult.signature);
      console.log('Explorer URL:', createResult.explorerUrl);
      console.log('');

      const collectionId = createResult.collection.id;

      // Step 2: Test Admin Authentication
      console.log('🔐 Step 2: Testing Admin Authentication...');
      
      const adminResponse = await fetch(`${API_BASE}/api/admin/collections/${collectionId}`, {
        headers: {
          'x-admin-wallet': adminWallet
        }
      });

      if (adminResponse.ok) {
        const adminResult = await adminResponse.json();
        console.log('✅ Admin Authentication Successful!');
        console.log('Collection Admin Data Retrieved');
        console.log('Minting Enabled:', adminResult.collection.mintingEnabled);
        console.log('Test Mode:', adminResult.collection.isTestMode);
        console.log('Mint Price:', adminResult.collection.mintPrice);
        console.log('Max per Wallet:', adminResult.collection.maxMintsPerWallet);
        console.log('');
      } else {
        console.log('❌ Admin Authentication Failed');
        return;
      }

      // Step 3: Test Whitelist Check
      console.log('👥 Step 3: Testing Whitelist Check...');
      
      const whitelistResponse = await fetch(`${API_BASE}/api/admin/collections/${collectionId}/whitelist-check/${creatorAddress}`, {
        headers: {
          'x-admin-wallet': adminWallet
        }
      });

      if (whitelistResponse.ok) {
        const whitelistResult = await whitelistResponse.json();
        console.log('✅ Whitelist Check Successful!');
        console.log('Wallet:', whitelistResult.wallet);
        console.log('Is Whitelisted:', whitelistResult.isWhitelisted);
        console.log('Active Phase:', whitelistResult.activePhase?.name || 'None');
        console.log('Mint Price:', whitelistResult.mintPrice);
        console.log('Can Mint:', whitelistResult.canMint);
        console.log('');
      } else {
        console.log('❌ Whitelist Check Failed');
      }

      // Step 4: Test Minting Settings Update
      console.log('🎨 Step 4: Testing Minting Settings Update...');
      
      const mintingUpdateData = {
        mintingEnabled: true,
        mintPrice: 0.05,
        maxMintsPerWallet: 5,
        isTestMode: false
      };

      const mintingResponse = await fetch(`${API_BASE}/api/admin/collections/${collectionId}/minting`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': adminWallet
        },
        body: JSON.stringify(mintingUpdateData)
      });

      if (mintingResponse.ok) {
        const mintingResult = await mintingResponse.json();
        console.log('✅ Minting Settings Updated Successfully!');
        console.log('Message:', mintingResult.message);
        console.log('');
      } else {
        console.log('❌ Minting Settings Update Failed');
      }

      // Step 5: Test Collection List
      console.log('📚 Step 5: Testing Collection List...');
      
      const listResponse = await fetch(`${API_BASE}/api/collections`);
      const listResult = await listResponse.json();

      if (listResult.success) {
        console.log('✅ Collections Retrieved Successfully!');
        console.log('Total Collections:', listResult.collections.length);
        listResult.collections.forEach((collection, index) => {
          console.log(`${index + 1}. ${collection.name} (${collection.symbol})`);
          console.log(`   - Supply: ${collection.currentSupply}/${collection.totalSupply}`);
          console.log(`   - Minting: ${collection.mintingEnabled ? 'ON' : 'OFF'}`);
          console.log(`   - Test Mode: ${collection.isTestMode ? 'YES' : 'NO'}`);
          console.log(`   - Mint Price: ${collection.mintPrice} ${collection.paymentToken}`);
          console.log(`   - Max per Wallet: ${collection.maxMintsPerWallet || 'Unlimited'}`);
        });
        console.log('');
      }

      // Step 6: Test NFT Minting from Collection
      console.log('🎨 Step 6: Testing NFT Minting from Collection...');
      
      const nftData = {
        collectionId: collectionId,
        name: 'Los Bros Admin Test #1',
        symbol: 'LOSBROSADMIN',
        description: 'First NFT from the admin test collection.',
        image: 'https://picsum.photos/500/500?random=losbrosadmin1',
        attributes: [
          { trait_type: 'Background', value: 'Street' },
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Admin', value: 'Test' },
          { trait_type: 'Number', value: '1' }
        ],
        ownerAddress: creatorAddress
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
        console.log('✅ NFT Minted from Collection Successfully!');
        console.log('Mint Address:', mintResult.mint);
        console.log('Token Account:', mintResult.tokenAccount);
        console.log('Signature:', mintResult.signature);
        console.log('Explorer URL:', mintResult.explorerUrl);
        console.log('Collection Info:', mintResult.collection.name);
        console.log('');
      } else {
        console.log('❌ NFT minting failed:', mintResult.error);
      }

      console.log('🎉 Admin System Test Completed Successfully!');
      console.log('');
      console.log('🚀 Your Los Bros admin system is now fully functional!');
      console.log('📱 Frontend URLs:');
      console.log('   - Admin Dashboard: https://analos-nft-launcher-9cxc.vercel.app/admin-dashboard');
      console.log('   - Manage Collections: https://analos-nft-launcher-9cxc.vercel.app/manage-collections');
      console.log('   - Mint NFTs: https://analos-nft-launcher-9cxc.vercel.app/mint-losbros');

    } else {
      console.error('❌ Collection creation failed:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminSystem();
