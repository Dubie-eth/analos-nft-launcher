/**
 * Automated Price Oracle Update Service
 * 
 * Monitors LOS token price and automatically updates the Price Oracle
 * when the price changes by a configurable threshold (default: 1%)
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';

interface PriceOracleConfig {
  enabled: boolean;
  checkIntervalMs: number; // How often to check price (default: 60000ms = 1 min)
  updateThresholdPercent: number; // Minimum change to trigger update (default: 1%)
  programId: string;
  authorityKeypair: Keypair;
  rpcUrl: string;
  minTimeBetweenUpdates: number; // Cooldown period (default: 300000ms = 5 min)
}

interface PriceSource {
  name: string;
  url: string;
  parseResponse: (data: any) => number | null;
}

export class PriceOracleAutomation {
  private config: PriceOracleConfig;
  private connection: Connection;
  private lastKnownPrice: number = 0;
  private lastUpdateTime: number = 0;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 5;

  // Price sources (add more as needed)
  private priceSources: PriceSource[] = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=los-token&vs_currencies=usd',
      parseResponse: (data) => data?.['los-token']?.usd || null,
    },
    {
      name: 'CoinMarketCap',
      url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=LOS',
      parseResponse: (data) => data?.data?.LOS?.quote?.USD?.price || null,
    },
    {
      name: 'Jupiter Aggregator',
      url: 'https://price.jup.ag/v4/price?ids=LOS',
      parseResponse: (data) => data?.data?.LOS?.price || null,
    },
    // Add more sources as needed
  ];

  constructor(config: PriceOracleConfig) {
    this.config = {
      checkIntervalMs: 60000, // 1 minute
      updateThresholdPercent: 1.0, // 1%
      minTimeBetweenUpdates: 300000, // 5 minutes
      ...config,
    };
    
    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
    
    console.log('🤖 Price Oracle Automation initialized');
    console.log('   Check Interval:', this.config.checkIntervalMs / 1000, 'seconds');
    console.log('   Update Threshold:', this.config.updateThresholdPercent + '%');
    console.log('   Cooldown:', this.config.minTimeBetweenUpdates / 1000, 'seconds');
  }

  /**
   * Start automated price monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Automation already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⚠️  Automation is disabled in config');
      return;
    }

    console.log('🚀 Starting Price Oracle automation...');
    this.isRunning = true;
    
    // Initial price fetch
    this.checkAndUpdatePrice();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkAndUpdatePrice();
    }, this.config.checkIntervalMs);
    
    console.log('✅ Automation started successfully');
  }

  /**
   * Stop automated price monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Automation is not running');
      return;
    }

    console.log('🛑 Stopping Price Oracle automation...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('✅ Automation stopped');
  }

  /**
   * Check current price and update oracle if threshold is met
   */
  private async checkAndUpdatePrice(): Promise<void> {
    try {
      console.log('🔍 Checking LOS price...');
      
      // Fetch current price from sources
      const currentPrice = await this.fetchPrice();
      
      if (!currentPrice) {
        console.log('⚠️  Could not fetch price from any source');
        this.consecutiveErrors++;
        
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          console.error('❌ Too many consecutive errors, stopping automation');
          this.stop();
        }
        return;
      }

      // Reset error counter on success
      this.consecutiveErrors = 0;
      
      console.log('   Current Price: $' + currentPrice.toFixed(6));
      
      // If this is the first check, just store the price
      if (this.lastKnownPrice === 0) {
        this.lastKnownPrice = currentPrice;
        console.log('   Initial price stored: $' + currentPrice.toFixed(6));
        return;
      }
      
      // Calculate price change percentage
      const priceChangePercent = Math.abs(
        ((currentPrice - this.lastKnownPrice) / this.lastKnownPrice) * 100
      );
      
      console.log('   Last Known Price: $' + this.lastKnownPrice.toFixed(6));
      console.log('   Price Change: ' + priceChangePercent.toFixed(2) + '%');
      
      // Check if update is needed
      const thresholdMet = priceChangePercent >= this.config.updateThresholdPercent;
      const cooldownExpired = Date.now() - this.lastUpdateTime >= this.config.minTimeBetweenUpdates;
      
      if (thresholdMet && cooldownExpired) {
        console.log('🚨 Threshold met! Updating oracle...');
        await this.updateOracle(currentPrice);
      } else {
        if (!thresholdMet) {
          console.log('   ℹ️  Change below threshold (' + this.config.updateThresholdPercent + '%)');
        }
        if (!cooldownExpired) {
          const remainingCooldown = Math.ceil((this.config.minTimeBetweenUpdates - (Date.now() - this.lastUpdateTime)) / 1000);
          console.log('   ⏳ Cooldown active (' + remainingCooldown + 's remaining)');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error in price check:', error.message);
      this.consecutiveErrors++;
      
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error('❌ Too many consecutive errors, stopping automation');
        this.stop();
      }
    }
  }

  /**
   * Fetch current LOS price from multiple sources
   */
  private async fetchPrice(): Promise<number | null> {
    // Try each source until one succeeds
    for (const source of this.priceSources) {
      try {
        console.log('   Trying source:', source.name);
        
        const response = await axios.get(source.url, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        const price = source.parseResponse(response.data);
        
        if (price && price > 0) {
          console.log('   ✅ Got price from ' + source.name + ': $' + price.toFixed(6));
          return price;
        }
      } catch (error: any) {
        console.log('   ⚠️  Failed to fetch from ' + source.name + ':', error.message);
        continue;
      }
    }
    
    // If all sources fail, return null
    return null;
  }

  /**
   * Update the Price Oracle on-chain
   */
  private async updateOracle(newPrice: number): Promise<void> {
    try {
      // Convert price to 6 decimal precision
      const priceInMicroUSD = Math.floor(newPrice * 1_000_000);
      
      console.log('💰 Updating Price Oracle...');
      console.log('   New Price: $' + newPrice.toFixed(6));
      console.log('   Micro USD: ' + priceInMicroUSD);
      
      // Derive PDA for oracle data account
      const [oracleDataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle')],
        new PublicKey(this.config.programId)
      );
      
      console.log('   Oracle PDA:', oracleDataPDA.toString());
      
      // Build update instruction
      const instructionData = Buffer.alloc(9);
      instructionData.writeUInt8(1, 0); // Instruction discriminator for "update_price"
      instructionData.writeBigUInt64LE(BigInt(priceInMicroUSD), 1);
      
      const instruction = {
        programId: new PublicKey(this.config.programId),
        keys: [
          { pubkey: oracleDataPDA, isSigner: false, isWritable: true },
          { pubkey: this.config.authorityKeypair.publicKey, isSigner: true, isWritable: false },
        ],
        data: instructionData,
      };
      
      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = this.config.authorityKeypair.publicKey;
      
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign transaction
      transaction.sign(this.config.authorityKeypair);
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      
      console.log('   📤 Transaction sent:', signature);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }
      
      // Update tracking variables
      this.lastKnownPrice = newPrice;
      this.lastUpdateTime = Date.now();
      
      console.log('✅ Oracle updated successfully!');
      console.log('   Transaction: https://explorer.analos.io/tx/' + signature);
      console.log('   Old Price: $' + this.lastKnownPrice.toFixed(6));
      console.log('   New Price: $' + newPrice.toFixed(6));
      
    } catch (error: any) {
      console.error('❌ Failed to update oracle:', error.message);
      throw error;
    }
  }

  /**
   * Get current automation status
   */
  getStatus() {
    return {
      running: this.isRunning,
      enabled: this.config.enabled,
      lastKnownPrice: this.lastKnownPrice,
      lastUpdateTime: this.lastUpdateTime,
      checkIntervalSeconds: this.config.checkIntervalMs / 1000,
      updateThresholdPercent: this.config.updateThresholdPercent,
      cooldownSeconds: this.config.minTimeBetweenUpdates / 1000,
      consecutiveErrors: this.consecutiveErrors,
      nextCheckIn: this.isRunning 
        ? Math.max(0, this.config.checkIntervalMs - (Date.now() - this.lastUpdateTime)) 
        : null,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PriceOracleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Configuration updated:', newConfig);
    
    // Restart if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
let automationInstance: PriceOracleAutomation | null = null;

export function initializePriceOracleAutomation(config: PriceOracleConfig): PriceOracleAutomation {
  if (!automationInstance) {
    automationInstance = new PriceOracleAutomation(config);
  }
  return automationInstance;
}

export function getPriceOracleAutomation(): PriceOracleAutomation | null {
  return automationInstance;
}

