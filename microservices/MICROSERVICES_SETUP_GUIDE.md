# 🏗️ Analos Microservices Architecture

## ✅ Progress: Service 1 - Core (80% Complete)

### Service 1: **Analos Core NFT Launchpad** ✅
**Directory**: `microservices/analos-core/`  
**Port**: 8080  
**Status**: Structure created, server written

**Responsibilities:**
- ✅ NFT minting & collections
- ✅ Marketplace functionality
- ✅ User profiles
- ✅ IPFS uploads
- ✅ RPC proxy
- ✅ Mint tracking
- ✅ Ticker registry

**Files Created:**
- ✅ `src/core-server.ts` - Clean server without automation
- ✅ `package.json` - Updated for core service
- ✅ All source files copied from backend

**Next Steps for Core:**
1. Create `railway.json` for deployment
2. Test build locally: `npm install && npm run build`
3. Deploy to Railway

---

### Service 2: **Analos Price Oracle Automation** ⏳
**Directory**: `microservices/analos-oracle/`  
**Port**: 8081  
**Status**: NOT STARTED

**Responsibilities:**
- Automated price updates
- Multi-source price fetching (CoinGecko, Jupiter, CMC)
- Oracle management API
- Price automation configuration

**Files Needed:**
```
analos-oracle/
├── src/
│   ├── oracle-server.ts (new)
│   ├── services/
│   │   └── price-oracle-automation.ts (copy from backend)
│   └── routes/
│       └── price-oracle-automation.ts (copy from backend)
├── package.json
├── tsconfig.json
└── railway.json
```

**API Endpoints:**
- `GET /health`
- `GET /api/oracle/automation/status`
- `POST /api/oracle/automation/start`
- `POST /api/oracle/automation/stop`
- `POST /api/oracle/automation/config`

---

### Service 3: **Analos Keypair Security** ⏳
**Directory**: `microservices/analos-security/`  
**Port**: 8082  
**Status**: NOT STARTED

**Responsibilities:**
- 2FA management (Google Authenticator)
- Keypair rotation
- Security audits
- Encrypted keypair backups

**Files Needed:**
```
analos-security/
├── src/
│   ├── security-server.ts (new)
│   ├── services/
│   │   ├── keypair-rotation-service.ts (copy from backend)
│   │   └── two-factor-auth-service.ts (copy from backend)
│   └── routes/
│       └── keypair-rotation.ts (copy from backend)
├── package.json (with speakeasy, qrcode)
├── tsconfig.json
└── railway.json
```

**API Endpoints:**
- `GET /health`
- `POST /api/admin/keypair/2fa/setup`
- `POST /api/admin/keypair/2fa/verify`
- `POST /api/admin/keypair/rotate`
- `GET /api/admin/keypair/status`

---

## 🚀 Deployment Plan

### Railway Services to Create:
1. **analos-core-service** (Port 8080)
   - Connect to GitHub: `Dubie-eth/analos-nft-launcher`
   - Branch: `master`
   - Root Directory: `microservices/analos-core`

2. **analos-oracle-service** (Port 8081)
   - Same repo, branch
   - Root Directory: `microservices/analos-oracle`

3. **analos-security-service** (Port 8082)
   - Same repo, branch
   - Root Directory: `microservices/analos-security`

---

## 🔧 Environment Variables

### Core Service (analos-core)
```
PORT=8080
ANALOS_RPC_URL=https://rpc.analos.io
CORS_ORIGIN=https://analosnftfrontendminimal.vercel.app
PINATA_API_KEY=<your-key>
PINATA_SECRET_KEY=<your-secret>
```

### Oracle Service (analos-oracle)
```
PORT=8081
PRICE_ORACLE_PROGRAM_ID=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
PRICE_ORACLE_AUTOMATION_ENABLED=true
PRICE_ORACLE_CHECK_INTERVAL=60000
PRICE_ORACLE_UPDATE_THRESHOLD=1.0
PRICE_ORACLE_COOLDOWN=300000
ANALOS_RPC_URL=https://rpc.analos.io
PRICE_ORACLE_AUTHORITY_SECRET_KEY=[82,204,132,...]
```

### Security Service (analos-security)
```
PORT=8082
KEYPAIR_ROTATION_ENABLED=true
KEYPAIR_ENCRYPTION_KEY=Bm4QNucPoBlYwzD6E5FtvfIbrSyZACLHGp83g70sKqxdihROX
KEYPAIR_BACKUP_DIR=./keypair-backups
ANALOS_RPC_URL=https://rpc.analos.io
```

---

## 📝 Frontend Updates Needed

Update `frontend-minimal/src/config/backend-config.ts`:

```typescript
export const BACKEND_SERVICES = {
  CORE: process.env.NEXT_PUBLIC_CORE_URL || 'https://analos-core-service-production.up.railway.app',
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_URL || 'https://analos-oracle-service-production.up.railway.app',
  SECURITY: process.env.NEXT_PUBLIC_SECURITY_URL || 'https://analos-security-service-production.up.railway.app',
};

// Update all API calls to use correct service
export const coreAPI = createAPIClient(BACKEND_SERVICES.CORE);
export const oracleAPI = createAPIClient(BACKEND_SERVICES.ORACLE);
export const securityAPI = createAPIClient(BACKEND_SERVICES.SECURITY);
```

---

## ✅ Quick Start Commands

### Test Core Service Locally:
```bash
cd microservices/analos-core
npm install
npm run build
npm start
# Visit http://localhost:8080/health
```

### Build Oracle Service:
```bash
cd microservices/analos-oracle
npm install
npm run build
npm start
# Visit http://localhost:8081/health
```

### Build Security Service:
```bash
cd microservices/analos-security
npm install
npm run build
npm start
# Visit http://localhost:8082/health
```

---

## 🎯 Next Steps (In Order):

1. ✅ **Core service structure** (DONE)
2. **Test core build**: `cd microservices/analos-core && npm install && npm run build`
3. **Create oracle service**: Copy files, create server
4. **Create security service**: Copy files, create server
5. **Deploy all 3 to Railway**
6. **Update frontend** to use all 3 service URLs
7. **Test end-to-end** functionality

---

## 🌟 Benefits of This Architecture:

✅ **Isolated Failures** - If oracle breaks, core still works  
✅ **Independent Scaling** - Scale each service separately  
✅ **Cleaner Code** - Each service has one responsibility  
✅ **Easier Debugging** - Separate logs for each service  
✅ **Future Growth** - Easy to add new services  
✅ **Cost Efficient** - Pay only for what you use  

---

## 📊 Estimated Timeline:

- ✅ Core service: **DONE** (1 hour)
- ⏳ Oracle service: **30 minutes**
- ⏳ Security service: **30 minutes**
- ⏳ Railway deployment: **20 minutes** (all 3)
- ⏳ Frontend updates: **15 minutes**
- ⏳ Testing: **30 minutes**

**Total remaining**: ~2 hours 15 minutes

---

Ready to continue with the Oracle and Security services!

