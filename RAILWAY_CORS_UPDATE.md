# 🔄 Update CORS on All Railway Services

## 📋 Service URLs Summary
- **Core Service**: `https://analos-core-service-production.up.railway.app`
- **Oracle Service**: `https://analos-nft-launcher-production-2c71.up.railway.app`
- **Security Service**: `https://analos-security-service-production.up.railway.app`
- **Frontend**: `https://loslauncher.vercel.app`

---

## 🎯 Step 1: Update Core Service CORS

Go to **Core Service** → Variables → Update `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://loslauncher.vercel.app,https://analos-nft-launcher-production-2c71.up.railway.app,https://analos-security-service-production.up.railway.app
```

**Click "Deploy" or wait for auto-redeploy**

---

## 🎯 Step 2: Update Oracle Service CORS

Go to **Oracle Service** → Variables → Update `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://loslauncher.vercel.app,https://analos-core-service-production.up.railway.app,https://analos-security-service-production.up.railway.app
```

**Click "Deploy" or wait for auto-redeploy**

---

## 🎯 Step 3: Update Security Service CORS

Go to **Security Service** → Variables → Update `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://loslauncher.vercel.app,https://analos-core-service-production.up.railway.app,https://analos-nft-launcher-production-2c71.up.railway.app
```

**Click "Deploy" or wait for auto-redeploy**

---

## ✅ What This Does

Each service can now accept requests from:
- ✅ The frontend (Vercel)
- ✅ The other two microservices (for inter-service communication)
- ✅ Itself (for internal operations)

This enables:
- 🌐 Frontend → All Services
- 🔄 Services → Services (cross-communication)
- 🔒 Security (only allowed origins can connect)

---

## 🚀 After Updating

Once all 3 services redeploy with updated CORS:
1. ✅ Frontend will be able to call all services
2. ✅ Services can call each other
3. ✅ Everything will work together!

**Let me know when all 3 services have redeployed!** 🎯

