'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAirdrop } from '@/hooks/useEnhancedPrograms';

export default function AirdropsPage() {
  const { publicKey } = useWallet();
  const { programId } = useAirdrop();
  
  const [claiming, setClaiming] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  const handleClaim = async (campaignId: number, amount: number) => {
    if (!publicKey) return;
    
    setClaiming(true);
    try {
      console.log('Claiming airdrop...', { campaignId, amount });
      
      // Simulate claim
      await new Promise(resolve => setTimeout(resolve, 1500));
      setClaimedAmount(amount);
      alert(`Successfully claimed ${amount} tokens!`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to claim airdrop');
    } finally {
      setClaiming(false);
    }
  };

  const campaigns = [
    {
      id: 1,
      name: 'Early Supporter Airdrop',
      amount: 1000,
      eligible: true,
      claimed: false,
      ends: 'In 7 days',
    },
    {
      id: 2,
      name: 'NFT Holder Rewards',
      amount: 500,
      eligible: true,
      claimed: false,
      ends: 'In 14 days',
    },
    {
      id: 3,
      name: 'Community Contributor',
      amount: 2500,
      eligible: false,
      claimed: false,
      ends: 'In 30 days',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎁 Airdrops</h1>
            <p className="text-gray-400">Claim your token airdrops</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Program Info */}
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-8">
          <p className="text-sm font-mono">
            Program: <span className="text-green-400">{programId.toBase58()}</span>
          </p>
        </div>

        {!publicKey ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to check eligibility</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total Eligible</p>
                <p className="text-3xl font-bold text-green-400">3,500</p>
                <p className="text-xs text-gray-500 mt-1">Tokens</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Claimed</p>
                <p className="text-3xl font-bold text-blue-400">{claimedAmount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Tokens</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Remaining</p>
                <p className="text-3xl font-bold text-purple-400">{3500 - (claimedAmount || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Tokens</p>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
              
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`bg-gray-800 rounded-lg p-6 border ${
                    campaign.eligible ? 'border-green-500' : 'border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{campaign.name}</h3>
                        {campaign.eligible && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Eligible ✓
                          </span>
                        )}
                        {!campaign.eligible && (
                          <span className="px-3 py-1 bg-gray-600 text-gray-400 text-xs rounded-full">
                            Not Eligible
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Amount</p>
                          <p className="text-2xl font-bold text-green-400">{campaign.amount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Ends</p>
                          <p className="text-lg font-semibold">{campaign.ends}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-400 mb-4">
                        {campaign.eligible 
                          ? '✅ You are eligible for this airdrop. Click to claim your tokens.'
                          : '❌ You do not meet the requirements for this airdrop.'
                        }
                      </p>
                    </div>

                    <div className="ml-4">
                      {campaign.eligible && !campaign.claimed ? (
                        <button
                          onClick={() => handleClaim(campaign.id, campaign.amount)}
                          disabled={claiming}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                          {claiming ? 'Claiming...' : 'Claim'}
                        </button>
                      ) : campaign.claimed ? (
                        <button
                          disabled
                          className="bg-gray-600 text-gray-400 font-bold py-3 px-8 rounded-lg cursor-not-allowed"
                        >
                          Claimed ✓
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-700 text-gray-500 font-bold py-3 px-8 rounded-lg cursor-not-allowed"
                        >
                          Ineligible
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">🌳</div>
                <h3 className="font-bold mb-2">Merkle Proofs</h3>
                <p className="text-sm text-gray-400">Efficient on-chain verification</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-bold mb-2">Rate Limiting</h3>
                <p className="text-sm text-gray-400">Anti-bot protection built-in</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold mb-2">Claim Tracking</h3>
                <p className="text-sm text-gray-400">Real-time claim monitoring</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

