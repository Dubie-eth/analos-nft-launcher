/**
 * Deploy The LosBros collection immediately
 */

const { realDeploymentService } = require('./dist/real-deployment-service.js');
const { Keypair } = require('@solana/web3.js');

async function deployLosBros() {
  try {
    console.log('🚀 Deploying The LosBros collection...');
    
    // Create a mock payer keypair for deployment
    const payerKeypair = Keypair.generate();
    console.log('📍 Payer address:', payerKeypair.publicKey.toBase58());
    
    // LosBros collection configuration
    const config = {
      name: 'The LosBros',
      symbol: 'LOSBROS',
      description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
      imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
      externalUrl: 'https://analos-nft-launcher-9cxc.vercel.app',
      totalSupply: 2222,
      mintPrice: 0.01,
      paymentToken: 'LOS',
      creatorAddress: payerKeypair.publicKey.toBase58(),
      royalty: 5.0,
      attributes: [
        { trait_type: 'Collection', value: 'The LosBros' },
        { trait_type: 'Network', value: 'Analos' },
        { trait_type: 'Platform', value: 'LosLauncher' }
      ]
    };
    
    // Deploy the collection
    const result = await realDeploymentService.deployCollection(config, payerKeypair);
    
    if (result.success) {
      console.log('✅ The LosBros collection deployed successfully!');
      console.log('📍 Mint Address:', result.mintAddress);
      console.log('📍 Metadata Address:', result.metadataAddress);
      console.log('📍 Master Edition Address:', result.masterEditionAddress);
      console.log('📍 Escrow Address:', result.escrowAddress);
      console.log('📍 Transaction Signature:', result.transactionSignature);
      console.log('📍 Explorer URL:', result.explorerUrl);
      
      // Save deployment info
      const deploymentInfo = {
        collectionName: 'The LosBros',
        deployedAt: new Date().toISOString(),
        ...result
      };
      
      require('fs').writeFileSync(
        './losbros-deployment.json', 
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log('💾 Deployment info saved to losbros-deployment.json');
      
    } else {
      console.error('❌ Deployment failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error deploying LosBros:', error);
  }
}

// Run deployment
deployLosBros();
