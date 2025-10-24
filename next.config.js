/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize for Railway deployment
  output: 'standalone',
  
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'arweave.net',
      'nftstorage.link',
    ],
    unoptimized: true,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'Analos NFT Launcher',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.analos.io',
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Logging for debugging Railway issues
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;

