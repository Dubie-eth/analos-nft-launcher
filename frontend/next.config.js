/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['picsum.photos'],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // Ensure the URL has a protocol
    const fullBackendUrl = backendUrl.startsWith('http') 
      ? backendUrl 
      : `https://${backendUrl}`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${fullBackendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
