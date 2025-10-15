'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { creatorAirdropService } from '@/services/creator-airdrop-service';
import { AirdropCampaign, TokenMetadata, NFTCollectionMetadata, EligibilityCriteria, CREATOR_AIRDROP_CONFIG } from '@/config/airdrop-config';

interface CreatorAirdropManagerProps {
  className?: string;
}

const CreatorAirdropManager: React.FC<CreatorAirdropManagerProps> = ({ className = '' }) => {
  const { publicKey, connected } = useWallet();
  const [campaigns, setCampaigns] = useState<AirdropCampaign[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AirdropCampaign | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activatingCampaign, setActivatingCampaign] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadData();
    }
  }, [connected, publicKey]);

  const loadData = async () => {
    try {
      const creatorCampaigns = creatorAirdropService.getCreatorCampaignsByWallet(
        publicKey?.toString() || ''
      );
      const airdropStats = await creatorAirdropService.getCreatorAirdropStats();
      
      setCampaigns(creatorCampaigns);
      setStats(airdropStats);
    } catch (error) {
      console.error('Error loading creator airdrop data:', error);
    }
  };

  const handleCreateCampaign = async (campaignData: any) => {
    if (!publicKey) return;

    setLoading(true);
    try {
      await creatorAirdropService.createCreatorCampaign(campaignData, publicKey.toString());
      await loadData();
      setShowCreateForm(false);
      alert('Campaign created successfully! You can now activate it by depositing tokens and paying the platform fee.');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateCampaign = async (campaign: AirdropCampaign, tokenDeposit: number, feePayment: number) => {
    if (!publicKey) return;

    setActivatingCampaign(true);
    try {
      const txSignature = await creatorAirdropService.activateCampaign(
        campaign.id,
        publicKey.toString(),
        tokenDeposit,
        feePayment
      );
      
      await loadData();
      setShowActivationModal(false);
      alert(`Campaign activated successfully! Transaction: ${txSignature}`);
    } catch (error) {
      console.error('Error activating campaign:', error);
      alert('Failed to activate campaign: ' + (error as Error).message);
    } finally {
      setActivatingCampaign(false);
    }
  };

  const formatTokenAmount = (amount: number, decimals: number = 9) => {
    return (amount / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
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

  if (!connected || !publicKey) {
    return (
      <div className={`bg-red-500/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-red-300 font-semibold mb-2">🔒 Wallet Connection Required</h3>
        <p className="text-red-200 text-sm">
          Please connect your wallet to create and manage airdrop campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🎁 Creator Airdrop Management</h2>
        <p className="text-purple-100">
          Create custom airdrop campaigns for your token holders and NFT collectors.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Your Campaigns</p>
            <p className="text-2xl font-bold text-white">{campaigns.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Created</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Active Campaigns</p>
            <p className="text-2xl font-bold text-green-400">
              {campaigns.filter(c => c.isActive).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Currently Running</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Airdrop</p>
            <p className="text-2xl font-bold text-blue-400">
              {formatTokenAmount(
                campaigns.reduce((sum, c) => sum + c.airdropToken.totalAmount, 0),
                9
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">Tokens</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Claims</p>
            <p className="text-2xl font-bold text-purple-400">
              {campaigns.reduce((sum, c) => sum + c.totalClaims, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Successfully Claimed</p>
          </div>
        </div>
      )}

      {/* Campaign Management */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Your Airdrop Campaigns</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {showCreateForm ? 'Cancel' : 'Create Campaign'}
            </button>
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <CreateCampaignForm onSubmit={handleCreateCampaign} loading={loading} />
          </div>
        )}

        {/* Campaign List */}
        <div className="p-6">
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎁</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Yet</h4>
              <p className="text-gray-600 mb-4">
                Create your first airdrop campaign to reward your token holders and NFT collectors.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCampaign?.id === campaign.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {campaign.airdropToken.symbol}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Amount</p>
                          <p className="font-semibold">
                            {formatTokenAmount(campaign.airdropToken.totalAmount, campaign.airdropToken.decimals)} {campaign.airdropToken.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Claimed</p>
                          <p className="font-semibold">
                            {formatTokenAmount(campaign.airdropToken.claimedAmount, campaign.airdropToken.decimals)} {campaign.airdropToken.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ends</p>
                          <p className="font-semibold">{getTimeRemaining(new Date(campaign.endDate))}</p>
                        </div>
                      </div>
                      
                      {/* Campaign Actions */}
                      <div className="mt-4 flex space-x-2">
                        {!campaign.isActive && campaign.creator.walletAddress === publicKey?.toString() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCampaign(campaign);
                              setShowActivationModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                          >
                            Activate Campaign
                          </button>
                        )}
                        {campaign.platformFee && (
                          <div className="text-xs text-gray-500 mt-2">
                            Platform Fee: {formatTokenAmount(campaign.platformFee)} tokens ({CREATOR_AIRDROP_CONFIG.PLATFORM_FEE_PERCENTAGE}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Details */}
      {selectedCampaign && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Campaign Info</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {selectedCampaign.name}</div>
                <div><span className="font-medium">Type:</span> {selectedCampaign.type.replace('_', ' ')}</div>
                <div><span className="font-medium">Token:</span> {selectedCampaign.airdropToken.name} ({selectedCampaign.airdropToken.symbol})</div>
                <div><span className="font-medium">Total Amount:</span> {formatTokenAmount(selectedCampaign.airdropToken.totalAmount, selectedCampaign.airdropToken.decimals)} {selectedCampaign.airdropToken.symbol}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    selectedCampaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCampaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Eligibility Requirements</h4>
              <div className="space-y-2 text-sm">
                {selectedCampaign.eligibility.tokenHoldings && selectedCampaign.eligibility.tokenHoldings.length > 0 && (
                  <div>
                    <span className="font-medium">Token Holdings:</span>
                    <ul className="ml-4 mt-1">
                      {selectedCampaign.eligibility.tokenHoldings.map((req, index) => (
                        <li key={index}>
                          • {req.symbol || 'Token'}: {req.minAmount.toLocaleString()} minimum
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedCampaign.eligibility.nftOwnership && selectedCampaign.eligibility.nftOwnership.length > 0 && (
                  <div>
                    <span className="font-medium">NFT Ownership:</span>
                    <ul className="ml-4 mt-1">
                      {selectedCampaign.eligibility.nftOwnership.map((req, index) => (
                        <li key={index}>
                          • {req.collectionName || 'Collection'}: {req.minCount} minimum
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedCampaign.eligibility.whitelist && selectedCampaign.eligibility.whitelist.length > 0 && (
                  <div>
                    <span className="font-medium">Whitelist:</span> {selectedCampaign.eligibility.whitelist.length} addresses
                  </div>
                )}
                
                <div><span className="font-medium">Start Date:</span> {selectedCampaign.startDate.toLocaleDateString()}</div>
                <div><span className="font-medium">End Date:</span> {selectedCampaign.endDate.toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Activation Modal */}
      {showActivationModal && selectedCampaign && (
        <CampaignActivationModal
          campaign={selectedCampaign}
          onActivate={handleActivateCampaign}
          onClose={() => setShowActivationModal(false)}
          loading={activatingCampaign}
        />
      )}
    </div>
  );
};

// Campaign Activation Modal Component
const CampaignActivationModal: React.FC<{
  campaign: AirdropCampaign;
  onActivate: (campaign: AirdropCampaign, tokenDeposit: number, feePayment: number) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ campaign, onActivate, onClose, loading }) => {
  const [tokenDeposit, setTokenDeposit] = useState(campaign.airdropToken.totalAmount);
  const [feePayment, setFeePayment] = useState(campaign.platformFee || 0);

  const formatTokenAmount = (amount: number, decimals: number = 9) => {
    return (amount / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActivate(campaign, tokenDeposit, feePayment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Activate Campaign: {campaign.name}</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">💰 Platform Fee Required</h3>
          <p className="text-yellow-700 text-sm">
            To activate this campaign, you must deposit the airdrop tokens and pay the platform fee of{' '}
            <strong>{formatTokenAmount(campaign.platformFee || 0)} tokens ({CREATOR_AIRDROP_CONFIG.PLATFORM_FEE_PERCENTAGE}%)</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Deposit Amount ({campaign.airdropToken.symbol})
              </label>
              <input
                type="number"
                value={tokenDeposit / Math.pow(10, campaign.airdropToken.decimals)}
                onChange={(e) => setTokenDeposit(parseFloat(e.target.value) * Math.pow(10, campaign.airdropToken.decimals))}
                min={campaign.airdropToken.totalAmount / Math.pow(10, campaign.airdropToken.decimals)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {formatTokenAmount(campaign.airdropToken.totalAmount, campaign.airdropToken.decimals)} {campaign.airdropToken.symbol}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Fee Payment (Tokens)
              </label>
              <input
                type="number"
                value={feePayment / Math.pow(10, campaign.airdropToken.decimals)}
                onChange={(e) => setFeePayment(parseFloat(e.target.value) * Math.pow(10, campaign.airdropToken.decimals))}
                min={(campaign.platformFee || 0) / Math.pow(10, campaign.airdropToken.decimals)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {formatTokenAmount(campaign.platformFee || 0, campaign.airdropToken.decimals)} tokens
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Token Deposit:</span>
                <span className="font-medium">{formatTokenAmount(tokenDeposit, campaign.airdropToken.decimals)} {campaign.airdropToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="font-medium">{formatTokenAmount(feePayment, campaign.airdropToken.decimals)} tokens</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Cost:</span>
                <span>{formatTokenAmount(tokenDeposit + feePayment, campaign.airdropToken.decimals)} tokens</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || tokenDeposit < campaign.airdropToken.totalAmount || feePayment < (campaign.platformFee || 0)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Activating...' : 'Activate Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Campaign Form Component
const CreateCampaignForm: React.FC<{
  onSubmit: (data: any) => void;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'holdings_based' as const,
    airdropToken: {
      mintAddress: '',
      symbol: '',
      name: '',
      decimals: 9,
    },
    totalAmount: 1000000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eligibility: {
      tokenHoldings: [] as any[],
      nftOwnership: [] as any[],
      whitelist: [] as string[],
    },
  });

  const [showTokenForm, setShowTokenForm] = useState(false);
  const [showNFTForm, setShowNFTForm] = useState(false);
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.airdropToken.mintAddress) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate eligibility criteria
    const hasEligibility = 
      formData.eligibility.tokenHoldings.length > 0 ||
      formData.eligibility.nftOwnership.length > 0 ||
      formData.eligibility.whitelist.length > 0;

    if (!hasEligibility) {
      alert('Please add at least one eligibility requirement');
      return;
    }

    onSubmit(formData);
  };

  const addTokenRequirement = () => {
    const mintAddress = prompt('Enter token mint address:');
    const minAmount = prompt('Enter minimum amount required:');
    
    if (mintAddress && minAmount) {
      setFormData(prev => ({
        ...prev,
        eligibility: {
          ...prev.eligibility,
          tokenHoldings: [
            ...prev.eligibility.tokenHoldings,
            {
              mintAddress: mintAddress.trim(),
              minAmount: parseInt(minAmount),
              symbol: 'TOKEN', // Would be fetched from metadata
              name: 'Token',
            }
          ]
        }
      }));
    }
  };

  const addNFTRequirement = () => {
    const collectionAddress = prompt('Enter NFT collection address:');
    const minCount = prompt('Enter minimum NFT count required:');
    
    if (collectionAddress && minCount) {
      setFormData(prev => ({
        ...prev,
        eligibility: {
          ...prev.eligibility,
          nftOwnership: [
            ...prev.eligibility.nftOwnership,
            {
              collectionAddress: collectionAddress.trim(),
              minCount: parseInt(minCount),
              collectionName: 'Collection', // Would be fetched from metadata
            }
          ]
        }
      }));
    }
  };

  const addWhitelistAddress = () => {
    if (newAddress.trim()) {
      try {
        new PublicKey(newAddress.trim()); // Validate address
        setWhitelistAddresses(prev => [...prev, newAddress.trim()]);
        setFormData(prev => ({
          ...prev,
          eligibility: {
            ...prev.eligibility,
            whitelist: [...prev.eligibility.whitelist, newAddress.trim()]
          }
        }));
        setNewAddress('');
      } catch (error) {
        alert('Invalid wallet address');
      }
    }
  };

  const removeWhitelistAddress = (address: string) => {
    setWhitelistAddresses(prev => prev.filter(addr => addr !== address));
    setFormData(prev => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        whitelist: prev.eligibility.whitelist.filter(addr => addr !== address)
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="holdings_based">Holdings Based</option>
            <option value="equal_share">Equal Share</option>
            <option value="whitelist">Whitelist</option>
            <option value="nft_based">NFT Based</option>
            <option value="creator_defined">Creator Defined</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Mint Address *</label>
          <input
            type="text"
            value={formData.airdropToken.mintAddress}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              airdropToken: { ...prev.airdropToken, mintAddress: e.target.value }
            }))}
            placeholder="Enter SPL token mint address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
          required
        />
      </div>

      {/* Eligibility Requirements */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Eligibility Requirements</h4>
        
        {/* Token Holdings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-gray-700">Token Holdings</h5>
            <button
              type="button"
              onClick={addTokenRequirement}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Token Requirement
            </button>
          </div>
          {formData.eligibility.tokenHoldings.length > 0 ? (
            <div className="space-y-2">
              {formData.eligibility.tokenHoldings.map((req, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                  <span className="font-medium">{req.symbol}:</span> {req.minAmount.toLocaleString()} minimum
                  <span className="text-gray-500 ml-2">({req.mintAddress.slice(0, 8)}...)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No token requirements added</p>
          )}
        </div>

        {/* NFT Ownership */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-gray-700">NFT Ownership</h5>
            <button
              type="button"
              onClick={addNFTRequirement}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Add NFT Requirement
            </button>
          </div>
          {formData.eligibility.nftOwnership.length > 0 ? (
            <div className="space-y-2">
              {formData.eligibility.nftOwnership.map((req, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                  <span className="font-medium">{req.collectionName}:</span> {req.minCount} minimum
                  <span className="text-gray-500 ml-2">({req.collectionAddress.slice(0, 8)}...)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No NFT requirements added</p>
          )}
        </div>

        {/* Whitelist */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-gray-700">Whitelist</h5>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={addWhitelistAddress}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
              >
                Add
              </button>
            </div>
          </div>
          {whitelistAddresses.length > 0 ? (
            <div className="space-y-1">
              {whitelistAddresses.map((address, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                  <span className="font-mono">{address.slice(0, 8)}...{address.slice(-8)}</span>
                  <button
                    type="button"
                    onClick={() => removeWhitelistAddress(address)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No whitelisted addresses</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setFormData({
            name: '',
            description: '',
            type: 'holdings_based',
            airdropToken: { mintAddress: '', symbol: '', name: '', decimals: 9 },
            totalAmount: 1000000,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            eligibility: { tokenHoldings: [], nftOwnership: [], whitelist: [] },
          })}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </form>
  );
};

export default CreatorAirdropManager;
