# ⚡ Quick Reference - Upgrade via Playground

## 🎯 Same Method as Last Time

---

## ✅ Pre-Flight Check

| Item | Value | Status |
|------|-------|--------|
| **Wallet** | `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q` | ✅ |
| **Balance** | 17.12 LOS | ✅ |
| **Program ID** | `BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr` | ✅ |
| **Authority** | Matches wallet | ✅ |
| **RPC** | `https://rpc.analos.io` | ✅ |

---

## 📝 5-Minute Checklist

### 1️⃣ **Open Playground**
https://beta.solpg.io

### 2️⃣ **Connect Wallet**
`4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q` (ending in ...EQ4q)

### 3️⃣ **Set RPC**
Settings → Custom → `https://rpc.analos.io`

### 4️⃣ **Copy Code**
From: `MEGA-NFT-LAUNCHPAD-CORE.rs` → To: Playground `src/lib.rs`

### 5️⃣ **Update Cargo.toml**
```toml
[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
solana-security-txt = "1.1.1"
default_env = "0.1.1"
```

### 6️⃣ **Build** 🔨
Click Build → Wait 30-60 sec

### 7️⃣ **Deploy** 🚀
Click Deploy → Approve wallet → Wait 1-2 min

### 8️⃣ **Download IDL**
Export → IDL → Save

### 9️⃣ **Update Frontend**
Copy IDL to `minimal-repo/src/idl/analos_nft_launchpad_core.json`

### 🔟 **Push & Test**
Git commit → Push → Test in admin dashboard

---

## 🚨 Critical Info

**DO use:** `4ea9k...EQ4q` (deployment wallet)  
**DON'T use:** `86oK...MhpW` (admin wallet)

**Program ID in code MUST be:**
```rust
declare_id!("BioNVjtSmBSvsVG3Yqn5VHWGDrLD56AvqYhz1LZbWhdr");
```

---

## 🎯 You're Ready!

**This is exactly how you deployed it last time.**  
**Same steps, same Playground, same wallet.**

**Ready to start? Let me know!** 🚀

