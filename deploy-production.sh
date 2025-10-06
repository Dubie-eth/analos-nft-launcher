#!/bin/bash

echo "🚀 Deploying NFT Launcher to Production"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "✅ CLI tools found"

# Deploy Backend to Railway
echo "🚀 Deploying backend to Railway..."
cd backend
railway login
railway deploy
echo "✅ Backend deployed to Railway"

# Get Railway URL
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "📡 Backend URL: $RAILWAY_URL"

# Deploy Frontend to Vercel
echo "🚀 Deploying frontend to Vercel..."
cd ../frontend-new

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
echo "$RAILWAY_URL" | vercel env add NEXT_PUBLIC_API_URL production

vercel env add NEXT_PUBLIC_NETWORK production
echo "analos" | vercel env add NEXT_PUBLIC_NETWORK production

vercel env add NEXT_PUBLIC_RPC_URL production
echo "https://rpc.analos.io" | vercel env add NEXT_PUBLIC_RPC_URL production

# Deploy
vercel --prod
echo "✅ Frontend deployed to Vercel"

echo "🎉 Deployment Complete!"
echo "======================"
echo "Backend: $RAILWAY_URL"
echo "Frontend: Check Vercel dashboard for URL"
echo "Real NFT Minter: [Frontend URL]/real-mint"
