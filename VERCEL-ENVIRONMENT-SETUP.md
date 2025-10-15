# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## 📋 **COMPLETE GUIDE TO VERCEL DEPLOYMENT**

This guide will help you configure all necessary environment variables in Vercel for secure production deployment.

---

## 🔐 **STEP 1: ACCESS VERCEL DASHBOARD**

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Sign in with your account
3. Find your project: **analos-nft-frontend-minimal**
4. Click on the project to open it

---

## ⚙️ **STEP 2: NAVIGATE TO ENVIRONMENT VARIABLES**

1. In your project dashboard, click **"Settings"** in the top menu
2. In the left sidebar, click **"Environment Variables"**
3. You'll see a form to add new variables

---

## 📝 **STEP 3: ADD ALL ENVIRONMENT VARIABLES**

### **🔹 Supabase Configuration**

#### **NEXT_PUBLIC_SUPABASE_URL**
- **Value**: `https://cdbcrfmlhwgtgngkuibk.supabase.co`
- **Environments**: Production, Preview, Development
- **Description**: Your Supabase project URL

**How to add:**
1. Click **"Add New"** or **"Add Variable"**
2. Name: `NEXT_PUBLIC_SUPABASE_URL`
3. Value: `https://cdbcrfmlhwgtgngkuibk.supabase.co`
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Value**: Get from Supabase Dashboard → Settings → API → "anon public"
- **Environments**: Production, Preview, Development
- **Description**: Supabase anonymous/public key (safe for client-side)

**How to get:**
1. Open Supabase Dashboard
2. Go to Settings → API
3. Copy the "anon public" key (starts with `eyJhbGciOiJIUzI1NiI...`)

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Value: Paste your anon key
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

#### **SUPABASE_SERVICE_ROLE_KEY**
- **Value**: Get NEW key from Supabase Dashboard (after rotation)
- **Environments**: Production, Preview, Development
- **Description**: Supabase service role key (NEVER expose to client)

**⚠️ CRITICAL: Use your NEW rotated key!**

**How to get:**
1. Follow **SUPABASE-KEY-ROTATION-GUIDE.md** to rotate your key
2. Copy the new service role key

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `SUPABASE_SERVICE_ROLE_KEY`
3. Value: Paste your NEW service role key
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

### **🔹 Database Encryption**

#### **DATABASE_ENCRYPTION_KEY**
- **Value**: `LaunchOnLos2024SecureKey32Char!` (or generate new 32-char key)
- **Environments**: Production, Preview, Development
- **Description**: Encryption key for sensitive database fields

**🔐 Security Recommendation**: Generate a new strong key

```bash
# Option 1: Use existing key
LaunchOnLos2024SecureKey32Char!

# Option 2: Generate new strong key (recommended)
# Use a password manager to generate a 32-character random string
```

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `DATABASE_ENCRYPTION_KEY`
3. Value: Your 32-character encryption key
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

### **🔹 Blockchain Configuration**

#### **NEXT_PUBLIC_RPC_URL**
- **Value**: `https://rpc.analos.io`
- **Environments**: Production, Preview, Development
- **Description**: Analos blockchain RPC endpoint

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `NEXT_PUBLIC_RPC_URL`
3. Value: `https://rpc.analos.io`
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

### **🔹 Admin Security**

#### **ADMIN_WALLETS**
- **Value**: Comma-separated list of admin wallet addresses
- **Environments**: Production, Preview, Development
- **Description**: Authorized admin wallet addresses

**Current admin wallets:**
```
86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW,89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m
```

**🔐 Security Recommendation**: Generate NEW admin wallets

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `ADMIN_WALLETS`
3. Value: Your comma-separated admin wallet addresses
4. Check: ✅ Production ✅ Preview ✅ Development
5. Click **"Save"**

---

### **🔹 Node Environment**

#### **NODE_ENV**
- **Value**: `production`
- **Environments**: Production only
- **Description**: Tells Next.js to run in production mode

**How to add:**
1. In Vercel, click **"Add New"**
2. Name: `NODE_ENV`
3. Value: `production`
4. Check: ✅ Production only
5. Click **"Save"**

---

## 📋 **COMPLETE ENVIRONMENT VARIABLES CHECKLIST**

Copy and paste these into Vercel (update values as needed):

