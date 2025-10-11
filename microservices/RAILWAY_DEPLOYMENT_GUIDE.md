# 🚀 Railway Microservices Deployment Guide

## ✅ What You've Built

3 separate microservices for the Analos NFT Launchpad:

1. **analos-core-service** - Main NFT functionality
2. **analos-oracle-service** - Automated price updates  
3. **analos-security-service** - 2FA & keypair rotation

---

## 🎯 Railway Deployment Steps

### Step 1: Deploy Core Service

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select: **`Dubie-eth/analos-nft-launcher`**
4. Configure:
   - **Service Name**: `analos-core-service`
   - **Branch**: `master`
   - **Root Directory**: `microservices/analos-core`
5. Add Environment Variables:
   ```
   PORT=8080
   ANALOS_RPC_URL=https://rpc.analos.io
   CORS_ORIGIN=https://analosnftfrontendminimal.vercel.app
   PINATA_API_KEY=<your-pinata-api-key>
   PINATA_SECRET_KEY=<your-pinata-secret-key>
   ```
6. Click **"Deploy"**
7. Copy the generated URL (e.g., `https://analos-core-service-production.up.railway.app`)

### Step 2: Deploy Oracle Service

1. In Railway Dashboard, click **"New"** → **"GitHub Repo"**
2. Select: **`Dubie-eth/analos-nft-launcher`** (same repo!)
3. Configure:
   - **Service Name**: `analos-oracle-service`
   - **Branch**: `master`
   - **Root Directory**: `microservices/analos-oracle`
4. Add Environment Variables:
   ```
   PORT=8081
   PRICE_ORACLE_PROGRAM_ID=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
   PRICE_ORACLE_AUTOMATION_ENABLED=true
   PRICE_ORACLE_CHECK_INTERVAL=60000
   PRICE_ORACLE_UPDATE_THRESHOLD=1.0
   PRICE_ORACLE_COOLDOWN=300000
   ANALOS_RPC_URL=https://rpc.analos.io
   PRICE_ORACLE_AUTHORITY_SECRET_KEY=[82,204,132,209,87,176,71,21,67,147,2,207,56,92,240,77,86,253,104,104,122,39,75,43,211,37,84,87,89,111,14,211,160,184,235,251,245,32,50,10,128,139,75,189,56,55,81,140,39,76,169,93,106,182,94,49,137,191,255,239,252,66,111,7]
   ```
5. Click **"Deploy"**
6. Copy the generated URL (e.g., `https://analos-oracle-service-production.up.railway.app`)

### Step 3: Deploy Security Service

1. In Railway Dashboard, click **"New"** → **"GitHub Repo"**
2. Select: **`Dubie-eth/analos-nft-launcher`** (same repo again!)
3. Configure:
   - **Service Name**: `analos-security-service`
   - **Branch**: `master`
   - **Root Directory**: `microservices/analos-security`
4. Add Environment Variables:
   ```
   PORT=8082
   KEYPAIR_ROTATION_ENABLED=true
   KEYPAIR_ENCRYPTION_KEY=Bm4QNucPoBlYwzD6E5FtvfIbrSyZACLHGp83g70sKqxdihROX
   KEYPAIR_BACKUP_DIR=./keypair-backups
   ANALOS_RPC_URL=https://rpc.analos.io
   ```
5. Click **"Deploy"**
6. Copy the generated URL (e.g., `https://analos-security-service-production.up.railway.app`)

---

## 🔍 Verify Deployments

Test each service's health endpoint:

```bash
# Core Service
curl https://analos-core-service-production.up.railway.app/health

# Oracle Service  
curl https://analos-oracle-service-production.up.railway.app/health

# Security Service
curl https://analos-security-service-production.up.railway.app/health
```

---

## 📝 Update Frontend

### In Vercel Dashboard:

Add 3 new environment variables:

```
NEXT_PUBLIC_CORE_URL=https://analos-core-service-production.up.railway.app
NEXT_PUBLIC_ORACLE_URL=https://analos-oracle-service-production.up.railway.app
NEXT_PUBLIC_SECURITY_URL=https://analos-security-service-production.up.railway.app
```

### Update CORS in Railway Services:

For each Railway service, add the Vercel frontend URL to `CORS_ORIGIN`:
```
CORS_ORIGIN=https://analosnftfrontendminimal.vercel.app
```

---

## 🎯 API Endpoint Map

### Core Service (Port 8080)
```
GET  /health
GET  /api/nft/all
GET  /api/nft/collection/:collectionName
GET  /api/nft/:mintAddress
POST /api/recovery/scan
POST /api/recovery/recover
GET  /api/blockchain-first/nfts
GET  /api/launchpad/collections
GET  /api/launchpad/collection/:address
GET  /api/mint-stats/:collectionAddress
POST /api/ticker/check
POST /api/ticker/reserve
```

### Oracle Service (Port 8081)
```
GET  /health
GET  /api/oracle/automation/status
POST /api/oracle/automation/start
POST /api/oracle/automation/stop
POST /api/oracle/automation/config
```

### Security Service (Port 8082)
```
GET  /health
POST /api/admin/keypair/2fa/setup
POST /api/admin/keypair/2fa/verify
POST /api/admin/keypair/rotate
GET  /api/admin/keypair/status
```

---

## 💰 Cost Estimate

| Service | Railway Plan | Est. Cost |
|---------|-------------|-----------|
| Core    | Hobby       | ~$5/month |
| Oracle  | Hobby       | ~$5/month |
| Security| Hobby       | ~$5/month |
| **Total** |           | **~$15/month** |

---

## 🔧 Troubleshooting

### If a service fails to build:
1. Check Railway logs
2. Verify `Root Directory` is set correctly
3. Check environment variables are set
4. Test build locally first

### If routes return 404:
1. Check Railway deployment logs
2. Verify health endpoint works first
3. Check CORS configuration
4. Verify service URL in frontend

### If Price Oracle automation doesn't start:
1. Verify `PRICE_ORACLE_AUTOMATION_ENABLED=true`
2. Check `PRICE_ORACLE_AUTHORITY_SECRET_KEY` is set correctly
3. Check Railway logs for initialization errors

---

## ✅ Success Checklist

- [ ] All 3 services deployed to Railway
- [ ] All health endpoints return 200 OK
- [ ] Oracle automation status returns 503 (expected when not enabled)
- [ ] Security 2FA setup endpoint responds
- [ ] Frontend environment variables updated in Vercel
- [ ] Frontend can connect to all 3 services
- [ ] CORS configured correctly on all services
- [ ] Admin panel shows all 3 service tabs

---

## 🎉 Next Steps After Deployment

1. Test Core service (NFT minting, collections)
2. Enable Price Oracle automation
3. Set up 2FA in admin panel
4. Test keypair rotation
5. Monitor all services for 24 hours
6. Scale as needed!

---

**Ready to deploy to Railway!** 🚀

