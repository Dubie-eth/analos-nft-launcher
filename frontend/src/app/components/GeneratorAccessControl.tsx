'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Users, Shield, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react';
import { generatorWhitelistService, GeneratorWhitelistPhase } from '@/lib/generator-whitelist-service';

interface GeneratorAccessControlProps {
  walletAddress?: string;
  onAccessGranted: () => void;
  onAccessDenied: (reason: string) => void;
}

export default function GeneratorAccessControl({ 
  walletAddress, 
  onAccessGranted, 
  onAccessDenied 
}: GeneratorAccessControlProps) {
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      checkAccess();
    }
  }, [walletAddress]);

  const checkAccess = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const info = await generatorWhitelistService.checkGeneratorAccess(walletAddress);
      setAccessInfo(info);
      
      if (info.hasAccess) {
        onAccessGranted();
      } else {
        onAccessDenied(info.reason || 'Access denied');
      }
    } catch (error) {
      console.error('Error checking generator access:', error);
      onAccessDenied('Error checking access');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'vip': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'premium': return <Shield className="w-5 h-5 text-purple-500" />;
      case 'basic': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Lock className="w-5 h-5 text-red-500" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'vip': return 'from-yellow-500 to-orange-500';
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'basic': return 'from-green-500 to-blue-500';
      default: return 'from-red-500 to-pink-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Checking generator access...</p>
        </div>
      </div>
    );
  }

  if (!accessInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Check Failed</h2>
          <p className="text-white/70">Unable to verify generator access</p>
        </div>
      </div>
    );
  }

  if (!accessInfo.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl w-full mx-auto text-white">
          <div className="text-center mb-8">
            <Lock className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Generator Access Restricted</h1>
            <p className="text-white/70 text-lg mb-6">
              {accessInfo.reason || 'You do not have access to the NFT generator at this time.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              How to Get Access
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Hold $LOL Tokens</h4>
                  <p className="text-white/70 text-sm">
                    Hold at least 100,000 $LOL tokens to qualify for basic access
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Verify Social Accounts</h4>
                  <p className="text-white/70 text-sm">
                    Connect and verify your Twitter, Telegram, or Discord accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Wait for Whitelist Phase</h4>
                  <p className="text-white/70 text-sm">
                    Access will be granted during your eligible whitelist phase
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {showDetails ? 'Hide' : 'Show'} Whitelist Details
            {showDetails ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-semibold">Upcoming Whitelist Phases</h4>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Verified Creators Phase</span>
                    <span className="text-white/50 text-sm">(Starts in 7 days)</span>
                  </div>
                  <p className="text-white/70 text-sm mb-2">
                    Requires 1M+ $LOL tokens and verified social accounts
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">3 Collections Max</span>
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">Priority Access</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Early Adopters Phase</span>
                    <span className="text-white/50 text-sm">(Starts in 14 days)</span>
                  </div>
                  <p className="text-white/70 text-sm mb-2">
                    Requires 100K+ $LOL tokens
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">2 Collections Max</span>
                    <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded">Standard Access</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-4xl w-full mx-auto text-white">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${getAccessLevelColor(accessInfo.accessLevel)} flex items-center justify-center`}>
            {getAccessLevelIcon(accessInfo.accessLevel)}
          </div>
          <h1 className="text-3xl font-bold mb-2">Generator Access Granted</h1>
          <p className="text-white/70 text-lg">
            Welcome to the NFT Generator! You have {accessInfo.accessLevel.toUpperCase()} level access.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Access Level
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Level:</span>
                <span className="font-medium capitalize">{accessInfo.accessLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Remaining Collections:</span>
                <span className="font-medium">{accessInfo.remainingCollections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Eligible Phases:</span>
                <span className="font-medium">{accessInfo.eligiblePhases.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Social Verification
            </h3>
            {accessInfo.socialVerification ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Verification Score:</span>
                  <span className="font-medium">{accessInfo.socialVerification.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Verified Accounts:</span>
                  <span className="font-medium">{accessInfo.socialVerification.accounts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className={`font-medium ${accessInfo.socialVerification.eligible ? 'text-green-400' : 'text-yellow-400'}`}>
                    {accessInfo.socialVerification.eligible ? 'Eligible' : 'Partial'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-white/70">No social verification data available</p>
            )}
          </div>
        </div>

        {accessInfo.eligiblePhases.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Your Eligible Phases</h3>
            <div className="space-y-3">
              {accessInfo.eligiblePhases.map((phase: GeneratorWhitelistPhase) => (
                <div key={phase.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{phase.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      phase.isActive ? 'bg-green-500/20 text-green-300' : 
                      phase.isUpcoming ? 'bg-yellow-500/20 text-yellow-300' : 
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {phase.isActive ? 'Active' : phase.isUpcoming ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-3">{phase.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      {phase.benefits.maxCollectionsPerWallet} Collections Max
                    </span>
                    {phase.benefits.priorityAccess && (
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                        Priority Access
                      </span>
                    )}
                    {phase.benefits.advancedFeatures && (
                      <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs">
                        Advanced Features
                      </span>
                    )}
                    {phase.benefits.customPricing && (
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        Custom Pricing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={onAccessGranted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <CheckCircle className="w-5 h-5" />
            Enter Generator
          </button>
        </div>
      </div>
    </div>
  );
}
