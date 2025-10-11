/**
 * Price Oracle Automation API Routes
 */

import express from 'express';
import { getPriceOracleAutomation } from '../services/price-oracle-automation.js';

const router = express.Router();

/**
 * GET /api/oracle/automation/status
 * Get automation status
 */
router.get('/status', (req, res) => {
  try {
    const automation = getPriceOracleAutomation();
    
    if (!automation) {
      return res.status(503).json({
        success: false,
        error: 'Automation not initialized',
      });
    }
    
    const status = automation.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting automation status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/oracle/automation/start
 * Start automated price updates
 */
router.post('/start', (req, res) => {
  try {
    const automation = getPriceOracleAutomation();
    
    if (!automation) {
      return res.status(503).json({
        success: false,
        error: 'Automation not initialized',
      });
    }
    
    automation.start();
    
    res.json({
      success: true,
      message: 'Automation started',
      data: automation.getStatus(),
    });
  } catch (error: any) {
    console.error('Error starting automation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/oracle/automation/stop
 * Stop automated price updates
 */
router.post('/stop', (req, res) => {
  try {
    const automation = getPriceOracleAutomation();
    
    if (!automation) {
      return res.status(503).json({
        success: false,
        error: 'Automation not initialized',
      });
    }
    
    automation.stop();
    
    res.json({
      success: true,
      message: 'Automation stopped',
      data: automation.getStatus(),
    });
  } catch (error: any) {
    console.error('Error stopping automation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/oracle/automation/config
 * Update automation configuration
 */
router.put('/config', (req, res) => {
  try {
    const automation = getPriceOracleAutomation();
    
    if (!automation) {
      return res.status(503).json({
        success: false,
        error: 'Automation not initialized',
      });
    }
    
    const { 
      checkIntervalMs, 
      updateThresholdPercent, 
      minTimeBetweenUpdates 
    } = req.body;
    
    automation.updateConfig({
      checkIntervalMs,
      updateThresholdPercent,
      minTimeBetweenUpdates,
    });
    
    res.json({
      success: true,
      message: 'Configuration updated',
      data: automation.getStatus(),
    });
  } catch (error: any) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

