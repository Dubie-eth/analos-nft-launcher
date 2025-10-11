/**
 * Integration example showing how to use @analos/web3-kit in the main application
 */

import { Analos, AnalosConnection, PublicKey, Transaction, SystemProgram } from '@analos/web3-kit';

// Example: Wallet Provider Integration
export class AnalosWalletProvider {
  private connection: AnalosConnection;

  constructor() {
    // Create connection with proper Analos configuration
    this.connection = Analos.createConnection('MAINNET', {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });

    console.log('🔗 Analos Wallet Provider initialized');
    console.log('🌐 Network:', this.connection.getClusterInfo().name);
    console.log('🔌 WebSocket:', this.connection.getWebSocketUrl());
  }

  async initializeWebSocket(): Promise<void> {
    try {
      await this.connection.initializeWebSocket();
      console.log('✅ WebSocket initialized successfully');
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed, continuing with HTTP-only mode');
    }
  }

  async getAccountInfo(address: string) {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await Analos.Utils.retryAnalosOperation(async () => {
        return await this.connection.getAccountInfo(publicKey);
      });
      
      return accountInfo;
    } catch (error) {
      const analosError = Analos.Utils.getAnalosErrorMessage(error);
      console.error('Failed to get account info:', analosError);
      throw new Error(analosError);
    }
  }

  async sendTransaction(transaction: Transaction, signers: any[]) {
    try {
      // Validate transaction before sending
      const validation = Analos.Utils.validateAnalosTransaction(transaction);
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
      }

      const signature = await this.connection.sendTransaction(transaction, signers);
      
      // Get explorer URL for the transaction
      const explorerUrl = this.connection.getExplorerUrl(signature);
      console.log('📝 Transaction sent:', signature);
      console.log('🔍 View on explorer:', explorerUrl);

      return { signature, explorerUrl };
    } catch (error) {
      const analosError = Analos.Utils.getAnalosErrorMessage(error);
      console.error('Transaction failed:', analosError);
      throw new Error(analosError);
    }
  }

  // Example: NFT Contract Service Integration
  async createNFTTransaction(mintAddress: string, ownerAddress: string) {
    try {
      const transaction = Analos.Utils.createAnalosTransaction();
      
      // Add memo instruction for NFT creation
      const memoInstruction = Analos.Utils.createAnalosMemoInstruction(
        `NFT created for ${ownerAddress}`
      );
      transaction.add(memoInstruction);

      // Add transfer instruction for minting fee
      const transferInstruction = Analos.Utils.createAnalosTransferInstruction(
        new PublicKey(ownerAddress),
        new PublicKey(mintAddress),
        Analos.Utils.parseAnalosAmount('0.1') // 0.1 LOS minting fee
      );
      transaction.add(transferInstruction);

      // Get recent blockhash with retry logic
      const { blockhash } = await Analos.Utils.retryAnalosOperation(async () => {
        return await this.connection.getLatestBlockhash('finalized');
      });

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ownerAddress);

      return transaction;
    } catch (error) {
      const analosError = Analos.Utils.getAnalosErrorMessage(error);
      console.error('Failed to create NFT transaction:', analosError);
      throw new Error(analosError);
    }
  }

  // Example: Real-time subscription
  async subscribeToAccountChanges(address: string, callback: (accountInfo: any) => void) {
    try {
      const publicKey = new PublicKey(address);
      
      const subscriptionId = this.connection.onAnalosAccountChange(
        publicKey,
        (accountInfo, context) => {
          console.log(`📊 Account ${address} changed at slot ${context.slot}`);
          callback(accountInfo);
        }
      );

      console.log(`📡 Subscribed to account changes for ${address}, subscription ID: ${subscriptionId}`);
      return subscriptionId;
    } catch (error) {
      const analosError = Analos.Utils.getAnalosErrorMessage(error);
      console.error('Failed to subscribe to account changes:', analosError);
      throw new Error(analosError);
    }
  }

  // Example: Market Data Service Integration
  async getMarketData() {
    try {
      // Get network information
      const networkInfo = this.connection.getClusterInfo();
      
      // Get current slot
      const slot = await this.connection.getSlot();
      
      // Get block height
      const blockHeight = await this.connection.getBlockHeight();
      
      // Get version
      const version = await this.connection.getVersion();

      return {
        network: networkInfo.name,
        rpc: networkInfo.rpc,
        ws: networkInfo.ws,
        explorer: networkInfo.explorer,
        currentSlot: slot,
        blockHeight: blockHeight,
        version: version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const analosError = Analos.Utils.getAnalosErrorMessage(error);
      console.error('Failed to get market data:', analosError);
      throw new Error(analosError);
    }
  }
}

// Example usage
async function demonstrateIntegration() {
  console.log('🚀 Analos Web3 Kit Integration Demo\n');

  // Initialize wallet provider
  const walletProvider = new AnalosWalletProvider();
  
  // Initialize WebSocket
  await walletProvider.initializeWebSocket();
  
  // Get market data
  const marketData = await walletProvider.getMarketData();
  console.log('📊 Market Data:', marketData);
  
  // Test account info retrieval
  try {
    const testAddress = 'So11111111111111111111111111111111111111112';
    const accountInfo = await walletProvider.getAccountInfo(testAddress);
    console.log('👤 Account Info:', accountInfo ? 'Found' : 'Not found');
  } catch (error) {
    console.log('👤 Account Info Test:', error.message);
  }
  
  // Test transaction creation
  try {
    const transaction = await walletProvider.createNFTTransaction(
      'So11111111111111111111111111111111111111112',
      'So11111111111111111111111111111111111111113'
    );
    console.log('✅ NFT Transaction created successfully');
    console.log('📝 Transaction has', transaction.instructions.length, 'instructions');
  } catch (error) {
    console.log('❌ NFT Transaction creation failed:', error.message);
  }

  console.log('\n🎉 Integration demo completed!');
}

// Export for use in main application
export { AnalosWalletProvider };

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateIntegration().catch(console.error);
}
