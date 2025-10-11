# 🚀 Analos NFT Launcher - Minimal Secure Backend

**Version**: 1.0.0  
**Program ID**: `7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk`

## ✨ **What This Is**

A **lightweight, secure backend** for the Analos NFT Launcher that does exactly what you need and nothing more.

### **What It Does**
- 📦 **IPFS/Pinata**: Upload NFT metadata and images
- 🔄 **RPC Proxy**: Rate-limited blockchain calls
- 👂 **Event Listener**: Watch for mints and reveals
- 🏥 **Health Check**: Monitor system status

### **What It Doesn't Do**
- ❌ No bloated services (we went from 72 → 4!)
- ❌ No redundant code
- ❌ No unnecessary dependencies
- ❌ No overcomplicated architecture

---

## 🏗️ **Quick Start**

```bash
# 1. Install
npm install

# 2. Configure
cp env.example .env
# Edit .env with your values

# 3. Run
npm run dev
```

Visit: http://localhost:3001

---

## 📊 **Project Structure**

```
backend-minimal/
├── src/
│   ├── server.ts              # Main server (50 lines)
│   ├── services/
│   │   ├── ipfs-service.ts           # IPFS/Pinata (250 lines)
│   │   ├── rpc-proxy-service.ts      # RPC proxy (200 lines)
│   │   └── event-listener-service.ts # Events (150 lines)
│   └── routes/
│       ├── health.ts          # Health checks
│       ├── ipfs.ts            # IPFS endpoints
│       ├── rpc-proxy.ts       # RPC endpoints
│       └── webhook.ts         # Webhook endpoints
├── package.json
├── tsconfig.json
└── env.example

Total: ~650 lines of clean, focused code
```

---

## 🔒 **Security Features**

- ✅ Helmet (security headers)
- ✅ CORS protection
- ✅ Rate limiting
- ✅ API key authentication
- ✅ Input validation
- ✅ File size limits
- ✅ No private keys stored

---

## 📚 **Documentation**

- **[DEPLOY.md](./DEPLOY.md)** - Complete deployment guide
- **[API Docs](./API.md)** - API endpoint documentation (coming soon)
- **[Security](./SECURITY.md)** - Security best practices (coming soon)

---

## 🚀 **Deploy**

See [DEPLOY.md](./DEPLOY.md) for complete instructions.

**Quick Railway Deploy:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## 🧪 **Testing**

```bash
# Health check
curl http://localhost:3001/health

# Test Pinata
curl http://localhost:3001/api/ipfs/test

# Upload metadata
curl -X POST http://localhost:3001/api/ipfs/upload-metadata \
  -H "Content-Type: application/json" \
  -d '{"name":"Test NFT","description":"Test","image":"https://..."}'
```

---

## 📈 **Monitoring**

```bash
# View logs
railway logs

# Check health
curl https://your-app.railway.app/health

# Get detailed status
curl https://your-app.railway.app/health/detailed
```

---

## 🤝 **Contributing**

This is a minimal backend by design. Before adding new features, ask:
1. Can the frontend do this?
2. Can the smart contract do this?
3. Is this absolutely necessary?

If yes to all three, then add it!

---

## 📝 **License**

MIT

---

## 💡 **Philosophy**

> "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."  
> — Antoine de Saint-Exupéry

This backend follows that principle. Every line serves a purpose. Every service is essential. Nothing is wasted.

---

## 🎯 **The Result**

```
Old Backend:
- 72 services
- 10,000+ lines of code
- Hard to maintain
- Slow builds
- High costs

New Backend:
- 4 services
- 650 lines of code
- Easy to maintain
- Fast builds
- Low costs ($2-3/month)
```

**That's what we call a win!** 🎊

