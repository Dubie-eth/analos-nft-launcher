# 🚀 Railway Deployment Guide

## Environment Variables Setup

Copy these **exact** environment variables to your Railway project:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
API_KEY=a6ffe279-a627-4623-8cc4-266785cf0eaf
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ANALOS_RPC_URL=https://rpc.analos.io
ANALOS_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
SOLANA_NETWORK=mainnet-beta
PINATA_API_KEY=ef9c5e9671c0a70ba963
PINATA_SECRET_KEY=597b13785cbf86fd613a5e1d0dc2c505c63701de2608278d5bf1e24511e4b56e
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5YmIxYTljOS1iNThiLTQxYmItOGE0ZS1hYmJjNGRhZmEyNzkiLCJlbWFpbCI6ImR1c3RpbmRkNDIxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJlZjljNWU5NjcxYzBhNzBiYTk2MyIsInNjb3BlZEtleVNlY3JldCI6IjU5N2IxMzc4NWNiZjg2ZmQ2MTNhNWUxZDBkYzJjNTA1YzYzNzAxZGUyNjA4Mjc4ZDViZjFlMjQ1MTFlNGI1NmUiLCJleHAiOjE3OTE2NDg0NjN9.1q54OghMxovKKHadf8es9In9G-ZKvW86caXyAbmj8qI
ADMIN_WALLET_PUBLIC_KEY=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
```

## Deployment Steps

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose `analos-nft-backend-minimal`
4. **Configure Deployment**:
   - **Branch**: `master`
   - **Root Directory**: Leave empty (default)
5. **Add Environment Variables**: Copy all variables above to Railway
6. **Deploy**: Click "Deploy"

## Expected Build Process

1. ✅ **Install Dependencies**: `npm install`
2. ✅ **Build TypeScript**: `npm run build`
3. ✅ **Start Server**: `npm start`

## Health Check

Once deployed, test the health endpoint:
```
GET https://your-railway-url.up.railway.app/health
```

## Security Features

- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ API key authentication
- ✅ Request logging

## Services Included

- 🔗 **IPFS Service**: Pinata integration for metadata storage
- 📡 **RPC Proxy**: Rate-limited Analos blockchain access
- 👂 **Event Listener**: Real-time mint tracking
- 🏥 **Health Check**: Server monitoring endpoint
