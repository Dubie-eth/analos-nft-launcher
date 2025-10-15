'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { airdropService } from '@/services/airdrop-service';
import { AirdropCampaign, UserEligibility } from '@/config/airdrop-config';

interface AirdropAdminProps {
  className?: string;
}

const AirdropAdmin: React.FC<AirdropAdminProps> = ({ className = '' }) => {
  const { publicKey, connected } = useWallet();
  const [campaigns, setCampaigns] = useState<AirdropCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Admin wallets
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
  ];

  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  useEffect(() => {
    if (isAdmin) {
      loadCampaigns();
      loadStats();
    }
  }, [isAdmin]);

  const loadCampaigns = async () => {
    try {
      const campaignList = airdropService.getCampaigns();
      setCampaigns(campaignList);
      
      if (campaignList.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campaignList[0].id);
        setWhitelist(campaignList[0].whitelist || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadStats = async () => {
    try {
      const airdropStats = await airdropService.getAirdropStats();
      setStats(airdropStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateCampaign = async (campaignData: any) => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      await airdropService.createCampaign(campaignData);
      await loadCampaigns();
      await loadStats();
      setShowCreateForm(false);
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!newAddress.trim() || !selectedCampaign) return;

    try {
      // Validate address
      new PublicKey(newAddress.trim());
      
      const updatedWhitelist = [...whitelist, newAddress.trim()];
      await airdropService.updateWhitelist(selectedCampaign, updatedWhitelist);
      setWhitelist(updatedWhitelist);
      setNewAddress('');
      alert('Address added to whitelist!');
    } catch (error) {
      alert('Invalid wallet address');
    }
  };

  const handleRemoveFromWhitelist = async (address: string) => {
    if (!selectedCampaign) return;

    try {
      const updatedWhitelist = whitelist.filter(addr => addr !== address);
      await airdropService.updateWhitelist(selectedCampaign, updatedWhitelist);
      setWhitelist(updatedWhitelist);
      alert('Address removed from whitelist!');
    } catch (error) {
      alert('Failed to remove address');
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setWhitelist(campaign.whitelist || []);
    }
  };

  if (!isAdmin) {
    return (
      <div className={`bg-red-500/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-red-300 font-semibold mb-2">🔒 Admin Access Required</h3>
        <p className="text-red-200 text-sm">
          Only admin wallets can manage airdrop campaigns and whitelists.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🎁 Airdrop Campaign Management</h2>
        <p className="text-purple-100">
          Manage LOL token airdrop campaigns, whitelists, and distribution settings.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Campaigns</p>
            <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Active Campaigns</p>
            <p className="text-2xl font-bold text-green-400">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Airdrop</p>
            <p className="text-2xl font-bold text-blue-400">
              {(stats.totalAirdropAmount / 1_000_000).toFixed(1)}M LOL
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Claimed</p>
            <p className="text-2xl font-bold text-purple-400">
              {(stats.totalClaimedAmount / 1_000_000).toFixed(1)}M LOL
            </p>
          </div>
        </div>
      )}

      {/* Campaign Management */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Management</h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Selector */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Select Campaign</h4>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => handleCampaignSelect(campaign.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCampaign === campaign.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-gray-900">{campaign.name}</h5>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {(campaign.totalAmount / 1_000_000).toFixed(1)}M LOL
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Whitelist Management */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Whitelist Management</h4>
              
              {/* Add to Whitelist */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddToWhitelist}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Whitelist */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {whitelist.length === 0 ? (
                  <p className="text-gray-500 text-sm">No addresses in whitelist</p>
                ) : (
                  whitelist.map((address, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono text-gray-700">
                        {address.slice(0, 8)}...{address.slice(-8)}
                      </span>
                      <button
                        onClick={() => handleRemoveFromWhitelist(address)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      {selectedCampaign && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          {(() => {
            const campaign = campaigns.find(c => c.id === selectedCampaign);
            if (!campaign) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Info</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {campaign.name}</div>
                    <div><span className="font-medium">Type:</span> {campaign.type}</div>
                    <div><span className="font-medium">Total Amount:</span> {(campaign.totalAmount / 1_000_000).toFixed(1)}M LOL</div>
                    <div><span className="font-medium">Claimed:</span> {(campaign.claimedAmount / 1_000_000).toFixed(1)}M LOL</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Requirements</h4>
                  <div className="space-y-2 text-sm">
                    {campaign.requirements.minHolding && (
                      <div><span className="font-medium">Min Holding:</span> {campaign.requirements.minHolding.toLocaleString()} LOL</div>
                    )}
                    {campaign.requirements.whitelistType && (
                      <div><span className="font-medium">Whitelist Type:</span> {campaign.requirements.whitelistType}</div>
                    )}
                    {campaign.requirements.nftCollections && (
                      <div><span className="font-medium">NFT Collections:</span> {campaign.requirements.nftCollections.length}</div>
                    )}
                    <div><span className="font-medium">Start Date:</span> {campaign.startDate.toLocaleDateString()}</div>
                    <div><span className="font-medium">End Date:</span> {campaign.endDate.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
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
    totalAmount: 1000000,
    minHolding: 1000,
    whitelistType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
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
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (LOL)</label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Holding (LOL)</label>
          <input
            type="number"
            value={formData.minHolding}
            onChange={(e) => setFormData(prev => ({ ...prev, minHolding: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
          required
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setFormData({
            name: '',
            description: '',
            type: 'holdings_based',
            totalAmount: 1000000,
            minHolding: 1000,
            whitelistType: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

export default AirdropAdmin;
