// Test script for Los Bros Collection System
// Tests collection creation and NFT minting from collection

async function testCollectionSystem() {
  console.log('🏗️ Testing Los Bros Collection System...\n');

  const API_BASE = 'https://analos-nft-launcher-production-f3da.up.railway.app';
  const creatorAddress = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
  const ownerAddress = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  try {
    // Step 1: Create Collection
    console.log('📚 Step 1: Creating Los Bros Collection...');
    
    const collectionData = {
      name: 'Los Bros',
      symbol: 'LOSBROS',
      description: 'The legendary Los Bros collection - a group of street-smart characters from the digital underground.',
      image: 'https://picsum.photos/500/500?random=losbros',
      externalUrl: 'https://losbros.com',
      creatorAddress: creatorAddress,
      totalSupply: 1000,
      attributes: [
        { trait_type: 'Background', value: 'Street' },
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Style', value: 'Classic' }
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

      // Step 2: Get Collection Info
      console.log('📊 Step 2: Getting Collection Info...');
      
      const getResponse = await fetch(`${API_BASE}/api/collections/${collectionId}`);
      const getResult = await getResponse.json();

      if (getResult.success) {
        console.log('✅ Collection Retrieved Successfully!');
        console.log('Collection Stats:', getResult.collection.stats);
        console.log('');
      } else {
        console.error('❌ Failed to get collection:', getResult.error);
        return;
      }

      // Step 3: Mint NFT from Collection
      console.log('🎨 Step 3: Minting NFT from Collection...');
      
      const nftData = {
        collectionId: collectionId,
        name: 'Los Bros #1',
        symbol: 'LOSBROS',
        description: 'The first Los Bros NFT - a street-smart character from the digital underground.',
        image: 'https://picsum.photos/500/500?random=losbros1',
        attributes: [
          { trait_type: 'Background', value: 'Street' },
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Style', value: 'Classic' },
          { trait_type: 'Number', value: '1' }
        ],
        ownerAddress: ownerAddress
      };

      console.log('NFT Data:', JSON.stringify(nftData, null, 2));
      console.log('');

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
        console.error('❌ NFT minting failed:', mintResult.error);
        return;
      }

      // Step 4: Get Updated Collection Stats
      console.log('📈 Step 4: Getting Updated Collection Stats...');
      
      const updatedResponse = await fetch(`${API_BASE}/api/collections/${collectionId}`);
      const updatedResult = await updatedResponse.json();

      if (updatedResult.success) {
        console.log('✅ Updated Collection Stats:');
        console.log('Total Supply:', updatedResult.collection.stats.totalSupply);
        console.log('Current Supply:', updatedResult.collection.stats.currentSupply);
        console.log('Remaining:', updatedResult.collection.stats.remaining);
        console.log('');
      }

      // Step 5: List All Collections
      console.log('📚 Step 5: Listing All Collections...');
      
      const listResponse = await fetch(`${API_BASE}/api/collections`);
      const listResult = await listResponse.json();

      if (listResult.success) {
        console.log('✅ Collections Retrieved Successfully!');
        console.log('Total Collections:', listResult.collections.length);
        listResult.collections.forEach((collection, index) => {
          console.log(`${index + 1}. ${collection.name} (${collection.symbol}) - ${collection.currentSupply}/${collection.totalSupply} minted`);
        });
        console.log('');
      }

      console.log('🎉 Collection System Test Completed Successfully!');
      console.log('');
      console.log('🚀 Your Los Bros collection is now live and ready for minting!');
      console.log('📱 Frontend URLs:');
      console.log('   - Manage Collections: https://analos-nft-launcher-9cxc.vercel.app/manage-collections');
      console.log('   - Mint NFTs: https://analos-nft-launcher-9cxc.vercel.app/mint-losbros');

    } else {
      console.error('❌ Collection creation failed:', createResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCollectionSystem();
