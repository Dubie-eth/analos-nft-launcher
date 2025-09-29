import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Minimal test server running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Analos NFT Launcher - Minimal Test Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Mock mint instructions endpoint for testing
app.post('/api/mint/instructions', (req, res) => {
  try {
    const { collectionName, quantity, walletAddress } = req.body;
    
    console.log('📝 Mint instructions request:', { collectionName, quantity, walletAddress });
    
    // Generate valid base58 addresses for testing
    const validBase58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const generateBase58Address = () => {
      let result = '';
      for (let i = 0; i < 44; i++) {
        result += validBase58Chars.charAt(Math.floor(Math.random() * validBase58Chars.length));
      }
      return result;
    };
    
    // Use known valid Solana public keys for testing
    const validSolanaKeys = [
      '11111111111111111111111111111112', // System Program
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
      'So11111111111111111111111111111111111111112', // Wrapped SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ];
    
    const getValidSolanaKey = () => {
      return validSolanaKeys[Math.floor(Math.random() * validSolanaKeys.length)];
    };
    
    // Return mock instructions in the exact format the SDK expects
    res.json({
      success: true,
      instructions: [
        {
          type: 'createMintAccount',
          mintAddress: getValidSolanaKey(),
          metadata: {
            name: `${collectionName} #1`,
            description: `Test NFT from ${collectionName}`,
            image: 'https://picsum.photos/500/500?random=1'
          },
          mintKeypair: {
            publicKey: getValidSolanaKey(),
            secretKey: Array.from({length: 64}, () => Math.floor(Math.random() * 256))
          }
        }
      ],
      nftData: [{
        mintAddress: getValidSolanaKey(),
        metadata: {
          name: `${collectionName} #1`,
          description: `Test NFT from ${collectionName}`,
          image: 'https://picsum.photos/500/500?random=1'
        },
        tokenId: 1
      }],
      totalCost: 4200.69,
      currency: '$LOS',
      collection: collectionName,
      message: 'Mock transaction instructions created for testing'
    });
  } catch (error) {
    console.error('Error creating mint instructions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mint instructions'
    });
  }
});

// Mock collections endpoint
app.get('/api/collections', (req, res) => {
  res.json({
    success: true,
    collections: [
      {
        id: 'launch-on-los',
        name: 'Launch On LOS',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
        imageUrl: 'https://i.imgur.com/UO6Jo6S.jpg', // LOL Logo from Imgur gallery
        mintPrice: 4200.69,
        totalSupply: 1111,
        currentSupply: 0,
        isActive: true,
        symbol: '$LOL',
        feePercentage: 2.5,
        externalUrl: 'https://launchonlos.fun/'
      }
    ]
  });
});

// Mock individual collection endpoint
app.get('/api/collections/:collectionName', (req, res) => {
  const { collectionName } = req.params;
  
  res.json({
    success: true,
    collection: {
      id: 'launch-on-los',
      name: 'Launch On LOS',
      description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
        imageUrl: 'https://i.imgur.com/UO6Jo6S.jpg', // LOL Logo from Imgur gallery
      mintPrice: 4200.69,
      totalSupply: 1111,
      currentSupply: 0,
      isActive: true,
      symbol: '$LOL',
      feePercentage: 2.5,
      externalUrl: 'https://launchonlos.fun/',
      feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
    }
  });
});

// Mock mint endpoint
app.post('/api/mint', (req, res) => {
  try {
    const { collectionName, quantity, walletAddress } = req.body;
    
    console.log('🎯 Mint request:', { collectionName, quantity, walletAddress });
    
    // Return mock mint success
    res.json({
      success: true,
      message: 'NFT minted successfully (mock)',
      transactionSignature: 'mock_tx_' + Date.now(),
      explorerUrl: 'https://explorer.analos.io/tx/mock_tx_' + Date.now(),
      quantity: quantity || 1,
      collection: collectionName,
      totalCost: 4200.69 * (quantity || 1),
      currency: '$LOS',
      nftData: {
        mintAddress: 'mock_mint_' + Date.now(),
        tokenId: 1,
        name: `${collectionName} #1`,
        description: `Mock NFT from ${collectionName}`,
        image: 'https://picsum.photos/500/500?random=nft'
      }
    });
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint NFT'
    });
  }
});

// Mock collection deploy endpoint
app.post('/api/collections/deploy', (req, res) => {
  try {
    const { name, symbol, description, mintPrice, maxSupply, platformFee, feeRecipientAddress, externalUrl, imageUrl } = req.body;
    
    console.log('🚀 Collection deploy request:', { name, symbol, description, mintPrice, maxSupply });
    
    // Return mock deployment success
    res.json({
      success: true,
      message: 'Collection deployed successfully (mock)',
      data: {
        id: 'launch-on-los',
        name: name || 'Launch On LOS',
        symbol: symbol || '$LOL',
        description: description || 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
              imageUrl: imageUrl || 'https://i.imgur.com/8K3vQ2J.jpg', // Use actual uploaded image
        mintPrice: mintPrice || 4200.69,
        totalSupply: maxSupply || 1111,
        currentSupply: 0,
        isActive: true,
        platformFee: platformFee || 2.5,
        feeRecipientAddress: feeRecipientAddress || '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        externalUrl: externalUrl || 'https://launchonlos.fun/',
        deployedAt: new Date().toISOString(),
        mintAddress: 'mock_collection_mint_' + Date.now(),
        metadataAddress: 'mock_metadata_' + Date.now(),
        masterEditionAddress: 'mock_master_edition_' + Date.now()
      }
    });
  } catch (error) {
    console.error('Error deploying collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy collection'
    });
  }
});

console.log('🚀 Starting Minimal Test Server...');
console.log(`📡 Port: ${PORT}`);

try {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ Minimal server started successfully on port ${PORT}`);
    console.log(`🏥 Health check available at: http://0.0.0.0:${PORT}/health`);
    console.log(`🎯 Ready to accept requests!`);
  }).on('error', (error) => {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
