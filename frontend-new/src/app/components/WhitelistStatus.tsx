'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WhitelistRule, WhitelistType } from './WhitelistPriorityManager';
import { whitelistPhaseService, WhitelistPhase } from '@/lib/whitelist-phase-service';

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
  lolBalanceInfo?: any; // LOL balance info from the balance checker
}

export default function WhitelistStatus({ 
  collectionId, 
  collectionName, 
  basePrice,
  onWhitelistPriceChange,
  onWhitelistStatusChange,
  lolBalanceInfo 
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
    eligibilityReason?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load whitelist data from hardcoded phases
  useEffect(() => {
    const loadWhitelistData = () => {
      try {
        console.log('🔍 WhitelistStatus: Loading hardcoded whitelist phases');
        
        // Get current active phase
        const activePhase = whitelistPhaseService.getCurrentActivePhase();
        console.log('🔍 WhitelistStatus: Active phase:', activePhase);
        
        if (activePhase) {
          // Convert phase to WhitelistRule format for compatibility
          const phaseRule: WhitelistRule = {
            id: activePhase.id,
            type: 'token_holders',
            name: activePhase.name,
            priority: 1,
            enabled: activePhase.enabled,
            priceMultiplier: activePhase.priceMultiplier,
            maxMintsPerWallet: activePhase.maxMintsPerWallet,
            config: {
              tokenMint: activePhase.requirements.tokenMint,
              minBalance: activePhase.requirements.minBalance
            },
            startDate: activePhase.startDate,
            endDate: activePhase.endDate,
            description: activePhase.description
          };
          
          setWhitelistRules([phaseRule]);
          
          // Check if current wallet is whitelisted
          if (connected && publicKey) {
            checkWhitelistStatus([phaseRule], activePhase);
          }
        } else {
          console.log('🔍 WhitelistStatus: No active whitelist phase');
          setWhitelistRules([]);
          onWhitelistPriceChange?.(basePrice, 1.0, null);
          onWhitelistStatusChange?.(true, 999, false); // Allow minting when no whitelist is active
        }
      } catch (error) {
        console.error('Error loading whitelist data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWhitelistData();
  }, [collectionId, connected, publicKey, basePrice, onWhitelistPriceChange, onWhitelistStatusChange]);

  const checkWhitelistStatus = async (rules: WhitelistRule[], activePhase?: WhitelistPhase) => {
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

    if (!activeRule || !activePhase) {
      setWhitelistStatus(null);
      onWhitelistPriceChange?.(basePrice, 1.0, null);
      onWhitelistStatusChange?.(true, 999, false); // Allow minting when no whitelist is active
      return;
    }

    // Check wallet eligibility using the phase service
    const eligibility = await whitelistPhaseService.checkWalletEligibility(
      walletAddress, 
      activePhase,
      lolBalanceInfo?.balance // Pass the actual LOL balance
    );

    // Get remaining mints for this phase
    const mintInfo = await whitelistPhaseService.getRemainingMints(walletAddress, activePhase);

    const status = {
      isWhitelisted: eligibility.isEligible,
      activeRule,
      canMint: eligibility.isEligible && mintInfo.remaining > 0,
      remainingMints: mintInfo.remaining,
      priceMultiplier: activeRule.priceMultiplier,
      whitelistPrice: basePrice * activeRule.priceMultiplier,
      ruleType: activeRule.type,
      eligibilityReason: eligibility.reason
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
            <h3 className="text-white font-semibold">Not Eligible for Current Phase</h3>
            <p className="text-red-200 text-sm">
              <strong>{whitelistStatus.activeRule?.name}</strong> - {whitelistStatus.eligibilityReason || 'You do not meet the requirements for this phase'}
            </p>
            <p className="text-red-200 text-xs mt-1">
              Phase active until: {new Date(whitelistStatus.activeRule?.endDate || '').toLocaleDateString()}
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
