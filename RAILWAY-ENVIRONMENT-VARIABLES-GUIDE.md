# 🔧 Railway Environment Variables - Complete ANALOS Setup

## 📊 **Current Variables (analos-security-service)**

You already have these excellent variables:
- ✅ `ALLOWED_ORIGINS` - CORS configuration
- ✅ `ANALOS_MONITORING_SYSTEM_PROGRAM_ID` - Monitoring program
- ✅ `ANALOS_RPC_URL` - RPC endpoint
- ✅ `ANALOS_TOKEN_LOCK_ENHANCED_PROGRAM_ID` - Token lock program
- ✅ `AUTHORITY_PRIVATE_KEY` - Authority keypair
- ✅ `CORS_ORIGIN` - CORS settings
- ✅ `KEYPAIR_ENCRYPTION_KEY` - Security encryption
- ✅ `KEYPAIR_ROTATION_BACKUP_DIR` - Key rotation backup
- ✅ `KEYPAIR_ROTATION_CHECK_INTERVAL` - Rotation timing
- ✅ `KEYPAIR_ROTATION_ENABLED` - Security feature
- ✅ `NODE_ENV` - Environment
- ✅ `PORT` - Service port

---

## 🎯 **Additional Variables You Might Need**

### **1. Supabase Database Variables**
```bash
# Database connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database tables
SUPABASE_DB_URL=postgresql://user:pass@host:port/db
```

### **2. ANALOS Program IDs (Complete Set)**
```bash
# Core ANALOS Programs
ANALOS_NFT_LAUNCHPAD_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
ANALOS_PRICE_ORACLE_PROGRAM_ID=your-price-oracle-id
ANALOS_RARITY_ORACLE_PROGRAM_ID=your-rarity-oracle-id
ANALOS_TOKEN_LAUNCH_PROGRAM_ID=your-token-launch-id

# Enhanced Programs
ANALOS_AIRDROP_ENHANCED_PROGRAM_ID=your-airdrop-id
ANALOS_OTC_ENHANCED_PROGRAM_ID=your-otc-id
ANALOS_VESTING_ENHANCED_PROGRAM_ID=your-vesting-id
```

### **3. API Keys & External Services**
```bash
# IPFS/Pinata
PINATA_API_KEY=your-pinata-key
PINATA_SECRET_KEY=your-pinata-secret
NFT_STORAGE_API_KEY=your-nft-storage-key

# Analytics & Monitoring
ANALYTICS_API_KEY=your-analytics-key
MONITORING_WEBHOOK_URL=your-webhook-url
```

### **4. Security & Encryption**
```bash
# JWT & Session Management
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
ENCRYPTION_KEY=your-encryption-key

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **5. Frontend Integration**
```bash
# Frontend URLs
FRONTEND_URL=https://analosnftfrontendminimal.vercel.app
ADMIN_FRONTEND_URL=https://admin.analos.com
API_BASE_URL=https://analos-core-service-production.up.railway.app
```

### **6. Blockchain Configuration**
```bash
# Solana Network Settings
SOLANA_NETWORK=devnet  # or mainnet-beta
SOLANA_COMMITMENT=confirmed
TRANSACTION_TIMEOUT=60000
MAX_RETRIES=3

# Wallet Configuration
PLATFORM_WALLET_SECRET=[1,2,3,...]  # JSON array format
PLATFORM_WALLET_PUBLIC=your-public-key
```

### **7. Service Communication**
```bash
# Inter-service communication
ORACLE_SERVICE_URL=https://analos-oracle-production.up.railway.app
SECURITY_SERVICE_URL=https://analos-security-service-production.up.railway.app
CORE_SERVICE_URL=https://analos-core-service-production.up.railway.app

# Health check endpoints
HEALTH_CHECK_INTERVAL=30000
SERVICE_DISCOVERY_ENABLED=true
```

### **8. Feature Flags**
```bash
# Feature toggles
ENABLE_SOCIAL_VERIFICATION=true
ENABLE_PROFILE_NFTS=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_ORACLE_RARITY=true
ENABLE_BONDING_CURVES=true
```

### **9. Logging & Monitoring**
```bash
# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Performance monitoring
PERFORMANCE_MONITORING=true
METRICS_COLLECTION=true
```

### **10. Development & Testing**
```bash
# Development settings
DEBUG_MODE=false
TEST_MODE=false
MOCK_BLOCKCHAIN=false
SKIP_SIGNATURE_VERIFICATION=false

# Testing wallets
TEST_WALLET_PRIVATE_KEY=your-test-key
TEST_WALLET_PUBLIC_KEY=your-test-public
```

---

## 🎯 **Recommended Priority Order**

### **Phase 1: Essential (Add Now)**
```bash
# Database
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Core Program IDs
ANALOS_NFT_LAUNCHPAD_PROGRAM_ID=7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
ANALOS_PRICE_ORACLE_PROGRAM_ID=your-price-oracle-id

# API Keys
PINATA_API_KEY=your-pinata-key
PINATA_SECRET_KEY=your-pinata-secret
```

### **Phase 2: Security (Add Soon)**
```bash
# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
PLATFORM_WALLET_SECRET=[1,2,3,...]
```

### **Phase 3: Integration (Add Later)**
```bash
# Service URLs
FRONTEND_URL=https://analosnftfrontendminimal.vercel.app
API_BASE_URL=https://analos-core-service-production.up.railway.app
```

---

## 🚀 **How to Add Variables in Railway**

### **Method 1: Railway Dashboard**
1. Go to your service → Variables tab
2. Click "+ New Variable"
3. Add name and value
4. Click "Add"

### **Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Add variable
railway variables set SUPABASE_URL=your-value
```

### **Method 3: Environment File**
```bash
# Create .env file
echo "SUPABASE_URL=your-value" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=your-key" >> .env

# Deploy with variables
railway up
```

---

## 🔐 **Security Best Practices**

### **Sensitive Variables:**
- ✅ **Private Keys**: Always use Railway's secure storage
- ✅ **API Keys**: Never commit to git
- ✅ **Database URLs**: Use Railway's built-in database variables
- ✅ **Secrets**: Use Railway's secret management

### **Variable Naming:**
- ✅ Use UPPERCASE with underscores
- ✅ Be descriptive: `ANALOS_NFT_PROGRAM_ID` not `PROGRAM_ID`
- ✅ Group by service: `SUPABASE_*`, `ANALOS_*`, `PINATA_*`

---

## 📊 **Variable Categories**

| Category | Variables | Purpose |
|----------|-----------|---------|
| **Database** | `SUPABASE_*` | Database connection |
| **Blockchain** | `ANALOS_*_PROGRAM_ID` | Program IDs |
| **API Keys** | `PINATA_*`, `NFT_STORAGE_*` | External services |
| **Security** | `JWT_SECRET`, `ENCRYPTION_*` | Authentication |
| **Services** | `*_SERVICE_URL` | Inter-service communication |
| **Frontend** | `FRONTEND_URL`, `API_BASE_URL` | Frontend integration |

---

## 🎯 **Next Steps**

1. **Add Essential Variables** (Phase 1)
2. **Test Service Integration**
3. **Add Security Variables** (Phase 2)
4. **Test End-to-End Flow**
5. **Add Integration Variables** (Phase 3)

---

## 💡 **Pro Tips**

1. **Start Small**: Add only what you need for current features
2. **Test Each Addition**: Verify services work after adding variables
3. **Use Shared Variables**: For variables used across multiple services
4. **Document Changes**: Keep track of what each variable does
5. **Monitor Logs**: Watch for missing variable errors

---

**Which variables do you want to add first? I can help you set them up!** 🚀✨
