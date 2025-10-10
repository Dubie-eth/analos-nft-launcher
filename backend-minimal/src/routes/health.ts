/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { rpcProxyService } from '../services/rpc-proxy-service';
import { eventListenerService } from '../services/event-listener-service';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check RPC connection
    const slotResult = await rpcProxyService.getSlot();
    const rpcHealthy = slotResult.success;

    // Check event listener
    const listenerStatus = eventListenerService.getStatus();

    // Get cache stats
    const cacheStats = rpcProxyService.getCacheStats();

    res.json({
      status: rpcHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        rpc: {
          healthy: rpcHealthy,
          url: process.env.ANALOS_RPC_URL
        },
        eventListener: {
          active: listenerStatus.isListening,
          programId: listenerStatus.programId
        },
        cache: {
          entries: cacheStats.entries,
          size: `${(cacheStats.size / 1024).toFixed(2)} KB`
        }
      },
      version: '1.0.0'
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check with more info
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const slotResult = await rpcProxyService.getSlot();
    const blockhashResult = await rpcProxyService.getRecentBlockhash();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      blockchain: {
        network: process.env.SOLANA_NETWORK || 'mainnet-beta',
        programId: process.env.ANALOS_PROGRAM_ID,
        currentSlot: slotResult.data,
        recentBlockhash: blockhashResult.data?.blockhash
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as healthRouter };

