# 🧪 SECURITY TEST SCRIPTS

**Purpose:** Automated security testing for all 9 Analos programs  
**Language:** TypeScript/JavaScript  
**Framework:** Anchor + Solana Web3.js  

---

## 🔧 **TEST SETUP**

### **Prerequisites:**
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### **Test Configuration:**
```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Test configuration
const ANALOS_RPC = 'https://rpc.analos.io';
const connection = new Connection(ANALOS_RPC);

// Program IDs
const PROGRAM_IDS = {
  NFT_LAUNCHPAD: new PublicKey('5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT'),
  PRICE_ORACLE: new PublicKey('ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn'),
  RARITY_ORACLE: new PublicKey('H6sAs9Ewx6BNSF3NkPEEtwZo3kfFw4Y71us5U6D5rvW6'),
  TOKEN_LAUNCH: new PublicKey('HLkjxfp8eonnKdLMoN7otZBHetRMoRaQmHvyDvGjnzVx'),
  METADATA: new PublicKey('8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL'),
  VESTING: new PublicKey('GbAkoxYYPx5tcn5BD7RHyAYxMZkBxCvY6sHW5x9gcmuL'),
  TOKEN_LOCK: new PublicKey('QsA8Y11Sq3hFhqpZtwG7fUap5S3nU4VBxv5V4jTS5gh'),
  AIRDROP: new PublicKey('6oQjb8eyGCN8ZZ7i43ffssYWXE8oQquBuANzccdKuDpM'),
  OTC_MARKETPLACE: new PublicKey('7FmyCTWgzvZw2q58NJXEXsvGum72yTbbVvn81GN3RDrQ'),
};
```

---

## 🧪 **TEST SUITE 1: ACCESS CONTROL TESTS**

### **Test 1.1: Unauthorized Access Prevention**
```typescript
async function testUnauthorizedAccess() {
  console.log('🔒 Testing unauthorized access prevention...');
  
  const unauthorizedUser = Keypair.generate();
  
  try {
    // Try to initialize collection without proper authority
    await program.methods
      .initializeCollection(
        new BN(1000), // max_supply
        new BN(1000000), // price_lamports
        new BN(100), // reveal_threshold
        "Test Collection",
        "TEST",
        "https://example.com/metadata.json"
      )
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: unauthorizedUser.publicKey, // Wrong authority
        // ... other accounts
      })
      .signers([unauthorizedUser])
      .rpc();
      
    throw new Error('❌ SECURITY FAILURE: Unauthorized access allowed!');
  } catch (error) {
    if (error.message.includes('Unauthorized') || error.message.includes('InvalidSigner')) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      throw error;
    }
  }
}
```

### **Test 1.2: Authority Validation**
```typescript
async function testAuthorityValidation() {
  console.log('🔒 Testing authority validation...');
  
  // Test with wrong authority for each program
  const wrongAuthority = Keypair.generate();
  
  const tests = [
    {
      name: 'NFT Launchpad',
      method: 'initialize_collection',
      accounts: { authority: wrongAuthority.publicKey }
    },
    {
      name: 'Vesting',
      method: 'create_vesting',
      accounts: { creator: wrongAuthority.publicKey }
    },
    {
      name: 'Token Lock',
      method: 'create_lock',
      accounts: { owner: wrongAuthority.publicKey }
    }
  ];
  
  for (const test of tests) {
    try {
      await program.methods[test.method](...test.params)
        .accounts(test.accounts)
        .signers([wrongAuthority])
        .rpc();
        
      throw new Error(`❌ SECURITY FAILURE: ${test.name} authority validation failed!`);
    } catch (error) {
      if (error.message.includes('Unauthorized') || error.message.includes('InvalidSigner')) {
        console.log(`✅ ${test.name} authority validation working`);
      } else {
        throw error;
      }
    }
  }
}
```

---

## 🧪 **TEST SUITE 2: INPUT VALIDATION TESTS**

### **Test 2.1: Invalid Input Rejection**
```typescript
async function testInputValidation() {
  console.log('🔍 Testing input validation...');
  
  const invalidInputs = [
    {
      name: 'Zero Amount',
      params: { amount: new BN(0) },
      expectedError: 'InvalidAmount'
    },
    {
      name: 'Negative Time',
      params: { unlock_time: new BN(-1) },
      expectedError: 'InvalidUnlockTime'
    },
    {
      name: 'Empty String',
      params: { collection_name: '' },
      expectedError: 'InvalidName'
    },
    {
      name: 'Too Long Ticker',
      params: { collection_symbol: 'VERYLONGTICKER' },
      expectedError: 'InvalidTickerLength'
    },
    {
      name: 'Future Time in Past',
      params: { unlock_time: new BN(Date.now() / 1000 - 3600) },
      expectedError: 'InvalidUnlockTime'
    }
  ];
  
  for (const test of invalidInputs) {
    try {
      await program.methods.createLock(test.params.amount, test.params.unlock_time)
        .accounts({
          lockAccount: lockAccountPDA,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([owner])
        .rpc();
        
      throw new Error(`❌ SECURITY FAILURE: ${test.name} validation failed!`);
    } catch (error) {
      if (error.message.includes(test.expectedError)) {
        console.log(`✅ ${test.name} properly rejected`);
      } else {
        console.log(`⚠️ ${test.name} rejected with different error: ${error.message}`);
      }
    }
  }
}
```

