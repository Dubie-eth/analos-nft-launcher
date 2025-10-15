# 🔐 Security.txt Setup Guide for Analos Explorer Verification

## ✅ What I've Done

I've created `security.txt` files for **all 9 programs**:

1. ✅ analos-nft-launchpad/security.txt
2. ✅ analos-token-launch/security.txt
3. ✅ analos-rarity-oracle/security.txt
4. ✅ analos-price-oracle/security.txt
5. ✅ analos-otc-enhanced/security.txt
6. ✅ analos-airdrop-enhanced/security.txt
7. ✅ analos-vesting-enhanced/security.txt
8. ✅ analos-token-lock-enhanced/security.txt
9. ✅ analos-monitoring-system/security.txt

---

## 📝 STEP 1: Update Contact Information

You need to replace the placeholder information with your **actual contacts**.

### In EACH security.txt file, replace:

#### Current Placeholders:
```
project_url: "https://github.com/yourusername/analos-nft-launchpad"
contacts: "email:support@launchonlos.fun,twitter:@analos_io"
source_code: "https://github.com/yourusername/analos-nft-launchpad"
```

#### Replace with YOUR information:
```
project_url: "https://github.com/YOUR_GITHUB_USERNAME/analos-nft-launchpad"
contacts: "email:YOUR_EMAIL@analos.io,twitter:@YOUR_TWITTER"
source_code: "https://github.com/YOUR_GITHUB_USERNAME/analos-nft-launchpad"
```

### Contact Information Section:
Update these lines in each file:
```markdown
- **Security Issues:** YOUR_EMAIL@analos.io
- **Twitter/X:** @YOUR_TWITTER_HANDLE
- **Discord:** discord.gg/YOUR_DISCORD
- **Telegram:** t.me/YOUR_TELEGRAM
- **GitHub:** github.com/YOUR_GITHUB_USERNAME/analos-nft-launchpad
```

---

## 🔑 STEP 2: Upload Security.txt to Programs

