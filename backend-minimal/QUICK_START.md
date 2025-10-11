# 🚀 Quick Start - Get Running in 5 Minutes!

## ✅ **Step 1: Add Your Pinata Keys**

Open `.env` file and replace these lines with YOUR actual Pinata credentials:

```env
PINATA_API_KEY=your-actual-api-key
PINATA_SECRET_KEY=your-actual-secret-key  
PINATA_JWT=your-actual-jwt-token
```

### **Where to Find Your Pinata Keys:**

1. Go to https://app.pinata.cloud
2. Click on your profile → API Keys
3. Create new key or use existing one
4. Copy:
   - API Key
   - API Secret  
   - JWT (eyJhbG...)

---

## ✅ **Step 2: Test Locally**

```bash
# Start development server
npm run dev
```

You should see:
```
╔══════════════════════════════════════════════════╗
║  🚀 Analos NFT Launcher - Minimal Secure Backend║
╠══════════════════════════════════════════════════╣
║  Port:        3001                                ║
║  Environment: development                         ║
╚══════════════════════════════════════════════════╝
```

---

## ✅ **Step 3: Test Endpoints**

Open a new terminal and test:

```bash
# Test health
curl http://localhost:3001/health

# Test Pinata connection
curl http://localhost:3001/api/ipfs/test
```

Expected responses:
```json
// Health
{
  "status": "healthy",
  "services": { "rpc": { "healthy": true } }
}

// Pinata test
{
  "success": true,
  "message": "Pinata connection successful"
}
```

---

## ✅ **Step 4: Deploy to Railway**

Once local testing works:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

## 🔥 **Quick Troubleshooting**

### **"Pinata authentication failed"**
→ Check your `.env` file has correct keys  
→ Make sure there are no extra spaces  
→ Use JWT, not just API key

### **"Port 3001 already in use"**
→ Change PORT in `.env` to 3002 or 3003

### **"Module not found"**
→ Run `npm install` again

---

## 📞 **Need Help?**

Check `DEPLOY.md` for complete deployment guide!

---

**You're almost there!** Just add your Pinata keys and run `npm run dev`! 🎯

