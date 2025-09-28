# LosLauncher Deployment Guide

This guide will help you deploy your LosLauncher NFT platform to Railway (backend) and Vercel (frontend).

## 🚀 Quick Deployment Steps

### 1. Deploy Backend to Railway

#### Option A: Via Railway Dashboard (Recommended)
1. Go to [railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your LosLauncher repository
6. Select the `backend` folder as the root directory
7. Railway will automatically detect it's a Node.js project
8. Set environment variables (if needed)
9. Deploy!

#### Option B: Via Railway CLI
```bash
# Navigate to backend directory
cd backend

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 2. Deploy Frontend to Vercel

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your LosLauncher repository
5. Set the root directory to `frontend-new`
6. Add environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL
   - `NEXT_PUBLIC_APP_URL`: Your Vercel frontend URL
7. Deploy!

#### Option B: Via Vercel CLI
```bash
# Navigate to frontend directory
cd frontend-new

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_BACKEND_URL
vercel env add NEXT_PUBLIC_APP_URL
```

## 🔧 Environment Variables

### Backend (Railway)
- `PORT`: 3001 (auto-set by Railway)
- `NEXT_PUBLIC_APP_URL`: Your Vercel frontend URL

### Frontend (Vercel)
- `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL
- `NEXT_PUBLIC_APP_URL`: Your Vercel frontend URL

## 📋 Pre-Deployment Checklist

### Backend
- ✅ `package.json` has correct scripts
- ✅ `railway.json` configuration file exists
- ✅ Health check endpoint at `/health`
- ✅ All dependencies listed in `package.json`

### Frontend
- ✅ `package.json` has correct scripts
- ✅ Environment variables configured
- ✅ All dependencies listed in `package.json`
- ✅ Build script works (`npm run build`)

## 🎯 Post-Deployment Steps

1. **Test Backend Health**: Visit `https://your-railway-app.railway.app/health`
2. **Test Frontend**: Visit your Vercel URL
3. **Test Admin Panel**: Go to `/admin` and create a collection
4. **Test Mint Page**: Go to `/mint` and view collections
5. **Test API Integration**: Verify frontend can communicate with backend

## 🔗 Smart Contract Integration

After deployment, you can:

1. **Deploy Smart Contracts** to Analos (see `SMART_CONTRACT_SETUP.md`)
2. **Update Program ID** in Railway environment variables
3. **Test Real Blockchain Integration**

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Ensure they're set in both Railway and Vercel
3. **CORS Issues**: Backend CORS is configured for Vercel domains
4. **Health Check**: Backend has `/health` endpoint for Railway

### Railway Issues:
- Check build logs in Railway dashboard
- Verify `railway.json` configuration
- Ensure `npm run start` works locally

### Vercel Issues:
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure `npm run build` works locally

## 📊 Monitoring

### Railway
- View logs in Railway dashboard
- Monitor resource usage
- Check deployment status

### Vercel
- View build logs in Vercel dashboard
- Monitor performance
- Check deployment status

## 🔄 Updates

To update your deployment:

1. **Push changes** to your GitHub repository
2. **Railway** will automatically redeploy the backend
3. **Vercel** will automatically redeploy the frontend
4. **Test** the updated application

---

**Your LosLauncher platform will be live and accessible worldwide!** 🌍
