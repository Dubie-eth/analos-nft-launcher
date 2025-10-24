# 🚀 Render.com Backup Deployment Setup

## ✅ **Why Render?**

- 🔄 **Backup for Railway** - Automatic failover
- 🆓 **Free tier** - 750 hours/month (enough for testing)
- ⚡ **Fast deploys** - Usually 2-3 minutes
- 🔒 **Reliable** - Better uptime than Railway historically
- 🎯 **Easy migration** - Same Next.js app, different host

---

## 📋 **Step-by-Step Setup:**

### **Step 1: Create Render Account**

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest - auto-connects repos)
4. Verify your email

---

### **Step 2: Create New Web Service**

1. **Dashboard** → Click **"New +"** → Select **"Web Service"**
2. **Connect Repository:**
   - If using GitHub signup: Select `analos-nft-frontend-minimal`
   - If manual: Connect GitHub account → Select repo
3. **Configure Service:**
   - **Name:** `analos-nft-platform`
   - **Region:** `Oregon (US West)` (free tier available)
   - **Branch:** `master`
   - **Root Directory:** Leave blank (root of repo)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node .next/standalone/server.js`
   - **Plan:** Select **"Free"** (750 hours/month)

---

### **Step 3: Configure Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

**Add these variables:**

#### **Public Variables (Frontend accessible):**
```bash
# Next.js
NODE_ENV=production
HOSTNAME=0.0.0.0

# Analos RPC
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_ANALOS_WS_URL=wss://rpc.analos.io

# Platform Info
NEXT_PUBLIC_PLATFORM_NAME=Analos NFT Launcher
NEXT_PUBLIC_PLATFORM_DESCRIPTION=Launch your NFT collection on Analos

# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Anon Key]

# Contact
NEXT_PUBLIC_SECURITY_EMAIL=security@analos.io
NEXT_PUBLIC_WEBSITE_URL=https://analos.io
NEXT_PUBLIC_TWITTER_HANDLE=AnalosIO
NEXT_PUBLIC_TELEGRAM_HANDLE=AnalosOfficial
```

#### **Secret Variables (Server-side only):**
```bash
# Supabase (Server)
SUPABASE_SERVICE_ROLE_KEY=[Your Service Role Key]

# Pinata IPFS
PINATA_API_KEY=[Your Pinata API Key]
PINATA_SECRET_KEY=[Your Pinata Secret Key]
PINATA_JWT=[Your Pinata JWT]

# Admin Access
ADMIN_WALLETS=["86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW","89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m"]

# Security
DATABASE_ENCRYPTION_KEY=[Your Encryption Key]

# Oracle (if used)
PRICE_ORACLE_PROGRAM_ID=[Your Oracle Program ID]
PRICE_ORACLE_AUTHORITY_SECRET_KEY=[Your Oracle Key]
```

**💡 Tip:** Copy values from your Vercel or Railway environment variables!

---

### **Step 4: Configure Health Check**

1. Scroll to **"Health Check Path"**
2. Enter: `/api/health-simple`
3. This ensures Render knows when your app is ready

---

### **Step 5: Deploy!**

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Build Next.js app
   - Deploy to Oregon region
   - Assign URL: `https://analos-nft-platform.onrender.com`

**Build time:** ~3-5 minutes

---

## 🎯 **Using render.yaml (Recommended)**

We created `render.yaml` in your repo. This allows **Infrastructure as Code**:

### **Benefits:**
- ✅ One-click deploy
- ✅ Environment variables in Git (non-sensitive ones)
- ✅ Easy to replicate
- ✅ Version controlled

### **How to Use:**

1. **Commit and push** `render.yaml`:
   ```bash
   git add render.yaml RENDER-SETUP-GUIDE.md
   git commit -m "Add Render deployment configuration"
   git push minimal master
   ```

2. **In Render Dashboard:**
   - Click **"New +"** → **"Blueprint"**
   - Select `analos-nft-frontend-minimal` repo
   - Render auto-detects `render.yaml`
   - Fill in secret environment variables
   - Click **"Apply"**

3. **Done!** Render creates everything from the YAML file.

---

