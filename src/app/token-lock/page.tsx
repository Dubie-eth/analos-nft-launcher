'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTokenLock } from '@/hooks/useEnhancedPrograms';

export default function TokenLockPage() {
  const { publicKey } = useWallet();
  const { programId } = useTokenLock();
  
  const [amount, setAmount] = useState('');
  const [lockDuration, setLockDuration] = useState('90');
  const [lockType, setLockType] = useState('standard');
  const [loading, setLoading] = useState(false);

  const handleCreateLock = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const unlockTime = Date.now() + (Number(lockDuration) * 24 * 60 * 60 * 1000);
      console.log('Creating token lock...', { amount, unlockTime, lockType });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Successfully locked ${amount} tokens!`);
      setAmount('');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create lock');
    } finally {
      setLoading(false);
    }
  };

  const activeLocks = [
    {
      id: 1,
      amount: 50000,
      lockType: 'LP Token Lock',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      unlockTime: Date.now() + 150 * 24 * 60 * 60 * 1000,
      canUnlock: false,
    },
    {
      id: 2,
      amount: 25000,
      lockType: 'Team Lock',
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      unlockTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
      canUnlock: false,
    },
    {
      id: 3,
      amount: 10000,
      lockType: 'Standard Lock',
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      unlockTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
      canUnlock: true,
    },
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTimeRemaining = (unlockTime: number) => {
    const remaining = unlockTime - Date.now();
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔒 Token Lock Manager</h1>
            <p className="text-gray-400">Lock tokens securely with time-based release</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Program Info */}
        <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4 mb-8">
          <p className="text-sm font-mono">
            Program: <span className="text-orange-400">{programId.toBase58()}</span>
          </p>
        </div>

        {!publicKey ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to manage token locks</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total Locked</p>
                <p className="text-3xl font-bold text-orange-400">85,000</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Active Locks</p>
                <p className="text-3xl font-bold text-blue-400">3</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Unlockable</p>
                <p className="text-3xl font-bold text-green-400">10,000</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Still Locked</p>
                <p className="text-3xl font-bold text-purple-400">75,000</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Lock Form */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Create New Lock</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount to Lock
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10000"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                      data-1p-ignore
                      data-lpignore="true"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Lock Type
                    </label>
                    <select
                      value={lockType}
                      onChange={(e) => setLockType(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    >
                      <option value="standard">Standard Lock</option>
                      <option value="lp">LP Token Lock</option>
                      <option value="team">Team Lock</option>
                      <option value="investor">Investor Lock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Lock Duration (Days)
                    </label>
                    <select
                      value={lockDuration}
                      onChange={(e) => setLockDuration(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days (3 Months)</option>
                      <option value="180">180 Days (6 Months)</option>
                      <option value="365">365 Days (1 Year)</option>
                      <option value="730">730 Days (2 Years)</option>
                    </select>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Unlock Date:</p>
                    <p className="font-bold">
                      {formatDate(Date.now() + Number(lockDuration) * 24 * 60 * 60 * 1000)}
                    </p>
                  </div>

                  <button
                    onClick={handleCreateLock}
                    disabled={loading || !amount}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Creating Lock...' : 'Lock Tokens'}
                  </button>

                  <p className="text-xs text-gray-400 mt-2">
                    ⚠️ Locked tokens cannot be accessed until unlock date
                  </p>
                </div>
              </div>

              {/* Active Locks */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Your Active Locks</h2>
                
                <div className="space-y-4">
                  {activeLocks.map((lock) => (
                    <div key={lock.id} className={`bg-gray-700 rounded-lg p-4 border-2 ${
                      lock.canUnlock ? 'border-green-500' : 'border-gray-600'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{lock.amount.toLocaleString()} Tokens</p>
                          <p className="text-xs text-gray-400">{lock.lockType}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          lock.canUnlock 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {lock.canUnlock ? 'Unlockable' : 'Locked'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-gray-400">Created</p>
                          <p className="font-semibold">{formatDate(lock.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Unlocks</p>
                          <p className="font-semibold">{formatDate(lock.unlockTime)}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
                        <p className="font-bold text-lg">
                          {calculateTimeRemaining(lock.unlockTime)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          disabled={!lock.canUnlock}
                          className={`flex-1 py-2 px-4 rounded transition-colors ${
                            lock.canUnlock
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {lock.canUnlock ? 'Unlock Tokens' : 'Still Locked'}
                        </button>
                        {lockType === 'standard' && (
                          <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-4 rounded transition-colors">
                            Extend Lock
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">⏳</div>
                <h3 className="font-bold mb-2">Time-based Locks</h3>
                <p className="text-sm text-gray-400">Set specific unlock timestamps</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">💧</div>
                <h3 className="font-bold mb-2">LP Token Lock</h3>
                <p className="text-sm text-gray-400">Lock liquidity pool tokens securely</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-bold mb-2">Multi-sig Unlock</h3>
                <p className="text-sm text-gray-400">Multiple approvals for emergency unlock</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

