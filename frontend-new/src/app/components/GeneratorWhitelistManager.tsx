'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, Calendar, Star, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { generatorWhitelistService, GeneratorWhitelistPhase } from '@/lib/generator-whitelist-service';

interface GeneratorWhitelistManagerProps {
  isAdmin?: boolean;
}

export default function GeneratorWhitelistManager({ isAdmin = false }: GeneratorWhitelistManagerProps) {
  const [whitelistPhases, setWhitelistPhases] = useState<GeneratorWhitelistPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [editingPhase, setEditingPhase] = useState<GeneratorWhitelistPhase | null>(null);
  const [newPhase, setNewPhase] = useState<Partial<GeneratorWhitelistPhase>>({});
  const [manualWhitelistAddress, setManualWhitelistAddress] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');

  useEffect(() => {
    loadWhitelistPhases();
  }, []);

  const loadWhitelistPhases = () => {
    const config = generatorWhitelistService.getCurrentConfig();
    setWhitelistPhases(config.whitelistPhases);
    setLoading(false);
  };

  const addToManualWhitelist = () => {
    if (!manualWhitelistAddress || !selectedPhaseId) {
      alert('Please enter wallet address and select a phase');
      return;
    }

    const success = generatorWhitelistService.addToManualWhitelist(manualWhitelistAddress, selectedPhaseId);
    if (success) {
      loadWhitelistPhases();
      setManualWhitelistAddress('');
      setSelectedPhaseId('');
      alert('Wallet added to manual whitelist');
    } else {
      alert('Failed to add wallet to whitelist');
    }
  };

  const removeFromManualWhitelist = (walletAddress: string, phaseId: string) => {
    const success = generatorWhitelistService.removeFromManualWhitelist(walletAddress, phaseId);
    if (success) {
      loadWhitelistPhases();
      alert('Wallet removed from manual whitelist');
    } else {
      alert('Failed to remove wallet from whitelist');
    }
  };

  const toggleGeneratorAccess = () => {
    const config = generatorWhitelistService.getCurrentConfig();
    if (config.generatorEnabled) {
      generatorWhitelistService.disableGenerator();
    } else {
      generatorWhitelistService.enableGenerator();
    }
    loadWhitelistPhases();
  };

  const emergencyShutdown = () => {
    if (confirm('Are you sure you want to activate emergency shutdown? This will immediately disable generator access for all users.')) {
      generatorWhitelistService.emergencyShutdown();
      loadWhitelistPhases();
      alert('Emergency shutdown activated');
    }
  };

  const getPhaseStatusColor = (phase: GeneratorWhitelistPhase) => {
    if (phase.isActive) return 'bg-green-500/20 text-green-300';
    if (phase.isUpcoming) return 'bg-yellow-500/20 text-yellow-300';
    if (phase.isCompleted) return 'bg-gray-500/20 text-gray-300';
    return 'bg-red-500/20 text-red-300';
  };

  const getPhaseStatusIcon = (phase: GeneratorWhitelistPhase) => {
    if (phase.isActive) return <CheckCircle className="w-4 h-4" />;
    if (phase.isUpcoming) return <Clock className="w-4 h-4" />;
    if (phase.isCompleted) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const config = generatorWhitelistService.getCurrentConfig();
  const stats = generatorWhitelistService.getAccessStatistics();

  return (
    <div className="space-y-6">
      {/* Generator Status */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Generator Access Control
          </h3>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={toggleGeneratorAccess}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  config.generatorEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {config.generatorEnabled ? 'Disable Generator' : 'Enable Generator'}
              </button>
              <button
                onClick={emergencyShutdown}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Emergency Shutdown
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.totalEligibleWallets}</div>
            <div className="text-white/70 text-sm">Eligible Wallets</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.totalCollectionsCreated}</div>
            <div className="text-white/70 text-sm">Collections Created</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.activePhases}</div>
            <div className="text-white/70 text-sm">Active Phases</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.upcomingPhases}</div>
            <div className="text-white/70 text-sm">Upcoming Phases</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="text-white/70">Generator Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            config.generatorEnabled && !config.globalSettings.emergencyShutdown
              ? 'bg-green-500/20 text-green-300'
              : 'bg-red-500/20 text-red-300'
          }`}>
            {config.generatorEnabled && !config.globalSettings.emergencyShutdown ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-white/70">Public Access:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            config.publicAccess ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {config.publicAccess ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-white/70">Whitelist Only:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            config.whitelistOnly ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
          }`}>
            {config.whitelistOnly ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Whitelist Phases */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Whitelist Phases
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowAddPhase(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Phase
            </button>
          )}
        </div>

        <div className="space-y-4">
          {whitelistPhases.map((phase) => (
            <div key={phase.id} className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium">{phase.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getPhaseStatusColor(phase)}`}>
                    {getPhaseStatusIcon(phase)}
                    {phase.isActive ? 'Active' : phase.isUpcoming ? 'Upcoming' : phase.isCompleted ? 'Completed' : 'Inactive'}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPhase(phase)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-white/70 mb-4">{phase.description}</p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-medium mb-2">Requirements</h5>
                  <div className="space-y-2 text-sm">
                    {phase.requirements.tokenHoldings && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Token Holdings:</span>
                        <span className="font-medium">
                          {phase.requirements.tokenHoldings.minimumBalance.toLocaleString()} {phase.requirements.tokenHoldings.tokenSymbol}
                        </span>
                      </div>
                    )}
                    {phase.requirements.socialVerification && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Social Score:</span>
                        <span className="font-medium">
                          {phase.requirements.socialVerification.minimumScore} points
                        </span>
                      </div>
                    )}
                    {phase.requirements.manualWhitelist && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Manual Whitelist:</span>
                        <span className="font-medium">
                          {phase.requirements.manualWhitelist.walletAddresses.length} wallets
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Benefits</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">Max Collections:</span>
                      <span className="font-medium">{phase.benefits.maxCollectionsPerWallet}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">Priority Access:</span>
                      <span className="font-medium">{phase.benefits.priorityAccess ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/70">Advanced Features:</span>
                      <span className="font-medium">{phase.benefits.advancedFeatures ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-white/70">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/70">
                    Eligible: {phase.statistics.totalEligibleWallets}
                  </span>
                  <span className="text-white/70">
                    Created: {phase.statistics.totalCollectionsCreated}
                  </span>
                  <span className="text-white/70">
                    Remaining: {phase.statistics.remainingSlots}
                  </span>
                </div>
              </div>

              {/* Manual Whitelist Management */}
              {phase.requirements.manualWhitelist && isAdmin && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h5 className="font-medium mb-3">Manual Whitelist Management</h5>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={manualWhitelistAddress}
                      onChange={(e) => setManualWhitelistAddress(e.target.value)}
                      placeholder="Wallet address"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50"
                    />
                    <select
                      value={selectedPhaseId}
                      onChange={(e) => setSelectedPhaseId(e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    >
                      <option value="">Select Phase</option>
                      <option value={phase.id}>{phase.name}</option>
                    </select>
                    <button
                      onClick={addToManualWhitelist}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {phase.requirements.manualWhitelist.walletAddresses.map((address, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <span className="font-mono text-sm">{address}</span>
                        <button
                          onClick={() => removeFromManualWhitelist(address, phase.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Access Level Distribution */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Access Level Distribution
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">VIP Access</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.accessLevels.vip}</div>
            <div className="text-white/70 text-sm">wallets</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Premium Access</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.accessLevels.premium}</div>
            <div className="text-white/70 text-sm">wallets</div>
          </div>
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Basic Access</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.accessLevels.basic}</div>
            <div className="text-white/70 text-sm">wallets</div>
          </div>
        </div>
      </div>
    </div>
  );
}
