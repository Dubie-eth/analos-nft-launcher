import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for trait folders
    files: 1000, // Maximum 1000 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Accept image files and ZIP files
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

// Store sessions and layer data in memory (in production, use a database)
const sessions = new Map<string, any>();
const layerData = new Map<string, any>();

/**
 * Upload ZIP file containing trait layers
 */
router.post('/upload-layers', upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file uploaded' });
    }

    // Generate session ID
    const sessionId = `zip_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // TODO: Implement ZIP processing logic
    // For now, return a mock response
    const mockLayers = [
      {
        name: 'Background',
        traits: ['blue', 'red', 'green'],
        images: new Map()
      },
      {
        name: 'Eyes',
        traits: ['normal', 'laser', 'glowing'],
        images: new Map()
      },
      {
        name: 'Hats',
        traits: ['none', 'cap', 'crown'],
        images: new Map()
      }
    ];

    // Store session data
    sessions.set(sessionId, {
      type: 'zip',
      uploadedAt: new Date(),
      fileSize: req.file.size,
      fileName: req.file.originalname
    });

    layerData.set(sessionId, mockLayers);

    res.json({
      success: true,
      data: {
        sessionId,
        layers: mockLayers,
        totalTraits: mockLayers.reduce((sum, layer) => sum + layer.traits.length, 0)
      }
    });

  } catch (error) {
    console.error('Error uploading ZIP layers:', error);
    res.status(500).json({ 
      error: 'Failed to process ZIP file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload folder containing trait layers
 */
router.post('/upload-folder', upload.array('files', 1000), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    
    console.log('📁 Backend received files:', files.length);
    files.forEach((file, index) => {
      console.log(`📁 Backend File ${index + 1}:`, {
        originalname: file.originalname,
        fieldname: file.fieldname,
        mimetype: file.mimetype,
        size: file.size
      });
    });
    
    // Generate session ID
    const sessionId = `folder_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Process folder structure
    const layersMap = new Map<string, string[]>();
    const invalidFiles: string[] = [];
    
    files.forEach((file) => {
      // Extract folder path from file.originalname or use a default structure
      const pathParts = file.originalname.split('/');
      if (pathParts.length >= 2) {
        const folderName = pathParts[0]; // First folder is the layer name
        
        // Validate image file
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
          if (!layersMap.has(folderName)) {
            layersMap.set(folderName, []);
          }
          
          // Remove extension from filename
          const traitName = path.basename(file.originalname, ext);
          layersMap.get(folderName)!.push(traitName);
        } else {
          invalidFiles.push(file.originalname);
        }
      }
    });

    // Log invalid files for debugging
    if (invalidFiles.length > 0) {
      console.warn('Invalid files found:', invalidFiles);
    }

    // Convert to layers array
    const layers = Array.from(layersMap.entries()).map(([layerName, traits]) => ({
      name: layerName,
      traits,
      images: new Map() // Will be populated during generation
    }));

    const totalTraits = layers.reduce((sum, layer) => sum + layer.traits.length, 0);

    // Store session data
    sessions.set(sessionId, {
      type: 'folder',
      uploadedAt: new Date(),
      fileCount: files.length,
      layerCount: layers.length,
      totalTraits
    });

    layerData.set(sessionId, layers);

    res.json({
      success: true,
      data: {
        sessionId,
        layers,
        totalTraits
      }
    });

  } catch (error) {
    console.error('Error uploading folder:', error);
    res.status(500).json({ 
      error: 'Failed to process folder upload',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Save generation configuration
 */
router.post('/save-config/:sessionId', express.json(), (req, res) => {
  try {
    const { sessionId } = req.params;
    const config = req.body;

    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Store configuration
    const sessionData = sessions.get(sessionId);
    sessionData.config = {
      ...config,
      savedAt: new Date()
    };
    sessions.set(sessionId, sessionData);

    res.json({
      success: true,
      message: 'Configuration saved successfully'
    });

  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ 
      error: 'Failed to save configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate NFTs
 */
router.post('/generate/:sessionId', express.json(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pricing } = req.body;

    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessions.get(sessionId);
    const layers = layerData.get(sessionId);

    if (!sessionData.config) {
      return res.status(400).json({ error: 'Configuration not found' });
    }

    // TODO: Implement actual NFT generation logic
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        sessionId,
        status: 'generating',
        progress: 0,
        message: 'Starting NFT generation...'
      }
    });

  } catch (error) {
    console.error('Error generating NFTs:', error);
    res.status(500).json({ 
      error: 'Failed to generate NFTs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get generation progress
 */
router.get('/progress/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessions.get(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        status: sessionData.status || 'pending',
        progress: sessionData.progress || 0,
        current: sessionData.current || 0,
        total: sessionData.total || 0,
        message: sessionData.message || 'Waiting to start...'
      }
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
 * Get generation result
 */
router.get('/result/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessions.get(sessionId);

    if (sessionData.status !== 'completed') {
      return res.status(400).json({ error: 'Generation not completed yet' });
    }

    // TODO: Return actual generation result
    res.json({
      success: true,
      data: sessionData.result
    });

  } catch (error) {
    console.error('Error getting result:', error);
    res.status(500).json({ 
      error: 'Failed to get result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate configuration
 */
router.post('/validate-config', express.json(), (req, res) => {
  try {
    const { config, layers } = req.body;

    const errors: string[] = [];

    // Validate collection details
    if (!config.collection.name) {
      errors.push('Collection name is required');
    }
    if (!config.collection.symbol) {
      errors.push('Collection symbol is required');
    }
    if (config.supply <= 0) {
      errors.push('Supply must be greater than 0');
    }

    // Validate layer configuration
    if (config.order.length === 0) {
      errors.push('At least one layer must be selected');
    }

    // Validate rarity configuration
    config.order.forEach((layerName: string) => {
      const layer = layers.find((l: any) => l.name === layerName);
      if (layer && config.rarity[layerName]) {
        const totalRarity = Object.values(config.rarity[layerName]).reduce((sum: number, val: any) => sum + val, 0);
        if (Math.abs(totalRarity - 100) > 0.01) {
          errors.push(`Layer ${layerName} rarity must sum to 100%`);
        }
      }
    });

    res.json({
      success: true,
      data: {
        valid: errors.length === 0,
        errors
      }
    });

  } catch (error) {
    console.error('Error validating configuration:', error);
    res.status(500).json({ 
      error: 'Failed to validate configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
