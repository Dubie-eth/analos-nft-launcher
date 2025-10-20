# 🚂 Railway Nixpacks Package Fix

## ❌ **Current Issue:**
Railway Nixpacks is failing with: `error: undefined variable 'npm-10_x'`

The package name `npm-10_x` is invalid in Nixpacks. Node.js 20 comes with npm by default.

## ✅ **What I Fixed:**

### 1. **Fixed nixpacks.toml** ✅
- Removed invalid `npm-10_x` package
- Removed `python3Packages.pip` (not needed)
- Kept only essential packages: `nodejs_20` and `python3`

### 2. **Created Backup Configuration** ✅
- Added `nixpacks-simple.toml` as fallback
- Simplified configuration for better compatibility

### 3. **Updated Configuration** ✅
- Node.js 20 includes npm by default
- Python 3 for native package compilation
- Legacy peer deps for React compatibility

---

## 🚀 **Deploy the Fix:**

### **Step 1: Commit and Push**
```bash
git add .
git commit -m "Fix: Correct Nixpacks package names for Railway

- Fix nixpacks.toml: remove invalid npm-10_x package
- Node.js 20 includes npm by default
- Keep only essential packages: nodejs_20, python3
- Add nixpacks-simple.toml as backup configuration

This resolves: undefined variable 'npm-10_x' error in Railway"
git push origin master
```

### **Step 2: Railway Will Auto-Deploy**
Railway will automatically detect the new commit and redeploy with corrected package names.

---

## 🔧 **Railway Service Configuration:**

### **Environment Variables to Set in Railway:**

Go to each Railway service → Settings → Variables:

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Required for Solana
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io

# Optional
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### **Build Settings:**
- **Build Command**: `npm ci --legacy-peer-deps && npm run build` (from railway.json)
- **Start Command**: `npm start` (default)
- **Root Directory**: Leave empty (use repo root)

---

## 📊 **Expected Build Process:**

### **Successful Build Should Show:**
```
▸ setup
✓ Node.js 20 installed (includes npm)
✓ Python 3 installed

▸ install
$ npm ci --legacy-peer-deps
✓ Dependencies installed

▸ build  
$ npm run build
✓ Creating an optimized production build
✓ Compiled successfully
✓ Build completed

▸ deploy
$ npm start
✓ Server started on port 3000
```

### **Key Changes:**
- ❌ **Before**: `npm-10_x` (invalid package name)
- ✅ **After**: Node.js 20 (includes npm by default)
- ✅ **Python 3**: For native package compilation
- ✅ **Legacy Peer Deps**: Resolves React conflicts

---

## 🎯 **For Each Railway Service:**

### **analos-core-service:**
1. Set environment variables
2. Ensure root directory is empty
3. Deploy with corrected Nixpacks configuration

### **analos-oracle:**
1. Same process as above
2. May need different environment variables

### **Third Service:**
1. Identify the service name
2. Apply same fixes

---

## 🆘 **Troubleshooting:**

### **If Build Still Fails:**

#### **Check Build Logs:**
1. Go to Railway Dashboard → Service → Deployments
2. Click on the failed deployment
3. Check "Build Logs" tab
4. Look for specific error messages

#### **Common Issues & Solutions:**
- **"undefined variable"** → Check nixpacks.toml package names
- **"Node.js version"** → Check nixpacks.toml and .nvmrc
- **"Python not found"** → Check nixpacks.toml Python configuration
- **"Peer dependency"** → Check --legacy-peer-deps flag

#### **Quick Fixes:**
```bash
# If package name is wrong, check nixpacks.toml
# If Node.js version is wrong, check nixpacks.toml and .nvmrc
# If Python is missing, check nixpacks.toml
# If peer deps fail, check --legacy-peer-deps flag
```

---

## 📋 **Deployment Checklist:**

### **Before Deploying:**
- [ ] `nixpacks.toml` fixed with correct package names
- [ ] `.nvmrc` file created
- [ ] `package.json` updated with engines
- [ ] `railway.json` updated with build command
- [ ] Environment variables ready

### **After Deploying:**
- [ ] Build completes successfully
- [ ] Service starts without errors
- [ ] Health check passes
- [ ] API endpoints respond

---

## 🎉 **Success Indicators:**

### **Build Success:**
```
✓ Node.js 20 installed
✓ Python 3 installed
✓ Dependencies installed
✓ Build completed
```

### **Deploy Success:**
```
✓ Server started
✓ Health check passed
✓ Service is running
```

---

## 💡 **Pro Tips:**

1. **Check Railway logs** for detailed error messages
2. **Set environment variables** before deploying
3. **Use Railway's health checks** to monitor service status
4. **Keep build logs** for debugging future issues
5. **Node.js 20** includes npm by default (no need to specify)

---

## 🔍 **What This Fixes:**

### **Before (Invalid Package):**
- ❌ `npm-10_x` (undefined variable)
- ❌ Nixpacks build fails
- ❌ Service won't deploy

### **After (Correct Packages):**
- ✅ Node.js 20 (includes npm)
- ✅ Python 3 (for native compilation)
- ✅ Nixpacks build succeeds
- ✅ Service deploys successfully

---

## 📚 **Nixpacks Package Reference:**

### **Valid Node.js Packages:**
- `nodejs_18` - Node.js 18
- `nodejs_20` - Node.js 20 (includes npm)
- `nodejs` - Latest Node.js

### **Valid Python Packages:**
- `python3` - Python 3
- `python3Packages.pip` - Python pip (usually not needed)

### **Invalid Packages:**
- ❌ `npm-10_x` - Not a valid Nixpacks package
- ❌ `npm-9_x` - Not a valid Nixpacks package

---

**Deploy the fix now and Railway should build successfully with correct package names!** 🚂✨
