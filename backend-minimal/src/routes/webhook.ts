/**
 * Webhook Routes
 * 
 * Handles incoming webhooks for blockchain events
 */

import { Router, Request, Response } from 'express';
import { eventListenerService } from '../services/event-listener-service';

const router = Router();

/**
 * POST /api/webhook/start-listener
 * Start the blockchain event listener
 */
router.post('/start-listener', async (req: Request, res: Response) => {
  try {
    await eventListenerService.startListening();

    res.json({
      success: true,
      message: 'Event listener started successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/webhook/stop-listener
 * Stop the blockchain event listener
 */
router.post('/stop-listener', async (req: Request, res: Response) => {
  try {
    await eventListenerService.stopListening();

    res.json({
      success: true,
      message: 'Event listener stopped successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/webhook/status
 * Get event listener status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = eventListenerService.getStatus();

    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/webhook/recent-events
 * Get recent events
 */
router.get('/recent-events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = await eventListenerService.getRecentEvents(limit);

    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as webhookRouter };

