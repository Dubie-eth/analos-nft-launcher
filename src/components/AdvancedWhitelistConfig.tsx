'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Settings, Users, Coins, Calendar, Shield } from 'lucide-react';

interface TokenRequirement {
  tokenMint: string;
  tokenSymbol: string;
  minBalance: number;
  decimals: number;
}

interface WhitelistPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxMintsPerWallet: number;
  maxTotalMints: number;
  price: number;
  priceMultiplier: number;
  phaseType: 'address' | 'token' | 'social' | 'mixed';
  tokenRequirements: TokenRequirement[];
  socialRequirements: {
    twitter?: boolean;
    discord?: boolean;
    telegram?: boolean;
    instagram?: boolean;
    minFollowers?: number;
    verifiedAccount?: boolean;
  };
  addressWhitelist: string[];
  isActive: boolean;
}

interface AdvancedWhitelistConfigProps {
  onConfigChange: (config: any) => void;
  initialConfig?: any;
}

export default function AdvancedWhitelistConfig({ onConfigChange, initialConfig }: AdvancedWhitelistConfigProps) {
  const [whitelistEnabled, setWhitelistEnabled] = useState(initialConfig?.enabled || false);
  const [phases, setPhases] = useState<WhitelistPhase[]>(initialConfig?.phases || []);
  const [showAddPhase, setShowAddPhase] = useState(false);
  
  const [newPhase, setNewPhase] = useState<WhitelistPhase>({
    id: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxMintsPerWallet: 1,
    maxTotalMints: 100,
    price: 0,
    priceMultiplier: 1.0,
    phaseType: 'token',
    tokenRequirements: [],
    socialRequirements: {},
    addressWhitelist: [],
    isActive: true
  });

  const [newTokenRequirement, setNewTokenRequirement] = useState<TokenRequirement>({
    tokenMint: '',
    tokenSymbol: '',
    minBalance: 0,
    decimals: 6
  });

  const [newAddress, setNewAddress] = useState('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleConfigChange = useCallback((newConfig: any) => {
    onConfigChange(newConfig);
  }, [onConfigChange]);

  const addTokenRequirement = () => {
    if (newTokenRequirement.tokenMint.trim() && newTokenRequirement.tokenSymbol.trim()) {
      const requirements = [...newPhase.tokenRequirements, { ...newTokenRequirement }];
      setNewPhase({ ...newPhase, tokenRequirements: requirements });
      setNewTokenRequirement({
        tokenMint: '',
        tokenSymbol: '',
        minBalance: 0,
        decimals: 6
      });
    }
  };

  const removeTokenRequirement = (index: number) => {
    const requirements = newPhase.tokenRequirements.filter((_, i) => i !== index);
    setNewPhase({ ...newPhase, tokenRequirements: requirements });
  };

  const addAddress = () => {
    if (newAddress.trim()) {
      const addresses = [...newPhase.addressWhitelist, newAddress.trim()];
      setNewPhase({ ...newPhase, addressWhitelist: addresses });
      setNewAddress('');
    }
  };

  const removeAddress = (index: number) => {
    const addresses = newPhase.addressWhitelist.filter((_, i) => i !== index);
    setNewPhase({ ...newPhase, addressWhitelist: addresses });
  };

  const addPhase = () => {
    if (newPhase.name.trim()) {
      const phase = {
        ...newPhase,
        id: generateId()
      };
      
      const updatedPhases = [...phases, phase];
      setPhases(updatedPhases);
      
      // Reset form
      setNewPhase({
        id: '',
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        maxMintsPerWallet: 1,
        maxTotalMints: 100,
        price: 0,
        priceMultiplier: 1.0,
        phaseType: 'token',
        tokenRequirements: [],
        socialRequirements: {},
        addressWhitelist: [],
        isActive: true
      });
      
      setShowAddPhase(false);
      
      // Update parent config
      handleConfigChange({
        enabled: whitelistEnabled,
        phases: updatedPhases
      });
    }
  };

  const removePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    setPhases(updatedPhases);
    handleConfigChange({
      enabled: whitelistEnabled,
      phases: updatedPhases
    });
  };

  const updatePhase = (index: number, updates: Partial<WhitelistPhase>) => {
    const updatedPhases = phases.map((phase, i) => 
      i === index ? { ...phase, ...updates } : phase
    );
    setPhases(updatedPhases);
    handleConfigChange({
      enabled: whitelistEnabled,
      phases: updatedPhases
    });
  };

  const handleWhitelistToggle = (enabled: boolean) => {
    setWhitelistEnabled(enabled);
    handleConfigChange({
      enabled,
      phases
    });
  };

  return (
    <div className="space-y-6">
      {/* Whitelist Toggle */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Advanced Whitelist Configuration</h3>
              <p className="text-sm text-gray-600">Configure multiple whitelist phases with different requirements</p>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={whitelistEnabled}
              onChange={(e) => handleWhitelistToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Whitelist</span>
          </label>
        </div>
      </div>

      {whitelistEnabled && (
        <>
          {/* Existing Phases */}
          {phases.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Whitelist Phases ({phases.length})
              </h4>
              
              {phases.map((phase, index) => (
                <div key={phase.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{phase.name}</h5>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                    </div>
                    <button
                      onClick={() => removePhase(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium ml-1 capitalize">{phase.phaseType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Max/Wallet:</span>
                      <span className="font-medium ml-1">{phase.maxMintsPerWallet}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Supply:</span>
                      <span className="font-medium ml-1">{phase.maxTotalMints}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium ml-1">
                        {phase.price === 0 ? 'FREE' : `${phase.price} SOL`}
                      </span>
                    </div>
                  </div>
                  
                  {phase.tokenRequirements.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">Token Requirements:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {phase.tokenRequirements.map((req, reqIndex) => (
                          <span key={reqIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {req.tokenSymbol}: {req.minBalance.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {phase.addressWhitelist.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">Addresses: {phase.addressWhitelist.length}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Phase */}
          {!showAddPhase ? (
            <button
              onClick={() => setShowAddPhase(true)}
              className="w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Whitelist Phase</span>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Add New Whitelist Phase
              </h4>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase Name *
                    </label>
                    <input
                      type="text"
                      value={newPhase.name}
                      onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Early Access, Token Holders"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phase Type
                    </label>
                    <select
                      value={newPhase.phaseType}
                      onChange={(e) => setNewPhase({ ...newPhase, phaseType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="token">Token Holders</option>
                      <option value="address">Address Whitelist</option>
                      <option value="social">Social Verification</option>
                      <option value="mixed">Mixed Requirements</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newPhase.description}
                    onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe this whitelist phase"
                  />
                </div>

                {/* Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newPhase.startDate}
                      onChange={(e) => setNewPhase({ ...newPhase, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newPhase.endDate}
                      onChange={(e) => setNewPhase({ ...newPhase, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Minting Limits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Mints Per Wallet
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPhase.maxMintsPerWallet}
                      onChange={(e) => setNewPhase({ ...newPhase, maxMintsPerWallet: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Phase Supply
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPhase.maxTotalMints}
                      onChange={(e) => setNewPhase({ ...newPhase, maxTotalMints: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (SOL)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPhase.price}
                      onChange={(e) => setNewPhase({ ...newPhase, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Token Requirements */}
                {(newPhase.phaseType === 'token' || newPhase.phaseType === 'mixed') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Token Requirements
                    </h5>
                    
                    <div className="space-y-3">
                      {newPhase.tokenRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{req.tokenSymbol}:</span>
                          <span className="text-sm">{req.minBalance.toLocaleString()}</span>
                          <button
                            onClick={() => removeTokenRequirement(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Token Symbol"
                          value={newTokenRequirement.tokenSymbol}
                          onChange={(e) => setNewTokenRequirement({ ...newTokenRequirement, tokenSymbol: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Token Mint Address"
                          value={newTokenRequirement.tokenMint}
                          onChange={(e) => setNewTokenRequirement({ ...newTokenRequirement, tokenMint: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Min Balance"
                          value={newTokenRequirement.minBalance}
                          onChange={(e) => setNewTokenRequirement({ ...newTokenRequirement, minBalance: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={addTokenRequirement}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Whitelist */}
                {(newPhase.phaseType === 'address' || newPhase.phaseType === 'mixed') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Address Whitelist
                    </h5>
                    
                    <div className="space-y-2">
                      {newPhase.addressWhitelist.map((address, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-sm font-mono">{address.slice(0, 8)}...{address.slice(-8)}</span>
                          <button
                            onClick={() => removeAddress(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Wallet Address"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <button
                          onClick={addAddress}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Requirements */}
                {(newPhase.phaseType === 'social' || newPhase.phaseType === 'mixed') && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Social Verification</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPhase.socialRequirements.twitter}
                          onChange={(e) => setNewPhase({
                            ...newPhase,
                            socialRequirements: { ...newPhase.socialRequirements, twitter: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Twitter</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPhase.socialRequirements.discord}
                          onChange={(e) => setNewPhase({
                            ...newPhase,
                            socialRequirements: { ...newPhase.socialRequirements, discord: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Discord</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPhase.socialRequirements.telegram}
                          onChange={(e) => setNewPhase({
                            ...newPhase,
                            socialRequirements: { ...newPhase.socialRequirements, telegram: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Telegram</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPhase.socialRequirements.instagram}
                          onChange={(e) => setNewPhase({
                            ...newPhase,
                            socialRequirements: { ...newPhase.socialRequirements, instagram: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Instagram</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={addPhase}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Phase
                  </button>
                  <button
                    onClick={() => setShowAddPhase(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
