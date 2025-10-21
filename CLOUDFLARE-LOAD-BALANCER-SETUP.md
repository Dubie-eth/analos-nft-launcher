# 🌐 Cloudflare Load Balancer Setup Guide

## 🎯 **Troubleshooting Domain Issues**

### **Step 1: Domain Configuration Check**

#### **1.1 Verify Domain in Cloudflare**
```bash
# Check if domain is added to Cloudflare
1. Go to Cloudflare Dashboard
2. Check "Add a Site" or existing domains
3. Verify domain status: "Active" ✅
```

#### **1.2 DNS Records Configuration**
```bash
# Required DNS Records:
Type: A
Name: @
Content: 192.0.2.1 (Cloudflare IP - will be updated)
Proxy: ✅ (Orange cloud)

Type: CNAME  
Name: www
Content: your-domain.com
Proxy: ✅ (Orange cloud)
```

### **Step 2: Domain Status Verification**

#### **2.1 Check Domain Status**
- ✅ **Active**: Domain is active and working
- ❌ **Expired**: Domain needs renewal
- ❌ **Unauthorized**: Domain ownership issues
- ❌ **Restricted**: Domain in restricted state

#### **2.2 SSL/TLS Configuration**
```bash
# SSL/TLS Settings:
Encryption Mode: Full (strict)
Edge Certificates: Universal SSL enabled
Always Use HTTPS: ✅ Enabled
```

### **Step 3: Permissions Verification**

#### **3.1 Account Permissions**
```bash
# Required Permissions:
- Load Balancing: ✅ Enabled
- DNS: ✅ Enabled  
- SSL/TLS: ✅ Enabled
- Page Rules: ✅ Enabled (if needed)
```

#### **3.2 Team Permissions**
```bash
# If using Cloudflare Teams:
- Load Balancer Admin: ✅ Required
- DNS Admin: ✅ Required
- SSL/TLS Admin: ✅ Required
```

### **Step 4: Load Balancer Configuration**

#### **4.1 Create Load Balancer**
```yaml
# Load Balancer Settings:
Name: analos-frontend-lb
TTL: 30 seconds
Steering: Off
Session Affinity: None

# Origins:
Primary: https://analos-frontend-service-production.up.railway.app
Backup: https://analosnftfrontendminimal.vercel.app

# Health Checks:
Path: /
Expected Codes: 200
Interval: 30 seconds
Timeout: 5 seconds
Retries: 3
```

#### **4.2 Pool Configuration**
```yaml
# Primary Pool (Railway):
Name: railway-frontend
Origins:
  - Name: railway-primary
    Address: analos-frontend-service-production.up.railway.app
    Weight: 100
    Enabled: ✅

# Backup Pool (Vercel):
Name: vercel-backup  
Origins:
  - Name: vercel-backup
    Address: analosnftfrontendminimal.vercel.app
    Weight: 50
    Enabled: ✅
```

### **Step 5: DNS Configuration**

#### **5.1 Update DNS Records**
```bash
# After Load Balancer Creation:
Type: CNAME
Name: @
Content: your-load-balancer.railway.app
Proxy: ✅ (Orange cloud)

Type: CNAME
Name: www  
Content: your-load-balancer.railway.app
Proxy: ✅ (Orange cloud)
```

#### **5.2 Verify DNS Propagation**
```bash
# Check DNS propagation:
nslookup your-domain.com
dig your-domain.com
```

---

## 🚀 **Step-by-Step Setup Process**

### **Phase 1: Domain Preparation**
1. **Add Domain to Cloudflare**
   - Go to Cloudflare Dashboard
   - Click "Add a Site"
   - Enter your domain
   - Choose plan (Free tier works)

2. **Update Nameservers**
   - Copy Cloudflare nameservers
   - Update at your domain registrar
   - Wait for propagation (up to 24 hours)

### **Phase 2: Load Balancer Creation**
1. **Go to Traffic → Load Balancing**
2. **Create Load Balancer**
   - Name: `analos-frontend-lb`
   - Hostname: `your-domain.com`
   - TTL: 30 seconds

3. **Create Origin Pools**
   - **Primary Pool**: Railway frontend
   - **Backup Pool**: Vercel frontend

### **Phase 3: Health Checks**
1. **Configure Health Checks**
   - Path: `/`
   - Expected codes: `200`
   - Interval: `30 seconds`
   - Timeout: `5 seconds`

2. **Test Health Checks**
   - Verify Railway is healthy
   - Verify Vercel is healthy (when working)

### **Phase 4: DNS Configuration**
1. **Update DNS Records**
   - Point domain to load balancer
   - Enable proxy (orange cloud)

2. **SSL Configuration**
   - Enable Universal SSL
   - Set to "Full (strict)"

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: "Domain not found"**
```bash
# Solution:
1. Verify domain is added to Cloudflare
2. Check nameservers are updated
3. Wait for DNS propagation
4. Verify domain ownership
```

### **Issue 2: "Permission denied"**
```bash
# Solution:
1. Check account permissions
2. Verify team access
3. Contact account admin
4. Upgrade plan if needed
```

### **Issue 3: "Load balancer creation failed"**
```bash
# Solution:
1. Verify origins are accessible
2. Check health check configuration
3. Ensure proper DNS setup
4. Verify SSL certificates
```

### **Issue 4: "Health checks failing"**
```bash
# Solution:
1. Check origin URLs are correct
2. Verify origins are responding
3. Adjust health check settings
4. Check firewall/security settings
```

---

## 📊 **Expected Results**

### **After Setup:**
- ✅ **Domain**: Points to load balancer
- ✅ **Railway**: Primary origin (working)
- ✅ **Vercel**: Backup origin (when working)
- ✅ **Health Checks**: Monitoring both origins
- ✅ **Failover**: Automatic routing to healthy origin

### **Performance Benefits:**
- ✅ **Global CDN**: Cloudflare edge network
- ✅ **Automatic Failover**: If Railway fails, routes to Vercel
- ✅ **Health Monitoring**: Continuous origin monitoring
- ✅ **SSL Termination**: Secure connections

---

## 🎯 **Quick Start Commands**

### **Test Origins:**
```bash
# Test Railway
curl -I https://analos-frontend-service-production.up.railway.app

# Test Vercel (when working)
curl -I https://analosnftfrontendminimal.vercel.app
```

### **Check Load Balancer:**
```bash
# Test load balancer
curl -I https://your-domain.com

# Check health status
# Go to Cloudflare Dashboard → Load Balancing → Health
```

---

**Ready to set up the load balancer? Let me know which step you're on and I can help troubleshoot!** 🚀✨
