# 🔑 How to Get Your Private Key for Railway

**⚠️ CRITICAL SECURITY WARNING:**
- Your private key controls your wallet and all funds
- NEVER share it publicly
- NEVER commit it to GitHub
- NEVER post it in Discord/Telegram
- Only use it in secure environment variables (Railway, Vercel, etc.)

---

## 📍 Where You Deployed From

You deployed the smart contract with Program ID: `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

This means you used a wallet/keypair to sign that deployment transaction. Let's find it!

---

## 🔍 Option 1: Find Your Existing Keypair File

### Check Common Locations:

**Windows:**
```
C:\Users\YourUsername\.config\solana\id.json
C:\Users\YourUsername\.config\analos\id.json
```

**Your Project:**
```
C:\Users\dusti\OneDrive\Desktop\anal404s\[look for any *keypair*.json or *wallet*.json files]
```

### If You Find a Keypair File:

The file will look like this:
```json
[123,45,67,89,... (64 numbers total)]
```

**To convert to Base58 for Railway:**

You can use this online tool (⚠️ USE WITH CAUTION):
- https://www.site24x7.com/tools/base58-decoder.html

Or use Solana CLI:
```bash
solana-keygen pubkey path/to/keypair.json
```

**Better: Use the keypair file directly in your backend code!**

---

## 🔍 Option 2: Export from Backpack/Phantom Wallet

### From Backpack Wallet:

1. Open Backpack extension
2. Click the 3 dots menu (⋮)
3. Go to **Settings**
4. Click **Show Secret Recovery Phrase** or **Export Private Key**
5. Verify with password
6. **Copy the private key** (Base58 format)

### From Phantom Wallet:

1. Open Phantom extension
2. Click the gear icon (Settings)
3. Go to **Security & Privacy**
4. Click **Show Secret Recovery Phrase** or **Show Private Key**
5. Verify with password
6. **Copy the private key**

---

## 🔍 Option 3: Check Where You Deployed From

### Look at Your Deployment Terminal

When you deployed with this command:
```bash
solana program deploy analos_nft_launchpad.so --url https://rpc.analos.io --use-rpc
```

The Solana CLI used a wallet. Check:

```bash
# See which wallet is configured
solana config get

# This will show:
# Config File: C:\Users\...\.config\solana\cli\config.yml
# Keypair Path: [PATH TO YOUR KEYPAIR]
```

Then use that keypair file!

---

## 🔍 Option 4: Generate a NEW Admin Wallet (NOT RECOMMENDED)

**⚠️ WARNING:** If you create a new wallet, it won't have authority over your deployed contract!

Only do this if:
- The backend doesn't need to sign transactions
- You're just using it for read-only operations

```bash
solana-keygen new --outfile admin-wallet.json
```

---

## 🎯 What Format Do You Need?

### For Railway Backend:

You need the **Base58 encoded private key** or the **keypair JSON array**.

**Option A: Base58 String (Recommended)**
```
ADMIN_PRIVATE_KEY=5Jx7s8F3k2mN9pQ1... (long string)
```

**Option B: JSON Array**
```
ADMIN_PRIVATE_KEY=[123,45,67,89,... (64 numbers)]
```

Most Solana tools output Base58 format, which is easier to work with.

---

## 🔒 Security Best Practices

### ✅ DO:
- Store in environment variables only (Railway Variables tab)
- Use separate wallets for dev/staging/production
- Rotate keys regularly
- Keep backups in secure password manager
- Use hardware wallets for high-value operations

### ❌ DON'T:
- Put in code files
- Commit to GitHub
- Share in screenshots
- Post in public channels
- Email or message without encryption
- Store in plain text files

---

## 🚨 If You Can't Find Your Private Key

### Option 1: Use Authority Wallet Address Instead

For **read-only** backend operations, you might only need the **public key**:

The wallet that deployed the contract is the authority. Get its public address:
```bash
solana address --keypair path/to/keypair.json
```

Then use that as:
```
ADMIN_PUBLIC_KEY=4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q
```

### Option 2: Check Solana Config

```bash
solana config get
```

This shows which keypair is currently configured.

### Option 3: Look for program-keypair.json

Check these locations:
```
analos-nft-launchpad/target/deploy/analos_nft_launchpad-keypair.json
```

This is the **program keypair** (not your wallet), but might help identify which wallet you used.

---

## 🎯 Quick Check: What Authority Was Used?

Your deployed program has this info:

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`  
**Authority:** `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`

This `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q` is your admin wallet's **public key**.

Find the keypair file that generates this public key!

---

## 💡 For Railway Backend Specifically

### What Does The Backend Need It For?

Check your backend code to see if it actually signs transactions:

1. **Read-only operations** → Only need public key
2. **Server-side signing** → Need private key

### If You're Not Sure:

For now, you can:
1. Deploy backend WITHOUT `ADMIN_PRIVATE_KEY`
2. Frontend will handle all signing via user wallets
3. Backend just provides API endpoints

Most NFT launchpads don't require server-side signing!

---

## 🆘 Still Stuck?

### Minimal Configuration

Try deploying with just these Railway variables:
```bash
NODE_ENV=production
PORT=3001
ANALOS_RPC_URL=https://rpc.analos.io
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

And skip `ADMIN_PRIVATE_KEY` for now if you can't find it!

The frontend can handle all wallet signing through user wallets (Backpack/Phantom).

---

## 📞 Next Steps

1. Try to find your keypair file in project directories
2. Check your wallet extension for export options
3. Look at `solana config get` output
4. If all else fails, deploy without admin key and use frontend signing only

Let me know what you find and I can help configure it properly!

