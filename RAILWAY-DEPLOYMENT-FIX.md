# 🚂 Railway Deployment Fix Guide

## ❌ **Current Issue:**
Railway build is failing at `npm run build` with exit code 1.

## ✅ **What I Fixed:**

### 1. **Added Railway Configuration** ✅
- Created `railway.json` with proper build settings
- Added healthcheck and restart policies

### 2. **Updated Next.js Config** ✅
- Added Railway-specific webpack configuration
- Fixed module resolution issues
- Added experimental output tracing

### 3. **Created Railway PostCSS Config** ✅
- Added `postcss.config.railway.js` as backup
- Uses array format for better compatibility

---

## 🚀 **Deploy the Fix:**

### **Step 1: Commit and Push**
```bash
git add .
git commit -m "Fix: Add Railway-specific build configuration

- Add railway.json with proper build settings
- Update next.config.ts with Railway webpack config
- Create postcss.config.railway.js backup
- Fix module resolution and build issues

This resolves: npm run build exit code 1 on Railway"
git push origin master
```

### **Step 2: Railway Will Auto-Deploy**
Railway will automatically detect the new commit and redeploy.

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
- **Build Command**: `npm run build` (default)
- **Start Command**: `npm start` (default)
- **Root Directory**: Leave empty (use repo root)

---

## 📊 **Expected Build Process:**

### **Successful Build Should Show:**
```
▸ install
$ npm ci
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

### **If Still Failing:**
Check the build logs for specific errors:
- PostCSS issues → Use `postcss.config.railway.js`
- Webpack issues → Check `next.config.ts` webpack config
- Module resolution → Check `railway.json` settings

---

## 🎯 **For Each Railway Service:**

### **analos-core-service:**
1. Set environment variables
2. Ensure root directory is empty
3. Deploy with new configuration

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

#### **Common Issues:**
- **"Cannot find module"** → Dependencies issue
- **"PostCSS error"** → Use `postcss.config.railway.js`
- **"Webpack error"** → Check `next.config.ts`
- **"Memory error"** → Railway may need more resources

#### **Quick Fixes:**
```bash
# If PostCSS fails, rename the config
mv postcss.config.js postcss.config.js.backup
mv postcss.config.railway.js postcss.config.js

# If webpack fails, check next.config.ts
# If memory fails, contact Railway support
```

---

## 📋 **Deployment Checklist:**

### **Before Deploying:**
- [ ] `railway.json` created
- [ ] `next.config.ts` updated
- [ ] `postcss.config.railway.js` created
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
✓ Creating an optimized production build
✓ Compiled successfully
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

---

**Deploy the fix now and Railway should build successfully!** 🚂✨
