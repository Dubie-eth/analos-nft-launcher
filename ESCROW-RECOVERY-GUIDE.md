# 🔐 **Escrow Wallet Recovery & Security Guide**

## **Overview**

This guide covers the **escrow wallet recovery system** for the Analos NFT Launchpad, ensuring funds can be recovered in case of contract issues, CTO scenarios, or emergency situations.

---

## 🏗️ **Escrow Wallet Architecture**

### **How Escrow Wallets Are Created:**

Each collection gets a **dedicated escrow wallet** (PDA):

```rust
seeds = [b"escrow_wallet", collection_config.key().as_ref()]
```

**Key Features:**
- ✅ **Deterministic** - Same seeds = same address
- ✅ **Program-controlled** - Only program can sign
- ✅ **Collection-specific** - One per collection
- ✅ **Recoverable** - Can be derived from seeds

---

## 🔑 **Recovery Keys**

### **What Are Recovery Keys?**

While escrow wallets are **PDAs (Program Derived Addresses)** controlled by the program, we need to store:

1. **Collection Config Public Key** - To derive escrow PDA
2. **Collection Authority** - Original creator
3. **Bump Seed** - For PDA derivation

### **How to Generate Recovery Information:**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Get collection config PDA
const [collectionConfigPDA, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection"), authority.publicKey.toBuffer()],
    program.programId
);

// Get escrow wallet PDA
const [escrowWalletPDA, escrowBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_wallet"), collectionConfigPDA.toBuffer()],
    program.programId
);

// SAVE THIS INFORMATION SECURELY:
const recoveryInfo = {
    collectionName: "My Collection",
    collectionConfigPDA: collectionConfigPDA.toString(),
    collectionAuthority: authority.publicKey.toString(),
    escrowWalletPDA: escrowWalletPDA.toString(),
    configBump: configBump,
    escrowBump: escrowBump,
    programId: program.programId.toString(),
    createdAt: new Date().toISOString(),
};

console.log("=== SAVE THIS SECURELY ===");
console.log(JSON.stringify(recoveryInfo, null, 2));
```

---

## 💾 **Storing Recovery Information**

### **1. Environment Variables (.env):**

```bash
# Collection 1 Recovery Info
COLLECTION_1_NAME="Analos Apes"
COLLECTION_1_CONFIG_PDA=HMRrBeKB95uEzwtysJsEAYjeMceB4NSfLqfWGx7Un16e
COLLECTION_1_AUTHORITY=3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL
COLLECTION_1_ESCROW_PDA=FfyAJBtYyUVBDMstPVV8rRvjRe9N9edm4y8wA245ca21
COLLECTION_1_CONFIG_BUMP=254
COLLECTION_1_ESCROW_BUMP=253

# Collection 2 Recovery Info
COLLECTION_2_NAME="Analos Pandas"
COLLECTION_2_CONFIG_PDA=...
```

### **2. Encrypted JSON File:**

```json
{
  "version": "1.0.0",
  "programId": "7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk",
  "network": "analos-mainnet",
  "collections": [
    {
      "id": 1,
      "name": "Analos Apes",
      "configPDA": "HMRrBeKB95uEzwtysJsEAYjeMceB4NSfLqfWGx7Un16e",
      "authority": "3gWTQDuyYaWDRo2LWCvrzU2dCKfcL5zBQ1UWUx9J9vRL",
      "escrowPDA": "FfyAJBtYyUVBDMstPVV8rRvjRe9N9edm4y8wA245ca21",
      "configBump": 254,
      "escrowBump": 253,
      "createdAt": "2025-10-10T00:00:00.000Z"
    }
  ]
}
```

**Encrypt this file with AES-256:**
```bash
openssl enc -aes-256-cbc -salt -in recovery-keys.json -out recovery-keys.json.enc
```

### **3. AWS Secrets Manager:**

```typescript
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManager({ region: "us-east-1" });

await client.createSecret({
    Name: "analos-nft-launchpad/collection-1",
    SecretString: JSON.stringify(recoveryInfo),
});
```

### **4. Hardware Wallet (Ledger/Trezor):**

- Store encrypted recovery file on hardware wallet
- Require hardware wallet signature to decrypt

---

## 🔧 **Recovery Procedures**

### **Scenario 1: Access Escrow Wallet Balance**

```typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://rpc.analos.io");

// Derive escrow wallet PDA
const [escrowWalletPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_wallet"), collectionConfigPDA.toBuffer()],
    programId
);

// Get balance
const balance = await connection.getBalance(escrowWalletPDA);
console.log(`Escrow Balance: ${balance / 1e9} SOL`);

// Get account data
const escrowWallet = await program.account.escrowWallet.fetch(escrowWalletPDA);
console.log("Creator Funds:", escrowWallet.creatorFunds / 1e9, "SOL");
console.log("BC Reserve:", escrowWallet.bondingCurveReserve / 1e9, "SOL");
```

### **Scenario 2: Creator Withdraws Funds**

```typescript
// Creator can always withdraw their funds (if not locked)
await program.methods
    .withdrawCreatorFunds(new BN(amount))
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        creator: creator.publicKey,
        authority: authority.publicKey,
    })
    .signers([creator, authority])
    .rpc();
```

### **Scenario 3: Community Takeover (CTO)**

```typescript
// 1. Create takeover proposal
await program.methods
    .createTakeoverProposal(
        newAuthority.publicKey,
        newAuthority.publicKey,
        "Community takeover - original creator abandoned project"
    )
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        takeoverProposal: takeoverProposalPDA,
        proposer: proposer.publicKey,
        systemProgram: SystemProgram.programId,
    })
    .signers([proposer])
    .rpc();

