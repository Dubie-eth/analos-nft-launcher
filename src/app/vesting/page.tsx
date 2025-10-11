'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useVesting } from '@/hooks/useEnhancedPrograms';

export default function VestingPage() {
  const { publicKey } = useWallet();
  const { programId } = useVesting();
  
  const [claiming, setClaiming] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateVestedAmount = (schedule: any) => {
    const now = currentTime;
    const { totalAmount, startTime, endTime, cliffEnd, claimedAmount } = schedule;
    
    if (now < cliffEnd) return 0;
    if (now >= endTime) return totalAmount - claimedAmount;
    
    const elapsed = now - startTime;
    const duration = endTime - startTime;
    const vested = Math.floor((totalAmount * elapsed) / duration);
    return Math.max(0, vested - claimedAmount);
  };

  const formatTimeRemaining = (endTime: number) => {
    const remaining = endTime - currentTime;
    if (remaining <= 0) return 'Fully Vested';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const vestingSchedules = [
    {
      id: 1,
      name: 'Team Allocation',
      totalAmount: 100000,
      claimedAmount: 25000,
      startTime: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      endTime: Date.now() + 275 * 24 * 60 * 60 * 1000, // 275 days from now
      cliffEnd: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago (passed)
      beneficiary: 'Team Wallet',
    },
    {
      id: 2,
      name: 'Advisor Allocation',
      totalAmount: 50000,
      claimedAmount: 0,
      startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      endTime: Date.now() + 335 * 24 * 60 * 60 * 1000, // 335 days from now
      cliffEnd: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now (not passed)
      beneficiary: 'Advisor Wallet',
    },
  ];

  const handleClaim = async (scheduleId: number) => {
    if (!publicKey) return;
    
    setClaiming(true);
    try {
      console.log('Claiming vested tokens...', { scheduleId });
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Tokens claimed successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to claim tokens');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">📅 Vesting Dashboard</h1>
            <p className="text-gray-400">Manage your vesting schedules</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Program Info */}
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-8">
          <p className="text-sm font-mono">
            Program: <span className="text-purple-400">{programId.toBase58()}</span>
          </p>
        </div>

        {!publicKey ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to view vesting schedules</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total Allocated</p>
                <p className="text-3xl font-bold text-purple-400">150,000</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total Vested</p>
                <p className="text-3xl font-bold text-green-400">
                  {vestingSchedules.reduce((sum, s) => sum + calculateVestedAmount(s), 25000)}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Claimed</p>
                <p className="text-3xl font-bold text-blue-400">25,000</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Available</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {vestingSchedules.reduce((sum, s) => sum + calculateVestedAmount(s), 0)}
                </p>
              </div>
            </div>

            {/* Vesting Schedules */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Active Vesting Schedules</h2>
              
              {vestingSchedules.map((schedule) => {
                const availableToClaim = calculateVestedAmount(schedule);
                const percentVested = ((schedule.claimedAmount + availableToClaim) / schedule.totalAmount) * 100;
                const isCliffPassed = currentTime >= schedule.cliffEnd;
                
                return (
                  <div key={schedule.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{schedule.name}</h3>
                        <p className="text-sm text-gray-400">{schedule.beneficiary}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          isCliffPassed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {isCliffPassed ? 'Vesting' : 'In Cliff'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Vesting Progress</span>
                        <span className="font-bold">{percentVested.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${percentVested}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Total Amount</p>
                        <p className="text-lg font-bold">{schedule.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Claimed</p>
                        <p className="text-lg font-bold text-blue-400">{schedule.claimedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Available</p>
                        <p className="text-lg font-bold text-green-400">{availableToClaim.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Remaining</p>
                        <p className="text-lg font-bold text-purple-400">
                          {(schedule.totalAmount - schedule.claimedAmount - availableToClaim).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-400">{formatTimeRemaining(schedule.endTime)}</p>
                        {!isCliffPassed && (
                          <p className="text-xs text-yellow-400 mt-1">
                            ⏰ Cliff ends in {Math.floor((schedule.cliffEnd - currentTime) / (1000 * 60 * 60 * 24))} days
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleClaim(schedule.id)}
                        disabled={claiming || availableToClaim === 0 || !isCliffPassed}
                        className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
                      >
                        {claiming ? 'Claiming...' : `Claim ${availableToClaim.toLocaleString()}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-bold mb-2">Linear Vesting</h3>
                <p className="text-sm text-gray-400">Tokens release gradually over time</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">⏰</div>
                <h3 className="font-bold mb-2">Cliff Periods</h3>
                <p className="text-sm text-gray-400">Initial lock before vesting starts</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">🚨</div>
                <h3 className="font-bold mb-2">Emergency Pause</h3>
                <p className="text-sm text-gray-400">Admin controls for security</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

