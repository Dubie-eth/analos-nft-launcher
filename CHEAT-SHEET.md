# ⚡ CHEAT SHEET - Do This Now!

## ✅ I Already Did:
- Added your Twitter: **@EWildn**
- Added your Telegram: **t.me/Dubie_420**
- Added security code to NFT Launchpad program
- Created all files you need

---

## 👤 YOU Do This (3 Commands):

### 1. Create Repo
Go to: **https://github.com/new**
- Name: `analos-nft-launchpad-program`  
- PUBLIC ✓
- Click "Create"

### 2. Push Code
```powershell
cd C:\Users\dusti\OneDrive\Desktop\anal404s\analos-nft-launchpad
git add .
git commit -m "Add security"
git remote add programs https://github.com/Dubie-eth/analos-nft-launchpad-program.git
git push programs main
```

### 3. Verify
```bash
cargo install solana-verify

git log -1 --format="%H"
# Copy that hash ↑

solana-verify verify-from-repo -um \
  --program-id 5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT \
  --library-name analos_nft_launchpad \
  https://github.com/Dubie-eth/analos-nft-launchpad-program \
  --commit-hash PASTE_HASH_HERE
```

### 4. Check
Go to: **https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT**

Should see: ✅ Verified badge + @EWildn

---

## ⏱️ Time: 15 minutes total

## 🤔 Questions?

**Read:** `DUBIE-SIMPLE-EXPLANATION.md`

**Or ask me!**

---

**Your info ready:** @EWildn | t.me/Dubie_420 ✅

