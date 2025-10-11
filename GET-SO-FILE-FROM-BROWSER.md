# 🔧 Extract the .so File from Solana Playground (VISUAL GUIDE)

Your compiled program (`analos_nft_launchpad.so`) is stored in the browser! Here's how to get it:

---

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### 1️⃣ **Open Browser DevTools**

In the Solana Playground tab:
- Press **`F12`** (or `Ctrl + Shift + I`)
- Click the **"Application"** tab at the top
  - (If you don't see it, click the `>>` button to show more tabs)

---

### 2️⃣ **Navigate to IndexedDB**

In the left sidebar:
1. Expand **"Storage"** → **"IndexedDB"**
2. Look for a database called **"SolPG"** or **"playground"**
3. Expand it to see the object stores

---

### 3️⃣ **Find Your Compiled Program**

Look for object stores named:
- `builds`
- `programs`
- `deployments`

Click on each to browse. You're looking for:
- **Key/Name**: Your program name or ID (`2DpzahxCmfQDt87wxHagAnBDa82MeCrZAr22Lhss7NMh`)
- **Value**: Binary data (Blob or ArrayBuffer)

---

### 4️⃣ **Download the .so File**

Once you find the binary data:

**Option A** - Direct Save (if available):
- Right-click on the Blob/ArrayBuffer
- Select **"Save as..."**
- Save as: `analos_nft_launchpad.so`

**Option B** - Copy and Save via Console:

1. Click on the data entry to select it
2. Go to the **"Console"** tab
3. Paste this code to download it:

```javascript
// Find the build data
const openRequest = indexedDB.open('SolPG');
openRequest.onsuccess = () => {
  const db = openRequest.result;
  const transaction = db.transaction(['builds'], 'readonly');
  const store = transaction.objectStore('builds');
  const getRequest = store.get('analos-nft-launchpad'); // Your project name
  
  getRequest.onsuccess = () => {
    const build = getRequest.result;
    if (build && build.binary) {
      // Create download link
      const blob = new Blob([build.binary], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analos_nft_launchpad.so';
      a.click();
      URL.revokeObjectURL(url);
      console.log('Downloaded analos_nft_launchpad.so');
    } else {
      console.log('Build data:', build);
    }
  };
};
```

Press **Enter** to run. The `.so` file should download!

---

## 🎯 **ALTERNATIVE: Simpler Approach**

Since browser extraction is complex, here's what I recommend:

### **Use Anchor's Build Artifact Cache:**

Playground might have saved it. In Playground terminal, try:

```bash
pwd
ls -la
find . -name "*.so"
```

This might reveal a hidden `.so` file location!

---

## 🆘 **IF ALL ELSE FAILS**

### **Plan B: Deploy Using Program Buffer**

Solana has a feature where deployed programs are stored in "Program Buffers". Since you already deployed to Devnet, the program binary exists on-chain!

You can:
1. Download the program from Devnet
2. Redeploy it to Analos

**Command:**
```powershell
# Download from Devnet
solana program dump 2DpzahxCmfQDt87wxHagAnBDa82MeCrZAr22Lhss7NMh analos_nft_launchpad.so --url https://api.devnet.solana.com

# Then deploy to Analos
solana program deploy analos_nft_launchpad.so --url https://rpc.analos.io
```

**This is MUCH EASIER!** ✅

---

## ✅ **RECOMMENDED APPROACH:**

**Use Plan B** - Download from Devnet, then deploy to Analos!

This avoids all the browser extraction complexity.

**Ready to try? Let me know!**