// 2. Community votes
await program.methods
    .voteOnTakeoverProposal(proposalId, true) // true = support
    .accounts({...})
    .rpc();

// 3. If approved, new authority can access escrow
await program.methods
    .withdrawCreatorFunds(amount)
    .accounts({
        authority: newAuthority.publicKey, // Now the new authority
        ...
    })
    .signers([newAuthority])
    .rpc();
```

### **Scenario 4: Emergency Program Upgrade**

```typescript
// If program needs emergency fix, deploy new version and migrate
// New program can read old escrow wallet state

// 1. Deploy new program version
// 2. Create migration instruction
// 3. Transfer authority to new program
// 4. Migrate escrow wallet data

// Example migration:
await newProgram.methods
    .migrateEscrowWallet(oldEscrowWalletPDA)
    .accounts({
        oldEscrowWallet: oldEscrowWalletPDA,
        newEscrowWallet: newEscrowWalletPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
    })
    .signers([authority])
    .rpc();
```

---

## 🚨 **Emergency Procedures**

### **1. Creator Loses Private Key:**

**Options:**
1. **Use Multisig:** If configured, other signers can access
2. **Community Takeover:** Community votes to replace authority
3. **Contact Platform:** Platform admin can assist with recovery

**Prevention:**
- ✅ Use multisig (2-of-3 or 3-of-5)
- ✅ Store backup keys securely
- ✅ Use hardware wallets

### **2. Program Bug or Exploit:**

**Immediate Actions:**
1. **Emergency Pause:**
   ```typescript
   await program.methods
       .emergencyPause()
       .accounts({...})
       .signers([admin])
       .rpc();
   ```

2. **Transfer Funds to Safe Wallet:**
   ```typescript
   await program.methods
       .emergencyTransferAllAuthorities(safeWallet, "Bug detected")
       .accounts({...})
       .signers([admin])
       .rpc();
   ```

3. **Deploy Fix:**
   - Deploy patched program version
   - Migrate all collections
   - Resume operations

### **3. Analos Network Issues:**

**Backup RPC Endpoints:**
```typescript
const rpcs = [
    "https://rpc.analos.io",
    "https://backup-rpc.analos.io",
    "https://fallback-rpc.analos.io",
];

let connection;
for (const rpc of rpcs) {
    try {
        connection = new Connection(rpc);
        await connection.getLatestBlockhash();
        break; // Success
    } catch (error) {
        console.log(`RPC ${rpc} failed, trying next...`);
    }
}
```

---

## 🔒 **Security Best Practices**

### **1. Key Management:**
- ✅ Use **hardware wallets** for admin keys
- ✅ Enable **multisig** for all collections
- ✅ Rotate keys every **90 days**
- ✅ Store backups in **multiple locations**

### **2. Monitoring:**
- ✅ Set up **alerts** for large withdrawals
- ✅ Monitor **escrow balances** daily
- ✅ Log all **admin actions**
- ✅ Track **CTO proposals**

### **3. Recovery Drills:**
- ✅ Test recovery procedures **quarterly**
- ✅ Verify backup keys are **valid**
- ✅ Ensure team knows **emergency procedures**
- ✅ Document all **recovery scenarios**

### **4. Auditing:**
- ✅ Regular **security audits**
- ✅ Community **bug bounties**
- ✅ Transparent **incident reports**
- ✅ Public **recovery procedures**

---

## 📊 **Recovery Dashboard**

### **Monitor All Escrow Wallets:**

```typescript
// Fetch all collections
const allCollections = await program.account.collectionConfig.all();

for (const collection of allCollections) {
    const [escrowWalletPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow_wallet"), collection.publicKey.toBuffer()],
        program.programId
    );

    const escrowWallet = await program.account.escrowWallet.fetch(escrowWalletPDA);
    const balance = await connection.getBalance(escrowWalletPDA);

    console.log(`=== ${collection.account.collectionName} ===`);
    console.log(`Escrow PDA: ${escrowWalletPDA.toString()}`);
    console.log(`Total Balance: ${balance / 1e9} SOL`);
    console.log(`Creator Funds: ${escrowWallet.creatorFunds / 1e9} SOL`);
    console.log(`BC Reserve: ${escrowWallet.bondingCurveReserve / 1e9} SOL`);
    console.log(`Funds Locked: ${escrowWallet.fundsLocked}`);
    console.log(`Authority: ${escrowWallet.authority.toString()}`);
    console.log();
}
```

---

## ✅ **Checklist**

### **After Creating Each Collection:**
- [ ] Save collection config PDA
- [ ] Save escrow wallet PDA
- [ ] Save authority public key
- [ ] Save bump seeds
- [ ] Encrypt and store recovery info
- [ ] Upload to AWS Secrets Manager
- [ ] Test recovery procedure
- [ ] Document in team wiki

### **Monthly:**
- [ ] Verify all escrow balances
- [ ] Check for unauthorized withdrawals
- [ ] Review CTO proposals
- [ ] Test recovery procedures
- [ ] Rotate backup keys if needed

### **Quarterly:**
- [ ] Full security audit
- [ ] Recovery drill with team
- [ ] Update recovery procedures
- [ ] Review and update access controls

---

## 🎯 **Summary**

**Escrow Wallet Recovery System:**
1. ✅ **PDAs are deterministic** - Can always derive from seeds
2. ✅ **Store recovery info securely** - Multiple encrypted backups
3. ✅ **Community takeover support** - Built-in recovery mechanism
4. ✅ **Emergency procedures** - Pause, transfer, migrate
5. ✅ **Regular drills** - Test procedures quarterly
6. ✅ **Transparent operations** - Public audit trail

**The system is designed for maximum recoverability while maintaining security!** 🚀
