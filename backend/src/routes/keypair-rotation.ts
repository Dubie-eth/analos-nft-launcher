/**
 * Secure Keypair Rotation API Routes
 * Protected with 2FA
 */

import * as express from 'express';
import { getKeypairRotationService } from '../services/keypair-rotation-service';
import { getTwoFactorAuthService } from '../services/two-factor-auth-service';

const router = express.Router();

/**
 * POST /api/admin/keypair/2fa/setup
 * Setup 2FA for an admin wallet
 */
router.post('/2fa/setup', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required',
      });
    }
    
    const twoFactorService = getTwoFactorAuthService();
    
    if (!twoFactorService) {
      return res.status(503).json({
        success: false,
        error: '2FA service not initialized',
      });
    }
    
    const secret = await twoFactorService.generateSecret(walletAddress);
    
    res.json({
      success: true,
      data: {
        qrCodeUrl: secret.qrCodeUrl,
        manualEntryKey: secret.manualEntryKey,
        message: 'Scan QR code with Google Authenticator app',
      },
    });
  } catch (error: any) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/keypair/2fa/verify
 * Verify 2FA token
 */
router.post('/2fa/verify', (req, res) => {
  try {
    const { walletAddress, token } = req.body;
    
    if (!walletAddress || !token) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and token required',
      });
    }
    
    const twoFactorService = getTwoFactorAuthService();
    
    if (!twoFactorService) {
      return res.status(503).json({
        success: false,
        error: '2FA service not initialized',
      });
    }
    
    const verified = twoFactorService.verifyToken(walletAddress, token);
    
    res.json({
      success: true,
      verified,
    });
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/keypair/rotate
 * Rotate keypair (2FA protected)
 */
router.post('/rotate', async (req, res) => {
  try {
    const { walletAddress, token2FA, reason, transferAllFunds } = req.body;
    
    if (!walletAddress || !token2FA) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and 2FA token required',
      });
    }
    
    // Verify 2FA
    const twoFactorService = getTwoFactorAuthService();
    
    if (twoFactorService) {
      const verified = twoFactorService.verifyToken(walletAddress, token2FA);
      
      if (!verified) {
        return res.status(403).json({
          success: false,
          error: 'Invalid 2FA token',
        });
      }
    }
    
    // Perform rotation
    const rotationService = getKeypairRotationService();
    
    if (!rotationService) {
      return res.status(503).json({
        success: false,
        error: 'Rotation service not initialized',
      });
    }
    
    const result = await rotationService.rotateKeypair({
      initiatedBy: walletAddress,
      reason: reason || 'Manual rotation via admin panel',
      transferAllFunds: transferAllFunds !== false,
    });
    
    res.json({
      success: true,
      data: {
        oldPublicKey: result.oldPublicKey,
        newPublicKey: result.newPublicKey,
        newKeypairArray: result.newKeypairArray,
        solTransferred: result.solTransferred,
        transferSignature: result.transferSignature,
        message: 'Keypair rotated successfully! Update Railway environment variables with new keypair.',
      },
    });
  } catch (error: any) {
    console.error('Error rotating keypair:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/keypair/history
 * Get rotation history (2FA protected)
 */
router.get('/history', async (req, res) => {
  try {
    const { walletAddress, token2FA } = req.query;
    
    if (!walletAddress || !token2FA) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and 2FA token required',
      });
    }
    
    // Verify 2FA
    const twoFactorService = getTwoFactorAuthService();
    
    if (twoFactorService) {
      const verified = twoFactorService.verifyToken(walletAddress as string, token2FA as string);
      
      if (!verified) {
        return res.status(403).json({
          success: false,
          error: 'Invalid 2FA token',
        });
      }
    }
    
    const rotationService = getKeypairRotationService();
    
    if (!rotationService) {
      return res.status(503).json({
        success: false,
        error: 'Rotation service not initialized',
      });
    }
    
    const history = rotationService.getRotationHistory();
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error getting rotation history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/keypair/backups
 * List all encrypted backups
 */
router.get('/backups', (req, res) => {
  try {
    const rotationService = getKeypairRotationService();
    
    if (!rotationService) {
      return res.status(503).json({
        success: false,
        error: 'Rotation service not initialized',
      });
    }
    
    const backups = rotationService.listBackups();
    
    res.json({
      success: true,
      data: backups,
    });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

