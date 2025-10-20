# 🚂 Railway Node.js 20 + Python Fix

## ❌ **Current Issues:**
1. **Node.js Version**: Railway using Node.js 18.20.5, but Solana packages require Node.js 20+
2. **Missing Python**: `usb` package needs Python for native compilation
3. **Peer Dependencies**: React version conflicts with wallet adapters
4. **Engine Warnings**: Many packages expect newer Node.js versions

## ✅ **What I Fixed:**

### 1. **Added Node.js 20 Configuration** ✅
- Created `nixpacks.toml` to force Node.js 20
- Added `.nvmrc` file specifying Node.js 20
- Updated `package.json` with engine requirements

### 2. **Added Python Support** ✅
- Added Python 3 to Nixpacks configuration
- This fixes the `usb` package compilation error

### 3. **Fixed Peer Dependencies** ✅
- Added `--legacy-peer-deps` flag to npm install
- This resolves React version conflicts

### 4. **Updated Railway Configuration** ✅
- Modified `railway.json` with custom build command
- Added proper error handling

---

## 🚀 **Deploy the Fix:**

### **Step 1: Commit and Push**
```bash
git add .
git commit -m "Fix: Force Node.js 20 and add Python support for Railway

- Add nixpacks.toml to force Node.js 20 and Python 3
- Add .nvmrc file specifying Node.js 20
- Update package.json with engine requirements
- Add --legacy-peer-deps to resolve React conflicts
- Fix usb package compilation with Python support

This resolves: Node.js version compatibility and Python dependency issues"
git push origin master
```

### **Step 2: Railway Will Auto-Deploy**
Railway will automatically detect the new commit and redeploy with Node.js 20.

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
✓ Node.js 20 installed
✓ Python 3 installed
✓ npm 10.x installed

▸ install
$ npm ci --legacy-peer-deps
✓ Dependencies installed (with legacy peer deps)

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
- **Node.js**: 18.20.5 → 20.x
- **Python**: Not available → Python 3 installed
- **Peer Deps**: Strict → Legacy (resolves React conflicts)
- **USB Package**: Will compile successfully with Python

---

## 🎯 **For Each Railway Service:**

### **analos-core-service:**
1. Set environment variables
2. Ensure root directory is empty
3. Deploy with new Node.js 20 configuration

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
- **"Node.js version"** → Check nixpacks.toml and .nvmrc
- **"Python not found"** → Check nixpacks.toml Python configuration
- **"Peer dependency"** → Check --legacy-peer-deps flag
- **"USB compilation"** → Should be fixed with Python 3

#### **Quick Fixes:**
```bash
# If Node.js version is wrong, check nixpacks.toml
# If Python is missing, check nixpacks.toml
# If peer deps fail, check --legacy-peer-deps flag
# If USB fails, Python 3 should fix it
```

---

## 📋 **Deployment Checklist:**

### **Before Deploying:**
- [ ] `nixpacks.toml` created with Node.js 20
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
5. **Node.js 20** is required for modern Solana packages

---

## 🔍 **What This Fixes:**

### **Before (Node.js 18):**
- ❌ Solana packages require Node.js 20+
- ❌ USB package fails without Python
- ❌ React version conflicts
- ❌ Engine compatibility warnings

### **After (Node.js 20):**
- ✅ Solana packages compatible
- ✅ USB package compiles with Python 3
- ✅ React conflicts resolved with --legacy-peer-deps
- ✅ No engine compatibility warnings

---

**Deploy the fix now and Railway should build successfully with Node.js 20!** 🚂✨
