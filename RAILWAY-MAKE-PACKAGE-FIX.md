# 🚂 Railway Make Package Fix

## ❌ **Current Issue:**
Railway Nixpacks is failing with: `undefined variable 'make'`

The `make` package name is not recognized in the Nix environment. We need to use `gnumake` instead.

## ✅ **What I Fixed:**

### 1. **Fixed Package Name** ✅
- Changed `make` to `gnumake` (correct Nix package name)
- Updated both `nixpacks.toml` and `nixpacks-simple.toml`
- Kept other packages: `nodejs_20`, `python3`, `gcc`, `pkg-config`

### 2. **Correct Nix Package Names** ✅
- `make` → `gnumake` (GNU Make)
- `gcc` → `gcc` (correct)
- `pkg-config` → `pkg-config` (correct)
- `nodejs_20` → `nodejs_20` (correct)
- `python3` → `python3` (correct)

---

## 🚀 **Deploy the Fix:**

### **Step 1: Commit and Push**
```bash
git add .
git commit -m "Fix: Use correct Nix package name for make

- Change 'make' to 'gnumake' in nixpacks.toml
- Change 'make' to 'gnumake' in nixpacks-simple.toml
- Fix undefined variable 'make' error in Railway
- Use correct Nix package names for build tools

This resolves: undefined variable 'make' error in Railway"
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
✓ Node.js 20 installed
✓ Python 3 installed
✓ GCC compiler installed
✓ GNU Make build tool installed
✓ pkg-config installed

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

### **Key Improvements:**
- ❌ **Before**: `undefined variable 'make'`
- ✅ **After**: `gnumake` (correct Nix package name)
- ✅ **Build Tools**: All essential tools available
- ✅ **Native Compilation**: Should work for USB package

---

## 🎯 **For analos-core-service:**

### **Current Status:**
- **Service**: analos-core-service
- **Status**: Failed (5 minutes ago)
- **Error**: `undefined variable 'make'`
- **Fix**: Deploying corrected package names

### **Next Steps:**
1. Deploy the `gnumake` fix
2. Monitor build logs
3. Test functionality once deployed
4. Apply same config to other services

---

## 🆘 **Troubleshooting:**

### **If Build Still Fails:**

#### **Check Build Logs:**
1. Go to Railway Dashboard → Service → Deployments
2. Click on the failed deployment
3. Check "Build Logs" tab
4. Look for specific error messages

#### **Common Issues & Solutions:**
- **"undefined variable"** → Check package names in nixpacks.toml
- **"package not found"** → Verify Nix package names
- **"compilation error"** → Check if gcc and gnumake are available
- **"USB error"** → May need to add libusb1 back if needed

---

## 📚 **Nix Package Names Reference:**

### **Correct Package Names:**
- `nodejs_20` - Node.js 20
- `python3` - Python 3
- `gcc` - GCC compiler
- `gnumake` - GNU Make (not `make`)
- `pkg-config` - Package configuration

### **Common Mistakes:**
- ❌ `make` → ✅ `gnumake`
- ❌ `g++` → ✅ `gcc` (includes C++)
- ❌ `npm-10_x` → ✅ Not needed (included with Node.js)

---

## 💡 **Pro Tips:**

1. **Use correct Nix names** - Check Nixpkgs documentation
2. **Test incrementally** - Fix one package at a time
3. **Monitor logs closely** - Watch for specific error messages
4. **Keep it simple** - Use minimal required packages
5. **Document what works** - Note successful configurations

---

**Deploy the gnumake fix and let's get analos-core-service working!** 🚂✨
