/**
 * Analos NFT Launcher - Minimal Secure Backend
 * 
 * Purpose: Lightweight backend for IPFS uploads, RPC proxying, and event listening
 * Security: Helmet, CORS, rate limiting, input validation
 * 
 * Program ID: 7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { ipfsRouter } from './routes/ipfs';
import { rpcRouter } from './routes/rpc-proxy';
import { webhookRouter } from './routes/webhook';
import { healthRouter } from './routes/health';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://rpc.analos.io"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
}));

// CORS - Only allow your frontend
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://analos-nft-launcher-9cxc.vercel.app',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};
app.use(cors(corsOptions));

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// API KEY VALIDATION (for sensitive endpoints)
// ============================================================================

function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.warn('⚠️ Warning: API_KEY not set in environment variables');
    return next();
  }

  if (apiKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid API key' 
    });
  }

  next();
}

// ============================================================================
// REQUEST LOGGING
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no auth required)
app.use('/health', healthRouter);

// IPFS/Pinata uploads (API key required for uploads)
app.use('/api/ipfs', ipfsRouter);

// RPC proxy (rate limited)
app.use('/api/rpc', rpcRouter);

// Webhook listener (for blockchain events)
app.use('/api/webhook', webhookRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Analos NFT Launcher API',
    version: '1.0.0',
    status: 'operational',
    programId: process.env.ANALOS_PROGRAM_ID,
    endpoints: {
      health: '/health',
      ipfs: '/api/ipfs',
      rpc: '/api/rpc',
      webhook: '/api/webhook'
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 Analos NFT Launcher - Minimal Secure Backend         ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Port:        ${PORT.toString().padEnd(48)} ║`);
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(48)} ║`);
  console.log(`║  Program ID:  7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk  ║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                                  ║');
  console.log('║  - GET  /health                    Health check              ║');
  console.log('║  - POST /api/ipfs/upload           Upload to IPFS           ║');
  console.log('║  - POST /api/rpc/proxy             Proxy RPC calls          ║');
  console.log('║  - POST /api/webhook/mint          Mint event webhook       ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  Security Features:                                          ║');
  console.log('║  ✅ Helmet security headers                                  ║');
  console.log('║  ✅ CORS protection                                          ║');
  console.log('║  ✅ Rate limiting                                            ║');
  console.log('║  ✅ API key authentication                                   ║');
  console.log('║  ✅ Request logging                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;