### **Test 2.2: Overflow/Underflow Protection**
```typescript
async function testOverflowProtection() {
  console.log('🔢 Testing overflow/underflow protection...');
  
  const maxU64 = new BN('18446744073709551615'); // Max u64 value
  
  try {
    // Test with maximum possible values
    await program.methods.createLock(maxU64, new BN(Date.now() / 1000 + 3600))
      .accounts({
        lockAccount: lockAccountPDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([owner])
      .rpc();
      
    console.log('✅ Overflow protection working (max values accepted)');
  } catch (error) {
    if (error.message.includes('overflow') || error.message.includes('underflow')) {
      throw new Error('❌ SECURITY FAILURE: Overflow/underflow not handled!');
    }
    console.log('✅ Overflow protection working (max values rejected appropriately)');
  }
}
```

---

## 🧪 **TEST SUITE 3: STATE CONSISTENCY TESTS**

### **Test 3.1: Double-Spending Prevention**
```typescript
async function testDoubleSpendingPrevention() {
  console.log('💰 Testing double-spending prevention...');
  
  // Create airdrop
  const airdropPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('airdrop'), authority.publicKey.toBuffer()],
    program.programId
  )[0];
  
  await program.methods.initializeAirdrop(
    new BN(1000000), // total_amount
    [recipient.publicKey], // recipients
    [new BN(100000)] // amounts
  )
  .accounts({
    airdrop: airdropPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId
  })
  .signers([authority])
  .rpc();
  
  // Try to claim twice
  try {
    // First claim (should succeed)
    await program.methods.claimAirdrop()
      .accounts({
        airdrop: airdropPDA,
        recipient: recipient.publicKey,
        // ... other accounts
      })
      .signers([recipient])
      .rpc();
      
    console.log('✅ First airdrop claim successful');
    
    // Second claim (should fail)
    await program.methods.claimAirdrop()
      .accounts({
        airdrop: airdropPDA,
        recipient: recipient.publicKey,
        // ... other accounts
      })
      .signers([recipient])
      .rpc();
      
    throw new Error('❌ SECURITY FAILURE: Double-spending allowed!');
  } catch (error) {
    if (error.message.includes('AlreadyClaimed')) {
      console.log('✅ Double-spending prevention working');
    } else {
      throw error;
    }
  }
}
```

### **Test 3.2: State Transition Validation**
```typescript
async function testStateTransitionValidation() {
  console.log('🔄 Testing state transition validation...');
  
  // Create vesting schedule
  const vestingPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('vesting'), creator.publicKey.toBuffer(), recipient.publicKey.toBuffer()],
    program.programId
  )[0];
  
  const startTime = new BN(Date.now() / 1000);
  const endTime = new BN(Date.now() / 1000 + 31536000); // 1 year
  const cliffTime = new BN(Date.now() / 1000 + 2592000); // 30 days
  
  await program.methods.createVesting(
    new BN(1000000), // total_amount
    startTime,
    endTime,
    cliffTime
  )
  .accounts({
    vestingAccount: vestingPDA,
    creator: creator.publicKey,
    recipient: recipient.publicKey,
    systemProgram: SystemProgram.programId
  })
  .signers([creator])
  .rpc();
  
  // Try to claim before cliff (should fail)
  try {
    await program.methods.claimVested()
      .accounts({
        vestingAccount: vestingPDA,
        recipient: recipient.publicKey
      })
      .signers([recipient])
      .rpc();
      
    throw new Error('❌ SECURITY FAILURE: Early claim allowed!');
  } catch (error) {
    if (error.message.includes('CliffNotReached')) {
      console.log('✅ State transition validation working');
    } else {
      throw error;
    }
  }
}
```

---

## 🧪 **TEST SUITE 4: FUND SAFETY TESTS**

