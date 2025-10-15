# 🔒 SECURITY CHECKLIST - ALWAYS FOLLOW

## ⚠️ THE 5 GOLDEN RULES - COPY THIS TO YOUR DESKTOP

### 🚨 **CRITICAL SECURITY RULES:**

1. **🚫 NEVER leave keypairs in project root**
2. **🗑️ ALWAYS delete temporary copies after use**
3. **📵 NEVER commit keypair files to git**
4. **✅ ALWAYS verify recipient before sharing**
5. **🔐 ALWAYS use secure communication channels**

---

## 📋 **DAILY SECURITY CHECKLIST**

### **Before Starting Work:**
- [ ] Run security scan: `./scripts/security-scan.ps1`
- [ ] Verify no keypairs in project root
- [ ] Check .secure-keypairs/ directory exists
- [ ] Confirm git staging is clean

### **During Development:**
- [ ] Never create keypair files in root
- [ ] Always use .secure-keypairs/ for storage
- [ ] Delete temporary files immediately
- [ ] Verify recipients before sharing

### **Before Committing:**
- [ ] Run security scan again
- [ ] Check git staging for sensitive files
- [ ] Verify no hardcoded private keys
- [ ] Run cleanup script: `./scripts/cleanup-temp.ps1`

### **After Committing:**
- [ ] Verify commit doesn't contain sensitive data
- [ ] Check git history is clean
- [ ] Update security logs
- [ ] Clean up any temporary files

---

## 🛡️ **SECURITY COMMANDS**

### **Daily Commands:**
```powershell
# Run security scan
./scripts/security-scan.ps1

# Clean up temporary files
./scripts/cleanup-temp.ps1

# Check git status
git status

# Verify secure storage
ls .secure-keypairs/
```

### **Emergency Commands:**
```powershell
# Remove all keypairs from staging
git reset HEAD *.json

# Move keypairs to secure directory
mv *.json .secure-keypairs/

# Verify gitignore
cat .gitignore | grep keypair
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **If Security Rules Violated:**
1. **STOP** all work immediately
2. **ASSESS** the damage
3. **SECURE** all affected systems
4. **ROTATE** compromised credentials
5. **NOTIFY** security team
6. **DOCUMENT** incident

### **Recovery Steps:**
1. Verify system integrity
2. Test all security measures
3. Update security protocols
4. Train team on violations
5. Implement additional safeguards

---

## 📊 **COMPLIANCE TRACKING**

### **Weekly Audit:**
- [ ] All team members following rules
- [ ] Security scans passing
- [ ] No violations in git history
- [ ] Secure storage properly maintained

### **Monthly Review:**
- [ ] Security protocols effective
- [ ] Team training completed
- [ ] Emergency procedures tested
- [ ] System integrity verified

---

## 🎯 **SUCCESS METRICS**

### **Security Goals:**
- ✅ 100% rule adherence
- ✅ Zero security incidents
- ✅ Complete team compliance
- ✅ Automated enforcement active

### **Risk Reduction:**
- ✅ 99.9% keypair protection
- ✅ Zero accidental exposures
- ✅ Complete audit trail
- ✅ Real-time monitoring

---

## 📞 **SECURITY CONTACTS**

- **Primary:** Admin wallet holder
- **Backup:** Trusted team member
- **Emergency:** Security team

---

**🔒 SECURITY IS EVERYONE'S RESPONSIBILITY**

**Print this checklist and keep it visible!**
**Run security scans before every commit!**
**Never compromise on security!**

---

**Last Updated:** $(Get-Date)
**Next Review:** $(Get-Date).AddDays(7)
**Status:** ✅ ACTIVE