To make your programs show as "Verified" on [Analos Explorer](https://explorer.analos.io/), you need to **upload the security.txt files on-chain**.

### Option A: Using Solana CLI (Recommended)

```bash
# For each program, run:
solana program write-buffer programs/analos-nft-launchpad/security.txt

# This will return a buffer address. Then:
solana program set-buffer-authority <BUFFER_ADDRESS> --new-buffer-authority <PROGRAM_ID>

# Then write to program:
solana program deploy --program-id <PROGRAM_ID> --buffer <BUFFER_ADDRESS>
```

### Option B: Using Anchor

Add to each program's `lib.rs` at the top:

```rust
#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Analos NFT Launchpad",
    project_url: "https://github.com/yourusername/analos-nft-launchpad",
    contacts: "email:support@launchonlos.fun,twitter:@analos_io",
    policy: "https://github.com/yourusername/analos-nft-launchpad/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/yourusername/analos-nft-launchpad",
    auditors: "None"
}
```

Then rebuild and redeploy:
```bash
anchor build
anchor deploy
```

### Option C: Using Solana Program Library

```bash
# Install SPL CLI if not installed
cargo install spl-token-cli

# Write security.txt to program
spl-token write-security-txt \
  --program-id <PROGRAM_ID> \
  --security-txt programs/analos-nft-launchpad/security.txt
```

---

## 🔧 STEP 3: Verify on Analos Explorer

After uploading, verify each program appears correctly:

1. Go to [https://explorer.analos.io/](https://explorer.analos.io/)
2. Search for each program ID:
   - `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT` (NFT Launchpad)
   - `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf` (Token Launch)
   - `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2` (Rarity Oracle)
   - `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD` (Price Oracle)
   - `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY` (OTC Enhanced)
   - `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC` (Airdrop Enhanced)
   - `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY` (Vesting Enhanced)
   - `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH` (Token Lock Enhanced)
   - `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG` (Monitoring System)

3. Check for:
   - ✅ Green "Verified" badge
   - ✅ Security contact information visible
   - ✅ GitHub link working
   - ✅ Social links working

---

## 📋 Quick Find & Replace Script

Use this script to update all files at once:

### PowerShell Script:
```powershell
# Replace these with YOUR actual values
$GITHUB_USERNAME = "yourusername"
$EMAIL = "support@launchonlos.fun"
$TWITTER = "@analos_io"
$DISCORD = "discord.gg/analos"
$TELEGRAM = "t.me/analos"

# Update all security.txt files
Get-ChildItem -Path "programs\*\security.txt" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "yourusername", $GITHUB_USERNAME
    $content = $content -replace "support@launchonlos.fun", $EMAIL
    $content = $content -replace "@analos_io", $TWITTER
    $content = $content -replace "discord.gg/analos", $DISCORD
    $content = $content -replace "t.me/analos", $TELEGRAM
    Set-Content $_.FullName $content
}

Write-Host "✅ All security.txt files updated!"
```

Save as `update-security-txt.ps1` and run:
```powershell
.\update-security-txt.ps1
```

### Bash Script (Mac/Linux):
```bash
#!/bin/bash

# Replace these with YOUR actual values
GITHUB_USERNAME="yourusername"
EMAIL="support@launchonlos.fun"
TWITTER="@analos_io"
DISCORD="discord.gg/analos"
TELEGRAM="t.me/analos"

# Update all security.txt files
find programs -name "security.txt" -type f | while read file; do
    sed -i "s/yourusername/$GITHUB_USERNAME/g" "$file"
    sed -i "s/support@launchonlos.fun/$EMAIL/g" "$file"
    sed -i "s/@analos_io/$TWITTER/g" "$file"
    sed -i "s|discord.gg/analos|$DISCORD|g" "$file"
    sed -i "s|t.me/analos|$TELEGRAM|g" "$file"
done

echo "✅ All security.txt files updated!"
```

Save as `update-security-txt.sh` and run:
```bash
chmod +x update-security-txt.sh
./update-security-txt.sh
```

---

## 🎯 What Each Program's security.txt Contains

### Common Information (All Files):
- ✅ Program name
- ✅ Project URL (GitHub)
- ✅ Contact email
- ✅ Twitter/X handle
- ✅ Discord server
- ✅ Telegram group
- ✅ Security policy link
- ✅ Source code link
- ✅ Bug bounty information
- ✅ Vulnerability reporting instructions

### Unique Per Program:
- ✅ Specific program ID
- ✅ Program-specific name
- ✅ Last updated date

---

## 📦 All Program IDs Reference

```
NFT Launchpad:      5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
Token Launch:       CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf
Rarity Oracle:      3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2
Price Oracle:       5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD
OTC Enhanced:       7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY
Airdrop Enhanced:   J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC
Vesting Enhanced:   Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY
Token Lock Enhanced: 3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH
Monitoring System:  7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG
```

---

## 🚀 Quick Verification Commands

```bash
# Check if security.txt exists for each program
ls programs/*/security.txt

# View a specific security.txt
cat programs/analos-nft-launchpad/security.txt

# Check all files have correct program IDs
grep "Program ID:" programs/*/security.txt
```

---

## ⚠️ Important Notes

### Before Uploading:
1. ✅ **Update contact information** in all files
2. ✅ **Verify GitHub URLs** are correct
3. ✅ **Test email addresses** work
4. ✅ **Verify social media handles** are correct
5. ✅ **Commit to GitHub** before referencing

### After Uploading:
1. ✅ **Check Analos Explorer** shows verified badge
2. ✅ **Click all links** to ensure they work
3. ✅ **Test contact methods** (send test email)
4. ✅ **Monitor for vulnerabilities** reported
5. ✅ **Update files** when information changes

---

## 🔒 Security Best Practices

### DO:
- ✅ Use a dedicated security email
- ✅ Monitor security inbox daily
- ✅ Respond to reports within 24 hours
- ✅ Keep contact information updated
- ✅ Have a bug bounty program
- ✅ Acknowledge security researchers

### DON'T:
- ❌ Ignore security reports
- ❌ Use personal email addresses
- ❌ Let social accounts go inactive
- ❌ Forget to update when details change
- ❌ Punish researchers for responsible disclosure

---

## 📧 Contact Template for security.txt

Here's what your actual contact info should look like:

```markdown
## Contact Information
- **Security Issues:** support@launchonlos.fun (or your domain)
- **Twitter/X:** @YourActualHandle
- **Discord:** discord.gg/YourServerCode
- **Telegram:** t.me/YourGroup
- **GitHub:** github.com/YourUsername/analos-nft-launchpad
- **Website:** https://analos.io
```

---

## 🎯 Checklist for Each Program

- [ ] Created security.txt file ✅ (Already done!)
- [ ] Updated GitHub username
- [ ] Updated email address
- [ ] Updated Twitter handle
- [ ] Updated Discord link
- [ ] Updated Telegram link
- [ ] Verified program ID is correct
- [ ] Uploaded to on-chain program
- [ ] Verified on Analos Explorer
- [ ] Tested all contact links
- [ ] Committed to GitHub

---

## 🔄 Updating Security.txt Later

If you need to update information:

1. Edit the security.txt file locally
2. Commit changes to GitHub
3. Re-upload to program using same method
4. Verify changes on Analos Explorer
5. Wait for cache refresh (may take 5-10 minutes)

---

## 💡 Why This Matters

### Benefits of security.txt:
1. ✅ **Trust Badge** - Users see verified checkmark
2. ✅ **Transparency** - Clear contact information
3. ✅ **Security** - Responsible disclosure channel
4. ✅ **Professionalism** - Shows you care about security
5. ✅ **Community** - Easier for researchers to help
6. ✅ **Compliance** - Industry best practice

### What Users See:
- Green "Verified" badge on explorer
- Your contact information
- Link to source code
- Security policy
- Ways to report issues

---

## 📞 Need Help?

If you have questions about:
- Setting up security.txt → Check Solana docs
- Uploading to programs → Use Solana CLI
- Analos Explorer → Check explorer.analos.io/docs

---

## ✅ Final Steps

1. **Update contact info** using the script above
2. **Upload to programs** using your preferred method
3. **Verify on explorer** that all 9 programs show verified
4. **Test contact methods** to ensure they work
5. **Monitor security inbox** for reports

---

**Last Updated:** October 2025  
**Status:** Security.txt files created for all 9 programs ✅  
**Next:** Update contact information and upload to chain

