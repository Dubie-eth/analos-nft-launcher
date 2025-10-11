# 🚀 NFT Launcher Deployment Guide

## Backend Deployment to Railway

### Step 1: Railway Setup
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Create new project
4. Connect your GitHub repository
5. Select the `backend` folder as the root directory

### Step 2: Environment Variables
Set these environment variables in Railway dashboard:

```
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NETWORK=analos
FEE_WALLET_ADDRESS=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
CORS_ORIGINS=https://your-frontend-domain.vercel.app
HEALTH_CHECK_ENABLED=true
```

### Step 3: Deploy
Railway will automatically:
- Install dependencies (`npm install`)
- Build the project (`npm run build`)
- Start the server (`npm start`)

## Frontend Deployment to Vercel

### Step 1: Vercel Setup
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Select the `frontend-new` folder as the root directory

### Step 2: Environment Variables
Set these environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
NEXT_PUBLIC_NETWORK=analos
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
```

### Step 3: Deploy
Vercel will automatically:
- Install dependencies
- Build the Next.js app
- Deploy to global CDN

## Production URLs

After deployment, you'll have:
- **Backend API**: `https://your-backend.railway.app`
- **Frontend**: `https://your-frontend.vercel.app`
- **Real NFT Minter**: `https://your-frontend.vercel.app/real-mint`

## Testing Production

1. Visit your frontend URL
2. Go to `/real-mint`
3. Connect wallet
4. Mint a real NFT
5. Check transaction on [Analos Explorer](https://explorer.analos.io)

## Environment Variables Reference

### Backend (Railway)
- `NODE_ENV`: production
- `PORT`: 3001
- `ANALOS_RPC_URL`: https://rpc.analos.io
- `NETWORK`: analos
- `FEE_WALLET_ADDRESS`: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
- `CORS_ORIGINS`: Your frontend domain

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Your Railway backend URL
- `NEXT_PUBLIC_NETWORK`: analos
- `NEXT_PUBLIC_RPC_URL`: https://rpc.analos.io