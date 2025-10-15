# 🎯 Admin Panel Navigation Guide

## 🔍 **Finding Token Launch Section**

You're currently on the **NFT Collection Setup** page, but we need to find the **Token Launch** section.

### **Look for these sections in the admin panel:**

1. **"Program Management"** tab/section
2. **"Token Launch"** tab/section  
3. **"Initialize Programs"** section
4. **"Program Initialization"** menu

### **Alternative: Check the sidebar/navigation**

Look for:
- Program Status
- Oracle Programs
- Token Programs
- System Administration
- Program Controls

---

## 🔐 **Wallet Issue**

You mentioned you don't have access to the wallet. We need the **deployer wallet**:

**Required Wallet:** `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`

### **Options:**

**Option 1: Import the deployer wallet**
- You should have the keypair file: `deployer-keypair.json`
- Import it into your wallet (Phantom, Solflare, etc.)

**Option 2: Use a different admin wallet**
- If you have another wallet with admin privileges
- Make sure it has the authority to initialize programs

**Option 3: Check if there's a different admin interface**
- Maybe there's a separate admin login
- Or a different wallet connection method

---

## 🔍 **What to Look For**

In the admin panel, find:

### **Token Launch Section Should Show:**
```
Program ID: Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw
Status: Deployed ✅ | Not Initialized ⏳
Authority: 4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q
```

### **Initialization Form Should Have:**
- Token Name field
- Token Symbol field  
- Total Supply field
- Initial Price field
- Bonding Target field
- Creator Prebuy % field
- Metadata URI field

---

## 🚨 **Troubleshooting**

### **If you can't find Token Launch section:**

1. **Refresh the page** - Maybe the new program IDs haven't loaded
2. **Check different tabs** - Look for "Programs", "System", "Admin"
3. **Look for "Oracle" sections** - Token Launch might be grouped with oracles
4. **Check if there's a search function** - Search for "Token Launch" or "Eydws6Tz..."

### **If you can't access the right wallet:**

1. **Check your wallet files** - Look for `deployer-keypair.json`
2. **Import the keypair** - Add it to your wallet app
3. **Try a different wallet** - If you have admin access with another wallet

---

## 💡 **Alternative Approach**

If you can't find the Token Launch section, we can:

1. **Initialize via CLI** (if you have the deployer keypair)
2. **Check if the program needs to be added to the admin panel**
3. **Look for a different admin interface**

---

## ❓ **Questions for You**

1. **Can you see any other sections/tabs** in the admin panel besides NFT Collection?
2. **Do you have the `deployer-keypair.json` file** in your project?
3. **Are you connected with the right wallet** that has admin privileges?
4. **Is there a different admin interface** or login page?

Let me know what you see and we'll figure out the right path! 🚀
