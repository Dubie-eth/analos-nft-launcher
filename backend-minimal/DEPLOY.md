# 🚀 Analos NFT Launcher - Minimal Backend Deployment Guide

## ✅ **What We Built**

A **secure, minimal backend** with only what you need:

```
4 Services (350 lines total):
- ✅ IPFS/Pinata - Metadata storage
- ✅ RPC Proxy - Rate-limited blockchain calls
- ✅ Event Listener - Watch for mints/reveals  
- ✅ Health Check - Monitor system status

vs. Old Backend: 72 services, 10,000+ lines
```

---

## 📋 **Prerequisites**

1. **Node.js 18+**
2. **Pinata Account** (for IPFS)
   - Sign up at https://pinata.cloud
   - Get API key, secret key, and JWT
3. **Railway Account** (for deployment)
   - Sign up at https://railway.app

---

## 🏗️ **Setup Instructions**

### **Step 1: Install Dependencies**

```bash
cd backend-minimal
npm install
```

### **Step 2: Configure Environment**

Create `.env` file from template:

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=3001
NODE_ENV=production

# Security  
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
API_KEY=your-super-secret-api-key-here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Blockchain
ANALOS_RPC_URL=https://rpc.analos.io
ANALOS_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk

# Pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt

# Admin (public key only!)
ADMIN_WALLET_PUBLIC_KEY=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
```

### **Step 3: Test Locally**

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Visit: http://localhost:3001

---

## 🚀 **Deploy to Railway**

### **Option A: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
railway variables set API_KEY=your-api-key
railway variables set ANALOS_RPC_URL=https://rpc.analos.io
railway variables set ANALOS_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
railway variables set PINATA_API_KEY=your-pinata-api-key
railway variables set PINATA_SECRET_KEY=your-pinata-secret-key
railway variables set PINATA_JWT=your-pinata-jwt
railway variables set ADMIN_WALLET_PUBLIC_KEY=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW

# Deploy
railway up
```

### **Option B: Using Railway Dashboard**

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables in Settings → Variables
6. Deploy!

---

## 🔍 **Testing Your Deployment**

### **1. Health Check**

```bash
curl https://your-railway-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T...",
  "services": {
    "rpc": { "healthy": true },
    "eventListener": { "active": false },
    "cache": { "entries": 0, "size": "0.00 KB" }
  },
  "version": "1.0.0"
}
```

### **2. Test IPFS Upload**

```bash
curl -X POST https://your-railway-app.railway.app/api/ipfs/test
```

### **3. Test RPC Proxy**

```bash
curl -X GET https://your-railway-app.railway.app/api/rpc/account/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
```

---

## 🔒 **Security Checklist**

- [x] ✅ Helmet security headers
- [x] ✅ CORS protection (only your frontend)
- [x] ✅ Rate limiting (100 requests / 15 min)
- [x] ✅ API key authentication
- [x] ✅ Input validation
- [x] ✅ File size limits (10MB)
- [x] ✅ MIME type validation
- [x] ✅ No private keys stored
- [x] ✅ Request logging
- [x] ✅ Error handling

---

## 📊 **API Endpoints**

### **Health**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system info

### **IPFS**
- `POST /api/ipfs/upload-metadata` - Upload NFT metadata
- `POST /api/ipfs/upload-file` - Upload image file
- `POST /api/ipfs/upload-from-url` - Upload from URL
- `POST /api/ipfs/batch-upload` - Batch upload metadata
- `GET /api/ipfs/test` - Test Pinata connection

### **RPC Proxy**
- `POST /api/rpc/proxy` - Proxy any RPC call
- `GET /api/rpc/account/:address` - Get account info
- `GET /api/rpc/token-supply/:mint` - Get token supply
- `GET /api/rpc/transaction/:signature` - Get transaction
- `POST /api/rpc/clear-cache` - Clear RPC cache

### **Webhook**
- `POST /api/webhook/start-listener` - Start event listener
- `POST /api/webhook/stop-listener` - Stop event listener
- `GET /api/webhook/status` - Get listener status
- `GET /api/webhook/recent-events` - Get recent events

---

## 🔧 **Troubleshooting**

### **Issue: "Pinata authentication failed"**

**Solution:**
1. Check your Pinata credentials in `.env`
2. Make sure you're using JWT, not just API key
3. Test connection: `npm run dev` and visit `/api/ipfs/test`

### **Issue: "CORS error from frontend"**

**Solution:**
1. Update `CORS_ORIGIN` in `.env` to match your frontend URL
2. Make sure no trailing slash: `https://your-app.vercel.app` (not `https://your-app.vercel.app/`)

### **Issue: "Rate limit exceeded"**

**Solution:**
1. Increase limits in `.env`:
   ```
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=200  # Increase to 200
   ```

### **Issue: "RPC connection failed"**

**Solution:**
1. Check if Analos RPC is online
2. Try alternative RPC: `https://api.analos.io`
3. Check Railway logs for details

---

## 📈 **Monitoring**

### **View Logs**

```bash
# Railway CLI
railway logs

# Or in Dashboard: Project → Deployments → View Logs
```

### **Check Health**

Set up automated health checks:
```bash
# Ping every 5 minutes
*/5 * * * * curl https://your-app.railway.app/health
```

### **Monitor Costs**

Railway free tier includes:
- ✅ $5/month credit
- ✅ 512MB RAM
- ✅ 1GB storage
- ✅ 100GB bandwidth

Your minimal backend should cost ~$2-3/month.

---

## 🎯 **Next Steps**

1. **Update Frontend**: Point to your new backend URL
2. **Test Integration**: Deploy frontend and test end-to-end
3. **Monitor**: Watch logs for any issues
4. **Scale**: Add more services as needed

---

## 📚 **Additional Resources**

- **Railway Docs**: https://docs.railway.app
- **Pinata Docs**: https://docs.pinata.cloud
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js
- **Express Docs**: https://expressjs.com

---

## 💡 **Pro Tips**

1. **Use environment-specific configs**:
   - Development: Local `.env`
   - Production: Railway variables

2. **Monitor your Pinata usage**:
   - Free tier: 1GB storage, 100 requests/month
   - Upgrade if needed: $10/month for more

3. **Set up alerts**:
   - Railway → Settings → Notifications
   - Get notified of crashes/deployments

4. **Backup your data**:
   - Pinata stores your files
   - Keep local backups of metadata

---

## 🎊 **Success!**

Your minimal backend is:
- ✅ Secure (Helmet, CORS, rate limiting)
- ✅ Fast (caching, minimal code)
- ✅ Reliable (error handling, logging)
- ✅ Scalable (easy to add features)
- ✅ Cost-effective (~$2-3/month)

**You're ready to launch!** 🚀

