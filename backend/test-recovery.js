/**
 * Test Script for Blockchain Recovery System
 * This script tests the recovery functionality
 */

const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';

async function testRecoverySystem() {
  console.log('🧪 Testing Blockchain Recovery System...');
  
  try {
    // Test 1: Add known mints
    console.log('\n1️⃣ Testing add mints...');
    const addMintsResponse = await fetch(`${baseUrl}/api/recovery/add-mints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        mints: ['3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB'] 
      }),
    });
    
    const addMintsResult = await addMintsResponse.json();
    console.log('✅ Add mints result:', addMintsResult);
    
    // Test 2: Scan specific mint
    console.log('\n2️⃣ Testing scan specific mint...');
    const scanResponse = await fetch(`${baseUrl}/api/recovery/scan-mint/3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB`);
    const scanResult = await scanResponse.json();
    console.log('✅ Scan result:', scanResult);
    
    // Test 3: Get recovery report
    console.log('\n3️⃣ Testing recovery report...');
    const reportResponse = await fetch(`${baseUrl}/api/recovery/report`);
    const reportResult = await reportResponse.json();
    console.log('✅ Recovery report:', reportResult);
    
    // Test 4: Full recovery (if NFTs found)
    if (scanResult.success && scanResult.nfts && scanResult.nfts.length > 0) {
      console.log('\n4️⃣ Testing full recovery...');
      const fullRecoveryResponse = await fetch(`${baseUrl}/api/recovery/full-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const fullRecoveryResult = await fullRecoveryResponse.json();
      console.log('✅ Full recovery result:', fullRecoveryResult);
    } else {
      console.log('\n4️⃣ Skipping full recovery - no NFTs found to recover');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testRecoverySystem();
