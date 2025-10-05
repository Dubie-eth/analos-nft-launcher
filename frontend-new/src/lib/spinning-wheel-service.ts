/**
 * Spinning Wheel Game Service
 * Manages prizes, house edge, and volume tracking for the marketplace game
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, createCloseAccountInstruction } from '@solana/spl-token';

export interface Prize {
  id: string;
  type: 'nft' | 'token' | 'los';
  name: string;
  description: string;
  value: number; // in LOS tokens
  image?: string;
  mintAddress?: string;
  probability: number; // 0-1, higher = more likely
  isActive: boolean;
  createdAt: Date;
}

export interface SpinResult {
  prize: Prize | null;
  spinAngle: number;
  isWinner: boolean;
  cost: number;
  timestamp: Date;
  signature?: string;
}

export interface GameStats {
  totalVolume: number;
  totalSpins: number;
  totalWins: number;
  houseBalance: number;
  winRate: number;
  averagePrize: number;
}

export interface BurnToEarnEligibility {
  canBurn: boolean;
  emptyAccounts: number;
  estimatedReward: number;
}

class SpinningWheelService {
  private connection: Connection;
  private houseWallet: PublicKey;
  private prizes: Prize[] = [];
  private gameStats: GameStats;
  
  // Game Configuration
  private readonly HOUSE_EDGE = 0.15; // 15% house edge
  private readonly MIN_SPIN_COST = 0.1; // 0.1 LOS minimum
  private readonly MAX_SPIN_COST = 10; // 10 LOS maximum
  private readonly BURN_TO_EARN_REWARD = 0.5; // 0.5 LOS reward for burning empty accounts
  
  constructor() {
    this.connection = new Connection('https://rpc.analos.io');
    this.houseWallet = new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');
    this.gameStats = {
      totalVolume: 0,
      totalSpins: 0,
      totalWins: 0,
      houseBalance: 0,
      winRate: 0,
      averagePrize: 0
    };
    
    this.initializeDefaultPrizes();
    this.loadGameStats();
  }

  private initializeDefaultPrizes(): void {
    this.prizes = [
      {
        id: '1',
        type: 'los',
        name: '10 LOS',
        description: '10 LOS tokens',
        value: 10,
        probability: 0.1,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '2',
        type: 'los',
        name: '5 LOS',
        description: '5 LOS tokens',
        value: 5,
        probability: 0.15,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '3',
        type: 'los',
        name: '2 LOS',
        description: '2 LOS tokens',
        value: 2,
        probability: 0.25,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '4',
        type: 'los',
        name: '1 LOS',
        description: '1 LOS token',
        value: 1,
        probability: 0.3,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '5',
        type: 'los',
        name: '0.5 LOS',
        description: '0.5 LOS token',
        value: 0.5,
        probability: 0.2,
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  private loadGameStats(): void {
    // Load stats from localStorage or blockchain
    const savedStats = localStorage.getItem('spinning_wheel_stats');
    if (savedStats) {
      try {
        this.gameStats = JSON.parse(savedStats);
      } catch (error) {
        console.error('Failed to load game stats:', error);
      }
    }
  }

  private saveGameStats(): void {
    localStorage.setItem('spinning_wheel_stats', JSON.stringify(this.gameStats));
  }

  // Get all active prizes
  getPrizes(): Prize[] {
    return this.prizes.filter(prize => prize.isActive);
  }

  // Get game statistics
  getGameStats(): GameStats {
    return { ...this.gameStats };
  }

  // Add new prize (admin only)
  addPrize(prize: Omit<Prize, 'id' | 'createdAt'>): Prize {
    const newPrize: Prize = {
      ...prize,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    this.prizes.push(newPrize);
    this.savePrizes();
    return newPrize;
  }

  // Update prize (admin only)
  updatePrize(prizeId: string, updates: Partial<Prize>): boolean {
    const index = this.prizes.findIndex(p => p.id === prizeId);
    if (index === -1) return false;
    
    this.prizes[index] = { ...this.prizes[index], ...updates };
    this.savePrizes();
    return true;
  }

  // Remove prize (admin only)
  removePrize(prizeId: string): boolean {
    const index = this.prizes.findIndex(p => p.id === prizeId);
    if (index === -1) return false;
    
    this.prizes.splice(index, 1);
    this.savePrizes();
    return true;
  }

  private savePrizes(): void {
    localStorage.setItem('spinning_wheel_prizes', JSON.stringify(this.prizes));
  }

  private loadPrizes(): void {
    const savedPrizes = localStorage.getItem('spinning_wheel_prizes');
    if (savedPrizes) {
      try {
        this.prizes = JSON.parse(savedPrizes);
      } catch (error) {
        console.error('Failed to load prizes:', error);
      }
    }
  }

  // Calculate weighted random prize selection
  private selectPrize(): Prize | null {
    const activePrizes = this.getPrizes();
    if (activePrizes.length === 0) return null;
    
    const totalWeight = activePrizes.reduce((sum, prize) => sum + prize.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const prize of activePrizes) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }
    
    return activePrizes[0]; // Fallback
  }

  // Calculate spin result with house edge
  private calculateSpinResult(selectedPrize: Prize | null, cost: number): SpinResult {
    if (!selectedPrize) {
      return {
        prize: null,
        spinAngle: Math.random() * 360,
        isWinner: false,
        cost,
        timestamp: new Date()
      };
    }
    
    const adjustedProbability = selectedPrize.probability * (1 - this.HOUSE_EDGE);
    const isWinner = Math.random() < adjustedProbability;
    
    return {
      prize: isWinner ? selectedPrize : null,
      spinAngle: Math.random() * 360,
      isWinner,
      cost,
      timestamp: new Date()
    };
  }

  // Execute spin
  async spinWheel(cost: number, userWallet: PublicKey, signTransaction: any): Promise<SpinResult> {
    // Validate spin cost
    if (cost < this.MIN_SPIN_COST || cost > this.MAX_SPIN_COST) {
      throw new Error(`Spin cost must be between ${this.MIN_SPIN_COST} and ${this.MAX_SPIN_COST} LOS`);
    }

    try {
      // Create transaction to pay spin cost
      const transaction = new Transaction();
      
      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userWallet,
          toPubkey: this.houseWallet,
          lamports: cost * LAMPORTS_PER_SOL
        })
      );

      // Sign and send transaction
      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      // Calculate spin result
      const selectedPrize = this.selectPrize();
      const result = this.calculateSpinResult(selectedPrize, cost);
      result.signature = signature;

      // Update game stats
      this.gameStats.totalVolume += cost;
      this.gameStats.totalSpins += 1;
      this.gameStats.totalWins += result.isWinner ? 1 : 0;
      this.gameStats.winRate = this.gameStats.totalWins / this.gameStats.totalSpins;
      this.gameStats.averagePrize = result.isWinner && result.prize ? result.prize.value : 0;
      
      this.saveGameStats();

      return result;

    } catch (error) {
      console.error('Spin failed:', error);
      throw new Error('Spin failed. Please try again.');
    }
  }

  // Check burn-to-earn eligibility
  async checkBurnToEarnEligibility(userWallet: PublicKey): Promise<BurnToEarnEligibility> {
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(userWallet, {
        programId: TOKEN_PROGRAM_ID
      });
      
      // Check for empty LOS token accounts
      const emptyAccounts = [];
      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = await this.connection.getAccountInfo(account.pubkey);
          if (accountInfo && accountInfo.data.length === 0) {
            emptyAccounts.push(account.pubkey);
          }
        } catch (error) {
          // Account might not exist or be invalid
        }
      }
      
      return {
        canBurn: emptyAccounts.length > 0,
        emptyAccounts: emptyAccounts.length,
        estimatedReward: emptyAccounts.length * this.BURN_TO_EARN_REWARD
      };
    } catch (error) {
      console.error('Error checking burn-to-earn eligibility:', error);
      return {
        canBurn: false,
        emptyAccounts: 0,
        estimatedReward: 0
      };
    }
  }

  // Execute burn-to-earn
  async executeBurnToEarn(userWallet: PublicKey, signTransaction: any): Promise<{ success: boolean; reward: number; signature?: string }> {
    try {
      const eligibility = await this.checkBurnToEarnEligibility(userWallet);
      
      if (!eligibility.canBurn) {
        throw new Error('No empty token accounts found to burn');
      }

      const transaction = new Transaction();
      let closedAccounts = 0;

      // Close empty token accounts and collect reward
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(userWallet, {
        programId: TOKEN_PROGRAM_ID
      });

      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = await this.connection.getAccountInfo(account.pubkey);
          if (accountInfo && accountInfo.data.length === 0) {
            transaction.add(
              createCloseAccountInstruction(
                account.pubkey,
                userWallet, // Destination for rent refund
                userWallet, // Owner
                [],
                TOKEN_PROGRAM_ID
              )
            );
            closedAccounts++;
          }
        } catch (error) {
          // Skip invalid accounts
        }
      }

      if (closedAccounts === 0) {
        throw new Error('No accounts could be closed');
      }

      // Add reward transfer
      const reward = closedAccounts * this.BURN_TO_EARN_REWARD;
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.houseWallet,
          toPubkey: userWallet,
          lamports: reward * LAMPORTS_PER_SOL
        })
      );

      // Sign and send transaction
      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      return {
        success: true,
        reward,
        signature
      };

    } catch (error) {
      console.error('Burn-to-earn failed:', error);
      throw new Error('Burn-to-earn failed. Please try again.');
    }
  }

  // Get house balance
  async getHouseBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.houseWallet);
      this.gameStats.houseBalance = balance / LAMPORTS_PER_SOL;
      this.saveGameStats();
      return this.gameStats.houseBalance;
    } catch (error) {
      console.error('Failed to get house balance:', error);
      return 0;
    }
  }

  // Admin functions
  async withdrawHouseFunds(amount: number, destination: PublicKey, signTransaction: any): Promise<string> {
    try {
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.houseWallet,
          toPubkey: destination,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      throw new Error('Failed to withdraw house funds');
    }
  }
}

export const spinningWheelService = new SpinningWheelService();
