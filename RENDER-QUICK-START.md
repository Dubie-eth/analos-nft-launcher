# ⚡ Render.com Quick Start (5 Minutes)

## 🎯 **Fastest Setup Path:**

### **1. Sign Up (1 minute)**
→ https://render.com → "Get Started" → Sign in with GitHub

### **2. New Web Service (1 minute)**
→ Dashboard → "New +" → "Web Service" → Select `analos-nft-frontend-minimal`

### **3. Configure (2 minutes)**
```
Name:          analos-nft-platform
Region:        Oregon (US West)
Branch:        master
Build Command: npm install && npm run build
Start Command: node .next/standalone/server.js
Plan:          Free
```

### **4. Environment Variables (1 minute)**

**Copy from Vercel:**
1. Open Vercel dashboard → Your project → Settings → Environment Variables
2. Click "..." → "Copy"
3. Paste into Render's environment variables section

**Required Minimum:**
```bash
NODE_ENV=production
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=[from Vercel]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Vercel]
SUPABASE_SERVICE_ROLE_KEY=[from Vercel]
PINATA_API_KEY=[from Vercel]
PINATA_SECRET_KEY=[from Vercel]
ADMIN_WALLETS=[from Vercel]
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
```

### **5. Deploy! (1 click)**
→ Click **"Create Web Service"** → Wait 3-5 min → Done! ✅

---

## 🔗 **Your Render URL:**

```
https://analos-nft-platform.onrender.com
```

Use this if Railway is down!

---

## 🎊 **That's It!**

**Total time:** ~5-10 minutes  
**Cost:** FREE (750 hours/month)  
**Maintenance:** Automatic (deploys from GitHub)

---

## 📊 **Render vs Railway:**

| Feature | Railway | Render |
|---------|---------|--------|
| **Uptime** | 🟡 ~99.5% | 🟢 ~99.9% |
| **Deploy Speed** | ⚡ 2-3 min | ⚡ 3-5 min |
| **Free Tier** | ✅ Yes | ✅ Yes (750hr) |
| **Auto-deploy** | ✅ Yes | ✅ Yes |
| **Health Checks** | ⚠️ Can fail | ✅ Reliable |
| **Logs** | ✅ Great | ✅ Great |
| **Price (paid)** | 💰 $5/mo | 💰 $7/mo |

---

## 🎯 **Quick Links:**

- **Sign up:** https://render.com
- **Docs:** https://render.com/docs
- **Status:** https://status.render.com
- **Support:** support@render.com

---

**Your `render.yaml` is ready - just commit and push, then connect Render to your repo!** 🚀

