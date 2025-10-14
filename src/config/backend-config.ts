/**
 * SECURITY: Backend Configuration
 * Centralized configuration for secure backend communication
 * All sensitive data is handled server-side
 */

// SECURITY: Server-side environment variables (not exposed to client)
export const SERVER_BACKEND_CONFIG = {
  // These should be set in your deployment environment
  BACKEND_URL: process.env.BACKEND_URL || 'https://analos-core-service-production.up.railway.app',
  API_KEY: process.env.API_KEY,
  TIMEOUT: 30000, // 30 seconds
};

// Client-side configuration (safe to expose)
export const CLIENT_BACKEND_CONFIG = {
  // Use secure proxy endpoint
  PROXY_URL: '/api/proxy',
  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // IPFS
  IPFS_UPLOAD_FILE: '/api/ipfs/upload-file',
  IPFS_UPLOAD_JSON: '/api/ipfs/upload-json',
  IPFS_TEST: '/api/ipfs/test',
  
  // RPC Proxy
  RPC_PROXY: '/api/rpc/proxy',
  
  // Webhooks
  WEBHOOK_ANALOS_EVENT: '/api/webhook/analos-event',
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://solana.com https://cdn.skypack.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://rpc.analos.io https://api.analos.io wss:; font-src 'self' data:;",
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
};

// CORS configuration
export const CORS_CONFIG = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://launchonlos.fun', 'https://www.launchonlos.fun']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
};