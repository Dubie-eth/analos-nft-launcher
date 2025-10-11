// Backend Configuration
// Centralized configuration for all backend API calls

// Microservices URLs
export const MICROSERVICES = {
  CORE: process.env.NEXT_PUBLIC_CORE_API_URL || 'https://analos-core-service-production.up.railway.app',
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://analos-nft-launcher-production-2c71.up.railway.app',
  SECURITY: process.env.NEXT_PUBLIC_SECURITY_API_URL || 'https://analos-security-service-production.up.railway.app',
} as const;

export const BACKEND_CONFIG = {
  // Production backend URL (Core Service is primary)
  BASE_URL: MICROSERVICES.CORE,
  
  // Microservices configuration
  SERVICES: MICROSERVICES,
  
  // API endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    
    // Core Service endpoints
    IPFS_UPLOAD_FILE: '/api/ipfs/upload-file',
    IPFS_UPLOAD_JSON: '/api/ipfs/upload-json',
    IPFS_TEST: '/api/ipfs/test',
    RPC_PROXY: '/api/rpc/proxy',
    RPC_ACCOUNT: '/api/rpc/account',
    RPC_TOKEN_SUPPLY: '/api/rpc/token-supply',
    RPC_TRANSACTION: '/api/rpc/transaction',
    WEBHOOK_ANALOS_EVENT: '/api/webhook/analos-event',
    WEBHOOK_START_LISTENER: '/api/webhook/start-listener',
    WEBHOOK_STOP_LISTENER: '/api/webhook/stop-listener',
    WEBHOOK_STATUS: '/api/webhook/status',
    TICKER_CHECK: '/api/ticker/check',
    TICKER_RESERVE: '/api/ticker/reserve',
    TICKER_REGISTER: '/api/ticker/register',
    COLLECTIONS: '/api/collections',
    MINT_SPL_NFT: '/api/mint-spl-nft',
    
    // Oracle Service endpoints
    ORACLE_STATUS: '/api/oracle/automation/status',
    ORACLE_START: '/api/oracle/automation/start',
    ORACLE_STOP: '/api/oracle/automation/stop',
    ORACLE_PRICE: '/api/oracle/price',
    
    // Security Service endpoints
    KEYPAIR_STATUS: '/api/keypair/status',
    KEYPAIR_ROTATE: '/api/keypair/rotate',
    KEYPAIR_2FA_SETUP: '/api/keypair/2fa/setup',
    KEYPAIR_2FA_VERIFY: '/api/keypair/2fa/verify',
  },
  
  // API Key for authentication
  API_KEY: 'a6ffe279-a627-4623-8cc4-266785cf0eaf',
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Rate limiting configuration
  RATE_LIMIT: {
    WINDOW_MS: 900000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, service: 'CORE' | 'ORACLE' | 'SECURITY' = 'CORE'): string => {
  const baseUrl = MICROSERVICES[service];
  return `${baseUrl}${endpoint}`;
};

// Helper functions for each microservice
export const buildCoreUrl = (endpoint: string): string => buildApiUrl(endpoint, 'CORE');
export const buildOracleUrl = (endpoint: string): string => buildApiUrl(endpoint, 'ORACLE');
export const buildSecurityUrl = (endpoint: string): string => buildApiUrl(endpoint, 'SECURITY');

// Helper function to get headers with API key
export const getApiHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'x-api-key': BACKEND_CONFIG.API_KEY,
    ...additionalHeaders,
  };
};

// Helper function for authenticated fetch requests
export const authenticatedFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const headers = getApiHeaders();
  
  // Merge headers
  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
};

// Health check function
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl(BACKEND_CONFIG.ENDPOINTS.HEALTH));
    const data = await response.json();
    return data.status === 'healthy' || data.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// Export the old URL for reference (deprecated - use MICROSERVICES instead)
export const OLD_BACKEND_URL = 'https://analos-nft-launcher-backend-production.up.railway.app';

// Health check for all services
export const checkAllServicesHealth = async (): Promise<{
  core: boolean;
  oracle: boolean;
  security: boolean;
  allHealthy: boolean;
}> => {
  const results = {
    core: false,
    oracle: false,
    security: false,
    allHealthy: false,
  };

  try {
    const [coreRes, oracleRes, securityRes] = await Promise.allSettled([
      fetch(buildCoreUrl('/health')),
      fetch(buildOracleUrl('/health')),
      fetch(buildSecurityUrl('/health')),
    ]);

    results.core = coreRes.status === 'fulfilled' && coreRes.value.ok;
    results.oracle = oracleRes.status === 'fulfilled' && oracleRes.value.ok;
    results.security = securityRes.status === 'fulfilled' && securityRes.value.ok;
    results.allHealthy = results.core && results.oracle && results.security;
  } catch (error) {
    console.error('Health check failed:', error);
  }

  return results;
};

export default BACKEND_CONFIG;
