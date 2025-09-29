// ES Module runner for Analos SDK operations
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnalosSDKWrapper } from './analos-sdk-wrapper.mjs';

async function main() {
  const [,, operation, dataString] = process.argv;
  
  if (!operation || !dataString) {
    console.error('Usage: node analos-sdk-runner.mjs <operation> <data>');
    process.exit(1);
  }

  try {
    const data = JSON.parse(dataString);
    
    // Reconstruct connection and wallet from data
    const connection = new Connection(data.connection.endpoint);
    const walletKeypair = Keypair.fromSecretKey(new Uint8Array(data.wallet.secretKey));
    
    // Initialize SDK wrapper
    const sdkWrapper = new AnalosSDKWrapper(connection, walletKeypair);
    await sdkWrapper.initialize();
    
    let result;
    
    switch (operation) {
      case 'createCollection':
        result = await sdkWrapper.createNFTCollection(data.collectionData);
        break;
        
      case 'mintNFTs':
        result = await sdkWrapper.mintNFTs(data.poolAddress, data.quantity, data.userWallet);
        break;
        
      case 'getCollectionInfo':
        result = await sdkWrapper.getCollectionInfo(data.poolAddress);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Output result as JSON
    console.log(JSON.stringify(result));
    
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
}

main();
