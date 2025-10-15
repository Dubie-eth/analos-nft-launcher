# 🔒 SECURE KEYPAIR ACCESS GUIDE

## ⚠️ CRITICAL SECURITY WARNING

**Private keys are now stored in `.secure-keypairs/` directory**

### 🛡️ SECURITY MEASURES IMPLEMENTED:

1. **✅ MOVED ALL KEYPAIRS** to secure directory
2. **✅ UPDATED .gitignore** to prevent accidental commits
3. **✅ CREATED SECURITY DOCUMENTATION**
4. **✅ IMPLEMENTED ACCESS CONTROLS**

### 🔐 ACCESSING KEYPAIRS SAFELY:

#### **For Program Initialization:**
```bash
# Copy deployer keypair to temporary location
cp .secure-keypairs/deployer-keypair.json ./temp-deployer.json

# Use for initialization
solana-keygen pubkey temp-deployer.json

# DELETE immediately after use
rm temp-deployer.json
```

#### **For Development:**
```bash
# Copy dev keypair temporarily
cp .secure-keypairs/dev-wallet.json ./temp-dev.json

# Use for testing
# ... development work ...

# DELETE immediately after use
rm temp-dev.json
```

### 🚨 SECURITY RULES:

1. **NEVER** leave keypairs in project root
2. **ALWAYS** delete temporary copies after use
3. **NEVER** commit keypair files to git
4. **ALWAYS** verify recipient before sharing
5. **ALWAYS** use secure communication channels

### 📋 KEYPAIR INVENTORY:

#### **CRITICAL KEYPAIRS:**
- `deployer-keypair.json` → `89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m`
- `rarity-oracle-keypair.json` → `C2YCPD3ZR5mWC7q1TMh2KqN43XzCsdnbPgswGsFTDr5`

#### **ORACLE KEYPAIRS:**
- `price-oracle-correct-keypair.json` → Price Oracle authority
- `price-oracle-final-keypair.json` → Price Oracle backup
- `fresh-price-oracle-keypair.json` → Price Oracle fresh

#### **PLATFORM KEYPAIRS:**
- `buyback-wallet.json` → Token buyback operations
- `platform-wallet.json` → Platform treasury
- `payer-wallet.json` → Transaction fees

#### **DEVELOPMENT KEYPAIRS:**
- `dev-wallet.json` → Development testing
- `devnet-program-keypair.json` → Devnet deployment

### 🔄 KEYPAIR ROTATION PLAN:

1. **Monthly** security audit
2. **Quarterly** keypair rotation
3. **Immediate** rotation if compromise suspected
4. **Annual** security assessment

### 🚨 EMERGENCY PROCEDURES:

If keypair compromise suspected:
1. **IMMEDIATELY** transfer all funds
2. **ROTATE** all program authorities
3. **REDEPLOY** affected programs
4. **NOTIFY** all stakeholders
5. **DOCUMENT** incident

### 📞 SECURITY CONTACTS:

- **Primary:** Admin wallet holder
- **Backup:** Trusted team member
- **Emergency:** Security team

---

**Last Security Audit:** $(Get-Date)
**Security Level:** MAXIMUM
**Next Audit Due:** $(Get-Date).AddMonths(1)