```bash
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://cdbcrfmlhwgtgngkuibk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_NEW_supabase_service_role_key_here

# ENCRYPTION
DATABASE_ENCRYPTION_KEY=your_32_character_encryption_key_here

# BLOCKCHAIN
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io

# ADMIN
ADMIN_WALLETS=your_admin_wallet_addresses_comma_separated

# NODE
NODE_ENV=production
```

---

## 🚀 **STEP 4: REDEPLOY YOUR APPLICATION**

After adding all environment variables:

1. Go to your project's **"Deployments"** tab
2. Click the **three dots (...)** on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** for faster deployment
5. Click **"Redeploy"** to confirm

**⏱️ Deployment usually takes 2-5 minutes**

---

## ✅ **STEP 5: VERIFY DEPLOYMENT**

### **1. Check Deployment Status**

- Wait for deployment to complete
- Status should show: ✅ **Ready**
- If failed, click on deployment to view logs

### **2. Test Your Application**

1. Visit your production URL (e.g., `https://your-project.vercel.app`)
2. Open browser DevTools (F12) → Console
3. Check for any errors
4. Try these actions:
   - Connect wallet
   - View marketplace
   - Access admin dashboard (if admin)
   - Check database connection

### **3. Test Environment Variables**

Open DevTools Console and run:
```javascript
// Should return your Supabase URL
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Should return your RPC URL
console.log(process.env.NEXT_PUBLIC_RPC_URL);
```

---

## 🔍 **TROUBLESHOOTING**

### **❌ Build Failed**

**Check:**
1. All environment variables are spelled correctly (case-sensitive)
2. No extra spaces before/after values
3. All required variables are set
4. Values don't have quotes around them (Vercel adds them automatically)

**Solution:**
1. Go to Settings → Environment Variables
2. Verify each variable
3. Make corrections
4. Redeploy

---

### **❌ Application Works Locally But Not on Vercel**

**Common Causes:**
1. Missing environment variables
2. Using old Supabase keys
3. CORS issues

**Solution:**
1. Check Vercel deployment logs
2. Compare .env.local with Vercel environment variables
3. Ensure all variables match

---

### **❌ Supabase Connection Errors**

**Error**: "Invalid API key" or "Auth session missing"

**Solution:**
1. Verify SUPABASE_SERVICE_ROLE_KEY is the NEW rotated key
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Ensure URL has no trailing slash
4. Redeploy after fixing

---

### **❌ Admin Dashboard Not Working**

**Solution:**
1. Check ADMIN_WALLETS environment variable
2. Verify your wallet address is in the list
3. Clear browser cache and cookies
4. Try connecting wallet again

---

## 🔐 **SECURITY BEST PRACTICES**

### **✅ DO:**
- Use Vercel's environment variables (encrypted at rest)
- Rotate keys regularly (every 90 days)
- Use different keys for development/production
- Keep service role key private
- Use preview environments for testing

### **❌ DON'T:**
- Never commit .env files to git
- Never share service role keys
- Never expose keys in client-side code
- Never use production keys in development
- Never screenshot or email keys

---

## 📊 **ENVIRONMENT VARIABLE SUMMARY**

| Variable | Type | Required | Environments | Secret |
|----------|------|----------|--------------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Public | Yes | All | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Yes | All | No |
| SUPABASE_SERVICE_ROLE_KEY | Private | Yes | All | Yes |
| DATABASE_ENCRYPTION_KEY | Private | Yes | All | Yes |
| NEXT_PUBLIC_RPC_URL | Public | Yes | All | No |
| ADMIN_WALLETS | Private | Yes | All | Yes |
| NODE_ENV | System | Yes | Production | No |

---

## 📞 **SUPPORT**

### **Vercel Documentation**
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Deployments](https://vercel.com/docs/concepts/deployments/overview)

### **Need Help?**
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test with preview deployment first

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Rotated Supabase Service Role Key
- [ ] Added all 7 environment variables to Vercel
- [ ] Selected correct environments for each variable
- [ ] Redeployed application
- [ ] Verified deployment successful
- [ ] Tested wallet connection
- [ ] Tested database access
- [ ] Tested admin dashboard
- [ ] Checked for console errors
- [ ] Cleared browser cache

---

**Security Level**: 🔴 CRITICAL
**Estimated Time**: 15-20 minutes
**Last Updated**: $(date)

