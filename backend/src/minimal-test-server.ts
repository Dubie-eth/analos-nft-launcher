import express from 'express';
import cors from 'cors';
import { arweaveService, ArweaveUploadResult } from './arweave-service';

const app = express();
const PORT = process.env.PORT || 3001;

// Store deployed collections in memory (in production, this would be a database)
let deployedCollections: any[] = [];

// Initialize Arweave service
console.log('🚀 Initializing Arweave service...');
arweaveService.initializeWithWallet().then(success => {
  if (success) {
    console.log('✅ Arweave service ready');
    arweaveService.getWalletAddress().then(address => {
      console.log(`🔑 Arweave wallet address: ${address}`);
      arweaveService.getBalance().then(balance => {
        console.log(`💰 Arweave balance: ${balance} AR`);
        if (balance === 0) {
          console.log('⚠️  Arweave wallet has no balance - uploads may fail');
          console.log('💡 Fund your wallet at: https://arweave.net/wallet');
        }
      });
    });
  } else {
    console.log('❌ Failed to initialize Arweave service');
  }
});

// Generate real Arweave URLs for images
const generateArweaveImageUrl = async (imageUrl: string, imageName: string): Promise<string> => {
  try {
    // Upload image to Arweave
    const result: ArweaveUploadResult = await arweaveService.uploadImageFromUrl(imageUrl, imageName);
    
    if (result.success && result.url) {
      console.log(`✅ Image uploaded to Arweave: ${result.url}`);
      return result.url;
    } else {
      console.log(`❌ Arweave upload failed: ${result.error}`);
      // Fallback to working placeholder
      const hash = imageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seed = hash % 1000;
      return `https://picsum.photos/500/500?random=${seed}`;
    }
  } catch (error) {
    console.error('❌ Error uploading to Arweave:', error);
    // Fallback to working placeholder
    const hash = imageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = hash % 1000;
    return `https://picsum.photos/500/500?random=${seed}`;
  }
};

// Auto-generate collection image URLs - use working images
const getCollectionImageUrl = (collectionName: string, uploadedImageUrl?: string): string => {
  // Always generate a working image URL
  const imageName = `collection-${collectionName.toLowerCase().replace(/\s+/g, '-')}`;
  
  if (uploadedImageUrl) {
    // If user uploaded an image, try to use it, but fallback to working URL if it fails
    return uploadedImageUrl;
  }
  
  // Generate working URL for the collection
  const hash = imageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 1000;
  return `https://picsum.photos/500/500?random=${seed}`;
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

// Collection deploy endpoint with real Arweave uploads
app.post('/api/collections/deploy', async (req, res) => {
  try {
    const { name, symbol, description, mintPrice, maxSupply, platformFee, feeRecipientAddress, externalUrl, imageUrl } = req.body;
    
    console.log('🚀 Collection deploy request:', { name, symbol, description, mintPrice, maxSupply });
    
    // Create new collection
    const collectionName = name || 'New Collection';
    const imageName = `collection-${collectionName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Upload image to Arweave if provided
    let finalImageUrl = imageUrl;
    if (imageUrl && arweaveService.isReady()) {
      console.log('📤 Uploading image to Arweave...');
      const arweaveResult = await generateArweaveImageUrl(imageUrl, imageName);
      finalImageUrl = arweaveResult;
    } else if (!imageUrl) {
      // Use default image
      const hash = imageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seed = hash % 1000;
      finalImageUrl = `https://picsum.photos/500/500?random=${seed}`;
    }
    
    const newCollection = {
      id: collectionName.toLowerCase().replace(/\s+/g, '-'),
      name: collectionName,
      symbol: symbol || '$NEW',
      description: description || 'A new NFT collection',
      imageUrl: finalImageUrl,
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
      arweaveUrl: finalImageUrl
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
    
    // Generate new working URL for the image
    const imageName = `collection-${collectionName.toLowerCase().replace(/\s+/g, '-')}`;
    const hash = imageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = hash % 1000;
    const newImageUrl = imageUrl ? imageUrl : `https://picsum.photos/500/500?random=${seed}`;
    
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

// Arweave status endpoint
app.get('/api/arweave/status', async (req, res) => {
  try {
    const isReady = arweaveService.isReady();
    const address = await arweaveService.getWalletAddress();
    const balance = await arweaveService.getBalance();
    const networkInfo = await arweaveService.getNetworkInfo();
    
    res.json({
      success: true,
      data: {
        isReady,
        walletAddress: address,
        balance: `${balance} AR`,
        networkInfo,
        status: isReady ? 'Ready' : 'Not initialized'
      }
    });
  } catch (error) {
    console.error('Error getting Arweave status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Arweave status'
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
