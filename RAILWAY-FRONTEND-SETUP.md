# 🚀 Railway Frontend + Cloudflare Load Balancing Setup

## 🎯 **Strategy: Dual Deployment with Load Balancing**

- **Primary**: Railway Frontend (Reliable, fast builds)
- **Backup**: Vercel Frontend (When Railway has issues)
- **Load Balancer**: Cloudflare (Routes to best performing service)

---

## 📋 **Step 1: Railway Frontend Setup**

### **1.1 Create New Railway Service**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `analos-nft-frontend-minimal`
5. Name it: `analos-frontend-service`

### **1.2 Configure Railway Settings**
- **Root Directory**: Leave empty (uses root)
- **Build Command**: `npm run build` (handled by nixpacks.toml)
- **Start Command**: `npm run start` (handled by nixpacks.toml)

### **1.3 Environment Variables**
Add these to your Railway service:

```bash
# Frontend Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Backend URLs (same as Vercel)
NEXT_PUBLIC_BACKEND_URL=https://analos-core-service-production.up.railway.app
NEXT_PUBLIC_API_URL=https://analos-core-service-production.up.railway.app

# Optional: Custom domain
NEXT_PUBLIC_DOMAIN=analosnftfrontendminimal.vercel.app
```

---

## 📋 **Step 2: Cloudflare Load Balancing Setup**

### **2.1 Create Cloudflare Account**
1. Go to [Cloudflare](https://cloudflare.com)
2. Sign up/Login
3. Add your domain (e.g., `onlyanal.fun`)

### **2.2 Configure Load Balancing**
1. Go to **Traffic** → **Load Balancing**
2. Create new pool with these origins:

**Primary Pool (Railway):**
- `https://analos-frontend-service-production.up.railway.app`
- Weight: 100
- Health Check: `/`

**Backup Pool (Vercel):**
- `https://analosnftfrontendminimal.vercel.app`
- Weight: 50
- Health Check: `/`

### **2.3 Load Balancing Rules**
```yaml
# Rule 1: Route to Railway (Primary)
Condition: Always
Action: Route to Railway Pool
Weight: 100

# Rule 2: Fallback to Vercel
Condition: Railway Pool unhealthy
Action: Route to Vercel Pool
Weight: 100
```

---

## 📋 **Step 3: Domain Configuration**

### **3.1 Custom Domain Setup**
1. **Railway**: Add custom domain in Railway dashboard
2. **Vercel**: Add custom domain in Vercel dashboard
3. **Cloudflare**: Point domain to load balancer

### **3.2 DNS Configuration**
```
# Cloudflare DNS Records
Type: CNAME
Name: @
Content: your-load-balancer.railway.app

Type: CNAME  
Name: www
Content: your-load-balancer.railway.app
```

---

## 📋 **Step 4: Performance Optimization**

### **4.1 Railway Optimizations**
```toml
# nixpacks.toml optimizations
[phases.setup]
nixPkgs = ["nodejs_22", "npm-9_x"]

[phases.install]
cmds = ["npm ci --ignore-scripts"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

### **4.2 Cloudflare Optimizations**
- **Caching**: Static assets cached for 1 year
- **Compression**: Gzip/Brotli enabled
- **Minification**: HTML, CSS, JS minified
- **Image Optimization**: WebP conversion

---

## 📋 **Step 5: Monitoring & Health Checks**

### **5.1 Health Check Endpoints**
```typescript
// Add to your Next.js app
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'frontend'
  });
}
```

### **5.2 Monitoring Setup**
- **Railway**: Built-in monitoring
- **Vercel**: Built-in monitoring  
- **Cloudflare**: Analytics dashboard
- **Uptime**: External monitoring service

---

## 🎯 **Expected Results**

### **Performance Benefits:**
- ✅ **Faster Builds**: Railway's Nixpacks vs Vercel's build system
- ✅ **Better Reliability**: Dual deployment redundancy
- ✅ **Global CDN**: Cloudflare's edge network
- ✅ **Automatic Failover**: If one service fails, traffic routes to the other

### **Cost Benefits:**
- ✅ **Railway**: More predictable pricing
- ✅ **Cloudflare**: Free tier covers most use cases
- ✅ **Redundancy**: No single point of failure

---

## 🚀 **Quick Start Commands**

### **Deploy to Railway:**
```bash
# Commit Railway config
git add railway.json nixpacks.toml
git commit -m "Add Railway frontend configuration"
git push origin master

# Railway will auto-deploy
```

### **Test Both Deployments:**
```bash
# Test Railway
curl https://analos-frontend-service-production.up.railway.app

# Test Vercel  
curl https://analosnftfrontendminimal.vercel.app

# Test Load Balancer
curl https://your-domain.com
```

---

## 🔧 **Troubleshooting**

### **Railway Issues:**
- Check Railway logs in dashboard
- Verify environment variables
- Check nixpacks.toml configuration

### **Vercel Issues:**
- Check Vercel build logs
- Verify PostCSS configuration
- Check vercel.json settings

### **Cloudflare Issues:**
- Check load balancer health
- Verify DNS configuration
- Check SSL certificate status

---

## 📊 **Success Metrics**

- ✅ **Build Success Rate**: >95% on both platforms
- ✅ **Response Time**: <200ms globally
- ✅ **Uptime**: >99.9% with load balancing
- ✅ **Cost**: Optimized with dual deployment

---

**Ready to set this up? Let's start with Railway deployment!** 🚀✨
