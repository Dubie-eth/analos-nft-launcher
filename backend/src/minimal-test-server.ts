import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Store deployed collections in memory (in production, this would be a database)
let deployedCollections: any[] = [];

// Generate Arweave-style permanent URLs for images
const generateArweaveUrl = (imageData: string, imageName: string = 'collection-image'): string => {
  // For now, we'll create mock Arweave URLs that look realistic
  // In production, you'd actually upload to Arweave and get real transaction IDs
  const mockTxId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `https://arweave.net/${mockTxId}/${imageName}.png`;
};

// Auto-generate collection image URLs - use actual uploaded images
const getCollectionImageUrl = (collectionName: string, uploadedImageUrl?: string): string => {
  // If user uploaded an image, use that - otherwise use a gradient emoji
  if (uploadedImageUrl) {
    return uploadedImageUrl;
  }
  
  // Default to a nice gradient emoji for collections without uploaded images
  return 'https://i.imgur.com/UO6Jo6S.png'; // Your LOL logo
};

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

// Collections endpoint - returns deployed collections
app.get('/api/collections', (req, res) => {
  res.json({
    success: true,
    collections: deployedCollections // Return actually deployed collections
  });
});

// Individual collection endpoint
app.get('/api/collections/:collectionName', (req, res) => {
  const { collectionName } = req.params;
  
  // Find the collection by name (case insensitive)
  const collection = deployedCollections.find(
    col => col.name.toLowerCase() === collectionName.toLowerCase() ||
           col.id.toLowerCase() === collectionName.toLowerCase()
  );
  
  if (!collection) {
    res.status(404).json({
      success: false,
      error: 'Collection not found'
    });
    return;
  }
  
  res.json({
    success: true,
    collection: collection
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
    
    // Create new collection with auto-generated Arweave URL
    const collectionName = name || 'New Collection';
    const newCollection = {
      id: collectionName.toLowerCase().replace(/\s+/g, '-'),
      name: collectionName,
      symbol: symbol || '$NEW',
      description: description || 'A new NFT collection',
      imageUrl: getCollectionImageUrl(collectionName, imageUrl), // Use uploaded image or default
      mintPrice: mintPrice || 1.0,
      totalSupply: maxSupply || 100,
      currentSupply: 0,
      isActive: true,
      feePercentage: platformFee || 2.5,
      externalUrl: externalUrl || '',
      feeRecipient: feeRecipientAddress || '',
      deployedAt: new Date().toISOString(),
      mintAddress: 'mock_collection_mint_' + Date.now(),
      metadataAddress: 'mock_metadata_' + Date.now(),
      masterEditionAddress: 'mock_master_edition_' + Date.now(),
      arweaveUrl: getCollectionImageUrl(collectionName, imageUrl) // Store the image URL separately too
    };
    
    // Add to deployed collections (replace any existing collections for clean slate)
    deployedCollections = [newCollection];
    
    // Return deployment success
    res.json({
      success: true,
      message: `Collection '${newCollection.name}' deployed successfully!`,
      data: newCollection
    });
  } catch (error) {
    console.error('Error deploying collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy collection'
    });
  }
});

// Update collection image endpoint - generates new Arweave URL
app.post('/api/collections/:collectionName/update-image', (req, res) => {
  try {
    const { collectionName } = req.params;
    const { imageUrl } = req.body;
    
    // Find the collection
    const collectionIndex = deployedCollections.findIndex(
      col => col.name.toLowerCase() === collectionName.toLowerCase() ||
             col.id.toLowerCase() === collectionName.toLowerCase()
    );
    
    if (collectionIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
      return;
    }
    
    // Use the uploaded image URL or keep the existing one
    const newImageUrl = imageUrl || deployedCollections[collectionIndex].imageUrl || 'https://i.imgur.com/UO6Jo6S.png';
    
    // Update the collection with new image URL
    deployedCollections[collectionIndex].imageUrl = newImageUrl;
    deployedCollections[collectionIndex].arweaveUrl = newImageUrl;
    deployedCollections[collectionIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: `Collection image updated successfully!`,
      data: {
        imageUrl: newImageUrl,
        arweaveUrl: newImageUrl,
        collection: deployedCollections[collectionIndex]
      }
    });
  } catch (error) {
    console.error('Error updating collection image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update collection image'
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
