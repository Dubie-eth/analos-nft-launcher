/**
 * Enhanced NFT Generator Routes
 * Integrates with LosLauncher generator and our 4-program system
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { rarityCalculator } from './services/enhanced-rarity-calculator';
import { ipfsService } from './services/ipfs-integration';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 2000, // Maximum 2000 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/zip';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, GIF, WebP) and ZIP files are allowed'));
    }
  }
});

// Store sessions and generation data
const generationSessions = new Map<string, any>();
const generationProgress = new Map<string, any>();

/**
 * Upload trait files and process layers
 */
router.post('/upload-traits', upload.array('files', 2000), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Generate session ID
    const sessionId = `gen_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Process uploaded files (enhanced version of your existing logic)
    const processedLayers = await processUploadedFiles(req.files);
    
    // Store session data
    generationSessions.set(sessionId, {
      sessionId,
      layers: processedLayers,
      uploadedAt: new Date(),
      fileCount: req.files.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
    });

    // Calculate expected rarity distribution
    const expectedDistribution = rarityCalculator.calculateExpectedDistribution(
      processedLayers,
      1000 // Default supply for preview
    );

    res.json({
      success: true,
      data: {
        sessionId,
        layers: processedLayers,
        totalTraits: processedLayers.reduce((sum, layer) => sum + (layer.traits?.length || 0), 0),
        expectedDistribution,
        estimatedGenerationTime: Math.floor(processedLayers.length * 0.5), // Rough estimate
      }
    });

  } catch (error) {
    console.error('Error processing trait files:', error);
    res.status(500).json({ 
      error: 'Failed to process trait files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Configure collection settings
 */
router.post('/configure-collection', async (req, res) => {
  try {
    const { sessionId, collectionSettings } = req.body;

    if (!sessionId || !generationSessions.has(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (!collectionSettings || !collectionSettings.name || !collectionSettings.symbol) {
      return res.status(400).json({ error: 'Collection name and symbol are required' });
    }

    // Update session with collection settings
    const session = generationSessions.get(sessionId);
    session.collectionSettings = collectionSettings;
    session.configuredAt = new Date();

    // Calculate cost estimate
    const costEstimate = await getGenerationCostEstimate(collectionSettings.totalSupply);

    res.json({
      success: true,
      data: {
        sessionId,
        collectionSettings,
        costEstimate,
        estimatedTime: Math.max(60, collectionSettings.totalSupply * 0.15 + 300),
      }
    });

  } catch (error) {
    console.error('Error configuring collection:', error);
    res.status(500).json({ 
      error: 'Failed to configure collection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Preview generation (no payment required)
 */
router.post('/preview-generation', async (req, res) => {
  try {
    const { sessionId, previewCount = 10 } = req.body;

    if (!sessionId || !generationSessions.has(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = generationSessions.get(sessionId);
    const { layers, collectionSettings } = session;

    if (!layers || layers.length === 0) {
      return res.status(400).json({ error: 'No layers found in session' });
    }

    // Generate preview NFTs
    const previewNFTs = await generatePreviewNFTs(layers, Math.min(previewCount, 50));

    // Calculate expected distribution
    const expectedDistribution = rarityCalculator.calculateExpectedDistribution(
      layers,
      collectionSettings?.totalSupply || 1000
    );

    // Get cost estimate
    const costEstimate = await getGenerationCostEstimate(
      collectionSettings?.totalSupply || 1000
    );

    res.json({
      success: true,
      data: {
        previewNFTs,
        expectedDistribution,
        costEstimate,
        collectionStats: {
          totalLayers: layers.length,
          totalTraits: layers.reduce((sum: number, layer: any) => sum + (layer.traits?.length || 0), 0),
          estimatedSupply: collectionSettings?.totalSupply || 1000,
        },
      }
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start complete generation and deployment
 */
router.post('/generate-and-deploy', async (req, res) => {
  try {
    const { sessionId, walletAddress } = req.body;

    if (!sessionId || !generationSessions.has(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const session = generationSessions.get(sessionId);
    
    if (!session.collectionSettings) {
      return res.status(400).json({ error: 'Collection settings not configured' });
    }

    // Initialize progress tracking
    const progressId = `progress_${sessionId}`;
    generationProgress.set(progressId, {
      status: 'preparing',
      current: 0,
      total: 6,
      message: 'Initializing generation...',
      details: {},
    });

    // Start generation in background
    startGenerationProcess(sessionId, walletAddress, progressId);

    res.json({
      success: true,
      data: {
        sessionId,
        progressId,
        message: 'Generation started. Use /generation-progress/:progressId to track progress.',
      }
    });

  } catch (error) {
    console.error('Error starting generation:', error);
    res.status(500).json({ 
      error: 'Failed to start generation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get generation progress
 */
router.get('/generation-progress/:progressId', async (req, res) => {
  try {
    const { progressId } = req.params;

    if (!generationProgress.has(progressId)) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    const progress = generationProgress.get(progressId);

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ 
      error: 'Failed to get progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get generation cost estimate
 */
router.get('/cost-estimate/:collectionSize', async (req, res) => {
  try {
    const collectionSize = parseInt(req.params.collectionSize);

    if (isNaN(collectionSize) || collectionSize <= 0) {
      return res.status(400).json({ error: 'Invalid collection size' });
    }

    const costEstimate = await getGenerationCostEstimate(collectionSize);

    res.json({
      success: true,
      data: costEstimate
    });

  } catch (error) {
    console.error('Error getting cost estimate:', error);
    res.status(500).json({ 
      error: 'Failed to get cost estimate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test IPFS connectivity
 */
router.get('/test-ipfs', async (req, res) => {
  try {
    const connectivityTest = await ipfsService.testConnectivity();

    res.json({
      success: true,
      data: connectivityTest
    });

  } catch (error) {
    console.error('Error testing IPFS:', error);
    res.status(500).json({ 
      error: 'Failed to test IPFS connectivity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get payment tiers
 */
router.get('/payment-tiers', async (req, res) => {
  try {
    const tiers = [
      {
        name: 'Small Collection',
        sizeRange: '100-500 NFTs',
        feeUSD: 70,
        features: [
          'NFT generation',
          'IPFS hosting (1 year)',
          'Basic rarity tiers',
          'Standard metadata',
        ],
      },
      {
        name: 'Medium Collection',
        sizeRange: '501-2,000 NFTs',
        feeUSD: 150,
        features: [
          'Everything in Small',
          'Advanced rarity tiers',
          'Extended IPFS hosting (2 years)',
          'Priority support',
          'Custom metadata templates',
        ],
      },
      {
        name: 'Large Collection',
        sizeRange: '2,001-10,000 NFTs',
        feeUSD: 350,
        features: [
          'Everything in Medium',
          'Premium IPFS hosting (3 years)',
          'Dedicated support',
          'Custom trait rules',
          'Analytics dashboard',
          'Marketing assistance',
        ],
      },
    ];

    res.json({
      success: true,
      data: { tiers }
    });

  } catch (error) {
    console.error('Error getting payment tiers:', error);
    res.status(500).json({ 
      error: 'Failed to get payment tiers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get session status
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!generationSessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = generationSessions.get(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.collectionSettings ? 'configured' : 'uploaded',
        layers: session.layers,
        collectionSettings: session.collectionSettings,
        uploadedAt: session.uploadedAt,
        configuredAt: session.configuredAt,
        fileCount: session.fileCount,
        totalSize: session.totalSize,
      }
    });

  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ 
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper Functions

/**
 * Process uploaded files (enhanced version of your existing logic)
 */
async function processUploadedFiles(files: any[]): Promise<any[]> {
  const layers = new Map<string, any>();
  
  for (const file of files) {
    const pathParts = file.originalname.split('/');
    const layerName = pathParts[0];
    
    if (!layers.has(layerName)) {
      layers.set(layerName, {
        name: layerName,
        traits: [],
        visible: true,
        order: layers.size,
      });
    }
    
    const layer = layers.get(layerName);
    const traitName = pathParts[1]?.replace(/\.[^/.]+$/, '') || file.originalname;
    
    layer.traits.push({
      id: `${layerName}_${traitName}_${crypto.randomBytes(4).toString('hex')}`,
      name: traitName,
      image: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      layer: layerName,
      rarity: 50, // Default rarity, will be adjusted by user
    });
  }
  
  // Convert to array and enhance with rarity tiers
  return Array.from(layers.values()).map(layer => ({
    ...layer,
    traits: rarityCalculator.enhanceTraitsWithTiers(layer.traits),
  }));
}

/**
 * Generate preview NFTs
 */
async function generatePreviewNFTs(layers: any[], count: number): Promise<any[]> {
  const previewNFTs = [];
  
  for (let i = 0; i < count; i++) {
    const selectedTraits = [];
    
    for (const layer of layers) {
      if (!layer.visible || !layer.traits || layer.traits.length === 0) continue;
      
      const totalWeight = layer.traits.reduce((sum: number, t: any) => sum + (t.rarity || 1), 0);
      let random = Math.random() * totalWeight;
      
      for (const trait of layer.traits) {
        random -= trait.rarity || 1;
        if (random <= 0) {
          selectedTraits.push(trait);
          break;
        }
      }
    }
    
    const rarity = rarityCalculator.calculateNFTRarity(selectedTraits);
    
    previewNFTs.push({
      tokenId: i,
      traits: selectedTraits,
      rarity,
      preview: true,
    });
  }
  
  return previewNFTs;
}

/**
 * Get generation cost estimate
 */
async function getGenerationCostEstimate(collectionSize: number): Promise<any> {
  let feeUSD: number;
  
  if (collectionSize <= 500) {
    feeUSD = 70;
  } else if (collectionSize <= 2000) {
    feeUSD = 150;
  } else {
    feeUSD = 350;
  }

  // Get IPFS cost estimate
  const ipfsCost = await ipfsService.getUploadCostEstimate(collectionSize);
  
  return {
    generatorFee: feeUSD,
    ipfsCost,
    totalCost: feeUSD + ipfsCost.pinata.cost,
    breakdown: {
      generation: feeUSD,
      ipfsHosting: ipfsCost.pinata.cost,
      blockchainDeployment: 0.05, // ~$0.05 SOL
    },
    currency: 'USD',
    paymentMethod: 'LOS',
  };
}

/**
 * Start generation process in background
 */
async function startGenerationProcess(
  sessionId: string, 
  walletAddress: string, 
  progressId: string
): Promise<void> {
  try {
    const session = generationSessions.get(sessionId);
    
    // Simulate the process for now
    const steps = [
      'Processing payment...',
      'Generating NFT collection...',
      'Uploading to IPFS...',
      'Deploying to blockchain...',
      'Configuring rarity oracle...',
      'Finalizing deployment...',
    ];
    
    for (let i = 0; i < steps.length; i++) {
      generationProgress.set(progressId, {
        status: i === steps.length - 1 ? 'completed' : 'processing',
        current: i + 1,
        total: steps.length,
        message: steps[i],
        details: {
          step: i + 1,
          totalSteps: steps.length,
          sessionId,
        },
      });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Mark as completed
    generationProgress.set(progressId, {
      status: 'completed',
      current: steps.length,
      total: steps.length,
      message: 'Collection deployed successfully!',
      details: {
        sessionId,
        collectionConfig: 'CollectionConfigAddress',
        tokenLaunchConfig: 'TokenLaunchConfigAddress',
        baseURI: 'ipfs://CollectionHash',
        deployedAt: new Date(),
      },
    });
    
  } catch (error) {
    generationProgress.set(progressId, {
      status: 'error',
      current: 0,
      total: 6,
      message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      },
    });
  }
}

export default router;