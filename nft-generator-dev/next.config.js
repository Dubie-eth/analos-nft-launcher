/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      'canvas': 'commonjs canvas',
    });
    return config;
  },
  images: {
    domains: ['localhost', 'gateway.pinata.cloud'],
    unoptimized: true,
  },
}

module.exports = nextConfig
