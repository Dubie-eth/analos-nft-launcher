/**
 * RPC Proxy Routes
 */

import { Router, Request, Response } from 'express';
import { rpcProxyService } from '../services/rpc-proxy-service';

const router = Router();

/**
 * POST /api/rpc/proxy
 * Proxy any RPC call
 */
router.post('/proxy', async (req: Request, res: Response) => {
  try {
    const { method, params, commitment } = req.body;

    if (!method) {
      return res.status(400).json({
        success: false,
        error: 'Missing method parameter'
      });
    }

    const result = await rpcProxyService.proxyCall({ method, params, commitment });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ RPC proxy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rpc/account/:address
 * Get account info
 */
router.get('/account/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const result = await rpcProxyService.getAccountInfo(address);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rpc/token-supply/:mint
 * Get token supply
 */
router.get('/token-supply/:mint', async (req: Request, res: Response) => {
  try {
    const { mint } = req.params;
    const result = await rpcProxyService.getTokenSupply(mint);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rpc/transaction/:signature
 * Get transaction
 */
router.get('/transaction/:signature', async (req: Request, res: Response) => {
  try {
    const { signature } = req.params;
    const result = await rpcProxyService.getTransaction(signature);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rpc/clear-cache
 * Clear RPC cache
 */
router.post('/clear-cache', (req: Request, res: Response) => {
  try {
    rpcProxyService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as rpcRouter };

