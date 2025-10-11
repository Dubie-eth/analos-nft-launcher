# 📦 How to Extract the .so File from Solana Playground

Solana Playground stores the compiled `.so` file in your browser's IndexedDB. Here's how to get it:

---

## METHOD 1: Using Browser DevTools (RECOMMENDED)

### Step 1: Open DevTools
1. In the Solana Playground tab, press **F12** (or Ctrl+Shift+I)
2. Click on the **"Application"** tab (if you don't see it, click the `>>` icon)

### Step 2: Navigate to IndexedDB
1. In the left sidebar, expand **"IndexedDB"**
2. Expand **"SolPG"** or **"solpg"**
3. Look for databases like:
   - `programs`
   - `builds`
   - `deploy`
4. Click on each one to browse the stored data

### Step 3: Find the Compiled Program
Look for an entry with:
- **Key**: Something like `2DpzahxCmfQDt87wxHagAnBDa82MeCrZAr22Lhss7NMh` (your Program ID)
- **Value**: A large object or binary data

The `.so` file data should be stored as a Blob or ArrayBuffer.

### Step 4: Download the Binary
1. Right-click on the binary data
2. Select **"Save as..."** or **"Copy"**
3. Save it as `analos_nft_launchpad.so`

---

## METHOD 2: Use Playground's Download Command (EASIER!)

Unfortunately, Playground doesn't have a direct "download .so" button, BUT we can work around this:

### Option A: Copy from Deploy Buffer

Since you already deployed to Devnet, Playground cached the .so file. Try this in the Playground terminal:

```bash
ls -la
```

This might show hidden build files.

### Option B: Rebuild and Capture

1. Clear Playground cache
2. Build again
3. Monitor browser's Network tab (F12 → Network)
4. Look for the .so file being uploaded during deployment
5. Right-click → "Save as..."

---

## METHOD 3: Build Locally (IF Your Environment Works)

Since you have the source code exported, you can try building locally:

```powershell
cd C:\Users\dusti\OneDrive\Desktop\analos-nft-launchpad-playground

# Try building
anchor build
```

**IF this works**, your `.so` file will be at:
```
target/deploy/analos_nft_launchpad.so
```

---

## 🚨 SIMPLEST WORKAROUND

Since extracting from browser is complex, here's what I recommend:

### 📝 **Just rebuild locally** from the exported source code:

The exported project has all your code. If we can get ONE successful `anchor build`, you'll have the `.so` file!

Let me help you try a clean local build with the exported files...

**Want to try this?**

