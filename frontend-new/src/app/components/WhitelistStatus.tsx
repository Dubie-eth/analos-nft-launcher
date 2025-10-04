'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WhitelistRule, WhitelistType } from './WhitelistPriorityManager';

interface WhitelistEntry {
  walletAddress: string;
  maxMints: number;
  mintedCount: number;
  addedAt: number;
  addedBy: string;
  notes?: string;
}

interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number;
  maxMintsPerWallet: number;
  entries: WhitelistEntry[];
}

interface WhitelistStatusProps {
  collectionId: string;
  collectionName: string;
  basePrice: number;
  onWhitelistPriceChange?: (price: number, multiplier: number, rule: WhitelistRule | null) => void;
  onWhitelistStatusChange?: (canMint: boolean, remainingMints: number, isWhitelisted: boolean) => void;
}

export default function WhitelistStatus({ 
  collectionId, 
  collectionName, 
  basePrice,
  onWhitelistPriceChange,
  onWhitelistStatusChange 
}: WhitelistStatusProps) {
  const { publicKey, connected } = useWallet();
  const [whitelistRules, setWhitelistRules] = useState<WhitelistRule[]>([]);
  const [whitelistStatus, setWhitelistStatus] = useState<{
    isWhitelisted: boolean;
    activeRule: WhitelistRule | null;
    canMint: boolean;
    remainingMints: number;
    priceMultiplier: number;
    whitelistPrice: number;
    ruleType: WhitelistType | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load whitelist data
  useEffect(() => {
    const loadWhitelistData = () => {
      try {
        const localStorageKey = `whitelist_rules_${collectionId}`;
        console.log('🔍 WhitelistStatus: Looking for localStorage key:', localStorageKey);
        
        const savedRules = localStorage.getItem(localStorageKey);
        console.log('🔍 WhitelistStatus: Found saved rules:', savedRules);
        
        if (savedRules) {
          const rules: WhitelistRule[] = JSON.parse(savedRules);
          console.log('🔍 WhitelistStatus: Parsed rules:', rules);
          setWhitelistRules(rules);
          
          // Check if current wallet is whitelisted
          if (connected && publicKey) {
            checkWhitelistStatus(rules);
          }
        } else {
          console.log('🔍 WhitelistStatus: No whitelist rules found for collectionId:', collectionId);
          
          // Debug: List all localStorage keys that start with 'whitelist_rules_'
          const allKeys = Object.keys(localStorage);
          const whitelistKeys = allKeys.filter(key => key.startsWith('whitelist_rules_'));
          console.log('🔍 WhitelistStatus: All whitelist localStorage keys:', whitelistKeys);
        }
      } catch (error) {
        console.error('Error loading whitelist data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWhitelistData();
  }, [collectionId, connected, publicKey]);

  const checkWhitelistStatus = async (rules: WhitelistRule[]) => {
    if (!connected || !publicKey) return;

    const walletAddress = publicKey.toString();
    const now = new Date();

    // Find active rule (highest priority first)
    const activeRule = rules.find(rule => {
      if (!rule.enabled) return false;
      const startDate = new Date(rule.startDate);
      const endDate = new Date(rule.endDate);
      return now >= startDate && now <= endDate;
    });

    if (!activeRule) {
      setWhitelistStatus(null);
      onWhitelistPriceChange?.(basePrice, 1.0, null);
      onWhitelistStatusChange?.(true, 999, false); // Allow minting when no whitelist is active
      return;
    }

    // Check if wallet qualifies for the active rule
    let isWhitelisted = false;
    let remainingMints = 0;

    switch (activeRule.type) {
      case 'token_holders':
        // Check token balance (simplified - in real implementation, you'd check actual balance)
        isWhitelisted = true; // Placeholder
        remainingMints = activeRule.maxMintsPerWallet;
        break;
      case 'snapshot':
        // Check if wallet is in snapshot
        isWhitelisted = activeRule.config.walletAddresses?.includes(walletAddress) || false;
        remainingMints = activeRule.maxMintsPerWallet;
        break;
      case 'nft_collection':
        // Check NFT collection holdings (simplified)
        isWhitelisted = true; // Placeholder
        remainingMints = activeRule.maxMintsPerWallet;
        break;
      case 'manual':
        // Check manual addresses
        isWhitelisted = activeRule.config.manualAddresses?.includes(walletAddress) || false;
        remainingMints = activeRule.maxMintsPerWallet;
        break;
    }

    const status = {
      isWhitelisted,
      activeRule,
      canMint: isWhitelisted,
      remainingMints,
      priceMultiplier: activeRule.priceMultiplier,
      whitelistPrice: basePrice * activeRule.priceMultiplier,
      ruleType: activeRule.type
    };

    setWhitelistStatus(status);
    onWhitelistPriceChange?.(status.whitelistPrice, status.priceMultiplier, activeRule);
    onWhitelistStatusChange?.(status.canMint, status.remainingMints, status.isWhitelisted);
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-white">Checking whitelist status...</span>
        </div>
      </div>
    );
  }

  if (!whitelistRules.length) {
    return null; // No whitelist configured
  }

  if (!connected) {
    return (
      <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔐</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Active</h3>
            <p className="text-blue-200 text-sm">Connect your wallet to check whitelist status</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whitelistStatus) {
    return (
      <div className="bg-gray-500/20 backdrop-blur-sm border border-gray-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">⏰</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Inactive</h3>
            <p className="text-gray-300 text-sm">No active whitelist phase at this time</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whitelistStatus.isWhitelisted) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🚫</div>
          <div>
            <h3 className="text-white font-semibold">Not Whitelisted</h3>
            <p className="text-red-200 text-sm">
              Your wallet is not whitelisted for the current rule: <strong>{whitelistStatus.activeRule?.name}</strong>
            </p>
            <p className="text-red-200 text-xs mt-1">
              Rule active until: {new Date(whitelistStatus.activeRule?.endDate || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is whitelisted
  return (
    <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Access</h3>
            <p className="text-green-200 text-sm">
              You're whitelisted for: <strong>{whitelistStatus.activeRule?.name}</strong>
            </p>
            <div className="text-green-200 text-xs mt-1 space-y-1">
              <div>Remaining mints: <strong>{whitelistStatus.remainingMints}</strong></div>
              <div>Rule Type: <strong>{whitelistStatus.ruleType}</strong></div>
              {whitelistStatus.priceMultiplier !== 1.0 && (
                <div>
                  Price: <strong>{whitelistStatus.priceMultiplier === 0 ? 'FREE' : `${whitelistStatus.priceMultiplier}x`}</strong>
                  {whitelistStatus.priceMultiplier !== 0 && (
                    <span className="ml-1">({whitelistStatus.whitelistPrice.toFixed(5)} $LOS)</span>
                  )}
                </div>
              )}
              {whitelistStatus.activeRule?.description && (
                <div>Note: <em>{whitelistStatus.activeRule.description}</em></div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-green-400 text-sm font-semibold">
            {whitelistStatus.priceMultiplier === 0 ? 'FREE MINT' : `${whitelistStatus.priceMultiplier}x PRICE`}
          </div>
          <div className="text-green-200 text-xs">
            Until {new Date(whitelistStatus.currentPhase?.endDate || '').toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
