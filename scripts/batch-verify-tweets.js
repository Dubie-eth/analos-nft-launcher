/**
 * BATCH TWEET VERIFICATION SCRIPT
 * Admin script to verify multiple tweets in batch
 * Usage: node scripts/batch-verify-tweets.js
 */

const fs = require('fs');
const path = require('path');

// Sample batch verification data
const batchVerifications = [
  {
    walletAddress: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    referralCode: 'ABC123',
    tweetId: '1234567890123456789',
    expectedUsername: 'admin_user'
  },
  {
    walletAddress: '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
    referralCode: 'DEF456',
    tweetId: '9876543210987654321',
    expectedUsername: 'test_user'
  }
];

async function batchVerifyTweets() {
  console.log('🚀 Starting batch tweet verification...');
  console.log(`📊 Processing ${batchVerifications.length} verifications`);

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const verification of batchVerifications) {
    console.log(`\n🔍 Verifying tweet ${verification.tweetId} for wallet ${verification.walletAddress.slice(0, 8)}...`);

    try {
      const response = await fetch('http://localhost:3000/api/webhooks/twitter-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: verification.walletAddress,
          referralCode: verification.referralCode,
          tweetId: verification.tweetId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Success: ${result.message}`);
        successCount++;
      } else {
        console.log(`❌ Failed: ${result.message}`);
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }
        failureCount++;
      }

      results.push({
        ...verification,
        result: result
      });

    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      failureCount++;
      
      results.push({
        ...verification,
        error: error.message
      });
    }

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate summary report
  console.log('\n📈 BATCH VERIFICATION SUMMARY');
  console.log('================================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📊 Total: ${batchVerifications.length}`);

  // Save detailed results to file
  const reportPath = path.join(__dirname, 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: batchVerifications.length,
      successful: successCount,
      failed: failureCount
    },
    results: results
  }, null, 2));

  console.log(`📄 Detailed report saved to: ${reportPath}`);

  return {
    success: successCount,
    failed: failureCount,
    total: batchVerifications.length
  };
}

// Example of how to add new verifications programmatically
function addVerificationFromCSV(csvPath) {
  console.log(`📁 Reading CSV file: ${csvPath}`);
  
  // This would read a CSV file with columns:
  // wallet_address,referral_code,tweet_id,expected_username
  
  // Example CSV content:
  // wallet_address,referral_code,tweet_id,expected_username
  // 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW,ABC123,1234567890123456789,admin_user
  // 89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m,DEF456,9876543210987654321,test_user
  
  console.log('💡 To add CSV support, implement CSV parsing here');
}

// Example of how to verify tweets from a database query
async function verifyFromDatabase() {
  console.log('🗄️ Fetching pending verifications from database...');
  
  try {
    const response = await fetch('http://localhost:3000/api/social-verification/twitter?status=pending');
    const data = await response.json();
    
    if (data.verifications && data.verifications.length > 0) {
      console.log(`📋 Found ${data.verifications.length} pending verifications`);
      
      // Process each pending verification
      for (const verification of data.verifications) {
        console.log(`🔍 Processing verification ${verification.id}...`);
        
        const result = await fetch('http://localhost:3000/api/webhooks/twitter-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: verification.wallet_address,
            referralCode: verification.referral_code,
            tweetId: verification.tweet_id
          }),
        });

        const verificationResult = await result.json();
        console.log(verificationResult.success ? '✅ Success' : '❌ Failed');
      }
    } else {
      console.log('📭 No pending verifications found');
    }
    
  } catch (error) {
    console.log(`💥 Error fetching from database: ${error.message}`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--csv')) {
    const csvPath = args[args.indexOf('--csv') + 1];
    if (csvPath) {
      addVerificationFromCSV(csvPath);
    } else {
      console.log('❌ Please provide CSV file path: --csv path/to/file.csv');
    }
  } else if (args.includes('--database')) {
    verifyFromDatabase();
  } else {
    batchVerifyTweets();
  }
}

module.exports = {
  batchVerifyTweets,
  addVerificationFromCSV,
  verifyFromDatabase
};
