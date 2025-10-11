'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  useEnhancedPrograms, 
  useOTCTrading, 
  useAirdrop, 
  useVesting, 
  useTokenLock 
} from '@/hooks/useEnhancedPrograms';

/**
 * Demo component showing how to use the 5 new enhanced programs
 * 
 * This component demonstrates:
 * - Accessing program IDs
 * - Checking program deployment status
 * - Using program-specific hooks
 */
export default function EnhancedProgramsDemo() {
  const { publicKey } = useWallet();
  const { programs, programIds, getAllProgramStatuses } = useEnhancedPrograms();
  const [programStatuses, setProgramStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Check program deployment status
  useEffect(() => {
    async function checkPrograms() {
      setLoading(true);
      const statuses = await getAllProgramStatuses();
      setProgramStatuses(statuses);
      setLoading(false);
    }
    checkPrograms();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">🚀 Enhanced Programs</h1>
        <p className="text-xl opacity-90">5 New Programs Now Available!</p>
      </div>

      {/* Program Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">📊 Program Deployment Status</h2>
        
        {loading ? (
          <p className="text-gray-500">Checking programs...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(programStatuses).map(([name, deployed]) => (
              <div 
                key={name}
                className={`p-4 rounded-lg border-2 ${
                  deployed 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-2xl">
                    {deployed ? '✅' : '❌'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
                  {programIds[name as keyof typeof programIds]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTC Trading */}
      <OTCTradingSection />

      {/* Airdrop */}
      <AirdropSection />

      {/* Vesting */}
      <VestingSection />

      {/* Token Lock */}
      <TokenLockSection />

      {/* Program IDs Reference */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📋 Quick Reference</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <strong>OTC Enhanced:</strong>
            <br />
            <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
              {programIds.otcEnhanced}
            </code>
          </div>
          <div>
            <strong>Airdrop Enhanced:</strong>
            <br />
            <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
              {programIds.airdropEnhanced}
            </code>
          </div>
          <div>
            <strong>Vesting Enhanced:</strong>
            <br />
            <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
              {programIds.vestingEnhanced}
            </code>
          </div>
          <div>
            <strong>Token Lock Enhanced:</strong>
            <br />
            <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
              {programIds.tokenLockEnhanced}
            </code>
          </div>
          <div>
            <strong>Monitoring System:</strong>
            <br />
            <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
              {programIds.monitoringSystem}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function OTCTradingSection() {
  const { publicKey } = useWallet();
  const { programId } = useOTCTrading();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🤝 OTC Trading</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Create peer-to-peer trades with escrow protection
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">🔄 NFT ↔ Token Swaps</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trade NFTs for tokens directly
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">🔐 Escrow Protection</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All trades secured by escrow
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">👥 Multi-sig Support</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Large trades require approval
          </p>
        </div>
      </div>

      <button
        disabled={!publicKey}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create OTC Offer
      </button>
    </div>
  );
}

function AirdropSection() {
  const { publicKey } = useWallet();
  const { programId } = useAirdrop();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🎁 Airdrops</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Distribute tokens to many wallets efficiently
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">🌳 Merkle Proofs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Efficient on-chain verification
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">⚡ Rate Limiting</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Anti-bot protection built-in
          </p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Claim Tracking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track who has claimed
          </p>
        </div>
      </div>

      <button
        disabled={!publicKey}
        className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Claim Airdrop
      </button>
    </div>
  );
}

function VestingSection() {
  const { publicKey } = useWallet();
  const { programId } = useVesting();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">📅 Token Vesting</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Lock team/investor tokens with time-based release
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">📈 Linear Vesting</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gradual token release
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">⏰ Cliff Periods</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Initial lock duration
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">🚨 Emergency Pause</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Safety controls included
          </p>
        </div>
      </div>

      <button
        disabled={!publicKey}
        className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create Vesting Schedule
      </button>
    </div>
  );
}

function TokenLockSection() {
  const { publicKey } = useWallet();
  const { programId } = useTokenLock();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔒 Token Lock</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Time-locked token escrow for security
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">⏳ Time-based Locks</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set unlock timestamps
          </p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">💧 LP Token Lock</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lock liquidity securely
          </p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">👥 Multi-sig Unlock</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Multiple approvals needed
          </p>
        </div>
      </div>

      <button
        disabled={!publicKey}
        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Lock Tokens
      </button>
    </div>
  );
}

