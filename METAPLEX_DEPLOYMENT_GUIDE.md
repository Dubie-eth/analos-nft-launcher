# 🚀 Metaplex Token Metadata Program Deployment Guide
## Deploy to Analos Blockchain via Solana Playground

---

## 📋 **Prerequisites**
- Analos wallet with sufficient LOS for deployment (~5-10 LOS recommended)
- Access to Solana Playground (https://beta.solpg.io)

---

## 🎯 **Step-by-Step Deployment Process**

### **Step 1: Open Solana Playground**
1. Go to: **https://beta.solpg.io**
2. You'll see the Solana Playground interface

### **Step 2: Import Metaplex Program from GitHub**
1. Click on the **folder icon** (Explorer) in the left sidebar
2. Click on **"Create a new project"** or use the existing one
3. In the file explorer, right-click and select **"Import from GitHub"**
4. Enter this GitHub URL:
   ```
   https://github.com/metaplex-foundation/mpl-token-metadata
   ```
5. Select the **`programs/token-metadata/program`** directory
6. Click **"Import"**

**⚠️ Alternative if GitHub import doesn't work:**
Since the program is already on your PC at:
`C:\Users\dusti\OneDrive\Desktop\LosLauncher\metaplex-standalone`

We can manually upload the files (but this will take time due to the number of files).

---

### **Step 3: Configure for Analos Network**

1. In Solana Playground, click on the **gear icon** (Settings) at the bottom left
2. Under **"Endpoint"**, select **"Custom"**
3. Enter the Analos RPC URL:
   ```
   https://analos.rpcpool.com/
   ```
4. Click **"Save"**

---

### **Step 4: Connect Your Wallet**

1. Click on the **wallet icon** at the bottom left
2. Select **"Connect Wallet"**
3. Choose your wallet (Phantom, Solflare, etc.)
4. Approve the connection

**💰 Make sure your wallet has at least 5-10 LOS for deployment fees!**

---

### **Step 5: Build the Program**

1. In the terminal at the bottom of Solana Playground, run:
   ```bash
   build
   ```
2. Wait for the build to complete (this may take 2-5 minutes)
3. You should see: **"Build successful"**

**⚠️ If you get errors:**
- Make sure all files were imported correctly
- Check that the `Cargo.toml` is present
- Try running `build` again

---

### **Step 6: Deploy to Analos**

1. After a successful build, run:
   ```bash
   deploy
   ```
2. **Approve the transaction** in your wallet when prompted
3. Wait for deployment to complete (may take 1-3 minutes)
4. You'll see output like:
   ```
   Program Id: <YOUR_PROGRAM_ID_HERE>
   ```

**🎉 SAVE THIS PROGRAM ID! You'll need it for the backend!**

Example Program ID format: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`

---

### **Step 7: Verify Deployment**

1. Copy the Program ID from the deployment output
2. Go to the Analos Explorer:
   ```
   https://explorer.analos.com/address/<YOUR_PROGRAM_ID>
   ```
3. You should see the program details

---

## 🔧 **After Deployment: Update Backend**

Once you have the Program ID, we need to update the backend code:

1. Open: `backend/src/real-nft-minting-service.ts`
2. Find the line with `TOKEN_METADATA_PROGRAM_ID`
3. Replace it with your new Program ID:
   ```typescript
   const TOKEN_METADATA_PROGRAM_ID = publicKey('YOUR_NEW_PROGRAM_ID_HERE');
   ```
4. Save the file
5. Restart the backend:
   ```bash
   cd backend
   npm start
   ```

---

## 🎨 **Test NFT Minting**

After updating the backend:

1. Go to: **https://analos-nft-launcher-9cxc.vercel.app/mint-real-nft**
2. Connect your wallet
3. Fill in NFT details
4. Click **"Mint Real NFT"**
5. Approve the transaction
6. Check the Analos Explorer for your new NFT!

---

## 🚨 **Troubleshooting**

### **Build Fails**
- Make sure all source files are present
- Check that `Cargo.toml` is correct
- Try refreshing Solana Playground and rebuilding

### **Deployment Fails**
- Check wallet balance (need 5-10 LOS)
- Make sure you're connected to Analos network
- Try deploying again (sometimes network issues occur)

### **"Program already exists" Error**
- The Program ID is already in use
- Generate a new keypair in Solana Playground:
  ```bash
  solana-keygen new -o program-keypair.json
  ```
- Try deploying again

---

## 📊 **Expected Costs**

- **Build**: Free (happens in browser)
- **Deployment**: ~2-5 LOS (depends on program size)
- **Total**: ~5-10 LOS (to be safe)

---

## ✅ **Success Checklist**

- [ ] Solana Playground opened
- [ ] Metaplex program imported
- [ ] Analos RPC configured
- [ ] Wallet connected with sufficient LOS
- [ ] Program built successfully
- [ ] Program deployed successfully
- [ ] Program ID saved
- [ ] Backend updated with new Program ID
- [ ] Backend restarted
- [ ] NFT minting tested

---

## 🎯 **Next Steps After Successful Deployment**

1. ✅ Update backend with Program ID
2. ✅ Deploy backend to Railway
3. ✅ Test NFT minting on production
4. ✅ Update frontend to use production backend
5. ✅ Deploy frontend to Vercel
6. ✅ Test full flow end-to-end

---

**🎉 Once this is done, you'll have REAL NFTs on Analos!**
