// Test script for SPL NFT minting
// Uses native fetch (Node 18+)

async function testMintNFT() {
  console.log('🎨 Testing SPL NFT Minting...\n');

  // Replace with your wallet address
  const ownerAddress = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  const nftData = {
    name: 'Test NFT #1',
    symbol: 'TEST',
    description: 'My first real SPL NFT on Analos!',
    image: 'https://picsum.photos/500/500',
    attributes: [
      { trait_type: 'Background', value: 'Blue' },
      { trait_type: 'Rarity', value: 'Common' }
    ],
    ownerAddress
  };

  console.log('📤 Sending mint request...');
  console.log('Owner:', ownerAddress);
  console.log('NFT Data:', JSON.stringify(nftData, null, 2));
  console.log('');

  try {
    const response = await fetch('http://localhost:3001/api/mint-spl-nft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nftData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ NFT MINTED SUCCESSFULLY!\n');
      console.log('🪙 Mint Address:', result.mint);
      console.log('📦 Token Account:', result.tokenAccount);
      console.log('📝 Signature:', result.signature);
      console.log('🔍 Explorer:', result.explorerUrl);
      console.log('\n🎉 Your NFT is live on Analos blockchain!');
    } else {
      console.log('❌ Minting failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMintNFT();