## 🔄 **Auto-Deploy Configuration**

Render will automatically deploy when you push to GitHub:

**Triggers:**
- ✅ Push to `master` branch
- ✅ Changes in `src/**`, `public/**`, `package.json`
- ✅ Changes to `next.config.js`, `tsconfig.json`

**Skips:**
- ⏭️ Changes to `README.md`, `.md` files
- ⏭️ Changes to `scripts/**` (unless affecting build)

---

## 🌐 **Custom Domain (Optional)**

Once deployed, you can add a custom domain:

1. **Render Dashboard** → Your Service → **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `backup.analos.io` (or whatever you want)
5. Add DNS records as shown by Render
6. Wait for SSL certificate (automatic)

---

## 📊 **Monitoring & Logs**

### **View Logs:**
- **Dashboard** → Your Service → **"Logs"** tab
- Real-time logs (like Railway)
- Filter by error/warning/info

### **Metrics:**
- **Dashboard** → Your Service → **"Metrics"** tab
- CPU usage, Memory, Response times
- Free on all plans!

### **Health Status:**
- Green = Healthy
- Yellow = Degraded
- Red = Down

---

## 💰 **Pricing Breakdown**

### **Free Tier:**
- ✅ 750 hours/month (~31 days)
- ✅ 512 MB RAM
- ✅ 0.5 CPU
- ✅ Auto-sleep after 15 min inactivity
- ✅ Wakes up on request (~30s cold start)

### **Starter Tier ($7/mo):**
- ✅ Always on (no sleep)
- ✅ 1 GB RAM
- ✅ 1 CPU
- ✅ Instant response
- ✅ Better for production

**Recommendation:** Start with **Free** for backup, upgrade to **Starter** if using as primary.

---

## 🔄 **Failover Strategy**

### **Scenario: Railway Goes Down**

1. **Check Render:** Should still be running
2. **Update DNS:** Point your domain to Render URL
3. **Or:** Use Render URL directly: `https://analos-nft-platform.onrender.com`

### **Automatic Failover (Advanced):**

Use **Cloudflare** to set up automatic failover:
1. Add both Railway and Render to Cloudflare
2. Configure health checks
3. If Railway fails → Auto-switch to Render

---

## 🧪 **Testing Your Render Deployment**

Once deployed, test these endpoints:

```bash
# Health check
https://analos-nft-platform.onrender.com/api/health-simple

# Homepage
https://analos-nft-platform.onrender.com/

# Profile page
https://analos-nft-platform.onrender.com/profile

# API endpoint
https://analos-nft-platform.onrender.com/api/pricing?username=test
```

All should work exactly like your Railway deployment!

---

## 🐛 **Troubleshooting**

### **Build Fails:**
- Check **"Logs"** tab for error details
- Usually missing environment variables
- Or Node version mismatch

### **Health Check Fails:**
- Ensure `/api/health-simple` returns JSON
- Check if app is binding to `0.0.0.0` (not `localhost`)
- Verify `HOSTNAME=0.0.0.0` in env vars

### **App Won't Start:**
- Check `next.config.js` has `output: 'standalone'`
- Verify start command: `node .next/standalone/server.js`
- Check environment variables are set

### **Cold Starts (Free Tier):**
- Free tier sleeps after 15 min
- First request takes ~30s to wake up
- Upgrade to Starter ($7/mo) for always-on

---

## ✅ **Checklist:**

- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set health check path
- [ ] Deploy service
- [ ] Test endpoints
- [ ] (Optional) Add custom domain
- [ ] (Optional) Set up monitoring

---

## 🎊 **You're All Set!**

Now you have:
- ✅ **Primary:** Railway (when it works)
- ✅ **Backup:** Render (always ready)
- ✅ **Frontend:** Vercel (separate infrastructure)
- ✅ **Database:** Supabase (separate infrastructure)

**No single point of failure!** 🎯

---

## 📞 **Need Help?**

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Email: support@render.com

**Status Page:**
- https://status.render.com

---

**Date:** October 24, 2025  
**Setup Time:** ~10 minutes  
**Maintenance:** Automatic deploys from GitHub

