# 🚂 Railway USB Package Compilation Fix

## ❌ **Current Issue:**
Railway build is failing with: `make: cc: No such file or directory`

The `usb` package needs C compiler and build tools to compile native modules, but they're missing from the Nixpacks environment.

## ✅ **What I Fixed:**

### 1. **Added Build Tools to Nixpacks** ✅
- Added `gcc` - C compiler
- Added `g++` - C++ compiler  
- Added `make` - Build tool
- Added `pkg-config` - Package configuration
- Added `libusb1` - USB library

### 2. **Updated Both Configurations** ✅
- Updated `nixpacks.toml` with build tools
- Updated `nixpacks-simple.toml` with build tools
- Both configurations now include all necessary dependencies

### 3. **Complete Build Environment** ✅
- Node.js 20.18.1 (working)
- Python 3.12.8 (working)
- C/C++ compilers (added)
- Build tools (added)
- USB library (added)

---

## 🚀 **Deploy the Fix:**

### **Step 1: Commit and Push**
```bash
git add .
git commit -m "Fix: Add C compiler and build tools for USB package compilation

- Add gcc, g++, make, pkg-config, libusb1 to nixpacks.toml
- Add build tools to nixpacks-simple.toml backup
- Fix USB package native compilation on Railway
- Complete build environment for native modules

This resolves: make: cc: No such file or directory error
Fixes: USB package compilation with proper build tools"
git push origin master
```

### **Step 2: Railway Will Auto-Deploy**
Railway will automatically detect the new commit and redeploy with build tools.

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
✓ Node.js 20.18.1 installed
✓ Python 3.12.8 installed
✓ GCC compiler installed
✓ G++ compiler installed
✓ Make build tool installed
✓ pkg-config installed
✓ libusb1 library installed

▸ install
$ npm ci --legacy-peer-deps
✓ Dependencies installed
✓ USB package compiled successfully

▸ build  
$ npm run build
✓ Creating an optimized production build
✓ Compiled successfully
✓ Build completed

▸ deploy
$ npm start
✓ Server started on port 3000
```

### **Key Improvements:**
- ❌ **Before**: `make: cc: No such file or directory`
- ✅ **After**: Complete build environment with C compiler
- ✅ **USB Package**: Will compile successfully with build tools
- ✅ **Native Modules**: All native dependencies can compile

---

## 🎯 **For Each Railway Service:**

### **analos-core-service:**
1. Set environment variables
2. Ensure root directory is empty
3. Deploy with complete build environment

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
- **"cc: No such file or directory"** → Should be fixed with gcc
- **"make: command not found"** → Should be fixed with make
- **"pkg-config: command not found"** → Should be fixed with pkg-config
- **"libusb not found"** → Should be fixed with libusb1

#### **Quick Fixes:**
```bash
# If C compiler is missing, check gcc in nixpacks.toml
# If make is missing, check make in nixpacks.toml
# If pkg-config is missing, check pkg-config in nixpacks.toml
# If libusb is missing, check libusb1 in nixpacks.toml
```

---

## 📋 **Deployment Checklist:**

### **Before Deploying:**
- [ ] `nixpacks.toml` updated with build tools
- [ ] `nixpacks-simple.toml` updated with build tools
- [ ] `.nvmrc` file created
- [ ] `package.json` updated with engines
- [ ] `railway.json` updated with build command
- [ ] Environment variables ready

### **After Deploying:**
- [ ] Build completes successfully
- [ ] USB package compiles without errors
- [ ] Service starts without errors
- [ ] Health check passes
- [ ] API endpoints respond

---

## 🎉 **Success Indicators:**

### **Build Success:**
```
✓ Node.js 20.18.1 installed
✓ Python 3.12.8 installed
✓ GCC compiler installed
✓ Build tools installed
✓ Dependencies installed
✓ USB package compiled
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
5. **Native modules** need C compiler and build tools

---

## 🔍 **What This Fixes:**

### **Before (Missing Build Tools):**
- ❌ `make: cc: No such file or directory`
- ❌ USB package compilation fails
- ❌ Native modules can't compile
- ❌ Service won't deploy

### **After (Complete Build Environment):**
- ✅ GCC compiler available
- ✅ Make build tool available
- ✅ USB package compiles successfully
- ✅ All native modules can compile
- ✅ Service deploys successfully

---

## 📚 **Nixpacks Build Tools Reference:**

### **Essential Build Tools:**
- `gcc` - C compiler
- `g++` - C++ compiler
- `make` - Build automation tool
- `pkg-config` - Package configuration
- `libusb1` - USB library

### **Node.js Native Modules:**
- `usb` - USB device access
- `@keystonehq/sdk` - Hardware wallet SDK
- `@solana/wallet-adapter-ledger` - Ledger wallet
- `@solana/wallet-adapter-trezor` - Trezor wallet

### **Why These Tools Are Needed:**
- **C Compiler**: Compiles native C code
- **Build Tools**: Automates compilation process
- **USB Library**: Provides USB device access
- **Package Config**: Helps find libraries

---

**Deploy the fix now and Railway should build successfully with complete build environment!** 🚂✨
