'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction as AnalosTransaction, Keypair } from '@solana/web3.js';
import { ANALOS_PLATFORM_WALLET } from '@/config/analos-programs';
import TreasuryWalletAccess from './TreasuryWalletAccess';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Send, 
  RefreshCw, 
  Eye, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface TreasuryBalance {
  balance: number;
  balanceFormatted: string;
  balanceUSD: number;
  lastUpdated: string;
}

interface FundDistribution {
  losStakers: {
    amount: number;
    percentage: number;
    recipients: number;
    lastDistribution: string;
  };
  treasury: {
    amount: number;
    percentage: number;
  };
  development: {
    amount: number;
    percentage: number;
  };
  marketing: {
    amount: number;
    percentage: number;
  };
}

interface Transaction {
  signature: string;
  amount: number;
  from: string;
  timestamp: string;
  type: 'mint_fee' | 'other';
  status: 'confirmed' | 'pending';
}

const TreasuryManager: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null);
  const [fundDistribution, setFundDistribution] = useState<FundDistribution | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [distributionAmount, setDistributionAmount] = useState<number>(0);
  const [losStakerWallet, setLosStakerWallet] = useState<string>('');
  const [developmentWallet, setDevelopmentWallet] = useState<string>('');
  const [marketingWallet, setMarketingWallet] = useState<string>('');
  const [treasuryKeypair, setTreasuryKeypair] = useState<Keypair | null>(null);

  useEffect(() => {
    if (connected) {
      loadTreasuryData();
    }
  }, [connected]);

  const loadTreasuryData = async () => {
    try {
      setLoading(true);
      
      // Fetch treasury balance
      const balanceResponse = await fetch('/api/treasury?action=balance');
      const balanceResult = await balanceResponse.json();
      
      if (balanceResult.success) {
        setTreasuryBalance(balanceResult.data);
      }

      // Fetch fund distribution data
      const distributionResponse = await fetch('/api/treasury?action=distribution');
      const distributionResult = await distributionResponse.json();
      
      if (distributionResult.success) {
        setFundDistribution(distributionResult.data);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/treasury?action=transactions');
      const transactionsResult = await transactionsResponse.json();
      
      if (transactionsResult.success) {
        setRecentTransactions(transactionsResult.data);
      }

    } catch (error) {
      console.error('Error loading treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeFunds = async () => {
    if (!treasuryKeypair) {
      alert('Please load the treasury wallet first');
      return;
    }

    if (distributionAmount <= 0) {
      alert('Please enter a valid distribution amount');
      return;
    }

    if (!losStakerWallet || !developmentWallet || !marketingWallet) {
      alert('Please configure all distribution wallets first');
      return;
    }

    try {
      setDistributing(true);

      // Create distribution transaction
      const transaction = new AnalosTransaction();
      const totalAmount = distributionAmount * LAMPORTS_PER_SOL;

      // 30% to LOS stakers
      const losStakerAmount = Math.floor(totalAmount * 0.30);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: new PublicKey(losStakerWallet),
          lamports: losStakerAmount
        })
      );

      // 20% to development
      const developmentAmount = Math.floor(totalAmount * 0.20);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: new PublicKey(developmentWallet),
          lamports: developmentAmount
        })
      );

      // 10% to marketing
      const marketingAmount = Math.floor(totalAmount * 0.10);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: treasuryKeypair.publicKey,
          toPubkey: new PublicKey(marketingWallet),
          lamports: marketingAmount
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = treasuryKeypair.publicKey;

      // Sign and send the transaction
      transaction.sign(treasuryKeypair);
      const signature = await connection.sendTransaction(transaction, [treasuryKeypair]);

      console.log('Distribution transaction sent:', signature);
      alert(`Distribution transaction sent successfully! Signature: ${signature}`);

      // Refresh treasury data
      await loadTreasuryData();

    } catch (error) {
      console.error('Error distributing funds:', error);
      alert('Error executing distribution transaction: ' + (error as Error).message);
    } finally {
      setDistributing(false);
    }
  };

  const handleWalletLoaded = (keypair: Keypair) => {
    setTreasuryKeypair(keypair);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(6)} LOS`;
  };

  const formatUSD = (amount: number) => {
    return `$${(amount * 0.0018).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-gray-300">Loading treasury data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Treasury Wallet Access */}
      <TreasuryWalletAccess onWalletLoaded={handleWalletLoaded} />

      {/* Treasury Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Wallet className="w-6 h-6 mr-3" />
            Treasury Management
          </h2>
          <button
            onClick={loadTreasuryData}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Treasury Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 text-sm">Total Balance</h3>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatAmount(treasuryBalance?.balance || 0)}</div>
            <div className="text-gray-400 text-sm">{formatUSD(treasuryBalance?.balance || 0)}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 text-sm">Available for Distribution</h3>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{formatAmount(distributionAmount)}</div>
            <div className="text-gray-400 text-sm">Ready to distribute</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-300 text-sm">Last Updated</h3>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm text-white">{formatDate(treasuryBalance?.lastUpdated || '')}</div>
            <div className="text-gray-400 text-xs">Treasury wallet</div>
          </div>
        </div>

        {/* Fund Distribution Breakdown */}
        {fundDistribution && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Fund Distribution Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-green-300 font-medium">LOS Stakers</h4>
                  <Users className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-xl font-bold text-white">{formatAmount(fundDistribution.losStakers.amount)}</div>
                <div className="text-green-400 text-sm">{fundDistribution.losStakers.percentage}%</div>
                <div className="text-gray-400 text-xs">{fundDistribution.losStakers.recipients} recipients</div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-blue-300 font-medium">Treasury</h4>
                  <Wallet className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white">{formatAmount(fundDistribution.treasury.amount)}</div>
                <div className="text-blue-400 text-sm">{fundDistribution.treasury.percentage}%</div>
                <div className="text-gray-400 text-xs">Platform operations</div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-purple-300 font-medium">Development</h4>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-white">{formatAmount(fundDistribution.development.amount)}</div>
                <div className="text-purple-400 text-sm">{fundDistribution.development.percentage}%</div>
                <div className="text-gray-400 text-xs">New features</div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-orange-300 font-medium">Marketing</h4>
                  <Send className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-xl font-bold text-white">{formatAmount(fundDistribution.marketing.amount)}</div>
                <div className="text-orange-400 text-sm">{fundDistribution.marketing.percentage}%</div>
                <div className="text-gray-400 text-xs">Community growth</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Distribution Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Send className="w-5 h-5 mr-2" />
          Fund Distribution
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Amount */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Distribution Amount (LOS)
            </label>
            <input
              type="number"
              value={distributionAmount}
              onChange={(e) => setDistributionAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              placeholder="Enter amount to distribute"
            />
            <p className="text-gray-400 text-xs mt-1">
              Available: {formatAmount(treasuryBalance?.balance || 0)}
            </p>
          </div>

          {/* Distribution Wallets */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                LOS Stakers Wallet
              </label>
              <input
                type="text"
                value={losStakerWallet}
                onChange={(e) => setLosStakerWallet(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter LOS stakers wallet address"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Development Wallet
              </label>
              <input
                type="text"
                value={developmentWallet}
                onChange={(e) => setDevelopmentWallet(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter development wallet address"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Marketing Wallet
              </label>
              <input
                type="text"
                value={marketingWallet}
                onChange={(e) => setMarketingWallet(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter marketing wallet address"
              />
            </div>
          </div>
        </div>

        {/* Distribution Preview */}
        {distributionAmount > 0 && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-white font-medium mb-3">Distribution Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">LOS Stakers (30%):</span>
                <span className="text-green-400 font-medium">{formatAmount(distributionAmount * 0.30)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Development (20%):</span>
                <span className="text-purple-400 font-medium">{formatAmount(distributionAmount * 0.20)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Marketing (10%):</span>
                <span className="text-orange-400 font-medium">{formatAmount(distributionAmount * 0.10)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between">
                <span className="text-gray-300">Treasury (40%):</span>
                <span className="text-blue-400 font-medium">{formatAmount(distributionAmount * 0.40)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleDistributeFunds}
            disabled={distributing || distributionAmount <= 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distributing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Distributing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Distribute Funds</span>
              </>
            )}
          </button>

          <button className="flex items-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Recent Transactions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-300 py-3">Signature</th>
                <th className="text-left text-gray-300 py-3">Amount</th>
                <th className="text-left text-gray-300 py-3">From</th>
                <th className="text-left text-gray-300 py-3">Type</th>
                <th className="text-left text-gray-300 py-3">Status</th>
                <th className="text-left text-gray-300 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-3 text-white font-mono text-sm">{tx.signature}</td>
                  <td className="py-3 text-white font-medium">{formatAmount(tx.amount)}</td>
                  <td className="py-3 text-gray-300 font-mono text-sm">{tx.from}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tx.type === 'mint_fee' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {tx.status === 'confirmed' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={`text-sm ${
                        tx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-400 text-sm">{formatDate(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-semibold mb-2">Important Notice</h4>
            <p className="text-gray-300 text-sm">
              To execute fund distributions, you need access to the treasury wallet's private key or a multi-signature setup. 
              The current implementation prepares the distribution transaction but requires manual execution with proper wallet access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryManager;
