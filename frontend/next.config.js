/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ANALOS_RPC_URL: process.env.NEXT_PUBLIC_ANALOS_RPC_URL,
    NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM_ID: process.env.NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM_ID,
  }
}

module.exports = nextConfig