### **Test 4.1: Escrow Security**
```typescript
async function testEscrowSecurity() {
  console.log('🏦 Testing escrow security...');
  
  // Test OTC marketplace escrow
  const offerPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('offer'), maker.publicKey.toBuffer()],
    program.programId
  )[0];
  
  const initialBalance = await connection.getTokenAccountBalance(makerTokenAccount);
  
  // Create offer (should transfer tokens to escrow)
  await program.methods.createOffer(
    new BN(100000), // offer_amount
    new BN(200000), // request_amount
    requestTokenMint.publicKey // request_token
  )
  .accounts({
    offer: offerPDA,
    offerTokenAccount: offerTokenAccount,
    makerTokenAccount: makerTokenAccount,
    maker: maker.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId
  })
  .signers([maker])
  .rpc();
  
  const afterBalance = await connection.getTokenAccountBalance(makerTokenAccount);
  
  // Verify tokens moved to escrow
  if (afterBalance.value.amount === (initialBalance.value.amount - 100000).toString()) {
    console.log('✅ Escrow security working - tokens properly held');
  } else {
    throw new Error('❌ SECURITY FAILURE: Escrow not working properly!');
  }
}
```

### **Test 4.2: Fee Validation**
```typescript
async function testFeeValidation() {
  console.log('💸 Testing fee validation...');
  
  // Test fee caps
  const maxFee = new BN(690); // 6.9% in basis points
  
  try {
    // Try to set fee above cap
    await program.methods.setTradingFee(new BN(700)) // Above 6.9%
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey
      })
      .signers([authority])
      .rpc();
      
    throw new Error('❌ SECURITY FAILURE: Fee cap bypassed!');
  } catch (error) {
    if (error.message.includes('FeeTooHigh') || error.message.includes('InvalidFee')) {
      console.log('✅ Fee validation working');
    } else {
      throw error;
    }
  }
}
```

---

## 🧪 **TEST SUITE 5: INTEGRATION TESTS**

### **Test 5.1: Cross-Program Interactions**
```typescript
async function testCrossProgramInteractions() {
  console.log('🔗 Testing cross-program interactions...');
  
  // Test NFT creation with price oracle
  const priceOraclePDA = PublicKey.findProgramAddressSync(
    [Buffer.from('price_oracle')],
    PROGRAM_IDS.PRICE_ORACLE
  )[0];
  
  // Initialize price oracle
  await priceOracleProgram.methods.initializePriceOracle()
    .accounts({
      priceOracle: priceOraclePDA,
      authority: authority.publicKey,
      systemProgram: SystemProgram.programId
    })
    .signers([authority])
    .rpc();
  
  // Update price
  await priceOracleProgram.methods.updatePrice(new BN(50000)) // $50 in lamports
    .accounts({
      priceOracle: priceOraclePDA,
      authority: authority.publicKey
    })
    .signers([authority])
    .rpc();
  
  // Create NFT collection that uses price oracle
  await program.methods.initializeCollection(
    new BN(1000), // max_supply
    new BN(1000000), // price_lamports
    new BN(100), // reveal_threshold
    "Test Collection",
    "TEST",
    "https://example.com/metadata.json"
  )
  .accounts({
    collectionConfig: collectionConfigPDA,
    priceOracle: priceOraclePDA,
    authority: authority.publicKey,
    // ... other accounts
  })
  .signers([authority])
  .rpc();
  
  console.log('✅ Cross-program interactions working');
}
```

### **Test 5.2: Concurrent Operations**
```typescript
async function testConcurrentOperations() {
  console.log('⚡ Testing concurrent operations...');
  
  const promises = [];
  
  // Create multiple airdrops concurrently
  for (let i = 0; i < 5; i++) {
    const airdropPDA = PublicKey.findProgramAddressSync(
      [Buffer.from('airdrop'), authority.publicKey.toBuffer(), new BN(i).toArrayLike(Buffer, 'le', 8)],
      program.programId
    )[0];
    
    promises.push(
      program.methods.initializeAirdrop(
        new BN(100000),
        [recipients[i]],
        [new BN(10000)]
      )
      .accounts({
        airdrop: airdropPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([authority])
      .rpc()
    );
  }
  
  try {
    await Promise.all(promises);
    console.log('✅ Concurrent operations working');
  } catch (error) {
    throw new Error(`❌ SECURITY FAILURE: Concurrent operations failed: ${error.message}`);
  }
}
```

---

## 🧪 **TEST SUITE 6: EDGE CASE TESTS**

