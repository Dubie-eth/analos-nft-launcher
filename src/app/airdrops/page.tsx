'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { airdropService } from '@/services/airdrop-service';
import { AirdropCampaign, UserEligibility } from '@/config/lol-token';
import { ANALOS_PROGRAMS } from '@/config/analos-programs';

export default function AirdropsPage() {
  const { publicKey, connected } = useWallet();
  
  const [campaigns, setCampaigns] = useState<AirdropCampaign[]>([]);
  const [userEligibility, setUserEligibility] = useState<UserEligibility | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [publicKey, connected]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Initialize default campaigns if none exist
      airdropService.initializeDefaultCampaigns();
      
      // Load campaigns and stats
      const campaignList = airdropService.getCampaigns();
      const airdropStats = await airdropService.getAirdropStats();
      
      setCampaigns(campaignList);
      setStats(airdropStats);
      
      // Check user eligibility if wallet is connected
      if (publicKey && connected) {
        await checkUserEligibility();
      }
    } catch (error) {
      console.error('Error loading airdrop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserEligibility = async () => {
    if (!publicKey) return;
    
    try {
      // Check eligibility for the first active campaign
      const activeCampaigns = campaigns.filter(c => c.isActive);
      if (activeCampaigns.length > 0) {
        const eligibility = await airdropService.checkEligibility(
          publicKey.toString(),
          activeCampaigns[0]
        );
        setUserEligibility(eligibility);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const handleClaim = async (campaignId: string, amount: number) => {
    if (!publicKey) return;
    
    setClaiming(true);
    try {
      console.log('Claiming airdrop...', { campaignId, amount });
      
      const signature = await airdropService.claimAirdrop(
        publicKey.toString(),
        campaignId,
        amount
      );
      
      alert(`Successfully claimed ${(amount / 1_000_000).toFixed(2)}M LOL tokens!`);
      
      // Reload data to update stats
      await loadData();
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      alert('Failed to claim airdrop: ' + (error as Error).message);
    } finally {
      setClaiming(false);
    }
  };

  const formatTokenAmount = (amount: number) => {
    return (amount / 1_000_000).toFixed(2);
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

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
            Airdrop Program: <span className="text-green-400">{ANALOS_PROGRAMS.AIRDROP_ENHANCED.toString()}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            LOL Token: <span className="text-green-300">1,000,000,000 LOL</span> (1% allocated for airdrops)
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
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Campaigns</p>
                  <p className="text-3xl font-bold text-green-400">{stats.totalCampaigns}</p>
                  <p className="text-xs text-gray-500 mt-1">Active: {stats.activeCampaigns}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Airdrop</p>
                  <p className="text-3xl font-bold text-blue-400">{formatTokenAmount(stats.totalAirdropAmount)}M</p>
                  <p className="text-xs text-gray-500 mt-1">LOL Tokens</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Claimed</p>
                  <p className="text-3xl font-bold text-purple-400">{formatTokenAmount(stats.totalClaimedAmount)}M</p>
                  <p className="text-xs text-gray-500 mt-1">LOL Tokens</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Claimed Wallets</p>
                  <p className="text-3xl font-bold text-orange-400">{stats.totalClaimedWallets}</p>
                  <p className="text-xs text-gray-500 mt-1">Unique Addresses</p>
                </div>
              </div>
            )}

            {/* User Eligibility */}
            {userEligibility && (
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Your Eligibility Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">LOL Holdings</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(userEligibility.requirements.holdingAmount / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Eligible Amount</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatTokenAmount(userEligibility.eligibleAmount)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <p className={`text-lg font-bold ${userEligibility.isEligible ? 'text-green-400' : 'text-red-400'}`}>
                      {userEligibility.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Campaigns */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No airdrop campaigns available yet.</p>
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const isEligible = userEligibility?.isEligible || false;
                  const eligibleAmount = userEligibility?.eligibleAmount || 0;
                  
                  return (
                    <div
                      key={campaign.id}
                      className={`bg-gray-800 rounded-lg p-6 border ${
                        isEligible ? 'border-green-500' : 'border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{campaign.name}</h3>
                            {isEligible && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Eligible ✓
                              </span>
                            )}
                            {!isEligible && (
                              <span className="px-3 py-1 bg-gray-600 text-gray-400 text-xs rounded-full">
                                Not Eligible
                              </span>
                            )}
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              campaign.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                            }`}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <p className="text-gray-300 mb-4">{campaign.description}</p>
                          
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-400">Total Amount</p>
                              <p className="text-lg font-bold text-green-400">{formatTokenAmount(campaign.totalAmount)}M</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Claimed</p>
                              <p className="text-lg font-bold text-blue-400">{formatTokenAmount(campaign.claimedAmount)}M</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Ends</p>
                              <p className="text-sm font-semibold">{getTimeRemaining(new Date(campaign.endDate))}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-400">Distribution Type</p>
                              <p className="text-sm font-semibold capitalize">{campaign.type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Your Eligible Amount</p>
                              <p className="text-lg font-bold text-purple-400">
                                {formatTokenAmount(eligibleAmount)}M
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-gray-400 mb-4">
                            {isEligible 
                              ? '✅ You are eligible for this airdrop. Click to claim your tokens.'
                              : '❌ You do not meet the requirements for this airdrop.'
                            }
                          </p>
                        </div>

                        <div className="ml-4">
                          {isEligible && eligibleAmount > 0 ? (
                            <button
                              onClick={() => handleClaim(campaign.id, eligibleAmount)}
                              disabled={claiming || !campaign.isActive}
                              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                              {claiming ? 'Claiming...' : 'Claim'}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-gray-700 text-gray-500 font-bold py-3 px-8 rounded-lg cursor-not-allowed"
                            >
                              {!campaign.isActive ? 'Inactive' : 'Not Eligible'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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

