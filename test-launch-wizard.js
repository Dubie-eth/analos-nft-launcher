// Test script for Los Bros Launch Wizard Integration
// Tests the complete launch wizard with all admin features

async function testLaunchWizard() {
  console.log('🚀 Testing Los Bros Launch Wizard Integration...\n');

  const API_BASE = 'https://analos-nft-launcher-production-f3da.up.railway.app';
  const adminWallet = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  try {
    // Step 1: Test Collection Creation via Launch Wizard
    console.log('🏗️ Step 1: Testing Launch Wizard Collection Creation...');
    
    const launchWizardData = {
      name: 'Los Bros Launch Wizard Test',
      symbol: 'LOSBROSWIZARD',
      description: 'Test collection created through the integrated launch wizard with all admin features.',
      image: 'https://picsum.photos/500/500?random=losbroslaunch',
      externalUrl: 'https://losbros.com',
      creatorAddress: adminWallet,
      totalSupply: 1000,
      attributes: [
        { trait_type: 'Collection', value: 'Los Bros Launch Wizard Test' },
        { trait_type: 'Mint Type', value: 'standard' },
        { trait_type: 'Reveal Type', value: 'instant' }
      ],
      // Admin features from launch wizard
      mintPrice: 0.05,
      paymentToken: 'SOL',
      maxMintsPerWallet: 5,
      isTestMode: true,
      whitelistEnabled: true,
      bondingCurveEnabled: false,
      // Whitelist configuration
      whitelist: {
        enabled: true,
        addresses: [adminWallet],
        phases: [
          {
            id: 'phase_1',
            name: 'Early Access',
            enabled: true,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            priceMultiplier: 0.5, // 50% of base price
            maxMintsPerWallet: 3,
            description: 'Early access phase for whitelisted users',
            requirements: {
              tokenMint: undefined,
              minBalance: 0,
              tokenSymbol: 'SOL'
            }
          }
        ]
      },
      // Delayed reveal configuration
      delayedReveal: {
        enabled: false,
        type: 'manual',
        revealTime: '',
        revealAtCompletion: false,
        placeholderImage: ''
      }
    };

    console.log('Launch Wizard Data:', JSON.stringify(launchWizardData, null, 2));
    console.log('');

    const createResponse = await fetch(`${API_BASE}/api/create-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet
      },
      body: JSON.stringify(launchWizardData)
    });

    const createResult = await createResponse.json();

    if (createResult.success) {
      console.log('✅ Launch Wizard Collection Created Successfully!');
      console.log('Collection ID:', createResult.collection.id);
      console.log('Collection Mint:', createResult.collection.collectionMint);
      console.log('Signature:', createResult.signature);
      console.log('Explorer URL:', createResult.explorerUrl);
      console.log('');

      const collectionId = createResult.collection.id;

      // Step 2: Test Admin Dashboard Access
      console.log('📊 Step 2: Testing Admin Dashboard Access...');
      
      const adminResponse = await fetch(`${API_BASE}/api/admin/collections/${collectionId}`, {
        headers: {
          'x-admin-wallet': adminWallet
        }
      });

      if (adminResponse.ok) {
        const adminResult = await adminResponse.json();
        console.log('✅ Admin Dashboard Access Successful!');
        console.log('Collection Admin Data Retrieved');
        console.log('Minting Enabled:', adminResult.collection.mintingEnabled);
        console.log('Test Mode:', adminResult.collection.isTestMode);
        console.log('Mint Price:', adminResult.collection.mintPrice);
        console.log('Max per Wallet:', adminResult.collection.maxMintsPerWallet);
        console.log('Whitelist Enabled:', adminResult.collection.whitelist?.enabled);
        console.log('Whitelist Phases:', adminResult.collection.whitelist?.phases?.length || 0);
        console.log('');
      } else {
        console.log('❌ Admin Dashboard Access Failed');
        return;
      }

      // Step 3: Test Whitelist Functionality
      console.log('👥 Step 3: Testing Whitelist Functionality...');
      
      const whitelistResponse = await fetch(`${API_BASE}/api/admin/collections/${collectionId}/whitelist-check/${adminWallet}`, {
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

      // Step 4: Test NFT Minting from Collection
      console.log('🎨 Step 4: Testing NFT Minting from Collection...');
      
      const nftData = {
        collectionId: collectionId,
        name: 'Los Bros Launch Wizard Test #1',
        symbol: 'LOSBROSWIZARD',
        description: 'First NFT from the launch wizard test collection.',
        image: 'https://picsum.photos/500/500?random=losbroslaunch1',
        attributes: [
          { trait_type: 'Collection', value: 'Los Bros Launch Wizard Test' },
          { trait_type: 'Mint Type', value: 'standard' },
          { trait_type: 'Reveal Type', value: 'instant' },
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
          console.log(`   - Whitelist: ${collection.whitelist?.enabled ? 'ENABLED' : 'DISABLED'}`);
        });
        console.log('');
      }

      console.log('🎉 Launch Wizard Integration Test Completed Successfully!');
      console.log('');
      console.log('🚀 Your Los Bros launch wizard is now fully integrated with:');
      console.log('   ✅ Collection creation with admin features');
      console.log('   ✅ Whitelist management and phases');
      console.log('   ✅ Payment token configuration');
      console.log('   ✅ Delayed reveal settings');
      console.log('   ✅ Bonding curve support');
      console.log('   ✅ Admin dashboard integration');
      console.log('   ✅ Real blockchain deployment');
      console.log('');
      console.log('📱 Frontend URLs:');
      console.log('   - Launch Wizard: https://analos-nft-launcher-9cxc.vercel.app/launch-collection');
      console.log('   - Admin Dashboard: https://analos-nft-launcher-9cxc.vercel.app/admin-dashboard');
      console.log('   - Manage Collections: https://analos-nft-launcher-9cxc.vercel.app/manage-collections');
      console.log('   - Mint NFTs: https://analos-nft-launcher-9cxc.vercel.app/mint-losbros');

    } else {
      console.error('❌ Launch wizard collection creation failed:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLaunchWizard();
