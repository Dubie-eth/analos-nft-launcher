# 🚀 Clean Deployment Guide

This is a fresh, clean deployment of the Analos NFT Launcher to resolve any previous configuration issues.

## 📋 Pre-Deployment Checklist

### ✅ Smart Contract
- **Status**: Already deployed to Analos
- **Program ID**: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`
- **Network**: Analos (https://rpc.analos.io)

### ✅ Environment Variables Ready
- Private key extracted and ready
- All configuration values prepared

---

## 🎯 Step 1: Deploy Backend to Railway

### 1.1 Create New Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your forked repository: `[your-username]/analos-nft-launcher`

### 1.2 Configure Railway Settings
1. **Root Directory**: Set to `backend`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`

### 1.3 Add Environment Variables
Add these variables in Railway:

```
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=[your-private-key-array]
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

### 1.4 Deploy and Get URL
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your Railway URL: `https://your-project.up.railway.app`

---

## 🎯 Step 2: Deploy Frontend to Vercel

### 2.1 Create New Vercel Project
1. Go to [Vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your forked repository: `[your-username]/analos-nft-launcher`

### 2.2 Configure Vercel Settings
1. **Framework Preset**: Next.js
2. **Root Directory**: Set to `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### 2.3 Add Environment Variables
Add these variables in Vercel:

```
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
```

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your Vercel URL: `https://your-project.vercel.app`

---

## 🎯 Step 3: Update CORS in Railway

### 3.1 Update CORS_ORIGIN
1. Go back to Railway project settings
2. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   CORS_ORIGIN=https://your-vercel-url.vercel.app
   ```
3. Railway will auto-redeploy

---

## 🎯 Step 4: Test Integration

### 4.1 Test Backend
Visit: `https://your-railway-url.up.railway.app/health`
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "service": "Analos NFT Launcher Backend (Clean)",
  "version": "1.0.0"
}
```

### 4.2 Test Frontend
1. Visit your Vercel URL
2. Check that "Backend: ✅ Connected" shows
3. Click "Try NFT Launchpad Demo"
4. Test the mint functionality

---

## 🎯 Step 5: Verify Full Integration

### 5.1 Frontend-Backend Connection
- ✅ Frontend loads successfully
- ✅ Backend health check passes
- ✅ CORS configured correctly

### 5.2 Smart Contract Integration
- ✅ Program ID configured
- ✅ Analos RPC connected
- ✅ Ready for NFT minting

---

## 🔧 Troubleshooting

### Backend Not Responding
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure CORS_ORIGIN matches Vercel URL exactly

### Frontend Can't Connect
1. Check `NEXT_PUBLIC_API_URL` in Vercel
2. Verify Railway URL is correct
3. Check browser console for CORS errors

### Smart Contract Issues
1. Verify Program ID is correct
2. Check Analos RPC URL
3. Ensure wallet is connected to Analos network

---

## 🎉 Success!

Once everything is working:
- ✅ Backend deployed to Railway
- ✅ Frontend deployed to Vercel  
- ✅ Smart contract connected
- ✅ Full integration tested

Your clean Analos NFT Launcher is ready for production! 🚀
