# 🔒 KEYPAIR SECURITY GUIDE

## ⚠️ CRITICAL SECURITY WARNING
**NEVER commit keypair files to GitHub or share them publicly!**

## 🔑 Current Keypair Status

### Deployer Keypairs (PROGRAM AUTHORITY)
- `deployer-keypair.json` → `89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m`
- `token-launch-program-keypair.json` → `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw`
- `rarity-oracle-keypair.json` → `C2YCPD3ZR5mWC7q1TMh2KqN43XzCsdnbPgswGsFTDr5`

### Admin Wallet
- **Your Admin Wallet:** `86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`
- **Issue:** This wallet doesn't have authority to initialize the programs

## 🛠️ SOLUTION OPTIONS

### Option 1: Transfer Authority (RECOMMENDED)
1. Import the deployer keypair to your wallet
2. Use it to initialize programs
3. Transfer authority to your admin wallet after initialization

### Option 2: Update Program Authority
1. Modify program source code to use your admin wallet as authority
2. Redeploy programs (requires new program IDs)

### Option 3: Multi-Signature Setup
1. Set up multi-sig requiring both wallets to sign

## 🚀 IMMEDIATE ACTION NEEDED

1. **Import deployer keypair to your wallet:**
   ```bash
   # Copy the keypair file to a secure location
   cp deployer-keypair.json ~/.config/solana/deployer-keypair.json
   
   # Import to Phantom/Solflare wallet using the private key
   # Use: solana-keygen pubkey deployer-keypair.json to get your public key
   # Never commit the actual keypair array to git
   ```

2. **Use the deployer wallet to initialize programs**

3. **Transfer authority after initialization**

## 🔒 SECURITY CHECKLIST
- [ ] All keypair files are in .gitignore
- [ ] No keypairs committed to git
- [ ] Keypairs stored in secure location
- [ ] Authority transferred to admin wallet after initialization
- [ ] Deployer keypairs deleted after use (optional)

## 📝 NEXT STEPS
1. Import deployer keypair to your wallet
2. Initialize programs using the admin panel
3. Transfer authority to your admin wallet
4. Secure/delete deployer keypairs
