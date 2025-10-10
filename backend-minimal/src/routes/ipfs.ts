/**
 * IPFS/Pinata Routes
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ipfsService, NFTMetadata } from '../services/ipfs-service';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

/**
 * POST /api/ipfs/upload-metadata
 * Upload NFT metadata to IPFS
 */
router.post('/upload-metadata', async (req: Request, res: Response) => {
  try {
    const metadata: NFTMetadata = req.body;

    // Validate metadata
    if (!metadata || !metadata.name || !metadata.description || !metadata.image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required metadata fields'
      });
    }

    // Upload to IPFS
    const result = await ipfsService.uploadMetadata(metadata);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error uploading metadata:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ipfs/upload-file
 * Upload file (image) to IPFS
 */
router.post('/upload-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const result = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ipfs/upload-from-url
 * Upload image from URL to IPFS
 */
router.post('/upload-from-url', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageUrl parameter'
      });
    }

    const result = await ipfsService.uploadImageFromUrl(imageUrl);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error uploading from URL:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ipfs/batch-upload
 * Batch upload multiple metadata files
 */
router.post('/batch-upload', async (req: Request, res: Response) => {
  try {
    const { metadataArray } = req.body;

    if (!metadataArray || !Array.isArray(metadataArray)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid metadataArray parameter'
      });
    }

    if (metadataArray.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 1000 metadata files per batch'
      });
    }

    const results = await ipfsService.batchUploadMetadata(metadataArray);

    res.json({
      success: true,
      results,
      total: results.length,
      successful: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('❌ Error batch uploading:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ipfs/test
 * Test Pinata connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const connected = await ipfsService.testConnection();

    res.json({
      success: connected,
      message: connected ? 'Pinata connection successful' : 'Pinata connection failed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as ipfsRouter };