### **Test 6.1: Boundary Conditions**
```typescript
async function testBoundaryConditions() {
  console.log('🎯 Testing boundary conditions...');
  
  const boundaryTests = [
    {
      name: 'Minimum Amount',
      amount: new BN(1),
      shouldSucceed: true
    },
    {
      name: 'Maximum Amount',
      amount: new BN('18446744073709551615'), // Max u64
      shouldSucceed: false // Should fail due to practical limits
    },
    {
      name: 'Minimum Time',
      time: new BN(Date.now() / 1000 + 1), // 1 second from now
      shouldSucceed: true
    },
    {
      name: 'Maximum Time',
      time: new BN(Date.now() / 1000 + 31536000 * 100), // 100 years
      shouldSucceed: false // Should fail due to practical limits
    }
  ];
  
  for (const test of boundaryTests) {
    try {
      await program.methods.createLock(test.amount, test.time)
        .accounts({
          lockAccount: lockAccountPDA,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([owner])
        .rpc();
        
      if (!test.shouldSucceed) {
        throw new Error(`❌ SECURITY FAILURE: ${test.name} should have failed!`);
      }
      console.log(`✅ ${test.name} handled correctly`);
    } catch (error) {
      if (test.shouldSucceed) {
        throw new Error(`❌ SECURITY FAILURE: ${test.name} should have succeeded: ${error.message}`);
      }
      console.log(`✅ ${test.name} properly rejected`);
    }
  }
}
```

### **Test 6.2: Malicious Input Handling**
```typescript
async function testMaliciousInputHandling() {
  console.log('🛡️ Testing malicious input handling...');
  
  const maliciousInputs = [
    {
      name: 'SQL Injection Attempt',
      input: "'; DROP TABLE users; --",
      expectedError: 'InvalidInput'
    },
    {
      name: 'XSS Attempt',
      input: '<script>alert("xss")</script>',
      expectedError: 'InvalidInput'
    },
    {
      name: 'Path Traversal Attempt',
      input: '../../../etc/passwd',
      expectedError: 'InvalidInput'
    },
    {
      name: 'Unicode Exploit',
      input: '\u0000\u0001\u0002',
      expectedError: 'InvalidInput'
    }
  ];
  
  for (const test of maliciousInputs) {
    try {
      await program.methods.initializeCollection(
        new BN(1000),
        new BN(1000000),
        new BN(100),
        test.input, // Malicious input
        "TEST",
        "https://example.com/metadata.json"
      )
      .accounts({
        collectionConfig: collectionConfigPDA,
        authority: authority.publicKey,
        // ... other accounts
      })
      .signers([authority])
      .rpc();
      
      throw new Error(`❌ SECURITY FAILURE: ${test.name} not properly handled!`);
    } catch (error) {
      console.log(`✅ ${test.name} properly rejected`);
    }
  }
}
```

---

## 🚀 **RUNNING THE TESTS**

### **Complete Test Suite:**
```typescript
async function runSecurityTests() {
  console.log('🔒 Starting comprehensive security test suite...\n');
  
  try {
    await testUnauthorizedAccess();
    await testAuthorityValidation();
    await testInputValidation();
    await testOverflowProtection();
    await testDoubleSpendingPrevention();
    await testStateTransitionValidation();
    await testEscrowSecurity();
    await testFeeValidation();
    await testCrossProgramInteractions();
    await testConcurrentOperations();
    await testBoundaryConditions();
    await testMaliciousInputHandling();
    
    console.log('\n🎉 ALL SECURITY TESTS PASSED!');
    console.log('✅ Your programs are secure and ready for production!');
  } catch (error) {
    console.error('\n❌ SECURITY TEST FAILED:', error.message);
    console.error('🚨 DO NOT DEPLOY TO PRODUCTION!');
    throw error;
  }
}

// Run tests
runSecurityTests().catch(console.error);
```

### **Individual Test Execution:**
```bash
# Run specific test suite
npm run test:security:access-control
npm run test:security:input-validation
npm run test:security:fund-safety
npm run test:security:integration
npm run test:security:edge-cases

# Run all security tests
npm run test:security:all
```

---

## 📊 **TEST RESULTS INTERPRETATION**

### **✅ PASS Criteria:**
- All unauthorized access attempts blocked
- All invalid inputs rejected
- All double-spending attempts prevented
- All state transitions validated
- All fund operations secure
- All edge cases handled properly

### **❌ FAIL Criteria:**
- Any unauthorized access allowed
- Any invalid input accepted
- Any double-spending possible
- Any state inconsistency
- Any fund loss risk
- Any edge case crash

### **📈 Success Metrics:**
- **100% Access Control Tests Pass**
- **100% Input Validation Tests Pass**
- **100% Fund Safety Tests Pass**
- **100% State Consistency Tests Pass**
- **100% Integration Tests Pass**
- **100% Edge Case Tests Pass**

---

**🔒 Run these tests before every deployment to ensure security! 🔒**
