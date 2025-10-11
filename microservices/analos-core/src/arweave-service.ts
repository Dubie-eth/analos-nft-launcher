import Arweave from 'arweave';

export interface ArweaveUploadResult {
  success: boolean;
  transactionId?: string;
  url?: string;
  error?: string;
}

export class ArweaveService {
  private arweave: Arweave;
  private wallet: any;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize Arweave - using mainnet for real permanent storage
    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
      timeout: 20000,
      logging: false,
    });
    
    console.log('🌐 Arweave service initialized');
  }

  // Initialize with wallet (you'll need to provide your Arweave wallet)
  async initializeWithWallet(walletData?: string): Promise<boolean> {
    try {
      if (walletData) {
        // Load wallet from keyfile data
        this.wallet = JSON.parse(walletData);
        console.log('🔑 Arweave wallet loaded');
      } else {
        // Generate a new wallet for testing (NOT for production!)
        this.wallet = await this.arweave.wallets.generate();
        console.log('🔑 New Arweave wallet generated (TESTING ONLY)');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Arweave wallet:', error);
      return false;
    }
  }

  // Get wallet address
  async getWalletAddress(): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }
    
    try {
      return await this.arweave.wallets.getAddress(this.wallet);
    } catch (error) {
      console.error('❌ Failed to get wallet address:', error);
      return null;
    }
  }

  // Get wallet balance
  async getBalance(): Promise<number> {
    if (!this.isInitialized || !this.wallet) {
      return 0;
    }
    
    try {
      const address = await this.getWalletAddress();
      if (!address) return 0;
      
      const balance = await this.arweave.wallets.getBalance(address);
      return parseFloat(this.arweave.ar.winstonToAr(balance));
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return 0;
    }
  }

  // Upload image to Arweave
  async uploadImage(imageData: Buffer, fileName: string, contentType: string = 'image/png'): Promise<ArweaveUploadResult> {
    if (!this.isInitialized || !this.wallet) {
      return {
        success: false,
        error: 'Arweave wallet not initialized'
      };
    }

    try {
      // Create transaction
      const transaction = await this.arweave.createTransaction({
        data: imageData
      }, this.wallet);

      // Add tags for metadata
      transaction.addTag('Content-Type', contentType);
      transaction.addTag('App-Name', 'Analos-NFT-Launcher');
      transaction.addTag('App-Version', '1.0.0');
      transaction.addTag('File-Name', fileName);
      transaction.addTag('Collection', 'NFT-Image');

      // Sign transaction
      await this.arweave.transactions.sign(transaction, this.wallet);

      // Get transaction ID
      const txId = transaction.id;
      console.log(`📤 Uploading to Arweave: ${txId}`);

      // Submit transaction
      const response = await this.arweave.transactions.post(transaction);
      
      if (response.status === 200) {
        const arweaveUrl = `https://arweave.net/${txId}`;
        console.log(`✅ Image uploaded to Arweave: ${arweaveUrl}`);
        
        return {
          success: true,
          transactionId: txId,
          url: arweaveUrl
        };
      } else {
        return {
          success: false,
          error: `Upload failed with status: ${response.status}`
        };
      }
    } catch (error) {
      console.error('❌ Arweave upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  // Upload image from URL (fetch and upload)
  async uploadImageFromUrl(imageUrl: string, fileName: string): Promise<ArweaveUploadResult> {
    try {
      console.log(`📥 Fetching image from: ${imageUrl}`);
      
      // Fetch image data
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch image: ${response.status}`
        };
      }

      const imageData = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';

      // Upload to Arweave
      return await this.uploadImage(imageData, fileName, contentType);
    } catch (error) {
      console.error('❌ Failed to upload image from URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isInitialized && !!this.wallet;
  }

  // Get network info
  async getNetworkInfo(): Promise<any> {
    try {
      const network = await this.arweave.network.getInfo();
      return {
        network: 'Arweave Mainnet',
        version: network.version,
        height: network.height,
        current: network.current,
        blocks: network.blocks,
        peers: network.peers
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      return {
        network: 'Arweave Mainnet',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const arweaveService = new ArweaveService();
